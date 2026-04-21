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

export type TriviaPreset = {
  id:        string;
  name:      string;
  questions: TriviaQuestion[];
  createdAt: number;
};

// ── Preset localStorage helpers ────────────────────────────────────────────────

const STORAGE_KEY = "trivia_presets";

function loadPresets(): TriviaPreset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function savePresets(presets: TriviaPreset[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
}

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
  const [presets, setPresets] = useState<TriviaPreset[]>(loadPresets);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [showPresets, setShowPresets] = useState(false);

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

  function savePreset() {
    const name = presetName.trim();
    if (!name) return;
    const newPreset: TriviaPreset = {
      id:        `${Date.now()}`,
      name,
      questions: (config.questions ?? []).filter(isQuestionValid),
      createdAt: Date.now(),
    };
    const updated = [newPreset, ...presets];
    savePresets(updated);
    setPresets(updated);
    setPresetName("");
    setSaveDialogOpen(false);
  }

  function deletePreset(id: string) {
    const updated = presets.filter((p) => p.id !== id);
    savePresets(updated);
    setPresets(updated);
  }

  function loadPreset(preset: TriviaPreset) {
    onChange({ mode: "custom", questions: preset.questions });
    setExpandedIdx(null);
    setShowPresets(false);
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

          {/* ── Presets bar ── */}
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-dim">
              {validCount}/{customQuestions.length} questions ready
            </span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-dim">Min 3, max 20</span>
              <button
                onClick={() => setShowPresets((v) => !v)}
                className={`font-mono text-[10px] px-2 py-1 rounded-sm border transition-colors ${
                  showPresets
                    ? "border-amber/40 bg-amber/10 text-amber"
                    : "border-border text-dim hover:text-muted"
                }`}
              >
                {presets.length > 0 ? `Saved (${presets.length})` : "Saved"}
              </button>
            </div>
          </div>

          {/* ── Saved presets panel ── */}
          {showPresets && (
            <div className="flex flex-col gap-1.5 p-2.5 rounded-sm border border-amber/20 bg-amber/5">
              <span className="font-mono text-[10px] text-amber tracking-widest uppercase">
                Saved Question Sets
              </span>
              {presets.length === 0 ? (
                <p className="font-mono text-[11px] text-dim">
                  No saved presets yet. Build a question set and save it below.
                </p>
              ) : (
                <div className="flex flex-col gap-1">
                  {presets.map((preset) => (
                    <div
                      key={preset.id}
                      className="flex items-center gap-2 px-3 py-2 rounded-sm border border-border bg-surface"
                    >
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="font-mono text-xs text-text truncate">{preset.name}</span>
                        <span className="font-mono text-[10px] text-dim">
                          {preset.questions.length} questions · {new Date(preset.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <button
                        onClick={() => loadPreset(preset)}
                        className="font-mono text-[10px] px-2 py-1 rounded-sm border border-amber/40
                                   bg-amber/10 text-amber hover:bg-amber/20 transition-colors shrink-0"
                      >
                        Load
                      </button>
                      <button
                        onClick={() => deletePreset(preset.id)}
                        className="font-mono text-[10px] px-2 py-1 rounded-sm border border-border
                                   text-dim hover:text-red hover:border-red/40 transition-colors shrink-0"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Question cards ── */}
          <div className="flex flex-col gap-1.5">
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

          {/* ── Save preset ── */}
          {isCustomReady && (
            <div className="mt-1">
              {saveDialogOpen ? (
                <div className="flex gap-2">
                  <input
                    autoFocus
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") savePreset();
                      if (e.key === "Escape") { setSaveDialogOpen(false); setPresetName(""); }
                    }}
                    placeholder="Name this question set…"
                    maxLength={60}
                    className="flex-1 min-w-0 bg-surface border border-amber/40 rounded-sm px-3 py-1.5
                               font-mono text-[16px] sm:text-xs text-text placeholder-dim outline-none
                               focus:border-amber/70 transition-colors"
                  />
                  <button
                    onClick={savePreset}
                    disabled={!presetName.trim()}
                    className="font-mono text-[10px] px-3 py-1.5 rounded-sm border border-amber/40
                               bg-amber/10 text-amber hover:bg-amber/20 disabled:opacity-40
                               disabled:cursor-not-allowed transition-colors shrink-0"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => { setSaveDialogOpen(false); setPresetName(""); }}
                    className="font-mono text-[10px] px-2 py-1.5 rounded-sm border border-border
                               text-dim hover:text-muted transition-colors shrink-0"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setSaveDialogOpen(true)}
                  className="w-full py-2 rounded-sm border border-dashed border-amber/30 text-amber/70
                             font-mono text-xs hover:border-amber/60 hover:text-amber transition-colors"
                >
                  💾 Save as preset
                </button>
              )}
            </div>
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
                       font-mono text-[16px] sm:text-xs text-text placeholder-dim outline-none
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
                             font-mono text-[16px] sm:text-[11px] text-text placeholder-dim outline-none
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
