"use client";

// Self-authored, first-party explainers for the Learn page (/ai-automation).
// They replace third-party video embeds: no external media, no network calls,
// mock data only. Keep them short, text-first, and keyboard-operable.

import { useId, useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";

// ─── Shared building blocks ────────────────────────────────────────────────────
function Panel({ label, title, children }: { label: string; title: string; children: React.ReactNode }) {
  return (
    <div className="mt-3 rounded-inner border border-silver-mid/60 bg-primary-ghost p-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-warm-dark">{label}</p>
      <h3 className="text-xs font-bold text-primary-dark mt-0.5 mb-2">{title}</h3>
      {children}
    </div>
  );
}

function KeyPoints({ items }: { items: React.ReactNode[] }) {
  return (
    <div className="mt-3">
      <h3 className="text-[10px] font-bold uppercase tracking-wider text-silver mb-1.5">Key points</h3>
      <ul className="flex flex-col gap-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2 text-xs text-gray-600 leading-relaxed">
            <span aria-hidden="true" className="flex-shrink-0 text-warm-dark">■</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Chip({
  pressed, onClick, children,
}: { pressed: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`px-2.5 py-1 rounded-badge border text-[11px] font-semibold transition-colors ${
        pressed
          ? "bg-primary text-white border-primary"
          : "bg-white text-primary-dark border-silver-mid hover:border-primary"
      }`}
    >
      {children}
    </button>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] text-gray-500 mt-2 leading-snug">{children}</p>;
}

// ─── 1. AI, machine learning, deep learning, generative AI ─────────────────────
const AI_LAYERS = [
  {
    name: "Artificial intelligence",
    def: "The broad field: any technique that lets a computer do a task we would normally call thinking.",
    eg: "Rule-based spam filters, route planners, chess programs.",
  },
  {
    name: "Machine learning",
    def: "A subset of AI where the system learns patterns from examples instead of following hand-written rules.",
    eg: "Predicting which parts will fail from past maintenance records.",
  },
  {
    name: "Deep learning",
    def: "Machine learning that uses many-layered neural networks, which can pick up patterns in messy data like images, audio, and text.",
    eg: "Speech-to-text, image recognition.",
  },
  {
    name: "Generative AI",
    def: "Deep learning models that create new content (text, images, code) from patterns they learned. Large language models live here.",
    eg: "Drafting an email or summarizing a report in GenAI.mil.",
  },
];

export function AiLayersExplainer() {
  const [active, setActive] = useState(3);
  const layer = AI_LAYERS[active];

  const box = (i: number, inner?: React.ReactNode) => (
    <div
      className={`rounded-inner border p-2 pt-1.5 transition-colors ${
        i === active ? "border-primary bg-primary-tint" : "border-silver-mid bg-white"
      }`}
    >
      <p className={`text-[10px] font-bold uppercase tracking-wider ${i === active ? "text-primary-dark" : "text-silver"}`}>
        {AI_LAYERS[i].name}
      </p>
      {inner && <div className="mt-1.5">{inner}</div>}
    </div>
  );

  return (
    <>
      <Panel label="Diagram" title="Each term sits inside the one before it">
        <div role="img" aria-label="Nested diagram: generative AI sits inside deep learning, which sits inside machine learning, which sits inside artificial intelligence.">
          {box(0, box(1, box(2, box(3))))}
        </div>
        <div className="flex flex-wrap gap-1.5 mt-3" role="group" aria-label="Choose a layer to define">
          {AI_LAYERS.map((l, i) => (
            <Chip key={l.name} pressed={i === active} onClick={() => setActive(i)}>{l.name}</Chip>
          ))}
        </div>
        <div aria-live="polite" className="mt-2 rounded-inner bg-white border border-silver-mid/60 p-2.5">
          <p className="text-xs font-bold text-primary-dark">{layer.name}</p>
          <p className="text-xs text-gray-600 leading-relaxed mt-0.5">{layer.def}</p>
          <p className="text-[11px] text-gray-500 mt-1"><span className="font-bold uppercase tracking-wide text-silver">Example</span> · {layer.eg}</p>
        </div>
      </Panel>
      <KeyPoints
        items={[
          "Every generative AI tool is machine learning, but most machine learning is not generative.",
          "Generative AI predicts likely output. Likely is not the same as correct, so you check the result.",
          "The chat tools on this site are generative AI, built on large language models.",
        ]}
      />
    </>
  );
}

// ─── 2. Tokens ─────────────────────────────────────────────────────────────────
// Teaching approximation only. Real tokenizers are learned and differ by model.
function roughTokens(text: string): string[] {
  const pieces = text.match(/\s*[A-Za-z]+|\s*\d{1,3}|\s*[^\sA-Za-z\d]|\s+$/g) ?? [];
  const out: string[] = [];
  for (const p of pieces) {
    const lead = p.match(/^\s*/)?.[0] ?? "";
    const word = p.slice(lead.length);
    if (/^[A-Za-z]{7,}$/.test(word)) {
      const chunks = word.match(/.{1,4}/g) ?? [word];
      chunks.forEach((c, i) => out.push(i === 0 ? lead + c : c));
    } else {
      out.push(p);
    }
  }
  return out;
}

const TOKEN_SAMPLE = "Summarize the attached maintenance report in three bullets for the flight commander.";

export function TokensExplainer() {
  const [text, setText] = useState(TOKEN_SAMPLE);
  const inputId = useId();
  const tokens = useMemo(() => roughTokens(text), [text]);
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <>
      <Panel label="Try it" title="See text split into tokens">
        <label htmlFor={inputId} className="text-[11px] font-semibold text-primary-dark">Type or edit a sentence</label>
        <textarea
          id={inputId}
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, 400))}
          rows={2}
          maxLength={400}
          className="mt-1 w-full resize-y rounded-input border border-silver-mid bg-white px-3 py-2 text-xs focus:border-primary focus:outline-none"
        />
        <div aria-hidden="true" className="mt-2 flex flex-wrap gap-y-1 font-mono text-[11px] leading-relaxed">
          {tokens.map((t, i) => (
            <span
              key={i}
              className={`px-0.5 border-b-2 whitespace-pre ${i % 2 ? "bg-warm-tint border-warm" : "bg-primary-tint border-primary/40"}`}
            >
              {t}
            </span>
          ))}
        </div>
        <p aria-live="polite" className="mt-2 text-[11px] font-semibold text-primary-dark">
          {words} words · {text.length} characters · about {tokens.length} tokens
        </p>
        <Note>
          Illustration only. Each model has its own tokenizer, so real counts differ. A common rule of thumb for English
          is about four characters, or three-quarters of a word, per token.
        </Note>
      </Panel>
      <KeyPoints
        items={[
          "Short, common words are usually one token. Long or rare words, numbers, and acronyms often break into several.",
          "Tokens are the unit the model counts. Limits on how much it can read or write at once are measured in tokens, not pages.",
          "Fewer wasted tokens means more room for what matters: say it once, plainly, and paste only the relevant part of a document.",
        ]}
      />
    </>
  );
}

