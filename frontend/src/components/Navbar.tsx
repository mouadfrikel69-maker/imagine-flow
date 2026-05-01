import { Link, NavLink } from "react-router-dom";
import { Sparkles } from "lucide-react";

export default function Navbar() {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? "text-white bg-surface border border-border"
        : "text-white/60 hover:text-white"
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-bg/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-accent to-accent2 text-bg shadow-lg shadow-accent/20 group-hover:shadow-accent/40 transition-shadow">
            <Sparkles size={18} strokeWidth={2.5} />
          </div>
          <span className="font-display text-lg font-extrabold tracking-tight">
            Imagine<span className="gradient-text">Flow</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1">
          <NavLink to="/" end className={linkClass}>
            Home
          </NavLink>
          <NavLink to="/text-to-image" className={linkClass}>
            Text → Image
          </NavLink>
          <NavLink to="/image-to-text" className={linkClass}>
            Image → Text
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
