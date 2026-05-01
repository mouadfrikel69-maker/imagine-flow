import { useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Image as ImageIcon,
  Upload,
  Copy,
  Check,
  Sparkles,
  X,
} from "lucide-react";

const STYLES: { label: string; instruction: string }[] = [
  {
    label: "Detailed caption",
    instruction:
      "Describe this image in 2–3 vivid, accurate sentences. Mention subject, setting, mood, and style.",
  },
  {
    label: "One-line alt text",
    instruction:
      "Write a single concise alt-text sentence describing this image (under 25 words).",
  },
  {
    label: "Prompt for re-generation",
    instruction:
      "Rewrite this image as a Stable Diffusion prompt: subject, style, lighting, composition, comma-separated tags. No preamble.",
  },
  {
    label: "Poetic description",
    instruction:
      "Describe this image as a short poetic vignette (3–4 lines). Evocative, sensory.",
  },
];

export default function ImageToText() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [style, setStyle] = useState(STYLES[0]);
  const [caption, setCaption] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const onPick = (f: File | null) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (f.size > 8 * 1024 * 1024) {
      setError("Image must be smaller than 8 MB.");
      return;
    }
    setError(null);
    setCaption("");
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    onPick(e.dataTransfer.files?.[0] ?? null);
  };

  const reset = () => {
    setFile(null);
    setPreviewUrl(null);
    setCaption("");
    setError(null);
  };

  const submit = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setCaption("");

    try {
      const dataUrl = await fileToDataUrl(file);
      const apiBase = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
      const res = await fetch(`${apiBase}/api/caption`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_data_url: dataUrl,
          instruction: style.instruction,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed (${res.status})`);
      }
      const data = (await res.json()) as { caption: string };
      setCaption((data.caption ?? "").trim());
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    if (!caption) return;
    await navigator.clipboard.writeText(caption);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <header className="mb-10 max-w-2xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-3 py-1 text-xs text-white/70 backdrop-blur">
          <ImageIcon size={13} className="text-accent2" /> Image → Text
        </div>
        <h1 className="mt-4 font-display text-4xl font-bold tracking-tight md:text-5xl">
          Show it, <span className="gradient-text">read about it.</span>
        </h1>
        <p className="mt-3 text-white/60">
          Drop in any image and ImagineFlow writes a caption — pick a style for
          how you want it phrased.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-[1fr_1.1fr]">
        {/* Upload panel */}
        <div className="card p-6">
          <label className="mb-2 block text-xs uppercase tracking-wider text-white/50">
            Image
          </label>
          {!previewUrl ? (
            <div
              onDrop={onDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => inputRef.current?.click()}
              className="flex aspect-video cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-bg/30 text-white/50 hover:border-accent2/60 hover:text-white transition-colors"
            >
              <Upload size={26} />
              <p className="text-sm">Click or drop an image here</p>
              <p className="text-xs text-white/30">PNG · JPG · WEBP · &lt; 8 MB</p>
            </div>
          ) : (
            <div className="relative aspect-video overflow-hidden rounded-xl border border-border bg-black/40">
              <img
                src={previewUrl}
                alt="upload preview"
                className="h-full w-full object-contain"
              />
              <button
                onClick={reset}
                className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white/80 hover:text-white"
                title="Remove"
              >
                <X size={14} />
              </button>
            </div>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onPick(e.target.files?.[0] ?? null)}
          />

          <label className="mb-2 mt-6 block text-xs uppercase tracking-wider text-white/50">
            Style
          </label>
          <div className="flex flex-wrap gap-2">
            {STYLES.map((s) => (
              <button
                key={s.label}
                type="button"
                onClick={() => setStyle(s)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                  style.label === s.label
                    ? "border-accent2 bg-accent2/10 text-white"
                    : "border-border text-white/60 hover:text-white"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {error && (
            <p className="mt-4 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={submit}
            disabled={!file || loading}
            className="btn-primary mt-6 w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles size={16} />
            {loading ? "Reading the image…" : "Generate caption"}
          </button>
        </div>

        {/* Output panel */}
        <div className="card p-6">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-white/50">
              Caption
            </span>
            {caption && (
              <button
                type="button"
                onClick={copy}
                className="btn-ghost px-3 py-1.5 text-xs"
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? "Copied" : "Copy"}
              </button>
            )}
          </div>

          <div className="min-h-[260px] rounded-xl border border-border bg-bg/40 p-5">
            {loading && (
              <div className="space-y-3">
                <div className="h-3 rounded shimmer" />
                <div className="h-3 w-5/6 rounded shimmer" />
                <div className="h-3 w-2/3 rounded shimmer" />
              </div>
            )}
            {!loading && !caption && (
              <div className="grid h-full place-items-center text-center text-sm text-white/40">
                <div>
                  <ImageIcon size={26} className="mx-auto mb-2 text-accent2" />
                  Upload an image to see its caption appear here.
                </div>
              </div>
            )}
            {!loading && caption && (
              <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="whitespace-pre-wrap text-sm leading-relaxed text-white/85"
              >
                {caption}
              </motion.p>
            )}
          </div>

          <p className="mt-3 text-[11px] text-white/40">
            Captions are generated by Pollinations.ai vision models. Results
            vary; try different styles if a caption misses the mark.
          </p>
        </div>
      </div>
    </div>
  );
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
