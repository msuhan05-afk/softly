import JarVisual from "@/components/JarVisual";

// Renders the product's real photo when one exists (public/products/*),
// falling back to the illustrated jar for varieties without photography yet.
// `fill` makes the image fill its parent (for fixed-size thumbnail slots);
// otherwise it sizes itself like JarVisual (width × 1.2 height) so it drops
// into the same layouts without adjustment.
export default function ProductVisual({ product, size = 220, fill = false, className = "" }) {
  if (!product.image) {
    return <JarVisual tone={product.jarTone} label={product.honeyType} size={size} />;
  }

  if (fill) {
    return (
      <img
        src={product.image}
        alt={`${product.name} jar`}
        className={`h-full w-full object-cover ${className}`}
      />
    );
  }

  return (
    <img
      src={product.image}
      alt={`${product.name} jar`}
      style={{ width: size, height: size * 1.2 }}
      className={`rounded-3xl object-cover shadow-jar ${className}`}
    />
  );
}
