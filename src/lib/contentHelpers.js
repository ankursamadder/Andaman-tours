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
  if (value == null) return undefined;
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string") {
    if (!value.trim()) return [];
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return undefined;
}

function toItinerary(value) {
  if (value == null) return undefined;
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string") {
    if (!value.trim()) return [];
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch {
      return [];
    }
  }
  return undefined;
}

function toVariants(value) {
  if (value == null) return undefined;
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string") {
    if (!value.trim()) return [];
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch {
      return [];
    }
  }
  return undefined;
}

export function normalizePackageRecord(row) {
  const slug = row.slug || row.id;

  const normalized = {
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
  };

  const gallery = toArray(row.gallery);
  const places = toArray(row.places);
  const highlights = toArray(row.highlights);
  const inclusions = toArray(row.inclusions);
  const exclusions = toArray(row.exclusions);
  const itinerary = toItinerary(row.itinerary);
  const variants = toVariants(row.variants ?? row.variant_options);
  const bookingFields = toVariants(row.booking_fields ?? row.bookingFields);

  if (gallery !== undefined) normalized.gallery = gallery;
  if (places !== undefined) normalized.places = places;
  if (highlights !== undefined) normalized.highlights = highlights;
  if (inclusions !== undefined) normalized.inclusions = inclusions;
  if (exclusions !== undefined) normalized.exclusions = exclusions;
  if (itinerary !== undefined) normalized.itinerary = itinerary;
  if (variants !== undefined) normalized.variants = variants;
  if (bookingFields !== undefined) normalized.bookingFields = bookingFields;

  return normalized;
}

export function mergePackageLists(seedPackages = [], remotePackages = []) {
  const remoteMap = new Map(remotePackages.map((pkg) => [pkg.slug || pkg.id, pkg]));
  const merged = seedPackages.map((pkg) => {
    const remote = remoteMap.get(pkg.id);
    if (!remote) return pkg;

    return {
      ...pkg,
      ...remote,
      gallery: remote.gallery?.length ? remote.gallery : pkg.gallery,
      places: remote.places?.length ? remote.places : pkg.places,
      highlights: remote.highlights?.length ? remote.highlights : pkg.highlights,
      inclusions: remote.inclusions?.length ? remote.inclusions : pkg.inclusions,
      exclusions: remote.exclusions?.length ? remote.exclusions : pkg.exclusions,
      itinerary: remote.itinerary?.length ? remote.itinerary : pkg.itinerary,
      variants: remote.variants?.length ? remote.variants : pkg.variants,
      bookingFields: remote.bookingFields?.length ? remote.bookingFields : pkg.bookingFields,
    };
  });
  const seedIds = new Set(seedPackages.map((pkg) => pkg.id));
  const extras = remotePackages.filter((pkg) => !seedIds.has(pkg.slug || pkg.id));
  return [...merged, ...extras];
}

function getQuantityFieldKey(activity) {
  const mapping = {
    "scuba-diving": "groupSize",
    kayaking: "groupSize",
    "two-wheeler-rent": "rentalDays",
    "cab-service": "tripDays",
    "dinner-cruise": "guests",
  };

  return mapping[activity?.id] || null;
}

function getSelectedVariant(activity, selectedVariantId) {
  const variants = Array.isArray(activity?.variants) ? activity.variants : [];
  return variants.find((variant) => variant.id === selectedVariantId) || variants[0] || null;
}

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function calculateActivityQuote(activity, selectedVariantId, formValues = {}) {
  const variant = getSelectedVariant(activity, selectedVariantId);
  if (!activity || !variant) {
    return {
      complete: false,
      unitPrice: null,
      quantity: null,
      total: null,
      variant: null,
      quantityFieldKey: null,
    };
  }

  const quantityFieldKey = getQuantityFieldKey(activity);
  const tripType = formValues.tripType;
  const quantityField = quantityFieldKey ? formValues[quantityFieldKey] : null;

  if (activity.id === "cab-service" && tripType === "Multi-day") {
    const quantity = toNumber(quantityField);
    if (!quantity || quantity < 1) {
      return {
        complete: false,
        unitPrice: Number(variant.price ?? 0),
        quantityFieldKey,
        quantity: null,
        total: null,
        variant,
      };
    }

    const unitPrice = Number(variant.price ?? 0);
    return {
      complete: true,
      unitPrice,
      quantityFieldKey,
      quantity,
      total: unitPrice * quantity,
      variant,
    };
  }

  if (activity.id === "cab-service") {
    if (!tripType) {
      return {
        complete: false,
        unitPrice: Number(variant.price ?? 0),
        quantityFieldKey: null,
        quantity: null,
        total: null,
        variant,
      };
    }

    const unitPrice = Number(variant.price ?? 0);
    return {
      complete: true,
      unitPrice,
      quantityFieldKey: null,
      quantity: 1,
      total: unitPrice,
      variant,
    };
  }

  if (activity.id === "photoshoot") {
    const unitPrice = Number(variant.price ?? 0);
    return {
      complete: true,
      unitPrice,
      quantityFieldKey: null,
      quantity: 1,
      total: unitPrice,
      variant,
    };
  }

  if (!quantityFieldKey) {
    const unitPrice = Number(variant.price ?? 0);
    return {
      complete: true,
      unitPrice,
      quantityFieldKey: null,
      quantity: 1,
      total: unitPrice,
      variant,
    };
  }

  const quantity = toNumber(quantityField);
  if (!quantity || quantity < 1) {
    return {
      complete: false,
      unitPrice: Number(variant.price ?? 0),
      quantityFieldKey,
      quantity: null,
      total: null,
      variant,
    };
  }

  const unitPrice = Number(variant.price ?? 0);
  return {
    complete: true,
    unitPrice,
    quantityFieldKey,
    quantity,
    total: unitPrice * quantity,
    variant,
  };
}

export function calculateActivityTotal(activity, selectedVariantId, formValues = {}) {
  const quote = calculateActivityQuote(activity, selectedVariantId, formValues);
  return quote.complete ? quote.total : null;
}
