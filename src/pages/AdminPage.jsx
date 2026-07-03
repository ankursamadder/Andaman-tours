import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient.js";
import { displayNameFromEmail, mergePackageLists, normalizePackageRecord, slugify } from "../lib/contentHelpers.js";
import seedPackages from "../data/packages.js";
import { useAuth } from "../context/AuthContext.jsx";
import AuthModal from "../components/AuthModal.jsx";

const emptyForm = {
  slug: "",
  name: "",
  tagline: "",
  duration: "",
  price: "",
  priceUnit: "per person",
  category: "Custom",
  rating: "0",
  reviews: "0",
  cover: "",
  gallery: "",
  places: "",
  highlights: "",
  inclusions: "",
  exclusions: "",
  itinerary: [{ day: "1", title: "", description: "" }],
};

function packageToForm(pkg) {
  return {
    slug: pkg.slug || pkg.id || "",
    name: pkg.name || "",
    tagline: pkg.tagline || "",
    duration: pkg.duration || "",
    price: String(pkg.price ?? ""),
    priceUnit: pkg.priceUnit || "per person",
    category: pkg.category || "Custom",
    rating: String(pkg.rating ?? 0),
    reviews: String(pkg.reviews ?? 0),
    cover: pkg.cover || "",
    gallery: (pkg.gallery || []).join(", "),
    places: (pkg.places || []).join(", "),
    highlights: (pkg.highlights || []).join("\n"),
    inclusions: (pkg.inclusions || []).join("\n"),
    exclusions: (pkg.exclusions || []).join("\n"),
    itinerary: (pkg.itinerary || []).length
      ? pkg.itinerary.map((stop) => ({
          day: String(stop.day ?? ""),
          title: stop.title || "",
          description: stop.description || "",
        }))
      : [{ day: "1", title: "", description: "" }],
  };
}

