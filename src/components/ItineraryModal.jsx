import React, { useEffect } from "react";

export default function ItineraryModal({ pkg, onClose, onEnquire }) {
  useEffect(() => {
    if (!pkg) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [pkg, onClose]);

  if (!pkg) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6">
      <div className="absolute inset-0 bg-lagoon-900/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-sand-50 w-full sm:max-w-3xl sm:rounded-3xl rounded-t-3xl max-h-[92vh] overflow-y-auto shadow-2xl">
        <div className="relative h-56 sm:h-64">
          <img src={pkg.cover} alt={pkg.name} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-lagoon-900/85 via-lagoon-900/10 to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 h-9 w-9 rounded-full bg-white/85 hover:bg-white flex items-center justify-center text-lagoon-900"
            aria-label="Close"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M6 18L18 6" strokeLinecap="round" /></svg>
          </button>
          <div className="absolute bottom-4 left-6 right-6">
            <span className="inline-block bg-coral-500 text-white text-xs font-semibold px-3 py-1 rounded-full mb-2">
              {pkg.category}
            </span>
            <h3 className="font-display text-white text-2xl sm:text-3xl">{pkg.name}</h3>
            <p className="text-sand-100/90 text-sm mt-1">{pkg.duration} · {pkg.places.join(" · ")}</p>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          {/* Highlights */}
          <div className="flex flex-wrap gap-2 mb-8">
            {pkg.highlights.map((h) => (
              <span key={h} className="text-xs bg-lagoon-50 text-lagoon-700 border border-lagoon-100 px-3 py-1.5 rounded-full">
                {h}
              </span>
            ))}
          </div>

          {/* Voyage route itinerary */}
          <h4 className="font-display text-xl text-lagoon-900 mb-6">Day-by-day itinerary</h4>
          <div className="space-y-0">
            {pkg.itinerary.map((stop, i) => (
              <div key={stop.day} className="flex gap-5">
                <div className="flex flex-col items-center">
                  <div className="h-10 w-10 shrink-0 rounded-full bg-lagoon-700 text-white flex items-center justify-center font-display text-sm">
                    {String(stop.day).padStart(2, "0")}
                  </div>
                  {i < pkg.itinerary.length - 1 && <div className="route-line flex-1 my-1" />}
                </div>
                <div className={`pb-8 ${i === pkg.itinerary.length - 1 ? "pb-0" : ""}`}>
                  <p className="text-xs uppercase tracking-wide text-coral-500 font-semibold mb-1">Day {stop.day}</p>
                  <p className="font-display text-lagoon-900 text-lg mb-1.5">{stop.title}</p>
                  <p className="text-driftwood text-sm leading-relaxed max-w-xl">{stop.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Inclusions / Exclusions */}
          <div className="grid sm:grid-cols-2 gap-6 mt-4 border-t border-sand-200 pt-8">
            <div>
              <p className="font-semibold text-lagoon-900 mb-3 text-sm">Inclusions</p>
              <ul className="space-y-2">
                {pkg.inclusions.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-driftwood">
                    <svg className="mt-0.5 shrink-0" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1E8C7F" strokeWidth="2.5"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-semibold text-lagoon-900 mb-3 text-sm">Exclusions</p>
              <ul className="space-y-2">
                {pkg.exclusions.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-driftwood">
                    <svg className="mt-0.5 shrink-0" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#FF7A59" strokeWidth="2.5"><path d="M6 6l12 12M6 18L18 6" strokeLinecap="round" /></svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 mt-9 bg-lagoon-50 rounded-2xl p-5">
            <div>
              <span className="text-xs text-driftwood block">Starting from</span>
              <span className="font-display text-2xl text-lagoon-700">₹{pkg.price.toLocaleString("en-IN")}</span>
              <span className="text-xs text-driftwood"> {pkg.priceUnit}</span>
            </div>
            <button
              onClick={() => onEnquire(pkg)}
              className="rounded-full bg-coral-500 hover:bg-coral-600 text-white font-semibold px-6 py-3 transition-colors"
            >
              Enquire About This Package
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}