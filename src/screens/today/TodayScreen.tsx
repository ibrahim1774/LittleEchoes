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
  | { step: 'hub' }
  | { step: 'question'; questionIndex: number }
  | { step: 'recording'; questionIndex: number }
  | { step: 'review'; questionIndex: number; blob: Blob; duration: number }
  | { step: 'free-recording' }
  | { step: 'free-review'; blob: Blob; duration: number }
  | { step: 'complete'; recordings: Recording[] };

function generateId() {
  return crypto.randomUUID();
}

export function TodayScreen() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();

  const [sessionId] = useState(() => state.todayProgress?.sessionId ?? generateId());
  const [phase, setPhase] = useState<SessionPhase>(() => {
    if (!state.todayProgress) return { step: 'hub' };
    if (state.todayProgress.flow === 'free') return { step: 'free-recording' };
    return { step: 'question', questionIndex: state.todayProgress.questionIndex };
  });
  const [collectedRecordings, setCollectedRecordings] = useState<Recording[]>(
    () => state.todayProgress?.recordings ?? []
  );
  const { activeChild, todayQuestions, parent } = state;

  if (!activeChild || !parent) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-echo-cream dark:bg-echo-dark-bg px-6 pb-24">
        <p className="font-nunito text-echo-gray text-center">
          No child selected. Please go back home.
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
    phase.step === 'question' || phase.step === 'recording' || phase.step === 'review'
      ? todayQuestions[phase.questionIndex]
      : null;

  function goBackToHub() {
    dispatch({ type: 'SET_TODAY_PROGRESS', payload: null });
    setPhase({ step: 'hub' });
  }

  function startQuestionFlow() {
    dispatch({ type: 'SET_TODAY_PROGRESS', payload: {
      sessionId,
      questionIndex: 0,
      recordings: collectedRecordings,
      flow: 'questions',
    }});
    setPhase({ step: 'question', questionIndex: 0 });
  }

  function startFreeRecording() {
    dispatch({ type: 'SET_TODAY_PROGRESS', payload: {
      sessionId,
      questionIndex: 0,
      recordings: collectedRecordings,
      flow: 'free',
    }});
    setPhase({ step: 'free-recording' });
  }

  function handleStartRecording() {
    setPhase((p) => ({ ...p, step: 'recording' } as SessionPhase));
  }

  function handleRecordingDone(blob: Blob, duration: number) {
    if (phase.step === 'recording') {
      setPhase({ step: 'review', questionIndex: phase.questionIndex, blob, duration });
    } else if (phase.step === 'free-recording') {
      setPhase({ step: 'free-review', blob, duration });
    }
  }

  function handleReRecord() {
    if (phase.step === 'review') {
      setPhase({ step: 'recording', questionIndex: phase.questionIndex });
    } else if (phase.step === 'free-review') {
      setPhase({ step: 'free-recording' });
    }
  }

  async function saveRecordingEntry(
    blob: Blob,
    duration: number,
    questionId: string,
    questionText: string,
    emotionTag?: Recording['emotionTag'],
    parentNote?: string
  ): Promise<Recording> {
    const recording: Recording = {
      id: generateId(),
      sessionId,
      childId: activeChild!.id,
      questionId,
      questionText,
      audioBlob: blob,
      durationSeconds: duration,
      emotionTag,
      parentNote,
      createdAt: new Date().toISOString(),
    };

    try {
      // Ensure session exists
      const session: RecordingSession = {
        id: sessionId,
        childId: activeChild!.id,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        status: 'in-progress',
      };
      await saveSession(session);
      dispatch({ type: 'SET_TODAY_SESSION', payload: session });

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

    return recording;
  }

  async function finishSession(recordings: Recording[]) {
    try {
      const completedSession: RecordingSession = {
        id: sessionId,
        childId: activeChild!.id,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        status: 'completed',
      };
      await saveSession(completedSession);
      dispatch({ type: 'SET_TODAY_SESSION', payload: completedSession });

      const streak = await updateStreak(activeChild!.id);
      dispatch({ type: 'SET_STREAK', payload: streak });
    } catch (err) {
      console.error('Failed to complete session:', err);
    }

    dispatch({ type: 'SET_TODAY_PROGRESS', payload: null });
    setPhase({ step: 'complete', recordings });
  }

  async function handleQuestionNext(
    blob: Blob,
    duration: number,
    emotionTag?: Recording['emotionTag'],
    parentNote?: string
  ) {
    if (phase.step !== 'review') return;
    if (!activeChild) return;

    const { questionIndex } = phase;
    const question = todayQuestions[questionIndex];

    const recording = await saveRecordingEntry(
      blob, duration, question.id, question.text, emotionTag, parentNote
    );

    const newRecordings = [...collectedRecordings, recording];
    setCollectedRecordings(newRecordings);


    const nextIndex = questionIndex + 1;
    const isLast = questionIndex >= todayQuestions.length - 1;

    if (isLast) {
      await finishSession(newRecordings);
    } else {
      dispatch({ type: 'SET_TODAY_PROGRESS', payload: {
        sessionId,
        questionIndex: nextIndex,
        recordings: newRecordings,
        flow: 'questions',
      }});
      setPhase({ step: 'question', questionIndex: nextIndex });
    }
  }

  async function handleFreeNext(
    blob: Blob,
    duration: number,
    emotionTag?: Recording['emotionTag'],
    parentNote?: string
  ) {
    if (phase.step !== 'free-review') return;
    if (!activeChild) return;

    const recording = await saveRecordingEntry(
      blob, duration, `free-${generateId()}`, 'Custom audio', emotionTag, parentNote
    );

    const newRecordings = [...collectedRecordings, recording];
    setCollectedRecordings(newRecordings);


    // Mark session complete, update streak, go back to hub
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
    } catch { /* non-critical */ }

    dispatch({ type: 'SET_TODAY_PROGRESS', payload: null });
    // Return to hub so they can record more or see they're done

    setPhase({ step: 'hub' });
  }

  // ── Render phases ──────────────────────────────────────────

  if (phase.step === 'complete') {
    return <SessionComplete recordings={phase.recordings} childName={activeChild.name} />;
  }

  const backButton = (
    <button
      onClick={goBackToHub}
      className="absolute top-4 left-4 z-10 w-10 h-10 rounded-full bg-white/80 dark:bg-echo-dark-card/80 shadow-soft flex items-center justify-center active:scale-95 transition-transform"
      aria-label="Back to options"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-echo-charcoal dark:text-white">
        <path d="M15 18l-6-6 6-6" />
      </svg>
    </button>
  );

  if (phase.step === 'question' && currentQuestion) {
    return (
      <div className="relative">
        {backButton}
        <QuestionDisplay
          question={currentQuestion}
          questionIndex={phase.questionIndex}
          totalQuestions={todayQuestions.length}
          childName={activeChild.name}
          onStartRecording={handleStartRecording}
        />
      </div>
    );
  }

  if (phase.step === 'recording' && currentQuestion) {
    return (
      <div className="relative">
        {backButton}
        <RecordingView
          question={currentQuestion}
          questionIndex={phase.questionIndex}
          totalQuestions={todayQuestions.length}
          childName={activeChild.name}
          onDone={handleRecordingDone}
        />
      </div>
    );
  }

  if (phase.step === 'review' && currentQuestion) {
    return (
      <div className="relative">
        {backButton}
        <ReviewRecording
          question={currentQuestion}
          questionIndex={phase.questionIndex}
          totalQuestions={todayQuestions.length}
          blob={phase.blob}
          duration={phase.duration}
          onReRecord={handleReRecord}
          onNext={handleQuestionNext}
        />
      </div>
    );
  }

  if (phase.step === 'free-recording') {
    return (
      <div className="relative">
        {backButton}
        <RecordingView
          questionIndex={0}
          totalQuestions={1}
          childName={activeChild.name}
          onDone={handleRecordingDone}
          isFreeRecording
        />
      </div>
    );
  }

  if (phase.step === 'free-review') {
    return (
      <div className="relative">
        {backButton}
        <ReviewRecording
          questionIndex={0}
          totalQuestions={1}
          blob={phase.blob}
          duration={phase.duration}
          onReRecord={handleReRecord}
          onNext={handleFreeNext}
          isFreeRecording
        />
      </div>
    );
  }

  // ── Record Hub (default) ───────────────────────────────────

  return (
    <div className="min-h-screen bg-echo-cream dark:bg-echo-dark-bg pb-24 px-5 pt-8">
      {/* Header */}
      <div className="text-center mb-6 animate-fade-in">
        <div className="text-5xl mb-3">{activeChild.avatarEmoji}</div>
        <h1 className="font-nunito font-bold text-2xl text-echo-charcoal dark:text-white">
          Record for {activeChild.name}
        </h1>
      </div>

      <div className="space-y-4 animate-fade-in" style={{ animationDelay: '0.15s' }}>
        {/* Answer Questions option — hidden for age 1-2 */}
        {activeChild.ageGroup !== '1-2' && todayQuestions.length > 0 && (
          <button
            onClick={startQuestionFlow}
            className="w-full bg-white dark:bg-echo-dark-card rounded-2xl p-5 shadow-soft text-left active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-echo-coral/10 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">❓</span>
              </div>
              <div className="flex-1">
                <p className="font-nunito font-bold text-base text-echo-charcoal dark:text-white">
                  Answer Today's Questions
                </p>
                <p className="font-inter text-echo-gray text-xs mt-0.5">
                  {todayQuestions.length} question{todayQuestions.length !== 1 ? 's' : ''} ready for {activeChild.name}
                </p>
              </div>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-echo-gray flex-shrink-0">
                <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </button>
        )}

        {/* Free Recording option */}
        <button
          onClick={startFreeRecording}
          className="w-full bg-white dark:bg-echo-dark-card rounded-2xl p-5 shadow-soft text-left active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-echo-sky/10 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">🎙️</span>
            </div>
            <div className="flex-1">
              <p className="font-nunito font-bold text-base text-echo-charcoal dark:text-white">
                Just Record Their Voice
              </p>
              <p className="font-inter text-echo-gray text-xs mt-0.5">
                No questions — capture anything up to 1 minute
              </p>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-echo-gray flex-shrink-0">
              <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </button>
      </div>

      {/* Tip */}
      <div className="mt-6 rounded-xl bg-echo-orange/10 px-4 py-3 animate-fade-in" style={{ animationDelay: '0.25s' }}>
        <p className="font-nunito text-echo-orange text-xs text-center">
          💡 Each recording is up to 1 minute
        </p>
      </div>
    </div>
  );
}
