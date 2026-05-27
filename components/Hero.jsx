"use client";

export default function Hero() {
  return (
    <section
      id="top"
      className="relative pt-36 pb-28 md:pt-44 md:pb-36 px-5 text-center overflow-hidden"
    >
      {/* Background blobs */}
      <div
        className="blob bg-peach animate-float"
        style={{ width: 460, height: 460, top: "-80px", left: "-120px" }}
      />
      <div
        className="blob bg-lilac animate-float-slow"
        style={{ width: 520, height: 520, top: "60px", right: "-160px" }}
      />
      <div
        className="blob bg-sage animate-float"
        style={{ width: 380, height: 380, bottom: "-160px", left: "30%", opacity: 0.45 }}
      />

      <div className="relative max-w-3xl mx-auto">
        <div className="reveal inline-flex items-center gap-2 bg-white/80 backdrop-blur border border-stone-100 rounded-full px-4 py-1.5 mb-8 shadow-softer">
          <span className="w-1.5 h-1.5 rounded-full bg-coral" />
          <span className="text-[12px] tracking-ultra text-stone-600">
            A small studio · London · 2026
          </span>
        </div>

        <h1
          className="reveal font-sans font-medium text-stone-800 leading-[1.05] tracking-tightest"
          style={{ fontSize: "clamp(44px, 8vw, 96px)" }}
        >
          A quieter way to live
          <br className="hidden sm:block" />{" "}
          <span
            className="font-hand text-coral align-baseline"
            style={{ fontSize: "1.15em", lineHeight: 0.8 }}
          >
            softly
          </span>{" "}
          with your screen.
        </h1>

        <p
          className="reveal mt-7 text-stone-500 text-[17px] md:text-[18px] leading-relaxed max-w-[500px] mx-auto"
          style={{ transitionDelay: "120ms" }}
        >
          Softly is a digital living room — a small, intentional companion
          designed around breath, rhythm, and the kinds of moments that don't
          ask for your attention back.
        </p>

        <div
          className="reveal mt-9 flex flex-col sm:flex-row items-center justify-center gap-3"
          style={{ transitionDelay: "200ms" }}
        >
          <a
            href="#hello"
            className="inline-flex items-center gap-2 bg-coral text-stone-800 font-medium text-[15px] px-6 py-3.5 rounded-full shadow-soft hover:shadow-lifted hover:scale-[1.03] transition-all duration-500"
          >
            Join the waitlist
            <span aria-hidden>→</span>
          </a>
          <a
            href="#moments"
            className="inline-flex items-center gap-2 bg-white text-stone-700 font-medium text-[15px] px-6 py-3.5 rounded-full border border-stone-200 hover:border-stone-300 hover:scale-[1.02] transition-all duration-500"
          >
            See a moment
          </a>
        </div>

        <div
          className="reveal mt-16 flex items-center justify-center gap-5 text-[12px] tracking-ultra text-stone-400"
          style={{ transitionDelay: "300ms" }}
        >
          <span>HCI · UCA London</span>
          <span className="w-1 h-1 rounded-full bg-stone-300" />
          <span>Made by Naman Mehra</span>
          <span className="w-1 h-1 rounded-full bg-stone-300 hidden sm:inline" />
          <span className="hidden sm:inline">Open May ’26</span>
        </div>
      </div>
    </section>
  );
}
