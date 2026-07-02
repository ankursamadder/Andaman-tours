import React from "react";

const reasons = [
  {
    title: "Local island experts",
    desc: "Our team is based in Port Blair and knows the ferries, tides and weather windows better than any online map.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 3a15 15 0 0 1 0 18M3 12h18" /></svg>
    ),
  },
  {
    title: "Real itineraries, no surprises",
    desc: "Every package shows the exact day-by-day plan, inclusions and exclusions before you enquire — nothing hidden.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /></svg>
    ),
  },
  {
    title: "Flexible, on request",
    desc: "Combine packages, add extra nights, or swap islands — send your shortlist and we'll tailor it for you.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12a8 8 0 0 1 14-5M20 12a8 8 0 0 1-14 5" strokeLinecap="round" /><path d="M4 4v5h5M20 20v-5h-5" strokeLinecap="round" strokeLinejoin="round" /></svg>
    ),
  },
  {
    title: "Quick response",
    desc: "Submit an enquiry and our travel desk gets back to you with a custom quote, usually within a few hours.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" strokeLinecap="round" /></svg>
    ),
  },
];

export default function WhyUs() {
  return (
    <section id="why-us" className="bg-lagoon-700 text-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-20 lg:py-24">
        <p className="text-coral-400 font-semibold tracking-[0.2em] uppercase text-xs mb-3">Why Andaman Voyages</p>
        <h2 className="font-display text-3xl sm:text-4xl max-w-xl text-balance">Planned like locals, priced like a booking desk</h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-14">
          {reasons.map((r) => (
            <div key={r.title}>
              <div className="h-11 w-11 rounded-full bg-white/10 flex items-center justify-center text-coral-400 mb-4">
                {r.icon}
              </div>
              <h3 className="font-display text-lg mb-2">{r.title}</h3>
              <p className="text-sand-100/80 text-sm leading-relaxed">{r.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
