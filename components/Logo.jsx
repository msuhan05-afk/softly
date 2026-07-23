// Buzzora's real brand badge (public/logo.jpg): bee-and-daisy icon, wordmark
// and tagline baked into one circular mark by the designer. At nav/footer
// scale the baked-in text reads too small, so we pair the badge as an icon
// with a crisp rendered wordmark; the splash screen shows the full badge
// large enough for the baked-in type to read on its own.
export default function Logo({ size = 40, className = "" }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <img
        src="/logo.jpg"
        alt="Buzzora"
        style={{ width: size, height: size }}
        className="rounded-full object-cover shadow-soft"
      />
      <span className="font-display text-2xl tracking-tight md:text-3xl">
        BUZZORA<span className="text-honey-500">.</span>
      </span>
    </span>
  );
}
