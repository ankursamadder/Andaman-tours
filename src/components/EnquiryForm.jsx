import React, { useEffect, useMemo, useState } from "react";
import { calculateActivityQuote } from "../lib/contentHelpers.js";
import { supabase } from "../lib/supabaseClient.js";
import { useAuth } from "../context/AuthContext.jsx";

const emptyForm = {
  name: "",
  phone: "",
  email: "",
  message: "",
};

export default function EnquiryForm({
  packages,
  selectedIds,
  onToggleSelect,
  prefill,
  compact = false,
  showActivityPicker = true,
  embedded = false,
  showHeading = true,
  resetKey,
  title = "Tell us your dates, we'll do the planning",
  intro = "Fill this out and we'll send a tailored quote to your phone or email - no obligation.",
}) {
  const { user, displayName } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [activityState, setActivityState] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const selectedPackages = useMemo(() => packages.filter((p) => selectedIds.includes(p.id)), [packages, selectedIds]);

  useEffect(() => {
    if (!compact && prefill) {
      document.getElementById("enquire")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [compact, prefill]);

  useEffect(() => {
    setForm(emptyForm);
    setActivityState({});
    setSubmitted(false);
    setError("");
    setSaving(false);
  }, [resetKey]);

  useEffect(() => {
    if (!user?.email) return;
    setForm((current) => ({
      ...current,
      name: current.name || displayName || "",
      email: current.email || user.email || "",
    }));
  }, [user?.email, displayName]);

  useEffect(() => {
    setActivityState((current) => {
      const next = {};
      selectedPackages.forEach((pkg) => {
        const previous = current[pkg.id] || {};
        next[pkg.id] = {
          variantId: previous.variantId || pkg.variants?.[0]?.id || "",
          bookingValues: previous.bookingValues || {},
        };
      });
      return next;
    });
  }, [selectedPackages]);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const setPackageState = (packageId, updater) => {
    setActivityState((current) => {
      const previous = current[packageId] || { variantId: "", bookingValues: {} };
      const nextState = typeof updater === "function" ? updater(previous) : updater;
      return { ...current, [packageId]: nextState };
    });
  };

  const updateVariant = (packageId, variantId) => {
    setPackageState(packageId, (previous) => ({ ...previous, variantId }));
  };

  const updateBookingValue = (packageId, key) => (e) => {
    const value = e.target.value;
    setPackageState(packageId, (previous) => ({
      ...previous,
      bookingValues: { ...(previous.bookingValues || {}), [key]: value },
    }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setActivityState({});
    setSubmitted(false);
    setError("");
  };

  const quoteSummary = useMemo(() => {
    return selectedPackages.map((pkg) => {
      const current = activityState[pkg.id] || {};
      const variantId = current.variantId || pkg.variants?.[0]?.id || "";
      const bookingValues = current.bookingValues || {};
      const quote = calculateActivityQuote(pkg, variantId, bookingValues);
      const quantityField = pkg.bookingFields?.find((field) => field.key === quote.quantityFieldKey);
      return {
        packageId: pkg.id,
        packageName: pkg.name,
        category: pkg.category,
        variantId: quote.variant?.id || null,
        variantLabel: quote.variant?.label || null,
        variantDuration: quote.variant?.duration || null,
        variantNote: quote.variant?.note || null,
        variantPrice: quote.unitPrice,
        quantityFieldKey: quote.quantityFieldKey,
        quantityFieldLabel: quantityField?.label || null,
        quantity: quote.quantity,
        total: quote.total,
        complete: quote.complete,
        bookingValues,
      };
    });
  }, [selectedPackages, activityState]);

  const grandTotal = useMemo(() => {
    return quoteSummary.reduce((sum, item) => sum + (item.complete && item.total ? item.total : 0), 0);
  }, [quoteSummary]);

  const hasCompleteQuote = quoteSummary.some((item) => item.complete && item.total != null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim() || !form.phone.trim()) {
      setError("Please share your name and phone number so we can reach you.");
      return;
    }

    if (selectedPackages.length === 0) {
      setError("Select at least one activity above to include in your enquiry.");
      return;
    }

    for (const pkg of selectedPackages) {
      const current = activityState[pkg.id] || {};
      const variantId = current.variantId || pkg.variants?.[0]?.id || "";
      const bookingValues = current.bookingValues || {};
      if (!variantId) {
        setError(`Please choose an option for ${pkg.name}.`);
        return;
      }

      for (const field of pkg.bookingFields || []) {
        if (!shouldRenderBookingField(field, bookingValues)) continue;
        const value = bookingValues[field.key];
        if (field.required && (value == null || String(value).trim() === "")) {
          setError(`Please complete the ${field.label.toLowerCase()} field for ${pkg.name}.`);
          return;
        }
        if (field.type === "number" && value !== "" && value != null) {
          const numericValue = Number(value);
          if (Number.isNaN(numericValue)) {
            setError(`Please enter a valid ${field.label.toLowerCase()} for ${pkg.name}.`);
            return;
          }
          if (typeof field.min === "number" && numericValue < field.min) {
            setError(`${field.label} for ${pkg.name} must be at least ${field.min}.`);
            return;
          }
          if (typeof field.max === "number" && numericValue > field.max) {
            setError(`${field.label} for ${pkg.name} must be at most ${field.max}.`);
            return;
          }
        }
      }

      const quote = calculateActivityQuote(pkg, variantId, bookingValues);
      if (!quote.complete) {
        setError(`Please complete the booking details for ${pkg.name} to see the price.`);
        return;
      }
    }

    setError("");
    setSaving(true);

    const quotePayload = quoteSummary.map((item) => ({
      packageId: item.packageId,
      packageName: item.packageName,
      category: item.category,
      variantId: item.variantId,
      variantLabel: item.variantLabel,
      variantDuration: item.variantDuration,
      variantNote: item.variantNote,
      unitPrice: item.variantPrice,
      quantityFieldKey: item.quantityFieldKey,
      quantityFieldLabel: item.quantityFieldLabel,
      quantity: item.quantity,
      total: item.total,
      bookingValues: item.bookingValues,
    }));

    const firstQuote = quoteSummary[0] || null;
    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim() || null,
      travelers: "Activity enquiry",
      travel_month: null,
      message: form.message.trim() || null,
      selected_package_ids: selectedPackages.map((pkg) => pkg.id),
      selected_package_names: selectedPackages.map((pkg) => pkg.name),
      selected_variant_id: selectedPackages.length === 1 ? firstQuote?.variantId || null : null,
      selected_variant_label: selectedPackages.length === 1 ? firstQuote?.variantLabel || null : null,
      selected_variant_price: selectedPackages.length === 1 ? firstQuote?.variantPrice ?? null : null,
      selected_variant_duration: selectedPackages.length === 1 ? firstQuote?.variantDuration || null : null,
      selected_variant_note: selectedPackages.length === 1 ? firstQuote?.variantNote || null : null,
      quoted_total: grandTotal,
      quote_summary: quotePayload,
      booking_details: {
        activities: quotePayload,
        grandTotal,
      },
    };

    try {
      const { error: submitError } = await supabase.from("enquiries").insert(payload);

      if (submitError) {
        setError(submitError.message);
        return;
      }

      setSubmitted(true);
    } catch {
      setError("We could not save your enquiry right now. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (submitted) {
    return (
      <div className={compact ? "bg-white rounded-3xl border border-sand-200 shadow-sm p-6" : "max-w-3xl mx-auto px-6 lg:px-10 py-24 text-center"}>
        <div className="h-16 w-16 rounded-full bg-lagoon-50 text-lagoon-700 flex items-center justify-center mx-auto mb-6">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 className="font-display text-3xl text-lagoon-900 mb-3">Enquiry received</h2>
        <p className="text-driftwood max-w-md mx-auto">
          Thanks, {form.name.split(" ")[0]}. Our travel desk will get back to you on {form.phone} with a custom quote
          for {selectedPackages.map((p) => p.name).join(", ")}.
        </p>
        <button
          onClick={resetForm}
          className="mt-8 rounded-full border border-lagoon-700 text-lagoon-700 font-semibold px-6 py-3 hover:bg-lagoon-50 transition-colors"
        >
          Send another enquiry
        </button>
      </div>
    );
  }

  const body = (
    <div
      className={
        compact
          ? "bg-white rounded-3xl border border-sand-200 shadow-sm p-5 sm:p-6"
          : `bg-white rounded-3xl shadow-sm border border-sand-200 p-6 sm:p-9 ${embedded ? "" : "mt-10"}`
      }
    >
      <div className="mb-6">
        {showHeading ? (
          <div>
            <p className="text-coral-500 font-semibold tracking-[0.2em] uppercase text-xs mb-2">Quote Request</p>
            <h2 className={`${compact ? "text-2xl" : "text-3xl sm:text-4xl"} font-display text-lagoon-900 text-balance`}>
              {title}
            </h2>
            <p className={`text-driftwood ${compact ? "mt-3 text-sm" : "mt-3 text-left max-w-2xl"}`}>
              {intro}
            </p>
          </div>
        ) : (
          <p className="text-driftwood text-sm sm:text-base max-w-2xl">{intro}</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className={compact ? "mt-6 space-y-5" : "mt-10 space-y-5"}>
        {!compact && showActivityPicker && (
          <div>
            <p className="font-semibold text-lagoon-900 text-sm mb-3">Selected activities</p>
            <div className="flex flex-wrap gap-2">
              {packages.map((p) => {
                const active = selectedIds.includes(p.id);
                return (
                  <button
                    type="button"
                    key={p.id}
                    onClick={() => onToggleSelect(p.id)}
                    className={`text-xs font-medium px-3.5 py-2 rounded-full border transition-colors ${
                      active
                        ? "bg-lagoon-700 border-lagoon-700 text-white"
                        : "bg-sand-50 border-sand-200 text-lagoon-700 hover:border-lagoon-400"
                    }`}
                  >
                    {p.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-5">
          <Field label="Full name" required>
            <input type="text" value={form.name} onChange={update("name")} placeholder="Priya Sharma" className="form-input" />
          </Field>
          <Field label="Phone number" required>
            <input
              type="tel"
              value={form.phone}
              onChange={update("phone")}
              placeholder="+91 98765 43210"
              className="form-input"
            />
          </Field>
          <Field label="Email address">
            <input
              type="email"
              value={form.email}
              onChange={update("email")}
              placeholder="priya@example.com"
              className="form-input"
            />
          </Field>
        </div>

        {selectedPackages.length > 0 && (
          <div className="space-y-4">
            {selectedPackages.map((pkg) => {
              const current = activityState[pkg.id] || {};
              const variantId = current.variantId || pkg.variants?.[0]?.id || "";
              const bookingValues = current.bookingValues || {};
              const quote = calculateActivityQuote(pkg, variantId, bookingValues);
              const selectedVariant = quote.variant;
              return (
                <div key={pkg.id} className="rounded-3xl border border-sand-200 bg-sand-50/70 p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-coral-500 font-semibold mb-1">{pkg.category}</p>
                      <h3 className="font-display text-xl text-lagoon-900">{pkg.name}</h3>
                      <p className="text-sm text-driftwood mt-1">{pkg.tagline}</p>
                    </div>
                    <span className="text-xs font-semibold text-lagoon-700 bg-white border border-sand-200 rounded-full px-3 py-1.5">
                      {pkg.variants?.length || 0} options
                    </span>
                  </div>

                  <div className="space-y-4">
                    <Field label="Package option" full required>
                      <select
                        value={variantId}
                        onChange={(e) => updateVariant(pkg.id, e.target.value)}
                        className="form-input"
                      >
                        {(pkg.variants || []).map((variant) => (
                          <option key={variant.id} value={variant.id}>
                            {variant.label} - Rs. {variant.price.toLocaleString("en-IN")}
                          </option>
                        ))}
                      </select>
                      {selectedVariant?.description ? <p className="text-xs text-driftwood mt-2">{selectedVariant.description}</p> : null}
                      {selectedVariant?.note ? <p className="text-xs text-coral-600 mt-1">{selectedVariant.note}</p> : null}
                    </Field>

                    <div className={compact ? "space-y-4" : "grid sm:grid-cols-2 gap-4"}>
                      {(pkg.bookingFields || []).map((field) => {
                        if (!shouldRenderBookingField(field, bookingValues)) return null;
                        return (
                          <Field key={field.key} label={field.label} required={field.required}>
                            {renderBookingInput(field, bookingValues[field.key] ?? "", updateBookingValue(pkg.id, field.key))}
                          </Field>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="rounded-3xl bg-lagoon-50 border border-lagoon-100 p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-coral-500 font-semibold">Grand total</p>
                  <p className="text-sm text-driftwood mt-1">
                    {hasCompleteQuote
                      ? "Complete the remaining activity options if you want every selected activity included."
                      : "Complete an activity option to see the total."}
                  </p>
                </div>
                <span className="font-display text-2xl text-lagoon-700">
                  {hasCompleteQuote ? `Rs. ${grandTotal.toLocaleString("en-IN")}` : "Select options to see price"}
                </span>
              </div>
            </div>
          </div>
        )}

        <Field label="Anything else we should know?" full>
          <textarea
            value={form.message}
            onChange={update("message")}
            rows={4}
            placeholder="E.g. celebrating our anniversary, need a wheelchair-accessible stay, traveling with kids..."
            className="form-input resize-none"
          />
        </Field>

        {error && <p className="text-coral-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-full bg-coral-500 hover:bg-coral-600 disabled:opacity-60 text-white font-semibold px-8 py-3.5 transition-colors"
        >
          {saving ? "Sending..." : "Request Quote"}
        </button>
      </form>
    </div>
  );

  if (compact) {
    return body;
  }

  if (embedded) {
    return body;
  }

  return (
    <section id="enquire" className="bg-sand-100">
      <div className="max-w-4xl mx-auto px-6 lg:px-10 py-20 lg:py-24">{body}</div>
    </section>
  );
}
function shouldRenderBookingField(field, bookingValues) {
  if (!field.dependsOn) return true;
  return bookingValues[field.dependsOn.key] === field.dependsOn.value;
}

function renderBookingInput(field, value, onChange) {
  if (field.type === "select") {
    return (
      <select value={value} onChange={onChange} className="form-input">
        <option value="">Select an option</option>
        {field.options?.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }

  if (field.type === "number") {
    return <input type="number" value={value} onChange={onChange} min={field.min} max={field.max} step={field.step || 1} className="form-input" />;
  }

  if (field.type === "date" || field.type === "time") {
    return <input type={field.type} value={value} onChange={onChange} className="form-input" />;
  }

  return <input type="text" value={value} onChange={onChange} className="form-input" />;
}

function Field({ label, required, full, children }) {
  return (
    <label className={`block ${full ? "sm:col-span-2" : ""}`}>
      <span className="text-sm font-medium text-lagoon-900 mb-1.5 block whitespace-normal leading-snug break-words">
        {label} {required && <span className="text-coral-500">*</span>}
      </span>
      {children}
    </label>
  );
}
