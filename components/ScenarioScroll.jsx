"use client";

const cards = [
  { time: "7:14 am", text: "A slow start. One breath before the inbox.", accent: "text-coral" },
  { time: "10:42 am", text: "A quiet check-in between meetings.", accent: "text-stone-700" },
  { time: "1:08 pm", text: "Lunch without a second screen.", accent: "text-emerald-700" },
  { time: "3:33 pm", text: "Stretch. Then keep designing.", accent: "text-amber-700" },
  { time: "6:21 pm", text: "Close the laptop. Properly.", accent: "text-coral" },
  { time: "9:47 pm", text: "Write one line in the diary.", accent: "text-violet-700" },
  { time: "11:02 pm", text: "Phone goes to the other room.", accent: "text-stone-700" },
];

export default function ScenarioScroll() {
  return (
    <section id="moments" className="py-20 md:py-28">
      <div className="max-w-6xl mx-auto px-5 mb-10">
        <p className="reveal text-[12px] tracking-ultra text-stone-400 uppercase mb-3">
          Moments
        </p>
        <h2 className="reveal font-sans font-medium text-stone-800 tracking-tightest text-4xl md:text-5xl max-w-2xl leading-tight">
          A day, made of <span className="font-hand text-coral text-[1.3em]">small pauses.</span>
        </h2>
      </div>

      <div className="no-scrollbar overflow-x-auto">
        <ul className="flex gap-4 px-5 pb-6 snap-x snap-mandatory" style={{ width: "max-content" }}>
          {cards.map((c, i) => (
            <li
              key={i}
              className="reveal snap-start group relative bg-white rounded-3xl shadow-soft border border-stone-100 flex flex-col justify-between p-5 transition-transform duration-500 hover:-translate-y-1"
              style={{ width: 288, height: 160, transitionDelay: `${i * 40}ms` }}
            >
              <span className="text-[14px] text-stone-400 font-medium">{c.time}</span>
              <span
                className={`text-[20px] leading-snug font-medium text-stone-800 group-hover:${c.accent} transition-colors duration-500`}
              >
                {c.text}
              </span>
            </li>
          ))}
          <li
            className="snap-start shrink-0 flex items-center justify-center rounded-3xl border border-dashed border-stone-200 text-stone-400 text-[14px]"
            style={{ width: 200, height: 160 }}
          >
            scroll →
          </li>
        </ul>
      </div>
    </section>
  );
}
