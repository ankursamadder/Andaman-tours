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
      <Shell title="Admin Portal" subtitle="Sign in with the admin email to manage packages and enquiries.">
        <button
          onClick={openAuthModal}
          className="rounded-full bg-coral-500 hover:bg-coral-600 text-white font-semibold px-6 py-3"
        >
          Sign In
        </button>
      </Shell>
    );
  }

  if (!isAdmin) {
    return (
      <Shell title="Access Restricted" subtitle={`Signed in as ${displayNameFromEmail(user.email)}. This account does not have admin access.`}>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={signOut}
            className="rounded-full border border-lagoon-700 text-lagoon-700 font-semibold px-6 py-3"
          >
            Sign Out
          </button>
          <a href="/" className="rounded-full bg-coral-500 hover:bg-coral-600 text-white font-semibold px-6 py-3">
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
      setError("Package name is required.");
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
      setError("Slug could not be generated. Please add a package name.");
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
        subtitle="Manage packages, itineraries, and enquiries in one place."
        userLabel={displayName || user.email}
        actions={
          <div className="flex flex-wrap gap-3">
            <a href="/" className="rounded-full border border-lagoon-700 text-lagoon-700 font-semibold px-5 py-2.5">
              Back to site
            </a>
            <button
              onClick={signOut}
              className="rounded-full bg-coral-500 hover:bg-coral-600 text-white font-semibold px-5 py-2.5"
            >
              Sign Out
            </button>
          </div>
        }
      >
        <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setTab("packages")}
          className={`px-4 py-2 rounded-full text-sm font-medium border ${
            tab === "packages" ? "bg-lagoon-700 text-white border-lagoon-700" : "bg-white border-sand-200 text-lagoon-700"
          }`}
        >
          Packages
        </button>
        <button
          onClick={() => setTab("enquiries")}
          className={`px-4 py-2 rounded-full text-sm font-medium border ${
            tab === "enquiries" ? "bg-lagoon-700 text-white border-lagoon-700" : "bg-white border-sand-200 text-lagoon-700"
          }`}
        >
          Enquiries
        </button>
      </div>

        {tab === "packages" ? (
        <div className="grid lg:grid-cols-[0.95fr_1.05fr] gap-6 items-start">
          <div className="bg-white rounded-3xl border border-sand-200 shadow-sm p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="font-display text-2xl text-lagoon-900">Packages</h2>
              <button
                onClick={() => {
                  setForm(emptyForm);
                  setEditingSlug("");
                  setError("");
                }}
                className="text-sm font-semibold text-coral-500"
              >
                New package
              </button>
            </div>
            {loadingData ? (
              <p className="text-driftwood text-sm">Loading packages...</p>
            ) : (
              <div className="space-y-3 max-h-[72vh] overflow-y-auto pr-1">
                {packages.map((pkg) => (
                  <button
                    key={pkg.id}
                    onClick={() => startEdit(pkg)}
                    className={`w-full text-left rounded-2xl border p-4 transition-colors ${
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

          <form onSubmit={handleSave} className="bg-white rounded-3xl border border-sand-200 shadow-sm p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <h2 className="font-display text-2xl text-lagoon-900">
                  {editingSlug ? "Edit package" : "Add package"}
                </h2>
                <p className="text-sm text-driftwood">Save it once, and it will appear on the public site too.</p>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="rounded-full bg-coral-500 hover:bg-coral-600 disabled:opacity-60 text-white font-semibold px-5 py-2.5"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>

            {error && <p className="text-coral-600 text-sm mb-4">{error}</p>}

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Slug">
                <input value={form.slug} onChange={handleField("slug")} className="form-input" placeholder="andaman-custom-trip" />
              </Field>
              <Field label="Name" required>
                <input value={form.name} onChange={handleField("name")} className="form-input" placeholder="Andaman Custom Trip" />
              </Field>
              <Field label="Tagline" full>
                <input value={form.tagline} onChange={handleField("tagline")} className="form-input" placeholder="A short marketing line" />
              </Field>
              <Field label="Duration">
                <input value={form.duration} onChange={handleField("duration")} className="form-input" placeholder="4 Nights / 5 Days" />
              </Field>
              <Field label="Price">
                <input type="number" value={form.price} onChange={handleField("price")} className="form-input" />
              </Field>
              <Field label="Price unit">
                <input value={form.priceUnit} onChange={handleField("priceUnit")} className="form-input" placeholder="per person" />
              </Field>
              <Field label="Category">
                <input value={form.category} onChange={handleField("category")} className="form-input" placeholder="Family" />
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
              <div className="flex items-center justify-between gap-3 mb-3">
                <p className="font-semibold text-lagoon-900">Itinerary</p>
                <button type="button" onClick={addItineraryRow} className="text-sm font-semibold text-coral-500">
                  Add day
                </button>
              </div>
              <div className="space-y-4">
                {form.itinerary.map((stop, index) => (
                  <div key={index} className="rounded-2xl border border-sand-200 bg-sand-50 p-4">
                    <div className="grid sm:grid-cols-[90px_1fr] gap-3">
                      <Field label="Day">
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
                        Remove day
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
            <p className="text-driftwood text-sm">Loading enquiries...</p>
          ) : enquiries.length ? (
            enquiries.map((item) => (
              <article key={item.id} className="bg-white rounded-3xl border border-sand-200 shadow-sm p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="font-display text-xl text-lagoon-900">{item.name}</h3>
                    <p className="text-sm text-driftwood">
                      {item.phone} {item.email ? `- ${item.email}` : ""}
                    </p>
                  </div>
                  <span className="text-xs text-driftwood">
                    {new Date(item.created_at).toLocaleString()}
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {(item.selected_package_names || []).map((pkg) => (
                    <span key={pkg} className="text-xs bg-lagoon-50 text-lagoon-700 border border-lagoon-100 px-3 py-1.5 rounded-full">
                      {pkg}
                    </span>
                  ))}
                </div>
                <div className="grid sm:grid-cols-3 gap-3 mt-4 text-sm">
                  <Info label="Travelers" value={item.travelers} />
                  <Info label="Travel month" value={item.travel_month || "-"} />
                  <Info label="Selected packages" value={String((item.selected_package_names || []).length)} />
                </div>
                {item.message && <p className="text-driftwood text-sm mt-4 whitespace-pre-wrap">{item.message}</p>}
              </article>
            ))
          ) : (
            <p className="text-driftwood text-sm">No enquiries yet.</p>
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
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-10">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <p className="text-coral-500 font-semibold tracking-[0.2em] uppercase text-xs mb-3">Admin</p>
            <h1 className="font-display text-4xl text-lagoon-900">{title}</h1>
            <p className="text-driftwood mt-3 max-w-2xl">{subtitle}</p>
            {userLabel && <p className="text-sm text-lagoon-700 mt-2">Signed in as {userLabel}</p>}
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
      <span className="text-sm font-medium text-lagoon-900 mb-1.5 block">
        {label} {required && <span className="text-coral-500">*</span>}
      </span>
      {children}
    </label>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-2xl bg-sand-50 border border-sand-200 p-3">
      <p className="text-xs uppercase tracking-wide text-driftwood">{label}</p>
      <p className="text-sm font-medium text-lagoon-900 mt-1">{value}</p>
    </div>
  );
}
