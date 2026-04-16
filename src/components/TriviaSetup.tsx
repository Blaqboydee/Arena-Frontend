import { useState } from "react";

// ── Shared types ───────────────────────────────────────────────────────────────

export type TriviaQuestion = {
  q:       string;
  options: [string, string, string, string];
  answer:  0 | 1 | 2 | 3;
};

export type TriviaMode = "random" | "pack" | "custom";

export type TriviaConfig = {
  mode:       TriviaMode;
  pack?:      string;
  questions?: TriviaQuestion[];
};

// ── Packs ─────────────────────────────────────────────────────────────────────

const PACKS = [
  { id: "science",   label: "Science & Nature",   icon: "🔬" },
  { id: "geography", label: "Geography & World",   icon: "🌍" },
  { id: "culture",   label: "History & Culture",   icon: "📜" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function blankQuestion(): TriviaQuestion {
  return { q: "", options: ["", "", "", ""], answer: 0 };
}

function isQuestionValid(q: TriviaQuestion) {
  return q.q.trim() && q.options.every((o) => o.trim());
}

// ── Props ─────────────────────────────────────────────────────────────────────

type Props = {
  config:   TriviaConfig;
  onChange: (config: TriviaConfig) => void;
};

// ── Main component ────────────────────────────────────────────────────────────

export default function TriviaSetup({ config, onChange }: Props) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(0);

  function setMode(mode: TriviaMode) {
    onChange({
      mode,
      pack:      mode === "pack"    ? (config.pack ?? "science")       : undefined,
      questions: mode === "custom"  ? (config.questions ?? [blankQuestion()]) : undefined,
    });
  }

  function setPack(pack: string) {
    onChange({ ...config, pack });
  }

  function addQuestion() {
    const questions = [...(config.questions ?? []), blankQuestion()];
    onChange({ ...config, questions });
    setExpandedIdx(questions.length - 1);
  }

  function removeQuestion(i: number) {
    const questions = (config.questions ?? []).filter((_, idx) => idx !== i);
    onChange({ ...config, questions });
    if (expandedIdx === i) setExpandedIdx(null);
  }

  function updateQuestion(i: number, updated: TriviaQuestion) {
    const questions = (config.questions ?? []).map((q, idx) => (idx === i ? updated : q));
    onChange({ ...config, questions });
  }

  const customQuestions = config.questions ?? [];
  const validCount = customQuestions.filter(isQuestionValid).length;
  const isCustomReady = validCount >= 3;

  return (
    <div className="flex flex-col gap-3">
      <span className="font-mono text-[10px] text-dim tracking-widest uppercase">
        Question Source
      </span>

      {/* Mode selector */}
      <div className="flex rounded-sm border border-border overflow-hidden">
        {(["random", "pack", "custom"] as TriviaMode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 py-2 font-mono text-[11px] uppercase tracking-wider transition-colors ${
              config.mode === m
                ? "bg-amber/15 text-amber"
                : "bg-surface text-dim hover:text-muted"
            }`}
          >
            {m === "random" ? "Random" : m === "pack" ? "Topic" : "Custom"}
          </button>
        ))}
      </div>

      {/* Random mode */}
      {config.mode === "random" && (
        <p className="font-mono text-[11px] text-dim">
          10 random questions from the built-in bank.
        </p>
      )}

      {/* Pack selector */}
      {config.mode === "pack" && (
        <div className="flex flex-col gap-1.5">
          {PACKS.map((pack) => (
            <button
              key={pack.id}
              onClick={() => setPack(pack.id)}
              className={`flex items-center gap-3 px-3 py-2 rounded-sm border text-left transition-all ${
                config.pack === pack.id
                  ? "border-amber/40 bg-amber/10 text-amber"
                  : "border-border bg-bg text-muted hover:border-border-bright"
              }`}
            >
              <span className="text-base leading-none">{pack.icon}</span>
              <span className="font-mono text-xs">{pack.label}</span>
              {config.pack === pack.id && (
                <span className="ml-auto font-mono text-[10px] text-amber">selected</span>
              )}
            </button>
          ))}
          <p className="font-mono text-[10px] text-dim mt-1">
            10 questions from the selected topic, supplemented with random if needed.
          </p>
        </div>
      )}

      {/* Custom questions */}
      {config.mode === "custom" && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-dim">
              {validCount}/{customQuestions.length} questions ready
            </span>
            <span className="font-mono text-[10px] text-dim">Min 3, max 20</span>
          </div>

          <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto pr-1">
            {customQuestions.map((q, i) => (
              <QuestionCard
                key={i}
                index={i}
                question={q}
                expanded={expandedIdx === i}
                onToggle={() => setExpandedIdx(expandedIdx === i ? null : i)}
                onChange={(updated) => updateQuestion(i, updated)}
                onRemove={() => removeQuestion(i)}
              />
            ))}
          </div>

          {customQuestions.length < 20 && (
            <button
              onClick={addQuestion}
              className="w-full py-2 rounded-sm border border-dashed border-border text-dim
                         font-mono text-xs hover:border-amber/40 hover:text-amber transition-colors"
            >
              + Add question
            </button>
          )}

          {customQuestions.length > 0 && !isCustomReady && (
            <p className="font-mono text-[10px] text-red/70">
              Need at least 3 fully filled-in questions to start.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Question card ─────────────────────────────────────────────────────────────

const OPTION_LABELS = ["A", "B", "C", "D"] as const;

function QuestionCard({
  index,
  question,
  expanded,
  onToggle,
  onChange,
  onRemove,
}: {
  index:    number;
  question: TriviaQuestion;
  expanded: boolean;
  onToggle: () => void;
  onChange: (q: TriviaQuestion) => void;
  onRemove: () => void;
}) {
  const valid = isQuestionValid(question);

  return (
    <div className={`rounded-sm border overflow-hidden transition-colors ${
      valid ? "border-border" : "border-border"
    }`}>
      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-bg/50 transition-colors bg-surface"
        onClick={onToggle}
      >
        <span className={`font-mono text-[10px] w-5 ${valid ? "text-green" : "text-dim"}`}>
          {valid ? "✓" : `Q${index + 1}`}
        </span>
        <span className="font-mono text-xs text-muted flex-1 truncate min-w-0">
          {question.q.trim() || <span className="text-dim italic">Untitled question</span>}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="text-dim hover:text-red transition-colors px-1 shrink-0"
          aria-label="Remove"
        >
          ✕
        </button>
        <span className="text-dim text-[10px] shrink-0">{expanded ? "▲" : "▼"}</span>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div className="px-3 pb-3 pt-2 flex flex-col gap-2.5 border-t border-border bg-bg">
          {/* Question text */}
          <input
            value={question.q}
            onChange={(e) => onChange({ ...question, q: e.target.value })}
            placeholder="Question text…"
            maxLength={300}
            className="w-full bg-surface border border-border rounded-sm px-3 py-2
                       font-mono text-xs text-text placeholder-dim outline-none
                       focus:border-amber/60 transition-colors"
          />

          {/* Options */}
          <div className="grid grid-cols-2 gap-2">
            {question.options.map((opt, i) => (
              <div key={i} className="flex items-center gap-1.5">
                {/* Correct answer radio */}
                <button
                  onClick={() => onChange({ ...question, answer: i as 0 | 1 | 2 | 3 })}
                  title="Mark as correct answer"
                  className={`w-4 h-4 rounded-full border shrink-0 transition-colors ${
                    question.answer === i
                      ? "border-green bg-green/30"
                      : "border-border bg-surface hover:border-green/50"
                  }`}
                />
                <span className={`font-display text-xs w-3 shrink-0 ${
                  question.answer === i ? "text-green" : "text-dim"
                }`}>
                  {OPTION_LABELS[i]}
                </span>
                <input
                  value={opt}
                  onChange={(e) => {
                    const options = [...question.options] as [string, string, string, string];
                    options[i] = e.target.value;
                    onChange({ ...question, options });
                  }}
                  placeholder={`Option ${OPTION_LABELS[i]}`}
                  maxLength={200}
                  className="flex-1 min-w-0 bg-surface border border-border rounded-sm px-2 py-1.5
                             font-mono text-[11px] text-text placeholder-dim outline-none
                             focus:border-amber/60 transition-colors"
                />
              </div>
            ))}
          </div>

          <p className="font-mono text-[10px] text-dim">
            Click the circle next to an option to mark it as the correct answer.
          </p>
        </div>
      )}
    </div>
  );
}
