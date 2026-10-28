
export default function InfiniteS() {
  const messages = [
    "Watch all courses for just $12/month",
    "The Creative Pass",
    "☺",
  ];

  return (
    <div className="w-full overflow-hidden bg-gray-100 py-3">
      <div className="flex w-max animate-marquee hover:[animation-play-state:paused]">
        {[0, 1, 2, 3].map((copy) => (
          <div
            key={copy}
            className="flex shrink-0 items-center gap-7 pr-7"
            aria-hidden={copy !== 0}
          >
            {messages.map((message, index) => (
              <span
                key={index}
                className={index === 1 ? "font-bold" : ""}
              >
                {message}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
