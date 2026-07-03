import React, { useEffect, useRef, useState } from "react";
import EnquiryForm from "./EnquiryForm.jsx";

const SCROLL_SHRINK_DISTANCE = 180;

function getBannerHeights() {
  if (typeof window !== "undefined" && window.innerWidth >= 640) {
    return {
      full: 288,
      scrolled: 120,
      quote: 96,
    };
  }

  return {
    full: 224,
    scrolled: 96,
    quote: 80,
  };
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export default function ItineraryModal({ pkg, onClose }) {
  const [view, setView] = useState("details");
  const [contentReady, setContentReady] = useState(true);
  const [bannerHeights, setBannerHeights] = useState(() => getBannerHeights());
  const [detailsScroll, setDetailsScroll] = useState(0);
  const scrollContainerRef = useRef(null);
  const scrollRafRef = useRef(0);

  useEffect(() => {
    const syncBannerHeights = () => {
      setBannerHeights(getBannerHeights());
    };

    syncBannerHeights();
    window.addEventListener("resize", syncBannerHeights);
    return () => window.removeEventListener("resize", syncBannerHeights);
  }, []);

  useEffect(() => {
    if (!pkg) return;
    setView("details");
    setContentReady(true);
    setDetailsScroll(0);
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [pkg, onClose]);

  useEffect(() => {
    if (!pkg) return;
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.scrollTop = 0;
    }
    setDetailsScroll(0);
    setContentReady(false);
    const frame = requestAnimationFrame(() => setContentReady(true));
    return () => cancelAnimationFrame(frame);
  }, [pkg, view]);

  useEffect(() => {
    return () => {
      if (scrollRafRef.current) {
        cancelAnimationFrame(scrollRafRef.current);
      }
    };
  }, []);

  if (!pkg) return null;

  const isQuoteView = view === "quote";
  const scrollProgress = clamp(detailsScroll / SCROLL_SHRINK_DISTANCE, 0, 1);
  const detailsBannerHeight =
    bannerHeights.full - (bannerHeights.full - bannerHeights.scrolled) * scrollProgress;
  const bannerHeight = isQuoteView ? bannerHeights.quote : detailsBannerHeight;
  const detailsOverlayOpacity = isQuoteView ? 0 : 1 - scrollProgress * 0.32;
  const detailsOverlayScale = isQuoteView ? 0.92 : 1 - scrollProgress * 0.1;
  const detailsOverlayTranslateY = isQuoteView ? 8 : scrollProgress * 10;

  const handleContentScroll = () => {
    if (isQuoteView || scrollRafRef.current) return;

    scrollRafRef.current = requestAnimationFrame(() => {
      scrollRafRef.current = 0;
      const scrollContainer = scrollContainerRef.current;
      if (!scrollContainer) return;
      const nextScroll = clamp(scrollContainer.scrollTop, 0, SCROLL_SHRINK_DISTANCE);
      setDetailsScroll((current) => (current === nextScroll ? current : nextScroll));
    });
  };

  const openQuoteView = () => {
    setView("quote");
  };

  const openDetailsView = () => {
    setView("details");
  };

  const startingPrice = Number(
    pkg.variants?.length
      ? Math.min(...pkg.variants.map((variant) => Number(variant.price) || Number.POSITIVE_INFINITY))
      : pkg.price || 0
  ).toLocaleString("en-IN");

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6">
      <div className="absolute inset-0 bg-lagoon-900/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl bg-sand-50 shadow-2xl sm:max-w-5xl sm:rounded-3xl">
        <div
          className="relative shrink-0 overflow-hidden transition-[height] duration-300 ease-in-out motion-reduce:transition-none"
          style={{ height: `${bannerHeight}px` }}
        >
          <img src={pkg.cover} alt={pkg.name} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-lagoon-900/85 via-lagoon-900/15 to-transparent" />

          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/85 text-lagoon-900 hover:bg-white"
            aria-label="Close"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M6 18L18 6" strokeLinecap="round" />
            </svg>
          </button>

          <div className="absolute inset-x-6 bottom-4">
            <div
              className="origin-bottom-left transition-all duration-300 ease-in-out motion-reduce:transition-none"
              style={{
                opacity: detailsOverlayOpacity,
                transform: `translateY(${detailsOverlayTranslateY}px) scale(${detailsOverlayScale})`,
              }}
            >
              <span className="mb-2 inline-block rounded-full bg-coral-500 px-3 py-1 text-xs font-semibold text-white">
                {pkg.category}
              </span>
              <h3 className="font-display text-2xl text-white sm:text-3xl">{pkg.name}</h3>
              <p className="mt-1 text-sm text-sand-100/90">
                {pkg.duration} - {pkg.places.join(" - ")}
              </p>
            </div>

            <div
              className={`absolute inset-x-0 bottom-0 transition-all duration-300 ease-in-out motion-reduce:transition-none ${
                isQuoteView ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"
              }`}
            >
              <h3 className="font-display text-xl leading-tight text-white sm:text-2xl">
                Request a quote for {pkg.name}
              </h3>
            </div>
          </div>
        </div>

        <div
          ref={scrollContainerRef}
          onScroll={handleContentScroll}
          className={`min-h-0 flex-1 overflow-y-auto transition-opacity duration-200 ease-out motion-reduce:transition-none ${
            contentReady ? "opacity-100" : "opacity-0"
          }`}
        >
          {view === "details" ? (
            <div className="flex min-h-full flex-col">
              <div className="flex-1 space-y-7 p-6 pb-28 sm:p-8 sm:pb-32">
                <div className="flex flex-wrap gap-2">
                  {pkg.highlights.map((h) => (
                    <span
                      key={h}
                      className="rounded-full border border-lagoon-100 bg-lagoon-50 px-3 py-1.5 text-xs text-lagoon-700"
                    >
                      {h}
                    </span>
                  ))}
                </div>

                <div>
                  <h4 className="mb-5 font-display text-lg text-lagoon-900">How it works</h4>
                  <div className="space-y-0">
                    {pkg.itinerary.map((stop, i) => (
                      <div key={stop.day} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-lagoon-700 font-display text-[11px] text-white">
                            {i + 1}
                          </div>
                          {i < pkg.itinerary.length - 1 && <div className="route-line my-1 flex-1" />}
                        </div>
                        <div className={i === pkg.itinerary.length - 1 ? "" : "pb-6"}>
                          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-coral-500">
                            Step {i + 1}
                          </p>
                          <p className="mb-1 font-display text-base text-lagoon-900">{stop.title}</p>
                          <p className="max-w-3xl text-xs leading-relaxed text-driftwood">{stop.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl border border-sand-200 bg-white p-5 sm:p-6">
                  <p className="mb-3 text-sm font-semibold text-lagoon-900">Inclusions</p>
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {pkg.inclusions.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-driftwood">
                        <svg
                          className="mt-0.5 shrink-0"
                          width="15"
                          height="15"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#1E8C7F"
                          strokeWidth="2.5"
                        >
                          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="sticky bottom-0 z-10 border-t border-sand-200 bg-sand-50/95 px-6 py-4 backdrop-blur supports-[backdrop-filter]:bg-sand-50/85 shadow-[0_-10px_35px_-28px_rgba(15,23,42,0.55)] sm:px-8">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="block text-xs text-driftwood">Starting from</span>
                    <span className="font-display text-2xl text-lagoon-700">Rs. {startingPrice}</span>
                    <span className="text-xs text-driftwood"> {pkg.priceUnit}</span>
                  </div>

                  <button
                    onClick={openQuoteView}
                    className="rounded-full bg-coral-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-coral-600"
                  >
                    Request a Quote
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3 p-4 pt-3 sm:space-y-3 sm:p-5 sm:pt-4">
              <button
                onClick={openDetailsView}
                className="inline-flex items-center gap-2 text-sm font-semibold text-lagoon-700 hover:text-coral-500"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Back to details
              </button>

              <EnquiryForm
                packages={[pkg]}
                selectedIds={[pkg.id]}
                compact={false}
                showActivityPicker={false}
                embedded
                showHeading={false}
                resetKey={`${pkg.id}-quote`}
                title={`Request a quote for ${pkg.name}`}
                intro="Share your details and we'll send a tailored quote for this activity."
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
