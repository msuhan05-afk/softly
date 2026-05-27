"use client";
import { useEffect, useState } from "react";

const links = [
  { href: "#moments", label: "Moments" },
  { href: "#practice", label: "Practice" },
  { href: "#diary", label: "Diary" },
  { href: "#hello", label: "Hello" },
];

export default function Nav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
  }, [open]);

  return (
    <header className="fixed top-4 inset-x-4 z-40 flex justify-center">
      <nav
        className="w-full max-w-5xl bg-white/70 backdrop-blur-xl rounded-full shadow-soft border border-stone-100 px-4 sm:px-5 py-2.5 flex items-center justify-between"
        style={{ backdropFilter: "blur(20px)" }}
      >
        <a href="#top" className="flex items-center gap-2 group">
          <span className="relative w-7 h-7 rounded-full bg-coral flex items-center justify-center shadow-softer">
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
          </span>
          <span className="text-[15px] font-medium tracking-ultra text-stone-800">softly</span>
        </a>

        <ul className="hidden md:flex items-center gap-7 text-[14px] font-medium text-stone-600">
          {links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="hover:text-stone-800 transition-colors duration-300"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <a
            href="#hello"
            className="hidden sm:inline-flex bg-stone-800 hover:bg-stone-900 text-white text-[13px] font-medium px-4 py-2 rounded-full transition-transform hover:scale-[1.03] duration-300"
          >
            Join the room
          </a>
          <button
            onClick={() => setOpen((v) => !v)}
            className="md:hidden w-9 h-9 rounded-full bg-stone-50 border border-stone-100 flex items-center justify-center"
            aria-label="Menu"
          >
            <span className="block w-3.5 h-px bg-stone-700 relative before:content-[''] before:absolute before:-top-1 before:left-0 before:w-3.5 before:h-px before:bg-stone-700 after:content-[''] after:absolute after:top-1 after:left-0 after:w-3.5 after:h-px after:bg-stone-700" />
          </button>
        </div>
      </nav>

      {open && (
        <div className="md:hidden fixed inset-x-4 top-20 bg-white/90 backdrop-blur-xl rounded-3xl border border-stone-100 shadow-lifted p-6">
          <ul className="space-y-4 text-stone-700">
            {links.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="text-lg font-medium"
                >
                  {l.label}
                </a>
              </li>
            ))}
            <li>
              <a
                href="#hello"
                onClick={() => setOpen(false)}
                className="inline-flex bg-stone-800 text-white text-sm font-medium px-4 py-2 rounded-full"
              >
                Join the room
              </a>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
