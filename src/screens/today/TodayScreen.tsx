import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { saveSession, saveRecording, updateStreak } from '@/services/storage';
import { syncToCloud } from '@/services/cloudSync';
import { supabase } from '@/services/supabase';
import type { Recording, RecordingSession } from '@/types';
import { QuestionDisplay } from './QuestionDisplay';
import { RecordingView } from './RecordingView';
import { ReviewRecording } from './ReviewRecording';
import { SessionComplete } from './SessionComplete';

type SessionPhase =
  | { step: 'question'; questionIndex: number }
  | { step: 'recording'; questionIndex: number }
  | { step: 'review'; questionIndex: number; blob: Blob; duration: number }
  | { step: 'complete'; recordings: Recording[] };

function generateId() {
  return crypto.randomUUID();
}

export function TodayScreen() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();

  // Restore session progress from context (survives tab switches)
  const [sessionId] = useState(() => state.todayProgress?.sessionId ?? generateId());
  const [phase, setPhase] = useState<SessionPhase>(() =>
    state.todayProgress
      ? { step: 'question', questionIndex: state.todayProgress.questionIndex }
      : { step: 'question', questionIndex: 0 }
  );
  const [collectedRecordings, setCollectedRecordings] = useState<Recording[]>(
    () => state.todayProgress?.recordings ?? []
  );

  const { activeChild, todayQuestions, parent } = state;

  if (!activeChild || !parent || todayQuestions.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-echo-cream px-6 pb-24">
        <p className="font-nunito text-echo-gray text-center">
          {todayQuestions.length === 0
            ? 'No questions loaded yet. Go back home and try again.'
            : 'No child selected. Please go back home.'}
        </p>
        <button
          onClick={() => navigate('/home')}
          className="mt-4 bg-echo-coral text-white font-nunito font-bold px-8 py-3 rounded-full shadow-coral"
        >
          Back Home
        </button>
      </div>
    );
  }

  const currentQuestion =
    phase.step !== 'complete' ? todayQuestions[phase.questionIndex] : null;

  function handleStartRecording() {
    setPhase((p) => ({ ...p, step: 'recording' } as SessionPhase));
  }

  function handleRecordingDone(blob: Blob, duration: number) {
    if (phase.step !== 'recording') return;
    setPhase({ step: 'review', questionIndex: phase.questionIndex, blob, duration });
  }

  function handleReRecord() {
    if (phase.step !== 'review') return;
    setPhase({ step: 'recording', questionIndex: phase.questionIndex });
  }

  async function handleNext(
    blob: Blob,
    duration: number,
    emotionTag?: Recording['emotionTag'],
    parentNote?: string
  ) {
    if (phase.step !== 'review') return;
    if (!activeChild) return;

    const { questionIndex } = phase;
    const question = todayQuestions[questionIndex];

    const recording: Recording = {
      id: generateId(),
      sessionId,
      childId: activeChild.id,
      questionId: question.id,
      questionText: question.text,
      audioBlob: blob,
      durationSeconds: duration,
      emotionTag,
      parentNote,
      createdAt: new Date().toISOString(),
    };

    try {
      // Create session on first recording
      if (questionIndex === 0) {
        const session: RecordingSession = {
          id: sessionId,
          childId: activeChild.id,
          date: new Date().toISOString().split('T')[0],
          createdAt: new Date().toISOString(),
          status: 'in-progress',
        };
        await saveSession(session);
        dispatch({ type: 'SET_TODAY_SESSION', payload: session });
      }

      try {
        await saveRecording(recording);
      } catch {
        // Blob storage can fail on mobile Safari — upload directly to cloud
        let audioUrl: string | undefined;
        if (state.user) {
          const path = `${state.user.id}/${recording.id}.webm`;
          const { error } = await supabase.storage
            .from('recordings')
            .upload(path, blob, { contentType: 'audio/webm', upsert: true });
          if (!error) audioUrl = path;
        }
        await saveRecording({ ...recording, audioBlob: undefined, audioUrl });
        recording.audioUrl = audioUrl;
      }

      if (state.user) void syncToCloud(state.user);
    } catch (err) {
      console.error('Failed to save recording:', err);
    }

    // ALWAYS advance phase — even if save had issues
    const newRecordings = [...collectedRecordings, recording];
    setCollectedRecordings(newRecordings);

    const nextIndex = questionIndex + 1;
    const isLast = questionIndex >= todayQuestions.length - 1;

    if (isLast) {
      // Mark session complete and update streak
      try {
        const completedSession: RecordingSession = {
          id: sessionId,
          childId: activeChild.id,
          date: new Date().toISOString().split('T')[0],
          createdAt: new Date().toISOString(),
          status: 'completed',
        };
        await saveSession(completedSession);
        dispatch({ type: 'SET_TODAY_SESSION', payload: completedSession });

        const streak = await updateStreak(activeChild.id);
        dispatch({ type: 'SET_STREAK', payload: streak });
      } catch (err) {
        console.error('Failed to complete session:', err);
      }

      // Clear progress — session is done
      dispatch({ type: 'SET_TODAY_PROGRESS', payload: null });
      setPhase({ step: 'complete', recordings: newRecordings });
    } else {
      // Save progress so it survives tab switches
      dispatch({ type: 'SET_TODAY_PROGRESS', payload: {
        sessionId,
        questionIndex: nextIndex,
        recordings: newRecordings,
      }});
      setPhase({ step: 'question', questionIndex: nextIndex });
    }
  }

  if (phase.step === 'complete') {
    return <SessionComplete recordings={phase.recordings} childName={activeChild.name} />;
  }

  if (phase.step === 'question' && currentQuestion) {
    return (
      <QuestionDisplay
        question={currentQuestion}
        questionIndex={phase.questionIndex}
        totalQuestions={todayQuestions.length}
        childName={activeChild.name}
        onStartRecording={handleStartRecording}
      />
    );
  }

  if (phase.step === 'recording' && currentQuestion) {
    return (
      <RecordingView
        question={currentQuestion}
        questionIndex={phase.questionIndex}
        totalQuestions={todayQuestions.length}
        childName={activeChild.name}
        onDone={handleRecordingDone}
      />
    );
  }

  if (phase.step === 'review' && currentQuestion) {
    return (
      <ReviewRecording
        question={currentQuestion}
        questionIndex={phase.questionIndex}
        totalQuestions={todayQuestions.length}
        blob={phase.blob}
        duration={phase.duration}
        onReRecord={handleReRecord}
        onNext={handleNext}
      />
    );
  }

  return null;
}
