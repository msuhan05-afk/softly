"use client";

function Phone({ width, height, opacity = 1, translateY = 0, bg, children, label }) {
  return (
    <div
      className="relative rounded-[44px] border-[10px] border-stone-900 shadow-lifted bg-stone-900"
      style={{
        width,
        height,
        opacity,
        transform: `translateY(${translateY}px)`,
      }}
    >
      <div
        className="absolute inset-0 rounded-[32px] m-1 overflow-hidden flex flex-col items-center justify-center text-center px-5"
        style={{ background: bg }}
      >
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-5 rounded-full bg-stone-900/85" />
        {children}
        <span className="absolute bottom-4 text-[11px] tracking-ultra text-stone-500 uppercase">
          {label}
        </span>
      </div>
    </div>
  );
}

export default function AppPreview() {
  return (
    <section className="relative py-24 md:py-32 px-5 overflow-hidden">
      <div className="blob bg-sage" style={{ width: 480, height: 480, top: 60, left: "-160px" }} />
      <div className="blob bg-lavender" style={{ width: 520, height: 520, bottom: -120, right: "-180px" }} />

      <div className="relative max-w-5xl mx-auto text-center">
        <p className="reveal text-[12px] tracking-ultra text-stone-400 uppercase mb-3">Inside</p>
        <h2 className="reveal font-sans font-medium text-stone-800 tracking-tightest text-4xl md:text-6xl leading-[1.05] max-w-3xl mx-auto">
          One screen. A few <span className="font-hand text-coral text-[1.25em]">gentle</span> things to do on it.
        </h2>
        <p
          className="reveal text-stone-500 text-[17px] mt-5 max-w-xl mx-auto"
          style={{ transitionDelay: "120ms" }}
        >
          Each surface is a single room. No tabs, no streaks, no badges asking
          for a return visit.
        </p>

        <div className="reveal mt-16 hidden md:flex items-end justify-center gap-6" style={{ transitionDelay: "200ms" }}>
          <Phone width={280} height={580} opacity={0.8} translateY={48} bg="#E8EFE8" label="Breathe">
            <div className="w-28 h-28 rounded-full bg-white/70 flex items-center justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-sage" />
            </div>
            <span className="font-hand text-stone-700 text-2xl">inhale</span>
          </Phone>

          <Phone width={300} height={620} opacity={1} translateY={0} bg="#FDFCF8" label="Now">
            <span className="text-[12px] tracking-ultra text-stone-400 uppercase mb-3">3:33 pm</span>
            <p className="text-stone-800 text-[22px] leading-snug font-medium max-w-[220px]">
              One small thing, and then we rest.
            </p>
            <button
              className="mt-8 w-24 h-24 rounded-full bg-coral text-stone-800 font-medium shadow-soft animate-breathe flex items-center justify-center"
              aria-label="Breathe"
            >
              breathe
            </button>
          </Phone>

          <Phone width={280} height={580} opacity={0.8} translateY={96} bg="#EFEDF4" label="Diary">
            <span className="text-[12px] tracking-ultra text-stone-400 uppercase mb-3">tonight</span>
            <p className="font-hand text-stone-700 text-[26px] leading-snug max-w-[200px]">
              today the light was softer.
            </p>
          </Phone>
        </div>

        {/* Mobile: single phone */}
        <div className="reveal mt-14 md:hidden flex justify-center" style={{ transitionDelay: "200ms" }}>
          <Phone width={280} height={580} opacity={1} translateY={0} bg="#FDFCF8" label="Now">
            <span className="text-[11px] tracking-ultra text-stone-400 uppercase mb-3">3:33 pm</span>
            <p className="text-stone-800 text-[20px] leading-snug font-medium max-w-[200px]">
              One small thing, and then we rest.
            </p>
            <button className="mt-6 w-20 h-20 rounded-full bg-coral text-stone-800 font-medium shadow-soft animate-breathe">
              breathe
            </button>
          </Phone>
        </div>
      </div>
    </section>
  );
}
