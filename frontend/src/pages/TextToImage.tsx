import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wand2, Download, RefreshCw, Sparkles } from "lucide-react";

const PRESETS = [
  "a futuristic city skyline at sunset, ultra-detailed, cinematic",
  "a cozy cabin in a snowy forest, warm window glow, painterly",
  "a steampunk owl with brass goggles, studio lighting, 8k",
  "a koi fish swimming through galaxies, surreal, vibrant colors",
  "a minimalist logo for a coffee shop named 'Lumen', vector",
];

const SIZES: { label: string; w: number; h: number }[] = [
  { label: "Square 1:1", w: 1024, h: 1024 },
  { label: "Wide 16:9", w: 1280, h: 720 },
  { label: "Portrait 3:4", w: 768, h: 1024 },
];

export default function TextToImage() {
  const [prompt, setPrompt] = useState(PRESETS[0]);
  const [size, setSize] = useState(SIZES[0]);
  const [seed, setSeed] = useState<number>(() =>
    Math.floor(Math.random() * 99999),
  );
  const [submitted, setSubmitted] = useState<{
    prompt: string;
    seed: number;
    w: number;
    h: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const generate = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!prompt.trim()) return;
    setLoading(true);
    setSubmitted({ prompt: prompt.trim(), seed, w: size.w, h: size.h });
  };

  const reroll = () => {
    const newSeed = Math.floor(Math.random() * 99999);
    setSeed(newSeed);
    setLoading(true);
    setSubmitted({
      prompt: prompt.trim(),
      seed: newSeed,
      w: size.w,
      h: size.h,
    });
  };

  const apiBase = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
  const imageUrl = submitted
    ? `${apiBase}/api/image?prompt=${encodeURIComponent(submitted.prompt)}` +
      `&width=${submitted.w}&height=${submitted.h}&seed=${submitted.seed}`
    : null;

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <header className="mb-10 max-w-2xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-3 py-1 text-xs text-white/70 backdrop-blur">
          <Wand2 size={13} className="text-accent" /> Text → Image
        </div>
        <h1 className="mt-4 font-display text-4xl font-bold tracking-tight md:text-5xl">
          Describe it, <span className="gradient-text">summon it.</span>
        </h1>
        <p className="mt-3 text-white/60">
          Type a prompt and get a fresh image from the Pollinations Flux model.
          Tweak the seed for variations.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-[1fr_1.1fr]">
        {/* Prompt panel */}
        <form onSubmit={generate} className="card p-6">
          <label className="mb-2 block text-xs uppercase tracking-wider text-white/50">
            Prompt
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            placeholder="Describe the image you want…"
            className="w-full resize-none rounded-xl border border-border bg-bg/60 px-4 py-3 text-sm leading-relaxed text-white placeholder:text-white/30 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
          />

          <div className="mt-4 flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                type="button"
                key={p}
                onClick={() => setPrompt(p)}
                className="rounded-full border border-border bg-surface/40 px-3 py-1 text-[11px] text-white/60 hover:border-accent/50 hover:text-white transition-colors"
              >
                {p.length > 38 ? p.slice(0, 38) + "…" : p}
              </button>
            ))}
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-xs uppercase tracking-wider text-white/50">
                Aspect
              </label>
              <div className="flex flex-wrap gap-2">
                {SIZES.map((s) => (
                  <button
                    type="button"
                    key={s.label}
                    onClick={() => setSize(s)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                      size.label === s.label
                        ? "border-accent bg-accent/10 text-white"
                        : "border-border text-white/60 hover:text-white"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-2 block text-xs uppercase tracking-wider text-white/50">
                Seed
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={seed}
                  onChange={(e) => setSeed(Number(e.target.value) || 0)}
                  className="w-full rounded-lg border border-border bg-bg/60 px-3 py-1.5 font-mono text-xs text-white focus:border-accent focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setSeed(Math.floor(Math.random() * 99999))}
                  className="rounded-lg border border-border bg-surface/40 p-1.5 text-white/70 hover:text-white"
                  title="Random seed"
                >
                  <RefreshCw size={14} />
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !prompt.trim()}
            className="btn-primary mt-6 w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles size={16} />
            {loading ? "Generating…" : "Generate"}
          </button>
        </form>

        {/* Output panel */}
        <div className="card p-6">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-white/50">
              Result
            </span>
            {imageUrl && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={reroll}
                  className="btn-ghost px-3 py-1.5 text-xs"
                  title="Regenerate with new seed"
                >
                  <RefreshCw size={13} /> Reroll
                </button>
                <a
                  href={imageUrl}
                  target="_blank"
                  rel="noreferrer"
                  download
                  className="btn-ghost px-3 py-1.5 text-xs"
                >
                  <Download size={13} /> Open
                </a>
              </div>
            )}
          </div>

          <div
            className="relative w-full overflow-hidden rounded-xl border border-border bg-black/40"
            style={{
              aspectRatio: submitted
                ? `${submitted.w} / ${submitted.h}`
                : "1 / 1",
            }}
          >
            <AnimatePresence>
              {!imageUrl && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 grid place-items-center text-center text-white/40"
                >
                  <div>
                    <Wand2 size={28} className="mx-auto mb-2 text-accent" />
                    <p className="text-sm">Your image will appear here.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {loading && (
              <div className="absolute inset-0 shimmer rounded-xl" />
            )}

            {imageUrl && (
              <motion.img
                key={imageUrl}
                src={imageUrl}
                alt={submitted?.prompt}
                initial={{ opacity: 0, scale: 1.04 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7 }}
                onLoad={() => setLoading(false)}
                className="relative h-full w-full object-cover"
              />
            )}
          </div>

          {submitted && (
            <p className="mt-3 font-mono text-[11px] leading-relaxed text-white/40">
              {submitted.prompt}
              <span className="ml-2 rounded bg-surface px-1.5 py-0.5 text-white/60">
                seed {submitted.seed}
              </span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
