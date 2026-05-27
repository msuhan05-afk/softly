"use client";

export default function Footer() {
  return (
    <footer className="px-5 pt-16 pb-12 border-t border-stone-100">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-full bg-coral flex items-center justify-center">
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
          </span>
          <div className="leading-tight">
            <div className="text-stone-800 font-medium tracking-ultra">softly</div>
            <div className="text-[12px] text-stone-400 tracking-ultra uppercase">a small studio · London ’26</div>
          </div>
        </div>

        <ul className="flex flex-wrap items-center gap-x-7 gap-y-3 text-[14px] text-stone-500">
          <li><a className="hover:text-stone-800 transition-colors" href="mailto:namanmehra.work@gmail.com">Email</a></li>
          <li><a className="hover:text-stone-800 transition-colors" href="https://www.linkedin.com/in/naman-mehra-/">LinkedIn</a></li>
          <li><a className="hover:text-stone-800 transition-colors" href="https://www.behance.net/namanmehra2">Behance</a></li>
          <li><a className="hover:text-stone-800 transition-colors" href="http://namansportfolio.framer.website/">Portfolio</a></li>
        </ul>

        <div className="font-hand text-stone-400 text-2xl">made gently</div>
      </div>
    </footer>
  );
}
