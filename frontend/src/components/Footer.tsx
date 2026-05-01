export default function Footer() {
  return (
    <footer className="border-t border-border/60 mt-16">
      <div className="mx-auto max-w-6xl px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-white/50">
        <p>
          Built with React, Vite, Tailwind & Framer Motion · Powered by{" "}
          <a
            href="https://pollinations.ai"
            target="_blank"
            rel="noreferrer"
            className="text-accent hover:text-accent2"
          >
            Pollinations.ai
          </a>
        </p>
        <p className="font-mono text-xs text-white/40">
          © {new Date().getFullYear()} ImagineFlow
        </p>
      </div>
    </footer>
  );
}