// ─── 3. Context window ─────────────────────────────────────────────────────────
const CONVERSATION = [
  { who: "You", text: "Instructions: help me write bullets for an award package. Keep every bullet under 200 characters.", tokens: 180 },
  { who: "AI", text: "Understood. Share the accomplishments and I will draft bullets.", tokens: 60 },
  { who: "You", text: "Pasted: three pages of notes on the inspection prep.", tokens: 420 },
  { who: "AI", text: "Draft bullet one, focused on the inspection result.", tokens: 120 },
  { who: "You", text: "Make it punchier and add the dollar savings.", tokens: 60 },
  { who: "AI", text: "Revised bullet with the savings figure.", tokens: 140 },
  { who: "You", text: "Now write two more bullets from the same notes.", tokens: 60 },
];

export function ContextWindowExplainer() {
  const [windowSize, setWindowSize] = useState(1100);
  const sliderId = useId();

  const visible = useMemo(() => {
    const keep = new Set<number>();
    let used = 0;
    for (let i = CONVERSATION.length - 1; i >= 0; i--) {
      if (used + CONVERSATION[i].tokens > windowSize) break;
      used += CONVERSATION[i].tokens;
      keep.add(i);
    }
    return { keep, used };
  }, [windowSize]);

  const dropped = CONVERSATION.length - visible.keep.size;
  const lostInstructions = !visible.keep.has(0);

  return (
    <>
      <Panel label="Try it" title="Shrink the window and watch older messages fall out">
        <label htmlFor={sliderId} className="text-[11px] font-semibold text-primary-dark">
          Context window: {windowSize} tokens
        </label>
        <input
          id={sliderId}
          type="range"
          min={300}
          max={1100}
          step={100}
          value={windowSize}
          onChange={(e) => setWindowSize(Number(e.target.value))}
          aria-valuetext={`${windowSize} tokens`}
          className="w-full mt-1 accent-[var(--color-primary)]"
        />
        <div className="mt-1 h-2 w-full rounded-full bg-silver-mid/60 overflow-hidden" aria-hidden="true">
          <div className="h-full bg-primary" style={{ width: `${(visible.used / windowSize) * 100}%` }} />
        </div>
        <p className="text-[10px] text-gray-500 mt-0.5">{visible.used} of {windowSize} tokens in use</p>
        <ol className="mt-2 flex flex-col gap-1">
          {CONVERSATION.map((m, i) => {
            const inView = visible.keep.has(i);
            return (
              <li
                key={i}
                className={`flex gap-2 items-start rounded-inner border px-2 py-1.5 text-[11px] leading-snug transition-opacity ${
                  inView ? "bg-white border-silver-mid/60 text-gray-700" : "bg-transparent border-dashed border-silver-mid text-gray-400"
                }`}
              >
                <span className={`flex-shrink-0 w-7 font-bold ${inView ? "text-primary-dark" : ""}`}>{m.who}</span>
                <span className="flex-1">{m.text}</span>
                <span className="flex-shrink-0 font-mono text-[10px]">{m.tokens}</span>
                <span className="sr-only">{inView ? "(in view)" : "(out of view)"}</span>
              </li>
            );
          })}
        </ol>
        <p aria-live="polite" className="mt-2 text-[11px] font-semibold text-primary-dark">
          {dropped === 0
            ? "Everything fits. The model can see the whole conversation."
            : `${dropped} oldest message${dropped > 1 ? "s" : ""} out of view.${lostInstructions ? " Your original instructions are gone, so the 200-character limit may be ignored." : ""}`}
        </p>
        <Note>Mock numbers for illustration. Real windows are far larger, but the same thing happens in long chats.</Note>
      </Panel>
      <KeyPoints
        items={[
          "The context window is the model's working memory: your instructions, pasted material, and every reply so far.",
          "It has a fixed size in tokens. When a chat outgrows it, the oldest content stops being seen. Some tools trim it, others summarize it.",
          "In a long chat, restate the rules that matter, or start a fresh chat with a short summary.",
        ]}
      />
    </>
  );
}

