import { useEffect, useState } from "react";

type Props = {
  phrases: string[];
  typingSpeedMs?: number;
  deletingSpeedMs?: number;
  pauseMs?: number;
  className?: string;
};

export default function TypingText({
  phrases,
  typingSpeedMs = 70,
  deletingSpeedMs = 35,
  pauseMs = 1400,
  className = "",
}: Props) {
  const [index, setIndex] = useState(0);
  const [text, setText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = phrases[index % phrases.length];
    let timeout: ReturnType<typeof setTimeout>;

    if (!deleting && text === current) {
      timeout = setTimeout(() => setDeleting(true), pauseMs);
    } else if (deleting && text === "") {
      timeout = setTimeout(() => {
        setDeleting(false);
        setIndex((i) => (i + 1) % phrases.length);
      }, 0);
    } else {
      timeout = setTimeout(
        () => {
          setText((t) =>
            deleting ? current.slice(0, t.length - 1) : current.slice(0, t.length + 1),
          );
        },
        deleting ? deletingSpeedMs : typingSpeedMs,
      );
    }

    return () => clearTimeout(timeout);
  }, [text, deleting, index, phrases, typingSpeedMs, deletingSpeedMs, pauseMs]);

  return (
    <span className={className}>
      {text}
      <span className="inline-block w-[2px] ml-1 align-baseline bg-accent2 animate-blink" style={{ height: "0.95em" }} />
    </span>
  );
}
