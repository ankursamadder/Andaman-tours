import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { user, signOut, openAuthModal, displayName } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { label: "Activities", href: "#packages" },
    { label: "Why Us", href: "#why-us" },
    { label: "Gallery", href: "#gallery" },
  ];

  const linkClass = scrolled ? "text-lagoon-700 hover:text-coral-500" : "text-white/90 hover:text-white";

  const authLabel = user ? displayName || user.email : "Sign In";

  return (
    <header
      className={`fixed top-0 inset-x-0 z-40 transition-colors duration-300 ${
        scrolled ? "bg-sand-50/95 backdrop-blur shadow-sm" : "bg-transparent"
      }`}
    >
      <nav className="max-w-7xl mx-auto flex items-center justify-between px-6 lg:px-10 py-4">
        <a href="#top" className="flex items-center gap-2">
          <span className={`font-display text-xl tracking-tight ${scrolled ? "text-lagoon-700" : "text-white"}`}>
            Andaman&nbsp;Voyages
          </span>
        </a>

        <div className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a key={l.href} href={l.href} className={`text-sm font-medium transition-colors ${linkClass}`}>
              {l.label}
            </a>
          ))}
          {user ? (
            <div className="flex items-center gap-3">
              <span className={`text-sm font-medium truncate max-w-[160px] ${scrolled ? "text-lagoon-700" : "text-white"}`}>
                {authLabel}
              </span>
              <button
                onClick={signOut}
                className={`text-sm font-semibold ${scrolled ? "text-coral-500" : "text-white underline"}`}
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={openAuthModal}
              className={`text-sm font-semibold px-4 py-2 rounded-full border transition-colors ${
                scrolled
                  ? "border-lagoon-700 text-lagoon-700 hover:bg-lagoon-50"
                  : "border-white/60 text-white hover:bg-white/10"
              }`}
            >
              Sign In
            </button>
          )}
          <a
            href="#packages"
            className="rounded-full bg-coral-500 hover:bg-coral-600 text-white text-sm font-semibold px-5 py-2.5 transition-colors"
          >
            Browse Activities
          </a>
        </div>

        <div className="md:hidden flex items-center gap-3">
          {!user ? (
            <button
              onClick={openAuthModal}
              className={`text-sm font-semibold px-3.5 py-1.5 rounded-full border transition-colors ${
                scrolled ? "border-lagoon-700 text-lagoon-700" : "border-white/60 text-white"
              }`}
            >
              Sign In
            </button>
          ) : (
            <span className={`text-xs font-medium px-3 py-1.5 rounded-full border ${scrolled ? "border-lagoon-700 text-lagoon-700" : "border-white/60 text-white"}`}>
              {authLabel}
            </span>
          )}

          <button
            onClick={() => setOpen((v) => !v)}
            className={`p-2 rounded-lg ${scrolled ? "text-lagoon-700" : "text-white"}`}
            aria-label="Toggle menu"
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {open ? (
                <path d="M6 6l12 12M6 18L18 6" strokeLinecap="round" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {open && (
        <div className="md:hidden bg-sand-50 border-t border-sand-200 px-6 py-4 flex flex-col gap-4">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="text-lagoon-700 font-medium"
            >
              {l.label}
            </a>
          ))}
          {user ? (
            <button
              onClick={async () => {
                await signOut();
                setOpen(false);
              }}
              className="rounded-full bg-lagoon-700 text-white text-sm font-semibold px-5 py-2.5 text-center"
            >
              Sign Out
            </button>
          ) : (
            <button
              onClick={() => {
                openAuthModal();
                setOpen(false);
              }}
              className="rounded-full bg-coral-500 text-white text-sm font-semibold px-5 py-2.5 text-center"
            >
              Sign In
            </button>
          )}
          <a
            href="#packages"
            onClick={() => setOpen(false)}
            className="rounded-full border border-lagoon-700 text-lagoon-700 text-sm font-semibold px-5 py-2.5 text-center"
          >
            Browse Activities
          </a>
        </div>
      )}
    </header>
  );
}
