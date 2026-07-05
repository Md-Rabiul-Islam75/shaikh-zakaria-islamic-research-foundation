"use client";

import { useState, useEffect } from "react";

/**
 * Renders `text` with a typewriter effect on first mount, then leaves it as
 * static text. A blinking caret shows while typing.
 */
export default function TypewriterText({
  text,
  className,
  speed = 22,
}: {
  text: string;
  className?: string;
  speed?: number;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setCount((c) => {
        if (c >= text.length) {
          clearInterval(id);
          return c;
        }
        return c + 1;
      });
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);

  const done = count >= text.length;

  return (
    <p className={className} aria-label={text}>
      {text.slice(0, count)}
      {!done && (
        <span className="inline-block animate-pulse font-normal">|</span>
      )}
    </p>
  );
}
