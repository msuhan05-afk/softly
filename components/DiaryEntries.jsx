"use client";

const entries = [
  {
    n: "01",
    date: "March · 2026",
    text:
      "People trust physical knobs more than invisible gestures. The hand wants something to push back.",
    sig: "Naman",
    rot: -1,
  },
  {
    n: "02",
    date: "February · 2026",
    text:
      "Waiting screens become emotional spaces. Most of them are wasted on a spinner.",
    sig: "softly",
    rot: 1,
  },
  {
    n: "03",
    date: "January · 2026",
    text:
      "Most interfaces ignore rhythm. They tick — they don't breathe.",
    sig: "Naman",
    rot: -1,
  },
  {
    n: "04",
    date: "December · 2025",
    text:
      "A confirmation dialog is a small theatre. Treat it like one.",
    sig: "softly",
    rot: 1,
  },
];

export default function DiaryEntries() {
  return (
    <section id="diary" className="py-24 md:py-32 px-5 bg-bg">
      <div className="max-w-5xl mx-auto">
        <p className="reveal text-[12px] tracking-ultra text-stone-400 uppercase mb-3">Diary</p>
        <h2 className="reveal font-sans font-medium text-stone-800 tracking-tightest text-4xl md:text-6xl leading-[1.05] max-w-3xl">
          A few notes <span className="font-hand text-coral text-[1.25em]">left out</span> on the table.
        </h2>

        <div className="mt-14 grid md:grid-cols-2 gap-6">
          {entries.map((e, i) => (
            <article
              key={e.n}
              className="reveal bg-white rounded-4xl shadow-soft border border-stone-100 p-7 md:p-9"
              style={{
                transform: `rotate(${e.rot}deg)`,
                transitionDelay: `${i * 80}ms`,
              }}
            >
              <div className="flex items-center justify-between text-[12px] tracking-ultra text-stone-400 uppercase">
                <span>N° {e.n}</span>
                <span>{e.date}</span>
              </div>
              <p className="mt-6 text-[20px] md:text-[22px] leading-snug text-stone-800 font-medium">
                {e.text}
              </p>
              <div className="mt-7 flex items-center gap-3">
                <span className="block w-8 h-px bg-stone-300" />
                <span className="font-hand text-stone-500 text-2xl">{e.sig}</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
