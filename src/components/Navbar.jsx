import React, { useState, useEffect } from "react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { label: "Packages", href: "#packages" },
    { label: "Why Us", href: "#why-us" },
    { label: "Gallery", href: "#gallery" },
    { label: "Enquire", href: "#enquire" },
  ];

  return (
    <header
      className={`fixed top-0 inset-x-0 z-40 transition-colors duration-300 ${
        scrolled ? "bg-sand-50/95 backdrop-blur shadow-sm" : "bg-transparent"
      }`}
    >
      <nav className="max-w-7xl mx-auto flex items-center justify-between px-6 lg:px-10 py-4">
        <a href="#top" className="flex items-center gap-2">
          <span
            className={`font-display text-xl tracking-tight ${
              scrolled ? "text-lagoon-700" : "text-white"
            }`}
          >
            Andaman&nbsp;Voyages
          </span>
        </a>

        <div className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={`text-sm font-medium transition-colors ${
                scrolled ? "text-lagoon-700 hover:text-coral-500" : "text-white/90 hover:text-white"
              }`}
            >
              {l.label}
            </a>
          ))}
          <a
            href="#enquire"
            className="rounded-full bg-coral-500 hover:bg-coral-600 text-white text-sm font-semibold px-5 py-2.5 transition-colors"
          >
            Plan My Trip
          </a>
        </div>

        <button
          onClick={() => setOpen((v) => !v)}
          className={`md:hidden p-2 rounded-lg ${scrolled ? "text-lagoon-700" : "text-white"}`}
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
      </nav>

      {open && (
        <div className="md:hidden bg-sand-50 border-t border-sand-200 px-6 py-4 flex flex-col gap-4">
          {links.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="text-lagoon-700 font-medium">
              {l.label}
            </a>
          ))}
          <a
            href="#enquire"
            onClick={() => setOpen(false)}
            className="rounded-full bg-coral-500 text-white text-sm font-semibold px-5 py-2.5 text-center"
          >
            Plan My Trip
          </a>
        </div>
      )}
    </header>
  );
}
