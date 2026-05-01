import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { ImageIcon, Type, Sparkles } from "lucide-react";

const samples = [
  {
    prompt: "an astronaut riding a horse on mars, cinematic, hyper-detailed",
    image:
      "https://image.pollinations.ai/prompt/an%20astronaut%20riding%20a%20horse%20on%20mars%2C%20cinematic%2C%20hyper-detailed?width=512&height=512&nologo=true&seed=42",
  },
  {
    prompt: "a neon cyberpunk fox in a rainy tokyo alley, photorealistic",
    image:
      "https://image.pollinations.ai/prompt/a%20neon%20cyberpunk%20fox%20in%20a%20rainy%20tokyo%20alley%2C%20photorealistic?width=512&height=512&nologo=true&seed=7",
  },
  {
    prompt: "a cozy cottage in an enchanted forest at golden hour, studio ghibli",
    image:
      "https://image.pollinations.ai/prompt/a%20cozy%20cottage%20in%20an%20enchanted%20forest%20at%20golden%20hour%2C%20studio%20ghibli?width=512&height=512&nologo=true&seed=12",
  },
  {
    prompt: "a crystal dragon perched on a mountain peak, fantasy concept art",
    image:
      "https://image.pollinations.ai/prompt/a%20crystal%20dragon%20perched%20on%20a%20mountain%20peak%2C%20fantasy%20concept%20art?width=512&height=512&nologo=true&seed=99",
  },
];

export default function AnimatedMockup() {
  const [i, setI] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % samples.length), 5000);
    return () => clearInterval(t);
  }, []);

  const sample = samples[i];

  return (
    <div className="relative">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="card overflow-hidden shadow-2xl shadow-black/50"
      >
        {/* Mock window chrome */}
        <div className="flex items-center gap-2 border-b border-border/60 px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
          <div className="ml-3 flex-1 truncate font-mono text-[11px] text-white/40">
            imagineflow.app/text-to-image
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Prompt side */}
          <div className="border-b md:border-b-0 md:border-r border-border/60 p-5">
            <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-wider text-white/50">
              <Type size={14} /> Prompt
            </div>
            <AnimatePresence mode="wait">
              <motion.p
                key={sample.prompt}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.4 }}
                className="font-mono text-sm leading-relaxed text-white/80"
              >
                {sample.prompt}
              </motion.p>
            </AnimatePresence>
            <div className="mt-5 flex items-center gap-2 text-xs text-white/40">
              <Sparkles size={14} className="text-accent" /> flux · 512×512
            </div>
          </div>

          {/* Image side */}
          <div className="relative aspect-square md:aspect-auto md:min-h-[280px] overflow-hidden bg-black/40">
            <AnimatePresence mode="wait">
              <motion.img
                key={sample.image}
                src={sample.image}
                alt={sample.prompt}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.7 }}
                className="absolute inset-0 h-full w-full object-cover"
                loading="lazy"
              />
            </AnimatePresence>
            <div className="pointer-events-none absolute bottom-2 right-2 rounded-md bg-black/50 px-2 py-1 text-[10px] uppercase tracking-wider text-white/70 backdrop-blur">
              <ImageIcon size={10} className="inline mr-1" /> generated
            </div>
          </div>
        </div>
      </motion.div>

      {/* Floating glow */}
      <div className="pointer-events-none absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-r from-accent/30 via-fuchsia-500/20 to-accent2/30 blur-3xl" />
    </div>
  );
}
