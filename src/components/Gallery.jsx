import React from "react";
import { img } from "../data/packages.js";

const photos = [
  { src: img.aerialIslands, caption: "Islands scattered across the Andaman Sea", span: "sm:col-span-2 sm:row-span-2" },
  { src: img.whiteSand, caption: "Radhanagar Beach, Havelock Island" },
  { src: img.boatsHarbour, caption: "Fishing boats at anchor" },
  { src: img.greenWater, caption: "Shallow reef water near the shore" },
  { src: img.redBlueBoat, caption: "Traditional island boats" },
];

export default function Gallery() {
  return (
    <section id="gallery" className="max-w-7xl mx-auto px-6 lg:px-10 py-20 lg:py-28">
      <p className="text-coral-500 font-semibold tracking-[0.2em] uppercase text-xs mb-3">Gallery</p>
      <h2 className="font-display text-3xl sm:text-4xl text-lagoon-900 max-w-xl text-balance">A glimpse before you go</h2>

      <div className="grid sm:grid-cols-4 auto-rows-[160px] gap-4 mt-10">
        {photos.map((p) => (
          <div key={p.src} className={`relative rounded-2xl overflow-hidden group ${p.span || ""}`}>
            <img
              src={p.src}
              alt={p.caption}
              loading="lazy"
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-lagoon-900/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
              <p className="text-white text-sm font-medium">{p.caption}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
