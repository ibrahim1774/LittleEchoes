import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { saveSession, saveRecording, updateStreak, getTodayRecordingCount } from '@/services/storage';
import { syncToCloud } from '@/services/cloudSync';
import { supabase } from '@/services/supabase';
import type { Recording, RecordingSession } from '@/types';
import { QuestionDisplay } from './QuestionDisplay';
import { RecordingView } from './RecordingView';
import { ReviewRecording } from './ReviewRecording';
import { SessionComplete } from './SessionComplete';

const MAX_DAILY_RECORDINGS = 3;

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
  const [phase, setPhase] = useState<SessionPhase>(() =>
    state.todayProgress
      ? { step: 'question', questionIndex: state.todayProgress.questionIndex }
      : { step: 'hub' }
  );
  const [collectedRecordings, setCollectedRecordings] = useState<Recording[]>(
    () => state.todayProgress?.recordings ?? []
  );
  const [todayCount, setTodayCount] = useState(0);

  const { activeChild, todayQuestions, parent } = state;

  // Load today's recording count
  const refreshCount = useCallback(async () => {
    if (!activeChild) return;
    const count = await getTodayRecordingCount(activeChild.id);
    setTodayCount(count);
  }, [activeChild]);

  useEffect(() => {
    void refreshCount();
  }, [refreshCount]);

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

  const remaining = Math.max(0, MAX_DAILY_RECORDINGS - todayCount);
  const currentQuestion =
    phase.step === 'question' || phase.step === 'recording' || phase.step === 'review'
      ? todayQuestions[phase.questionIndex]
      : null;

  // Compute how many question recordings are possible (limited by daily cap)
  const questionsAvailable = Math.min(todayQuestions.length, remaining);

  function startQuestionFlow() {
    if (remaining <= 0) return;

    setPhase({ step: 'question', questionIndex: 0 });
  }

  function startFreeRecording() {
    if (remaining <= 0) return;

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

    // Hard limit check
    const currentCount = await getTodayRecordingCount(activeChild.id);
    if (currentCount >= MAX_DAILY_RECORDINGS) {
      await finishSession(collectedRecordings);
      void refreshCount();
      return;
    }

    const { questionIndex } = phase;
    const question = todayQuestions[questionIndex];

    const recording = await saveRecordingEntry(
      blob, duration, question.id, question.text, emotionTag, parentNote
    );

    const newRecordings = [...collectedRecordings, recording];
    setCollectedRecordings(newRecordings);

    const newCount = currentCount + 1;
    setTodayCount(newCount);

    const nextIndex = questionIndex + 1;
    const isLast = questionIndex >= todayQuestions.length - 1 || newCount >= MAX_DAILY_RECORDINGS;

    if (isLast) {
      await finishSession(newRecordings);
    } else {
      dispatch({ type: 'SET_TODAY_PROGRESS', payload: {
        sessionId,
        questionIndex: nextIndex,
        recordings: newRecordings,
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

    // Hard limit check
    const currentCount = await getTodayRecordingCount(activeChild.id);
    if (currentCount >= MAX_DAILY_RECORDINGS) {
      await finishSession(collectedRecordings);
      void refreshCount();
      return;
    }

    const recording = await saveRecordingEntry(
      blob, duration, `free-${generateId()}`, 'Free recording', emotionTag, parentNote
    );

    const newRecordings = [...collectedRecordings, recording];
    setCollectedRecordings(newRecordings);
    setTodayCount(currentCount + 1);

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
    void refreshCount();
  }

  // ── Render phases ──────────────────────────────────────────

  if (phase.step === 'complete') {
    return <SessionComplete recordings={phase.recordings} childName={activeChild.name} />;
  }

  if (phase.step === 'question' && currentQuestion) {
    return (
      <QuestionDisplay
        question={currentQuestion}
        questionIndex={phase.questionIndex}
        totalQuestions={questionsAvailable}
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
        totalQuestions={questionsAvailable}
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
        totalQuestions={questionsAvailable}
        blob={phase.blob}
        duration={phase.duration}
        onReRecord={handleReRecord}
        onNext={handleQuestionNext}
      />
    );
  }

  if (phase.step === 'free-recording') {
    return (
      <RecordingView
        questionIndex={0}
        totalQuestions={1}
        childName={activeChild.name}
        onDone={handleRecordingDone}
        isFreeRecording
      />
    );
  }

  if (phase.step === 'free-review') {
    return (
      <ReviewRecording
        questionIndex={0}
        totalQuestions={1}
        blob={phase.blob}
        duration={phase.duration}
        onReRecord={handleReRecord}
        onNext={handleFreeNext}
        isFreeRecording
      />
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
        <p className="font-inter text-echo-gray text-sm mt-1">
          {remaining > 0
            ? `${todayCount} of ${MAX_DAILY_RECORDINGS} echoes today`
            : 'All done for today!'}
        </p>
      </div>

      {/* Progress dots */}
      <div className="flex justify-center gap-2 mb-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
        {Array.from({ length: MAX_DAILY_RECORDINGS }).map((_, i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full transition-all ${
              i < todayCount
                ? 'bg-echo-coral scale-110'
                : 'bg-echo-light-gray dark:bg-white/10'
            }`}
          />
        ))}
      </div>

      {remaining > 0 ? (
        <div className="space-y-4 animate-fade-in" style={{ animationDelay: '0.15s' }}>
          {/* Answer Questions option */}
          {todayQuestions.length > 0 && (
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
                    {Math.min(todayQuestions.length, remaining)} question{Math.min(todayQuestions.length, remaining) !== 1 ? 's' : ''} ready for {activeChild.name}
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
      ) : (
        /* All done state */
        <div className="text-center animate-fade-in" style={{ animationDelay: '0.15s' }}>
          <div className="bg-white dark:bg-echo-dark-card rounded-2xl p-8 shadow-soft mb-6">
            <div className="text-5xl mb-4">✨</div>
            <p className="font-nunito font-bold text-lg text-echo-charcoal dark:text-white mb-2">
              All {MAX_DAILY_RECORDINGS} echoes captured!
            </p>
            <p className="font-inter text-echo-gray text-sm">
              Come back tomorrow for new questions and recordings.
            </p>
          </div>
          <button
            onClick={() => navigate('/memories')}
            className="bg-echo-coral text-white font-nunito font-bold text-base px-8 py-4 rounded-full shadow-coral active:scale-95 transition-transform"
          >
            📖 View Memories
          </button>
        </div>
      )}

      {/* Tip */}
      {remaining > 0 && (
        <div className="mt-6 rounded-xl bg-echo-orange/10 px-4 py-3 animate-fade-in" style={{ animationDelay: '0.25s' }}>
          <p className="font-nunito text-echo-orange text-xs text-center">
            💡 Each recording is up to 1 minute — {remaining} recording{remaining !== 1 ? 's' : ''} left today
          </p>
        </div>
      )}
    </div>
  );
}
