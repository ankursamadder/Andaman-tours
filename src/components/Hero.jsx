import React from "react";
import { img } from "../data/packages.js";

export default function Hero() {
  return (
    <section id="top" className="relative h-[92vh] min-h-[560px] w-full overflow-hidden">
      <img
        src={img.aerialIslands}
        alt="Aerial view of turquoise water and green islands in the Andaman Sea"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-lagoon-900/80 via-lagoon-900/35 to-lagoon-900/50" />

      <div className="relative z-10 h-full max-w-7xl mx-auto px-6 lg:px-10 flex flex-col justify-center">
        <p className="text-coral-400 font-semibold tracking-[0.2em] uppercase text-xs mb-4">
          Andaman &amp; Nicobar Islands, India
        </p>
        <h1 className="font-display text-white text-4xl sm:text-5xl lg:text-6xl leading-[1.08] max-w-2xl text-balance">
          Islands worth crossing an ocean for.
        </h1>
        <p className="text-sand-100/90 text-base sm:text-lg mt-6 max-w-xl">
          Handpicked tour packages across Port Blair, Havelock and Neil Island — beaches,
          scuba reefs and honeymoon hideaways, mapped out day by day.
        </p>
        <div className="mt-9 flex flex-wrap gap-4">
          <a
            href="#packages"
            className="rounded-full bg-coral-500 hover:bg-coral-600 text-white font-semibold px-7 py-3.5 transition-colors"
          >
            Browse Packages
          </a>
          <a
            href="#enquire"
            className="rounded-full border border-white/60 text-white hover:bg-white/10 font-semibold px-7 py-3.5 transition-colors"
          >
            Send an Enquiry
          </a>
        </div>
      </div>

      {/* signature wave divider */}
      <svg
        className="absolute bottom-0 left-0 w-full text-sand-50"
        viewBox="0 0 1440 90"
        fill="currentColor"
        preserveAspectRatio="none"
      >
        <path d="M0,40 C240,90 480,0 720,30 C960,60 1200,10 1440,45 L1440,90 L0,90 Z" />
      </svg>
    </section>
  );
}