// ─── 4. Retrieval-augmented generation (RAG) ───────────────────────────────────
// Fictional sample documents for the simulator. Not real policy.
const DOCS: { id: string; title: string; text: string; keywords: string[] }[] = [
  { id: "A", title: "Sample SOP: Vehicle checkout", text: "Vehicles are signed out at the front desk. Return keys by 1600 and log mileage on the checkout sheet.", keywords: ["vehicle", "vehicles", "keys", "checkout", "mileage", "return"] },
  { id: "B", title: "Sample SOP: Leave requests", text: "Submit leave requests at least 14 days ahead. Supervisors approve or return them within 3 duty days.", keywords: ["leave", "request", "requests", "submit", "supervisor", "approve"] },
  { id: "C", title: "Sample SOP: Training records", text: "Upload completed training certificates to the shared drive within 5 duty days of finishing the course.", keywords: ["training", "certificate", "certificates", "upload", "course", "records"] },
];

const QUESTIONS = [
  "How far ahead do I submit leave requests?",
  "When do I return vehicle keys?",
  "Where do training certificates go?",
];

const ANSWERS: Record<string, string> = {
  A: "Return the keys by 1600 and log your mileage on the checkout sheet.",
  B: "Submit it at least 14 days ahead. Your supervisor responds within 3 duty days.",
  C: "Upload them to the shared drive within 5 duty days of finishing the course.",
};