function parseLines(value) {
  return String(value)
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseCsv(value) {
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function AdminPage() {
  const { user, loading, isAdmin, displayName, openAuthModal, signOut } = useAuth();
  const [tab, setTab] = useState("packages");
  const [packageRows, setPackageRows] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingSlug, setEditingSlug] = useState("");

  const remotePackages = useMemo(() => packageRows.map(normalizePackageRecord), [packageRows]);
  const packages = useMemo(() => mergePackageLists(seedPackages, remotePackages), [remotePackages]);
  const remoteSlugs = useMemo(() => new Set(remotePackages.map((pkg) => pkg.slug || pkg.id)), [remotePackages]);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoadingData(true);
      const [packagesResult, enquiriesResult] = await Promise.all([
        supabase.from("packages").select("*").order("created_at", { ascending: false }),
        supabase.from("enquiries").select("*").order("created_at", { ascending: false }),
      ]);

      if (!active) return;

      if (!packagesResult.error) setPackageRows(packagesResult.data ?? []);
      if (!enquiriesResult.error) setEnquiries(enquiriesResult.data ?? []);
      setLoadingData(false);
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <Shell title="Admin Portal" subtitle="Loading your session..." />;
  }

  if (!user) {
    return (
      <Shell title="Admin Portal" subtitle="Sign in with the admin email to manage activities and enquiries.">
        <button
          onClick={openAuthModal}
          className="rounded-full bg-coral-500 px-6 py-3 font-semibold text-white hover:bg-coral-600"
        >
          Sign In
        </button>
      </Shell>
    );
  }

  if (!isAdmin) {
    return (
      <Shell
        title="Access Restricted"
        subtitle={`Signed in as ${displayNameFromEmail(user.email)}. This account does not have admin access.`}
      >
        <div className="flex flex-wrap gap-3">
          <button
            onClick={signOut}
            className="rounded-full border border-lagoon-700 px-6 py-3 font-semibold text-lagoon-700"
          >
            Sign Out
          </button>
          <a href="/" className="rounded-full bg-coral-500 px-6 py-3 font-semibold text-white hover:bg-coral-600">
            Back to site
          </a>
        </div>
      </Shell>
    );
  }

  const handleField = (field) => (e) => setForm((current) => ({ ...current, [field]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim()) {
      setError("Activity name is required.");
      return;
    }

    if (!form.cover.trim()) {
      setError("Cover image URL is required.");
      return;
    }

    setSaving(true);

    const slug = slugify(form.slug || form.name);
    if (!slug) {
      setSaving(false);
      setError("Slug could not be generated. Please add an activity name.");
      return;
    }

    const payload = {
      slug,
      name: form.name.trim(),
      tagline: form.tagline.trim(),
      duration: form.duration.trim(),
      price: Number(form.price || 0),
      price_unit: form.priceUnit.trim() || "per person",
      category: form.category.trim() || "Custom",
      rating: Number(form.rating || 0),
      reviews: Number(form.reviews || 0),
      cover: form.cover.trim(),
      gallery: parseCsv(form.gallery),
      places: parseCsv(form.places),
      highlights: parseLines(form.highlights),
      inclusions: parseLines(form.inclusions),
      exclusions: parseLines(form.exclusions),
      itinerary: form.itinerary
        .map((stop) => ({
          day: Number(stop.day),
          title: stop.title.trim(),
          description: stop.description.trim(),
        }))
        .filter((stop) => stop.day && stop.title && stop.description),
    };

    const { error: saveError } = await supabase.from("packages").upsert(payload, { onConflict: "slug" });

    setSaving(false);
    if (saveError) {
      setError(saveError.message);
      return;
    }

    setForm(emptyForm);
    setEditingSlug("");
    const { data } = await supabase.from("packages").select("*").order("created_at", { ascending: false });
    setPackageRows(data ?? []);
  };

  const startEdit = (pkg) => {
    setEditingSlug(pkg.slug || pkg.id);
    setForm(packageToForm(pkg));
    setError("");
    setTab("packages");
  };

  const addItineraryRow = () => {
    setForm((current) => ({
      ...current,
      itinerary: [...current.itinerary, { day: "", title: "", description: "" }],
    }));
  };

  const updateItineraryRow = (index, field, value) => {
    setForm((current) => ({
      ...current,
      itinerary: current.itinerary.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    }));
  };

  const removeItineraryRow = (index) => {
    setForm((current) => ({
      ...current,
      itinerary: current.itinerary.filter((_, i) => i !== index),
    }));
  };

  return (
    <>
      <Shell
        title="Admin Portal"
        subtitle="Manage activities, how-it-works steps, and enquiries in one place."
        userLabel={displayName || user.email}
        actions={
          <div className="flex flex-wrap gap-3">
            <a href="/" className="rounded-full border border-lagoon-700 px-5 py-2.5 font-semibold text-lagoon-700">
              Back to site
            </a>
            <button
              onClick={signOut}
              className="rounded-full bg-coral-500 px-5 py-2.5 font-semibold text-white hover:bg-coral-600"
            >
              Sign Out
            </button>
          </div>
        }
      >
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setTab("packages")}
            className={`rounded-full border px-4 py-2 text-sm font-medium ${
              tab === "packages" ? "border-lagoon-700 bg-lagoon-700 text-white" : "border-sand-200 bg-white text-lagoon-700"
            }`}
          >
            Activities
          </button>
          <button
            onClick={() => setTab("enquiries")}
            className={`rounded-full border px-4 py-2 text-sm font-medium ${
              tab === "enquiries" ? "border-lagoon-700 bg-lagoon-700 text-white" : "border-sand-200 bg-white text-lagoon-700"
            }`}
          >
            Enquiries
          </button>
        </div>

        {tab === "packages" ? (
          <div className="grid items-start gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-3xl border border-sand-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="font-display text-2xl text-lagoon-900">Activities</h2>
                <button
                  onClick={() => {
                    setForm(emptyForm);
                    setEditingSlug("");
                    setError("");
                  }}
                  className="text-sm font-semibold text-coral-500"
                >
                  New activity
                </button>
              </div>

              {loadingData ? (
                <p className="text-sm text-driftwood">Loading activities...</p>
              ) : (
                <div className="max-h-[72vh] space-y-3 overflow-y-auto pr-1">
                  {packages.map((pkg) => (
                    <button
                      key={pkg.id}
                      onClick={() => startEdit(pkg)}
                      className={`w-full rounded-2xl border p-4 text-left transition-colors ${
                        editingSlug === (pkg.slug || pkg.id)
                          ? "border-lagoon-700 bg-lagoon-50"
                          : "border-sand-200 bg-sand-50 hover:border-lagoon-300"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-semibold text-lagoon-900">{pkg.name}</p>
                          <p className="text-sm text-driftwood">{pkg.duration}</p>
                        </div>
                        <span className="text-xs font-semibold text-lagoon-700">
                          {remoteSlugs.has(pkg.slug || pkg.id) ? "Saved" : "Seed"}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <form onSubmit={handleSave} className="rounded-3xl border border-sand-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <h2 className="font-display text-2xl text-lagoon-900">
                    {editingSlug ? "Edit activity" : "Add activity"}
                  </h2>
                  <p className="text-sm text-driftwood">Save it once, and it will appear on the public site too.</p>
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-full bg-coral-500 px-5 py-2.5 font-semibold text-white hover:bg-coral-600 disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>

              {error && <p className="mb-4 text-sm text-coral-600">{error}</p>}

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Slug">
                  <input value={form.slug} onChange={handleField("slug")} className="form-input" placeholder="scuba-diving" />
                </Field>
                <Field label="Name" required>
                  <input value={form.name} onChange={handleField("name")} className="form-input" placeholder="Scuba Diving" />
                </Field>
                <Field label="Tagline" full>
                  <input value={form.tagline} onChange={handleField("tagline")} className="form-input" placeholder="A short activity tagline" />
                </Field>
                <Field label="Duration">
                  <input value={form.duration} onChange={handleField("duration")} className="form-input" placeholder="3 Hours" />
                </Field>
                <Field label="Price">
                  <input type="number" value={form.price} onChange={handleField("price")} className="form-input" />
                </Field>
                <Field label="Price unit">
                  <input value={form.priceUnit} onChange={handleField("priceUnit")} className="form-input" placeholder="per person" />
                </Field>
                <Field label="Category">
                  <input value={form.category} onChange={handleField("category")} className="form-input" placeholder="Water Sports" />
                </Field>
                <Field label="Rating">
                  <input type="number" step="0.1" value={form.rating} onChange={handleField("rating")} className="form-input" />
                </Field>
                <Field label="Reviews">
                  <input type="number" value={form.reviews} onChange={handleField("reviews")} className="form-input" />
                </Field>
                <Field label="Cover image URL" full>
                  <input value={form.cover} onChange={handleField("cover")} className="form-input" placeholder="https://..." />
                </Field>
                <Field label="Gallery URLs" full>
                  <textarea value={form.gallery} onChange={handleField("gallery")} rows={2} className="form-input resize-none" placeholder="Comma-separated image URLs" />
                </Field>
                <Field label="Places" full>
                  <textarea value={form.places} onChange={handleField("places")} rows={2} className="form-input resize-none" placeholder="Port Blair, Havelock Island" />
                </Field>
                <Field label="Highlights" full>
                  <textarea value={form.highlights} onChange={handleField("highlights")} rows={3} className="form-input resize-none" placeholder="One highlight per line" />
                </Field>
                <Field label="Inclusions" full>
                  <textarea value={form.inclusions} onChange={handleField("inclusions")} rows={3} className="form-input resize-none" placeholder="One inclusion per line" />
                </Field>
                <Field label="Exclusions" full>
                  <textarea value={form.exclusions} onChange={handleField("exclusions")} rows={3} className="form-input resize-none" placeholder="One exclusion per line" />
                </Field>
              </div>

              <div className="mt-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="font-semibold text-lagoon-900">How it works steps</p>
                  <button type="button" onClick={addItineraryRow} className="text-sm font-semibold text-coral-500">
                    Add step
                  </button>
                </div>
                <div className="space-y-4">
                  {form.itinerary.map((stop, index) => (
                    <div key={index} className="rounded-2xl border border-sand-200 bg-sand-50 p-4">
                      <div className="grid gap-3 sm:grid-cols-[90px_1fr]">
                        <Field label="Step">
                          <input value={stop.day} onChange={(e) => updateItineraryRow(index, "day", e.target.value)} className="form-input" />
                        </Field>
                        <Field label="Title">
                          <input value={stop.title} onChange={(e) => updateItineraryRow(index, "title", e.target.value)} className="form-input" />
                        </Field>
                        <Field label="Description" full>
                          <textarea
                            value={stop.description}
                            onChange={(e) => updateItineraryRow(index, "description", e.target.value)}
                            rows={3}
                            className="form-input resize-none"
                          />
                        </Field>
                      </div>
                      {form.itinerary.length > 1 && (
                        <button type="button" onClick={() => removeItineraryRow(index)} className="mt-3 text-sm font-semibold text-coral-500">
                          Remove step
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </form>
          </div>
        ) : (
          <div className="grid gap-4">
            {loadingData ? (
              <p className="text-sm text-driftwood">Loading enquiries...</p>
            ) : enquiries.length ? (
              enquiries.map((item) => {
                const enquiryCategories = getEnquiryCategories(item);
                const enquiryActivities = getEnquiryActivities(item);

                return (
                  <article key={item.id} className="rounded-3xl border border-sand-200 bg-white p-5 shadow-sm sm:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h3 className="font-display text-2xl text-lagoon-900">{item.name}</h3>
                        <p className="mt-1 text-sm text-driftwood">
                          {item.phone}
                          {item.email ? ` · ${item.email}` : ""}
                        </p>
                      </div>
                      <span className="text-xs text-driftwood">{new Date(item.created_at).toLocaleString()}</span>
                    </div>

                    {enquiryCategories.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {enquiryCategories.map((category) => (
                          <span key={category} className="rounded-full border border-lagoon-100 bg-lagoon-50 px-3 py-1.5 text-xs text-lagoon-700">
                            {category}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
                      <Info label="Selected activities" value={String((item.selected_package_names || []).length)} />
                      <Info
                        label="Quoted total"
                        value={item.quoted_total != null ? `Rs. ${Number(item.quoted_total).toLocaleString("en-IN")}` : "-"}
                      />
                    </div>

                    <div className="mt-5">
                      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-driftwood">Selected activities</p>
                      <div className="space-y-3">
                        {enquiryActivities.map((quote, index) => {
                          const bookingDetails = formatBookingDetails(quote);
                          return (
                            <div
                              key={`${quote.packageId || quote.packageName || "activity"}-${quote.variantId || index}`}
                              className="rounded-2xl border border-sand-200 bg-sand-50 p-4"
                            >
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                  <p className="font-semibold text-lagoon-900">
                                    {quote.packageName || quote.activityName || "Activity"}
                                    {quote.variantLabel ? ` · ${quote.variantLabel}` : ""}
                                  </p>
                                  {quote.category && (
                                    <span className="mt-2 inline-flex rounded-full border border-lagoon-100 bg-lagoon-50 px-3 py-1.5 text-xs text-lagoon-700">
                                      {quote.category}
                                    </span>
                                  )}
                                </div>
                                <span className="text-sm font-semibold text-lagoon-700">
                                  {quote.total != null ? `Rs. ${Number(quote.total).toLocaleString("en-IN")}` : "Quote pending"}
                                </span>
                              </div>

                              {bookingDetails.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {bookingDetails.map((detail) => (
                                    <span
                                      key={`${quote.packageId || quote.packageName}-${detail.label}-${detail.value}`}
                                      className="rounded-full border border-sand-200 bg-white px-3 py-1.5 text-xs text-lagoon-700"
                                    >
                                      <span className="font-semibold">{detail.label}:</span> {detail.value}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {item.message && (
                      <div className="mt-5 rounded-2xl border border-sand-200 bg-white p-4">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-driftwood">Notes</p>
                        <p className="whitespace-pre-wrap text-sm text-driftwood">{item.message}</p>
                      </div>
                    )}
                  </article>
                );
              })
            ) : (
              <p className="text-sm text-driftwood">No enquiries yet.</p>
            )}
          </div>
        )}
      </Shell>
      <AuthModal />
    </>
  );
}

function Shell({ title, subtitle, userLabel, actions, children }) {
  return (
    <div className="min-h-screen bg-sand-50">
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-coral-500">Admin</p>
            <h1 className="font-display text-4xl text-lagoon-900">{title}</h1>
            <p className="mt-3 max-w-2xl text-driftwood">{subtitle}</p>
            {userLabel && <p className="mt-2 text-sm text-lagoon-700">Signed in as {userLabel}</p>}
          </div>
          {actions}
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, required, full, children }) {
  return (
    <label className={`block ${full ? "sm:col-span-2" : ""}`}>
      <span className="mb-1.5 block text-sm font-medium text-lagoon-900">
        {label} {required && <span className="text-coral-500">*</span>}
      </span>
      {children}
    </label>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-2xl border border-sand-200 bg-sand-50 p-3">
      <p className="text-xs uppercase tracking-wide text-driftwood">{label}</p>
      <p className="mt-1 text-sm font-medium text-lagoon-900">{value}</p>
    </div>
  );
}

function getEnquiryActivities(item) {
  const activities = item?.booking_details?.activities;
  if (Array.isArray(activities) && activities.length > 0) {
    return activities;
  }

  if (Array.isArray(item?.quote_summary) && item.quote_summary.length > 0) {
    return item.quote_summary;
  }

  return (item?.selected_package_names || []).map((name) => ({
    packageName: name,
    category: "",
    variantLabel: null,
    total: null,
    bookingValues: {},
  }));
}

function getEnquiryCategories(item) {
  return [...new Set(getEnquiryActivities(item).map((quote) => quote.category).filter(Boolean))];
}

function formatBookingDetails(quote) {
  const bookingValues = quote?.bookingValues;
  if (!bookingValues || typeof bookingValues !== "object") {
    return [];
  }

  return Object.entries(bookingValues)
    .filter(([, value]) => value != null && String(value).trim() !== "")
    .map(([key, value]) => ({
      label: key === quote.quantityFieldKey && quote.quantityFieldLabel ? quote.quantityFieldLabel : humanizeKey(key),
      value: String(value),
    }));
}

function humanizeKey(value) {
  return String(value)
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
