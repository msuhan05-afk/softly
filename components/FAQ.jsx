"use client";
import { useState } from "react";

const items = [
  {
    q: "Who is softly for?",
    a: "Anyone who feels their phone has gotten louder than they meant it to. It's especially for people who design, write, study, or care for others — work that needs a quieter inner room.",
  },
  {
    q: "Is this a real app?",
    a: "It's a small studio project by Naman Mehra — currently completing an MSc HCI at UCA London — exploring what a slower, less attention-extractive companion could feel like. Early rooms are being prototyped now.",
  },
  {
    q: "Will there be streaks, badges, or notifications?",
    a: "No. Streaks punish you for resting. Badges turn care into points. Notifications interrupt the thing they claim to support. None of those belong here.",
  },
  {
    q: "What's the design background?",
    a: "Product design for Metalane (now Illumina), visual storytelling for WWF India, founding Cheesecake Studios in J&K, and now research in tangible and spatial UI at UCA London. softly is the through-line.",
  },
  {
    q: "Where do I get in touch?",
    a: "Email is best — namanmehra.work@gmail.com. Or join the waitlist above and you'll hear from the studio when the first room opens.",
  },
];

function Item({ q, a, open, onClick }) {
  return (
    <div className={`bg-white rounded-2xl border border-stone-100 overflow-hidden ${open ? "open" : ""}`}>
      <button
        onClick={onClick}
        className="w-full flex items-center justify-between p-6 text-left"
      >
        <span className="text-[17px] md:text-[18px] font-medium text-stone-800 pr-6">{q}</span>
        <span className="plus-icon w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center text-stone-700 text-lg shrink-0">
          +
        </span>
      </button>
      <div
        className="grid transition-[grid-template-rows] duration-500 ease-in-out"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <p className="px-6 pb-6 text-stone-500 text-[15px] leading-relaxed">{a}</p>
        </div>
      </div>
    </div>
  );
}

export default function FAQ() {
  const [open, setOpen] = useState(0);

  return (
    <section className="py-24 md:py-32 px-5">
      <div className="max-w-3xl mx-auto">
        <p className="reveal text-[12px] tracking-ultra text-stone-400 uppercase mb-3">Slowly answered</p>
        <h2 className="reveal font-sans font-medium text-stone-800 tracking-tightest text-4xl md:text-5xl leading-[1.05]">
          A few <span className="font-hand text-coral text-[1.3em]">small</span> things, asked often.
        </h2>

        <div className="mt-12 space-y-3">
          {items.map((it, i) => (
            <div key={it.q} className="reveal" style={{ transitionDelay: `${i * 60}ms` }}>
              <Item
                q={it.q}
                a={it.a}
                open={open === i}
                onClick={() => setOpen(open === i ? -1 : i)}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
