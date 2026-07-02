export function slugify(value = "") {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function displayNameFromEmail(email = "") {
  const local = String(email).split("@")[0] || "";
  const cleaned = local
    .replace(/[._-]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase());

  return cleaned.join(" ") || email;
}

function toArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function toItinerary(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function normalizePackageRecord(row) {
  const slug = row.slug || row.id;

  return {
    id: slug,
    slug,
    name: row.name ?? "",
    tagline: row.tagline ?? "",
    duration: row.duration ?? "",
    price: Number(row.price ?? 0),
    priceUnit: row.price_unit ?? "per person",
    category: row.category ?? "Custom",
    rating: Number(row.rating ?? 0),
    reviews: Number(row.reviews ?? 0),
    cover: row.cover ?? "",
    gallery: toArray(row.gallery),
    places: toArray(row.places),
    highlights: toArray(row.highlights),
    inclusions: toArray(row.inclusions),
    exclusions: toArray(row.exclusions),
    itinerary: toItinerary(row.itinerary),
  };
}

export function mergePackageLists(seedPackages = [], remotePackages = []) {
  const remoteMap = new Map(remotePackages.map((pkg) => [pkg.slug || pkg.id, pkg]));
  const merged = seedPackages.map((pkg) => remoteMap.get(pkg.id) ?? pkg);
  const seedIds = new Set(seedPackages.map((pkg) => pkg.id));
  const extras = remotePackages.filter((pkg) => !seedIds.has(pkg.slug || pkg.id));
  return [...merged, ...extras];
}
