import React, { useMemo, useState } from "react";
import PackageCard from "./PackageCard.jsx";

export default function PackagesGrid({ packages, onView, selectedIds, onToggleSelect }) {
  const categories = useMemo(() => ["All", ...new Set(packages.map((p) => p.category))], [packages]);
  const [active, setActive] = useState("All");

  const filtered = active === "All" ? packages : packages.filter((p) => p.category === active);

  return (
    <section id="packages" className="max-w-7xl mx-auto px-6 lg:px-10 py-20 lg:py-28">
      <div className="max-w-2xl">
        <p className="text-coral-500 font-semibold tracking-[0.2em] uppercase text-xs mb-3">Tour Packages</p>
        <h2 className="font-display text-3xl sm:text-4xl text-lagoon-900 text-balance">
          Pick a route through the islands
        </h2>
        <p className="text-driftwood mt-4">
          Every package covers stays, transfers and a day-by-day plan. Tap the heart to shortlist
          a few, then send one enquiry for all of them.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mt-9">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setActive(c)}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
              active === c
                ? "bg-lagoon-700 text-white border-lagoon-700"
                : "bg-white text-lagoon-700 border-sand-200 hover:border-lagoon-400"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-7 mt-9">
        {filtered.map((pkg) => (
          <PackageCard
            key={pkg.id}
            pkg={pkg}
            onView={onView}
            selected={selectedIds.includes(pkg.id)}
            onToggleSelect={onToggleSelect}
          />
        ))}
      </div>
    </section>
  );
}
