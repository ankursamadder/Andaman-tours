import React from "react";

export default function PackageCard({ pkg, onView, selected, onToggleSelect }) {
  return (
    <div className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300 border border-sand-200/70 flex flex-col">
      <div className="relative h-56 overflow-hidden">
        <img
          src={pkg.cover}
          alt={`${pkg.name} — ${pkg.places.join(", ")}`}
          loading="lazy"
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <span className="absolute top-3 left-3 bg-lagoon-900/80 text-sand-50 text-xs font-semibold px-3 py-1 rounded-full">
          {pkg.category}
        </span>
        <button
          onClick={() => onToggleSelect(pkg.id)}
          aria-pressed={selected}
          title="Add to enquiry"
          className={`absolute top-3 right-3 h-9 w-9 rounded-full flex items-center justify-center transition-colors ${
            selected ? "bg-coral-500 text-white" : "bg-white/85 text-lagoon-700 hover:bg-white"
          }`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill={selected ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
            <path d="M12 21s-7.5-4.6-10-9.1C.5 8.4 2.4 5 6 5c2.1 0 3.6 1.1 4.5 2.4C11.4 6.1 12.9 5 15 5c3.6 0 5.5 3.4 4 6.9-2.5 4.5-10 9.1-10 9.1z" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-lg text-lagoon-900 leading-snug">{pkg.name}</h3>
          <div className="flex items-center gap-1 text-xs text-driftwood shrink-0 mt-1">
            <svg width="13" height="13" viewBox="0 0 20 20" fill="#FF7A59"><path d="M10 1l2.6 5.9 6.4.6-4.8 4.3 1.4 6.3L10 15l-5.6 3.1 1.4-6.3L1 7.5l6.4-.6z" /></svg>
            <span className="font-medium text-lagoon-700">{pkg.rating}</span>
            <span>({pkg.reviews})</span>
          </div>
        </div>

        <p className="text-driftwood text-sm mt-1">{pkg.tagline}</p>

        <div className="flex items-center gap-2 text-xs text-lagoon-600 mt-3">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s7-6.3 7-12A7 7 0 0 0 5 10c0 5.7 7 12 7 12z" /><circle cx="12" cy="10" r="2.5" /></svg>
          <span>{pkg.places.join(" · ")}</span>
        </div>

        <div className="flex items-center gap-2 text-xs text-lagoon-600 mt-1.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>
          <span>{pkg.duration}</span>
        </div>

        <div className="mt-4 flex items-end justify-between">
          <div>
            <span className="text-xs text-driftwood block">Starting from</span>
            <span className="font-display text-2xl text-lagoon-700">₹{pkg.price.toLocaleString("en-IN")}</span>
            <span className="text-xs text-driftwood"> {pkg.priceUnit}</span>
          </div>
          <button
            onClick={() => onView(pkg)}
            className="rounded-full bg-lagoon-700 hover:bg-lagoon-600 text-white text-sm font-semibold px-4 py-2.5 transition-colors"
          >
            View Itinerary
          </button>
        </div>
      </div>
    </div>
  );
}
