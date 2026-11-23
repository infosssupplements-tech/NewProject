export default function CardSlider({ items, renderCard, label }) {
  const loop = [...items, ...items];

  return (
    <div
      role="region"
      aria-label={label}
      className="marquee-pause relative w-full max-w-full min-w-0 overflow-hidden"
    >
      <ul className="marquee-track-slow flex w-max py-2">
        {loop.map((item, i) => (
          <li
            key={i}
            aria-hidden={i >= items.length ? "true" : undefined}
            className="w-[78vw] max-w-[320px] shrink-0 pr-4 sm:w-[340px] sm:max-w-none sm:pr-5 lg:w-[380px]"
          >
            {renderCard(item, i % items.length)}
          </li>
        ))}
      </ul>
    </div>
  );
}
