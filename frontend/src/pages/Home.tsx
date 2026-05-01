import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Image as ImageIcon,
  Type,
  Sparkles,
  Zap,
  Lock,
  Wand2,
} from "lucide-react";
import TypingText from "../components/TypingText";
import AnimatedMockup from "../components/AnimatedMockup";

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0 },
};

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl px-6">
      {/* Hero */}
      <section className="grid gap-12 py-16 md:grid-cols-[1.1fr_1fr] md:gap-16 md:py-24 items-center">
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.12 } } }}
        >
          <motion.div
            variants={fadeUp}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-3 py-1 text-xs text-white/70 backdrop-blur"
          >
            <Sparkles size={14} className="text-accent" />
            Powered by Pollinations.ai · Free to try
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="mt-5 font-display text-5xl font-extrabold tracking-tight md:text-6xl leading-[1.05]"
          >
            Turn{" "}
            <span className="gradient-text">
              <TypingText
                phrases={["images into words", "words into images", "ideas into art", "photos into captions"]}
              />
            </span>
            <br />
            in one delightful flow.
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="mt-5 max-w-xl text-lg text-white/65 leading-relaxed"
          >
            ImagineFlow is a tiny studio for AI imagination. Drop a photo to get
            a poetic caption, or type a prompt to summon a brand-new image —
            instantly, in your browser.
          </motion.p>

          <motion.div variants={fadeUp} className="mt-8 flex flex-wrap gap-3">
            <Link to="/text-to-image" className="btn-primary">
              <Wand2 size={16} /> Try Text → Image
              <ArrowRight size={16} />
            </Link>
            <Link to="/image-to-text" className="btn-ghost">
              <ImageIcon size={16} /> Try Image → Text
            </Link>
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/45"
          >
            <span className="inline-flex items-center gap-1.5">
              <Zap size={14} className="text-accent2" /> No login needed
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Lock size={14} className="text-accent" /> Key kept server-side
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Sparkles size={14} className="text-accent2" /> Flux + GPT vision
            </span>
          </motion.div>
        </motion.div>

        <AnimatedMockup />
      </section>

      {/* Feature strip */}
      <section className="grid gap-5 py-10 md:grid-cols-3">
        {[
          {
            icon: Type,
            title: "Prompt to picture",
            desc: "Describe anything — a dragon over Kyoto, a vinyl logo, a logo for your startup. Get a unique image in seconds.",
          },
          {
            icon: ImageIcon,
            title: "Picture to prose",
            desc: "Upload any image and ImagineFlow writes a vivid, accurate caption you can copy, share, or feed back as a prompt.",
          },
          {
            icon: Wand2,
            title: "Round-trip remix",
            desc: "Caption an image, tweak the words, then regenerate. Iterate visually and verbally without leaving the page.",
          },
        ].map(({ icon: Icon, title, desc }, idx) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.5, delay: idx * 0.1 }}
            className="card p-6 hover:border-accent/40 transition-colors"
          >
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-accent/30 to-accent2/30 text-white">
              <Icon size={18} />
            </div>
            <h3 className="mt-4 font-display text-lg font-semibold">{title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-white/60">{desc}</p>
          </motion.div>
        ))}
      </section>

      {/* "How it works" with animated typing prompts and pics */}
      <section className="py-16">
        <div className="mb-10 max-w-2xl">
          <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
            See it think,{" "}
            <span className="gradient-text">in real time.</span>
          </h2>
          <p className="mt-3 text-white/60">
            Watch the prompt type itself out, then the model paints. Three live
            examples below — they're real images generated by Pollinations on
            page load.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              prompt: "a tiny astronaut floating in a teacup, isometric 3d",
              image: "/demos/teacup-astronaut.jpg",
            },
            {
              prompt: "a vintage analog synthesizer underwater, dreamy lighting",
              image: "/demos/synth.jpg",
            },
            {
              prompt: "a paper-craft city at night with glowing windows",
              image: "/demos/papercraft.jpg",
            },
          ].map(({ prompt, image }) => (
            <ExampleCard key={prompt} prompt={prompt} image={image} />
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="my-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="card relative overflow-hidden p-10 text-center"
        >
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-accent/20 via-fuchsia-500/10 to-accent2/20" />
          <div className="relative">
            <h3 className="font-display text-3xl font-bold md:text-4xl">
              Ready to imagine?
            </h3>
            <p className="mx-auto mt-3 max-w-lg text-white/70">
              Pick a side — start with a prompt, or with a picture. Everything's
              free, no account required.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link to="/text-to-image" className="btn-primary">
                <Wand2 size={16} /> Generate an image
              </Link>
              <Link to="/image-to-text" className="btn-ghost">
                <ImageIcon size={16} /> Caption an image
              </Link>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}

function ExampleCard({ prompt, image }: { prompt: string; image: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5 }}
      className="card overflow-hidden"
    >
      <div className="aspect-square overflow-hidden bg-black/40 relative">
        <div className="absolute inset-0 shimmer" />
        <img
          src={image}
          alt={prompt}
          loading="lazy"
          className="relative h-full w-full object-cover transition-opacity duration-500"
          onLoad={(e) => (e.currentTarget.style.opacity = "1")}
          style={{ opacity: 0 }}
        />
      </div>
      <div className="p-4">
        <div className="mb-1.5 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-white/40">
          <Type size={11} /> prompt
        </div>
        <p className="font-mono text-xs leading-relaxed text-white/80">
          <TypingText phrases={[prompt]} typingSpeedMs={40} pauseMs={9999999} />
        </p>
      </div>
    </motion.div>
  );
}
