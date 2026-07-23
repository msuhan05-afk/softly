import Link from "next/link";
import BeeCharacter from "@/components/BeeCharacter";

export const metadata = {
  title: "Page Not Found",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[80vh] max-w-2xl flex-col items-center justify-center px-4 pt-24 text-center sm:px-6">
      <div className="animate-wobble">
        <BeeCharacter size={110} expression="sad" />
      </div>
      <p className="eyebrow mt-6">404</p>
      <h1 className="mt-2 font-display text-4xl sm:text-5xl">
        This jar wandered off.
      </h1>
      <p className="mx-auto mt-4 max-w-md text-charcoal-mute">
        We couldn&apos;t find the page you were looking for — it may have moved, or the link
        might be off by a letter. Let&apos;s get you back to the honey.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link href="/" className="btn-accent">
          Back to Home
        </Link>
        <Link href="/shop" className="btn-ghost">
          Shop Raw Honey
        </Link>
      </div>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-4 text-sm text-charcoal-mute">
        <Link href="/about" className="hover:text-honey-700">Our Story</Link>
        <span aria-hidden>·</span>
        <Link href="/hive-to-jar" className="hover:text-honey-700">From Hive to Jar</Link>
        <span aria-hidden>·</span>
        <Link href="/journal" className="hover:text-honey-700">The Honey Journal</Link>
      </div>
    </main>
  );
}