function retrieve(q: string) {
  const words: string[] = q.toLowerCase().match(/[a-z]+/g) ?? [];
  return DOCS.map((d) => ({ doc: d, hits: d.keywords.filter((k) => words.includes(k)) }))
    .sort((a, b) => b.hits.length - a.hits.length);
}

const RAG_STEPS = ["Question", "Search your sources", "Pull matching passages", "Answer from them, with a citation"];

const RAG_COMPARE = [
  { name: "RAG", fits: "Answers must come from specific, changing documents and you want a citation.", watch: "Only as good as the search. If the right passage isn't found, the answer suffers." },
  { name: "Long context", fits: "A few documents small enough to paste straight into the chat.", watch: "Fills the window fast, and details in a long paste can get missed." },
  { name: "Fine-tuning", fits: "Teaching a model a consistent style or specialized task.", watch: "Costly to retrain, and it doesn't keep facts current or cite sources." },
];

export function RagExplainer() {
  const [q, setQ] = useState(QUESTIONS[0]);
  const ranked = useMemo(() => retrieve(q), [q]);
  const top = ranked[0];

  return (
    <>
      <Panel label="Diagram" title="How RAG answers a question">
        <ol className="flex flex-wrap items-center gap-1 text-[11px]">
          {RAG_STEPS.map((s, i) => (
            <li key={s} className="flex items-center gap-1">
              <span className="rounded-badge bg-white border border-silver-mid/70 px-2 py-1 font-semibold text-primary-dark">
                <span className="text-warm-dark mr-1">{i + 1}</span>{s}
              </span>
              {i < RAG_STEPS.length - 1 && <ChevronRight size={12} aria-hidden="true" className="text-silver" />}
            </li>
          ))}
        </ol>
      </Panel>

      <Panel label="Try it" title="Ask a question against three sample documents">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Choose a sample question">
          {QUESTIONS.map((x) => (
            <Chip key={x} pressed={x === q} onClick={() => setQ(x)}>{x}</Chip>
          ))}
        </div>
        <ul className="mt-2 flex flex-col gap-1" aria-label="Sample documents">
          {ranked.map(({ doc, hits }) => {
            const picked = doc.id === top.doc.id;
            return (
              <li key={doc.id} className={`rounded-inner border px-2 py-1.5 text-[11px] leading-snug bg-white ${picked ? "border-primary" : "border-silver-mid/60 text-gray-400"}`}>
                <p className={`font-bold ${picked ? "text-primary-dark" : ""}`}>
                  [{doc.id}] {doc.title}
                  {picked && <span className="ml-1.5 text-[10px] uppercase tracking-wide text-warm-dark">Retrieved</span>}
                </p>
                <p className={picked ? "text-gray-600" : ""}>{doc.text}</p>
                {picked && hits.length > 0 && <p className="text-[10px] text-gray-500 mt-0.5">Matched on: {hits.join(", ")}</p>}
              </li>
            );
          })}
        </ul>
        <div aria-live="polite" className="mt-2 rounded-inner bg-primary-tint/60 border border-primary/30 p-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-primary-dark">Grounded answer</p>
          <p className="text-xs text-gray-700 mt-0.5">{ANSWERS[top.doc.id]} <span className="font-semibold text-primary">[{top.doc.id}]</span></p>
        </div>
        <Note>Fictional documents and simple keyword matching. Real systems search by meaning, but the flow is the same.</Note>
      </Panel>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-[11px] border-collapse">
          <caption className="text-left text-[10px] font-bold uppercase tracking-wider text-silver mb-1.5">RAG compared with other ways to give a model knowledge</caption>
          <thead>
            <tr className="text-left text-primary-dark">
              <th scope="col" className="py-1 pr-2 border-b border-silver-mid">Approach</th>
              <th scope="col" className="py-1 pr-2 border-b border-silver-mid">Good fit when</th>
              <th scope="col" className="py-1 border-b border-silver-mid">Watch for</th>
            </tr>
          </thead>
          <tbody>
            {RAG_COMPARE.map((r) => (
              <tr key={r.name} className="align-top text-gray-600">
                <th scope="row" className="py-1.5 pr-2 border-b border-silver-mid/50 text-left font-bold text-primary-dark whitespace-nowrap">{r.name}</th>
                <td className="py-1.5 pr-2 border-b border-silver-mid/50 leading-snug">{r.fits}</td>
                <td className="py-1.5 border-b border-silver-mid/50 leading-snug">{r.watch}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <KeyPoints
        items={[
          "RAG looks things up first, then writes. The model answers from the passages it was handed, not just from memory.",
          "Citations let you check the source. If an answer has no citation, treat it as unverified.",
          "Only point it at material you are allowed to share with that tool.",
        ]}
      />
    </>
  );
}

// ─── 5. Prompt structure ───────────────────────────────────────────────────────
const PROMPT_PARTS = [
  { key: "role", label: "Role", text: "You are an Air Force writing coach who keeps things brief and direct.", missing: "Tone and voice will be generic." },
  { key: "context", label: "Context", text: "Recurring training moves from Tuesdays to Thursdays starting next month. The audience is the 25 Airmen in my flight.", missing: "It will invent details or leave blanks for dates and audience." },
  { key: "task", label: "Task", text: "Draft an email announcing the new training schedule.", missing: "" },
  { key: "format", label: "Format", text: "Three short paragraphs, under 120 words, ending with who to contact for questions.", missing: "Length and layout will be a guess." },
] as const;

type PartKey = (typeof PROMPT_PARTS)[number]["key"];

export function PromptExplainer() {
  const [on, setOn] = useState<Record<PartKey, boolean>>({ role: false, context: false, task: true, format: false });
  const count = Object.values(on).filter(Boolean).length;
  const rating = count <= 1 ? "Vague" : count < 4 ? "Workable" : "Specific";
  const toggle = (k: PartKey) => setOn((s) => ({ ...s, [k]: !s[k] }));

  return (
    <>
      <Panel label="Try it" title="Build a prompt one part at a time">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Prompt parts to include">
          {PROMPT_PARTS.map((p) => (
            p.key === "task"
              ? <span key={p.key} className="px-2.5 py-1 rounded-badge border border-primary bg-primary text-white text-[11px] font-semibold">Task (always)</span>
              : <Chip key={p.key} pressed={on[p.key]} onClick={() => toggle(p.key)}>{p.label}</Chip>
          ))}
        </div>
        <div className="mt-2 rounded-inner bg-white border border-silver-mid/60 p-2.5 font-mono text-[11px] leading-relaxed text-gray-700">
          {PROMPT_PARTS.filter((p) => on[p.key]).map((p) => (
            <p key={p.key}><span className="font-bold text-warm-dark">{p.label}:</span> {p.text}</p>
          ))}
        </div>
        <div aria-live="polite" className="mt-2">
          <p className="text-[11px] font-semibold text-primary-dark">
            Prompt strength: {rating} ({count} of 4 parts)
          </p>
          <ul className="mt-1 flex flex-col gap-0.5">
            {PROMPT_PARTS.filter((p) => !on[p.key] && p.missing).map((p) => (
              <li key={p.key} className="text-[11px] text-gray-500 leading-snug">Without {p.label.toLowerCase()}: {p.missing}</li>
            ))}
          </ul>
        </div>
      </Panel>
      <KeyPoints
        items={[
          <><strong>Role</strong> sets the voice, <strong>context</strong> supplies the facts, <strong>task</strong> says what to do, and <strong>format</strong> says what the result should look like.</>,
          "The first answer is a draft. Iterate: tell it what to change, the same way you would mark up a junior Airman's work.",
          "Never put information in a prompt that the tool is not approved to handle.",
        ]}
      />
    </>
  );
}

// ─── 6. Agents ─────────────────────────────────────────────────────────────────
const AGENT_STEPS = [
  { name: "Goal", what: "You give it an outcome, not a single question.", eg: "Find a 1-hour slot next week for the four section leads and draft the invite." },
  { name: "Plan", what: "It breaks the goal into steps.", eg: "1. Check calendars. 2. Find a common open slot. 3. Draft the invite." },
  { name: "Act", what: "It uses a tool it has been given access to.", eg: "Reads the four calendars." },
  { name: "Observe", what: "It looks at what the tool returned.", eg: "Thursday 1300 is open for everyone." },
  { name: "Repeat or finish", what: "If the goal isn't met, it loops back to plan or act. If it is, it stops.", eg: "Slot found, so it moves on and drafts the invite." },
  { name: "You review", what: "A person checks the result before anything goes out.", eg: "You confirm the time, fix the wording, and send it yourself." },
];

export function AgentLoopExplainer() {
  const [step, setStep] = useState(0);
  const s = AGENT_STEPS[step];
  const last = AGENT_STEPS.length - 1;

  return (
    <>
      <Panel label="Try it" title="Step through an agent loop">
        <ol className="flex flex-wrap items-center gap-1 text-[11px]">
          {AGENT_STEPS.map((x, i) => (
            <li key={x.name} className="flex items-center gap-1" aria-current={i === step ? "step" : undefined}>
              <span className={`rounded-badge border px-2 py-1 font-semibold ${
                i === step
                  ? "bg-primary text-white border-primary"
                  : i === last
                    ? "bg-warm-tint text-warm-dark border-warm"
                    : "bg-white text-primary-dark border-silver-mid/70"
              }`}>
                {x.name}
              </span>
              {i < last && <ChevronRight size={12} aria-hidden="true" className="text-silver" />}
            </li>
          ))}
        </ol>
        <p className="text-[10px] text-gray-500 mt-1"><span aria-hidden="true">↻ </span>Plan, act, and observe can repeat several times before the agent finishes.</p>
        <div aria-live="polite" className="mt-2 rounded-inner bg-white border border-silver-mid/60 p-2.5">
          <p className="text-xs font-bold text-primary-dark">Step {step + 1} of {AGENT_STEPS.length}: {s.name}</p>
          <p className="text-xs text-gray-600 leading-relaxed mt-0.5">{s.what}</p>
          <p className="text-[11px] text-gray-500 mt-1"><span className="font-bold uppercase tracking-wide text-silver">Example</span> · {s.eg}</p>
        </div>
        <div className="mt-2 flex gap-1.5">
          <button type="button" onClick={() => setStep((n) => Math.max(0, n - 1))} disabled={step === 0}
            className="px-2.5 py-1 rounded-badge border border-silver-mid bg-white text-[11px] font-semibold text-primary-dark disabled:opacity-40">
            Back
          </button>
          <button type="button" onClick={() => setStep((n) => (n < last ? n + 1 : 0))}
            className="px-2.5 py-1 rounded-badge border border-primary bg-primary text-[11px] font-semibold text-white">
            {step < last ? "Next step" : "Start over"}
          </button>
        </div>
      </Panel>
      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
        <div className="rounded-inner border border-silver-mid/60 p-2">
          <p className="font-bold text-primary-dark">Chat</p>
          <p className="text-gray-600 leading-snug mt-0.5">One question, one answer. You do the next step.</p>
        </div>
        <div className="rounded-inner border border-silver-mid/60 p-2">
          <p className="font-bold text-primary-dark">Agent</p>
          <p className="text-gray-600 leading-snug mt-0.5">One goal, many steps. It does the next step, using tools.</p>
        </div>
      </div>
      <KeyPoints
        items={[
          "An agent is a model plus tools plus a loop: plan, act, observe, repeat.",
          "It can only do what its tools allow. Give it the least access the job needs.",
          "More steps means more chances to go wrong. You still own and check the output.",
        ]}
      />
    </>
  );
}
