import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient.js";

const emptyForm = {
  name: "",
  phone: "",
  email: "",
  travelers: "2",
  travelMonth: "",
  message: "",
};

export default function EnquiryForm({ packages, selectedIds, onToggleSelect, prefill }) {
  const [form, setForm] = useState(emptyForm);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const selectedPackages = packages.filter((p) => selectedIds.includes(p.id));

  useEffect(() => {
    if (prefill) {
      document.getElementById("enquire")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [prefill]);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim() || !form.phone.trim()) {
      setError("Please share your name and phone number so we can reach you.");
      return;
    }

    if (selectedPackages.length === 0) {
      setError("Select at least one package above to include in your enquiry.");
      return;
    }

    setError("");
    setSaving(true);

    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim() || null,
      travelers: form.travelers,
      travel_month: form.travelMonth || null,
      message: form.message.trim() || null,
      selected_package_ids: selectedPackages.map((pkg) => pkg.id),
      selected_package_names: selectedPackages.map((pkg) => pkg.name),
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
      <section id="enquire" className="max-w-3xl mx-auto px-6 lg:px-10 py-24 text-center">
        <div className="h-16 w-16 rounded-full bg-lagoon-50 text-lagoon-700 flex items-center justify-center mx-auto mb-6">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 className="font-display text-3xl text-lagoon-900 mb-3">Enquiry received</h2>
        <p className="text-driftwood max-w-md mx-auto">
          Thanks, {form.name.split(" ")[0]}. Our travel desk will get back to you on {form.phone} with a
          custom quote for {selectedPackages.map((p) => p.name).join(", ")}.
        </p>
        <button
          onClick={() => {
            setForm(emptyForm);
            setSubmitted(false);
          }}
          className="mt-8 rounded-full border border-lagoon-700 text-lagoon-700 font-semibold px-6 py-3 hover:bg-lagoon-50 transition-colors"
        >
          Send another enquiry
        </button>
      </section>
    );
  }

  return (
    <section id="enquire" className="bg-sand-100">
      <div className="max-w-4xl mx-auto px-6 lg:px-10 py-20 lg:py-24">
        <p className="text-coral-500 font-semibold tracking-[0.2em] uppercase text-xs mb-3 text-center">
          Enquire
        </p>
        <h2 className="font-display text-3xl sm:text-4xl text-lagoon-900 text-center text-balance">
          Tell us your dates, we'll do the planning
        </h2>
        <p className="text-driftwood text-center mt-4 max-w-lg mx-auto">
          Fill this out and we'll send a tailored quote to your phone or email - no obligation.
        </p>

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-sm border border-sand-200 p-6 sm:p-9 mt-10">
          <div>
            <p className="font-semibold text-lagoon-900 text-sm mb-3">Selected packages</p>
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

          <div className="grid sm:grid-cols-2 gap-5 mt-8">
            <Field label="Full name" required>
              <input
                type="text"
                value={form.name}
                onChange={update("name")}
                placeholder="Priya Sharma"
                className="form-input"
              />
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
            <Field label="Number of travelers">
              <select value={form.travelers} onChange={update("travelers")} className="form-input">
                {["1", "2", "3", "4", "5", "6+"].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Preferred travel month" full>
              <input
                type="month"
                value={form.travelMonth}
                onChange={update("travelMonth")}
                className="form-input"
              />
            </Field>
            <Field label="Anything else we should know?" full>
              <textarea
                value={form.message}
                onChange={update("message")}
                rows={4}
                placeholder="E.g. celebrating our anniversary, need a wheelchair-accessible stay, traveling with kids..."
                className="form-input resize-none"
              />
            </Field>
          </div>

          {error && <p className="text-coral-600 text-sm mt-4">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="mt-8 w-full sm:w-auto rounded-full bg-coral-500 hover:bg-coral-600 disabled:opacity-60 text-white font-semibold px-8 py-3.5 transition-colors"
          >
            {saving ? "Sending..." : "Send Enquiry"}
          </button>
        </form>
      </div>
    </section>
  );
}

function Field({ label, required, full, children }) {
  return (
    <label className={`block ${full ? "sm:col-span-2" : ""}`}>
      <span className="text-sm font-medium text-lagoon-900 mb-1.5 block">
        {label} {required && <span className="text-coral-500">*</span>}
      </span>
      {children}
    </label>
  );
}
