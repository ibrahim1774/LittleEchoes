import type { Question } from '@/types';
import { CATEGORY_COLORS, CATEGORY_LABELS } from '@/data/questions';

interface Props {
  question: Question;
  questionIndex: number;
  totalQuestions: number;
  childName: string;
  onStartRecording: () => void;
}

function readAloud(text: string) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.85;
  utterance.pitch = 1.0;

  // Prefer a female voice
  const voices = window.speechSynthesis.getVoices();
  const femaleVoice = voices.find(
    (v) =>
      v.name.toLowerCase().includes('female') ||
      v.name.toLowerCase().includes('samantha') ||
      v.name.toLowerCase().includes('karen') ||
      v.name.toLowerCase().includes('victoria')
  );
  if (femaleVoice) utterance.voice = femaleVoice;

  window.speechSynthesis.speak(utterance);
}

export function QuestionDisplay({
  question,
  questionIndex,
  totalQuestions,
  childName,
  onStartRecording,
}: Props) {
  const categoryColor = CATEGORY_COLORS[question.category];
  const categoryLabel = CATEGORY_LABELS[question.category];

  return (
    <div className="min-h-screen bg-gradient-to-b from-echo-cream to-white dark:from-echo-dark-bg dark:to-echo-dark-card flex flex-col items-center px-6 pt-8 pb-28">
      {/* Progress indicators */}
      <div className="flex gap-2 mb-6">
        {Array.from({ length: totalQuestions }).map((_, i) => (
          <div
            key={i}
            className={`h-2 rounded-full transition-all ${
              i < questionIndex
                ? 'w-6 opacity-100'
                : i === questionIndex
                ? 'w-10 opacity-100'
                : 'w-6 opacity-30'
            }`}
            style={{
              backgroundColor:
                i <= questionIndex ? categoryColor : '#F0F0F0',
            }}
          />
        ))}
      </div>

      <p className="font-inter text-echo-gray text-sm mb-6">
        Question {questionIndex + 1} of {totalQuestions}
      </p>

      {/* Question text */}
      <div className="flex-1 flex flex-col items-center justify-center w-full gap-6">
        <div className="text-center">
          <p
            className="font-nunito font-bold text-2xl text-echo-charcoal dark:text-white leading-relaxed text-center"
          >
            "{question.text}"
          </p>
        </div>

        {/* Category label */}
        <div className="flex items-center gap-2">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: categoryColor }}
          />
          <span
            className="font-nunito text-sm font-semibold"
            style={{ color: categoryColor }}
          >
            {categoryLabel}
          </span>
        </div>

        {/* Read Aloud */}
        <button
          onClick={() => readAloud(question.text)}
          className="flex items-center gap-2 px-4 py-2 rounded-full border-2 text-sm font-nunito font-semibold transition-all active:scale-95"
          style={{ borderColor: categoryColor, color: categoryColor }}
        >
          🔊 Read Aloud
        </button>
      </div>

      {/* Record button */}
      <div className="flex flex-col items-center gap-4 mt-6">
        <button
          onClick={onStartRecording}
          className="w-[120px] h-[120px] rounded-full bg-echo-coral flex items-center justify-center shadow-[0_8px_32px_rgba(255,107,107,0.4)] animate-pulse-cta active:scale-95 transition-transform"
          aria-label="Start recording"
        >
          <MicIcon />
        </button>
        <p className="font-nunito text-echo-gray text-sm text-center">
          Tap to record {childName}'s answer
        </p>
      </div>
    </div>
  );
}

function MicIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="white">
      <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
    </svg>
  );
}
