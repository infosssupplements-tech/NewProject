export default function Marquee({ items, className = "", slow = false, separator = "·" }) {
  const row = [...items, ...items];
  return (
    <div className={`relative overflow-hidden ${className}`} aria-hidden="true">
      <div className={`flex w-max ${slow ? "marquee-track-slow" : "marquee-track"}`}>
        {[0, 1].map((dup) => (
          <div key={dup} className="flex shrink-0 items-center">
            {row.map((item, i) => (
              <span key={`${dup}-${i}`} className="flex items-center">
                <span className="px-5">{item}</span>
                <span className="opacity-40">{separator}</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
