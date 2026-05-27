"use client";
import { useState } from "react";

export default function Waitlist() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState("idle");

  const submit = (e) => {
    e.preventDefault();
    if (!email.includes("@")) return;
    setState("done");
  };

  return (
    <section id="hello" className="relative py-28 md:py-36 px-5 overflow-hidden">
      <div className="blob bg-peach animate-float" style={{ width: 520, height: 520, top: -120, left: "-200px" }} />
      <div className="blob bg-lavender animate-float-slow" style={{ width: 580, height: 580, bottom: -180, right: "-220px" }} />
      <div className="blob bg-sage" style={{ width: 360, height: 360, top: "30%", right: "30%", opacity: 0.4 }} />

      <div className="relative max-w-2xl mx-auto text-center">
        <div className="reveal mx-auto mb-8 w-14 h-14 rounded-2xl bg-stone-800 relative flex items-center justify-center shadow-lifted">
          <span className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-coral border-2 border-bg" />
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="round">
            <path d="M4 7l8 6 8-6" />
            <rect x="3.5" y="5.5" width="17" height="13" rx="3" />
          </svg>
        </div>

        <h2 className="reveal font-sans font-medium text-stone-800 tracking-tightest leading-[1.05]" style={{ fontSize: "clamp(36px, 6vw, 64px)" }}>
          Be one of the first to live{" "}
          <span className="font-hand text-coral text-[1.3em]">softly.</span>
        </h2>

        <p className="reveal mt-5 text-stone-500 text-[17px] max-w-md mx-auto" style={{ transitionDelay: "120ms" }}>
          A small, quiet email when we open the first room. No streaks. No
          tricks. Promise.
        </p>

        <form
          onSubmit={submit}
          className="reveal mt-9 flex flex-col sm:flex-row items-stretch gap-3 max-w-md mx-auto"
          style={{ transitionDelay: "200ms" }}
        >
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="flex-1 bg-stone-50 border border-stone-100 rounded-full px-5 py-3.5 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-stone-300 focus:bg-white transition-colors"
          />
          <button
            type="submit"
            className="bg-stone-900 text-white font-medium text-[15px] px-6 py-3.5 rounded-full hover:scale-[1.04] transition-transform duration-500"
          >
            {state === "done" ? "✓ You're on the list" : "Join"}
          </button>
        </form>

        <p className="reveal mt-6 text-[12px] tracking-ultra text-stone-400 uppercase" style={{ transitionDelay: "260ms" }}>
          Or say hello — namanmehra.work@gmail.com
        </p>
      </div>
    </section>
  );
}
