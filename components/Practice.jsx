"use client";

const works = [
  {
    title: "Metalane — Health Platform",
    kind: "Product · Healthcare · 2024",
    body: "End-to-end digital health platform (now Illumina) — service discovery, appointments, family records and insurance, designed around accessibility and health literacy.",
    bg: "bg-sage",
  },
  {
    title: "Spatial Memory",
    kind: "XR · Quest · 2025",
    body: "A passthrough MR study where your kitchen counter becomes a calendar, and your bookshelf becomes an inbox.",
    bg: "bg-lavender",
  },
  {
    title: "Tangible Dial",
    kind: "Physical · Interaction Object · 2025",
    body: "A haptic rotary controller paired with a meditation app — tactile detents map to breath rhythm, not menu steps.",
    bg: "bg-peach",
  },
  {
    title: "HCI Lab — Reflections",
    kind: "Academic · Research · 2025",
    body: "Six critical reflections from FGCT7023 — wicked problems, communities of practice, participatory design, and the four orders.",
    bg: "bg-sage",
  },
  {
    title: "Wild Wisdom — Education",
    kind: "UI/UX · Motion · 2023",
    body: "An educational platform for young learners exploring wildlife and nature, with playful flows and motion sequences.",
    bg: "bg-lavender",
  },
  {
    title: "Cheesecake Studios",
    kind: "Brand · Studio · 2021 → Now",
    body: "Founded a boutique studio in J&K — animated invitations, identities and short-form video in Dogri.",
    bg: "bg-peach",
  },
];

export default function Practice() {
  return (
    <section id="practice" className="py-24 md:py-32 px-5">
      <div className="max-w-6xl mx-auto">
        <p className="reveal text-[12px] tracking-ultra text-stone-400 uppercase mb-3">Practice</p>
        <h2 className="reveal font-sans font-medium text-stone-800 tracking-tightest text-4xl md:text-6xl leading-[1.05] max-w-3xl">
          Things made along the way, <span className="font-hand text-coral text-[1.25em]">slowly.</span>
        </h2>
        <p className="reveal mt-5 text-stone-500 max-w-xl text-[17px]" style={{ transitionDelay: "120ms" }}>
          A small portfolio of product, XR and physical work — most of it about
          giving people back a little of their attention.
        </p>

        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {works.map((w, i) => (
            <article
              key={w.title}
              className="reveal group bg-white rounded-4xl border border-stone-100 shadow-soft p-6 flex flex-col hover:-translate-y-1 transition-transform duration-500"
              style={{ transitionDelay: `${i * 60}ms` }}
            >
              <div className={`${w.bg} rounded-3xl aspect-[4/3] mb-5 relative overflow-hidden`}>
                <div className="absolute inset-0 flex items-end p-4">
                  <span className="font-hand text-stone-700/80 text-2xl">
                    {w.title.split(" ")[0].toLowerCase()}
                  </span>
                </div>
                <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-coral" />
              </div>
              <span className="text-[12px] tracking-ultra text-stone-400 uppercase">{w.kind}</span>
              <h3 className="mt-2 text-[20px] font-medium text-stone-800 leading-snug">{w.title}</h3>
              <p className="mt-2 text-[14.5px] text-stone-500 leading-relaxed">{w.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
