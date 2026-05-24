const TYPE_GROUPS = {
  residential: [
    "residential",
    "residential building",
    "flat",
    "apartment",
    "house",
    "villa",
  ],
  commercial: ["commercial", "office", "shop", "showroom"],
  land: ["land", "plot", "farm land", "agricultural"],
};

export const PROPERTY_TYPE_OPTIONS = [
  { value: "Residential", label: "Residential" },
  { value: "Residential Building", label: "Residential Building" },
  { value: "Flat", label: "Flat" },
  { value: "Apartment", label: "Apartment" },
  { value: "House", label: "House" },
  { value: "Villa", label: "Villa" },
  { value: "Commercial", label: "Commercial" },
  { value: "Office", label: "Office" },
  { value: "Shop", label: "Shop" },
  { value: "Showroom", label: "Showroom" },
  { value: "Land", label: "Land" },
  { value: "Plot", label: "Plot" },
  { value: "Farm Land", label: "Farm Land" },
];

export const LAND_AREA_UNITS = ["Acre", "Guntha", "Sqft", "Sqm"];
export const YES_NO_OPTIONS = [
  { value: "", label: "Select" },
  { value: "Yes", label: "Yes" },
  { value: "No", label: "No" },
];
export const FURNISHING_OPTIONS = [
  { value: "", label: "Select furnishing" },
  { value: "Unfurnished", label: "Unfurnished" },
  { value: "Semi-Furnished", label: "Semi-Furnished" },
  { value: "Furnished", label: "Furnished" },
];

export function getPropertyCategory(type) {
  const normalized = String(type || "").trim().toLowerCase();
  if (TYPE_GROUPS.commercial.includes(normalized)) return "commercial";
  if (TYPE_GROUPS.land.includes(normalized)) return "land";
  return "residential";
}

export function createEmptyPropertyDetails(category = "residential") {
  if (category === "commercial") {
    return {
      sqft: "",
      floor: "",
      washroomAvailable: "",
      furnishingStatus: "",
    };
  }

  if (category === "land") {
    return {
      landArea: "",
      areaUnit: "Guntha",
      roadTouch: "",
      naPlot: "",
    };
  }

  return {
    rooms: "",
    washrooms: "",
    carpetArea: "",
    builtUpArea: "",
    floor: "",
    totalFloors: "",
  };
}

function toInputValue(value) {
  if (value === null || value === undefined) return "";
  return String(value);
}

export function normalizePropertyDetails(type, details = {}, legacy = {}) {
  const category = getPropertyCategory(type);
  const base = createEmptyPropertyDetails(category);

  if (category === "commercial") {
    return {
      ...base,
      sqft: toInputValue(details.sqft ?? legacy.sqft),
      floor: toInputValue(details.floor),
      washroomAvailable: toInputValue(details.washroomAvailable),
      furnishingStatus: toInputValue(details.furnishingStatus),
    };
  }

  if (category === "land") {
    return {
      ...base,
      landArea: toInputValue(details.landArea ?? legacy.sqft),
      areaUnit: toInputValue(details.areaUnit || (legacy.sqft ? "Sqft" : "Guntha")) || "Guntha",
      roadTouch: toInputValue(details.roadTouch),
      naPlot: toInputValue(details.naPlot),
    };
  }

  return {
    ...base,
    rooms: toInputValue(details.rooms ?? legacy.beds),
    washrooms: toInputValue(details.washrooms ?? legacy.baths),
    carpetArea: toInputValue(details.carpetArea ?? legacy.sqft),
    builtUpArea: toInputValue(details.builtUpArea),
    floor: toInputValue(details.floor),
    totalFloors: toInputValue(details.totalFloors),
  };
}

function sanitizeNumberLike(value) {
  if (value === "" || value === null || value === undefined) return "";
  return String(value).trim();
}

export function sanitizePropertyDetails(type, details = {}) {
  const category = getPropertyCategory(type);
  const normalized = normalizePropertyDetails(type, details);

  if (category === "commercial") {
    return {
      sqft: sanitizeNumberLike(normalized.sqft),
      floor: sanitizeNumberLike(normalized.floor),
      washroomAvailable: normalized.washroomAvailable || "",
      furnishingStatus: normalized.furnishingStatus || "",
    };
  }

  if (category === "land") {
    return {
      landArea: sanitizeNumberLike(normalized.landArea),
      areaUnit: normalized.areaUnit || "Guntha",
      roadTouch: normalized.roadTouch || "",
      naPlot: normalized.naPlot || "",
    };
  }

  return {
    rooms: sanitizeNumberLike(normalized.rooms),
    washrooms: sanitizeNumberLike(normalized.washrooms),
    carpetArea: sanitizeNumberLike(normalized.carpetArea),
    builtUpArea: sanitizeNumberLike(normalized.builtUpArea),
    floor: sanitizeNumberLike(normalized.floor),
    totalFloors: sanitizeNumberLike(normalized.totalFloors),
  };
}

function validateNonNegative(value) {
  if (value === "" || value === null || value === undefined) return false;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0;
}

export function validatePropertyForm(formData) {
  const errors = {};
  const category = getPropertyCategory(formData.type);
  const details = sanitizePropertyDetails(formData.type, formData.propertyDetails);

  if (!String(formData.title || "").trim()) errors.title = "Property title is required.";
  if (!String(formData.location || "").trim()) errors.location = "Location is required.";
  if (!validateNonNegative(formData.price) || Number(formData.price) <= 0) {
    errors.price = "Price is required and must be a valid positive number.";
  }
  if (!String(formData.type || "").trim()) errors.type = "Property type is required.";

  if (category === "residential") {
    if (!validateNonNegative(details.rooms) || Number(details.rooms) <= 0) {
      errors["propertyDetails.rooms"] = "Rooms / BHK is required.";
    }
    if (!validateNonNegative(details.carpetArea) || Number(details.carpetArea) <= 0) {
      errors["propertyDetails.carpetArea"] = "Carpet Area is required.";
    }
    ["washrooms", "builtUpArea", "floor", "totalFloors"].forEach((field) => {
      if (details[field] !== "" && !validateNonNegative(details[field])) {
        errors[`propertyDetails.${field}`] = "Value must be zero or greater.";
      }
    });
  }

  if (category === "commercial") {
    if (!validateNonNegative(details.sqft) || Number(details.sqft) <= 0) {
      errors["propertyDetails.sqft"] = "Sqft is required.";
    }
    if (details.floor !== "" && !validateNonNegative(details.floor)) {
      errors["propertyDetails.floor"] = "Floor must be zero or greater.";
    }
  }

  if (category === "land") {
    if (!validateNonNegative(details.landArea) || Number(details.landArea) <= 0) {
      errors["propertyDetails.landArea"] = "Land Area is required.";
    }
    if (!String(details.areaUnit || "").trim()) {
      errors["propertyDetails.areaUnit"] = "Area Unit is required.";
    }
  }

  return errors;
}

export function buildPropertyPayload(formData) {
  const category = getPropertyCategory(formData.type);
  const details = sanitizePropertyDetails(formData.type, formData.propertyDetails);
  const tags = String(formData.tags || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const payload = {
    title: String(formData.title || "").trim(),
    description: String(formData.description || "").trim(),
    price: Number(formData.price),
    location: String(formData.location || "").trim(),
    type: String(formData.type || "").trim(),
    propertyDetails: details,
    tags,
    sale: Boolean(formData.sale),
    images: Array.isArray(formData.existingImages) ? formData.existingImages : [],
  };

  if (category === "residential") {
    payload.beds = details.rooms ? Number(details.rooms) : null;
    payload.baths = details.washrooms ? Number(details.washrooms) : null;
    payload.sqft = details.carpetArea ? Number(details.carpetArea) : null;
  } else if (category === "commercial") {
    payload.beds = null;
    payload.baths = details.washroomAvailable === "Yes" ? 1 : null;
    payload.sqft = details.sqft ? Number(details.sqft) : null;
  } else {
    payload.beds = null;
    payload.baths = null;
    payload.sqft = details.areaUnit === "Sqft" && details.landArea ? Number(details.landArea) : null;
  }

  return payload;
}

export function summarizePropertyDetails(property = {}) {
  const category = getPropertyCategory(property.type);
  const details = normalizePropertyDetails(property.type, property.property_details || property.propertyDetails, {
    beds: property.beds,
    baths: property.baths,
    sqft: property.sqft,
  });

  if (category === "commercial") {
    return [
      details.sqft ? `${details.sqft} Sqft` : "",
      details.furnishingStatus || "",
      details.washroomAvailable === "Yes" ? "Washroom Available" : "",
    ].filter(Boolean);
  }

  if (category === "land") {
    const areaLabel = details.landArea ? `${details.landArea} ${details.areaUnit || ""}`.trim() : "";
    return [
      areaLabel,
      details.roadTouch === "Yes" ? "Road Touch" : "",
      details.naPlot === "Yes" ? "NA Plot" : "",
    ].filter(Boolean);
  }

  return [
    details.rooms ? `${details.rooms} BHK` : "",
    details.washrooms ? `${details.washrooms} Washrooms` : "",
    details.carpetArea ? `${details.carpetArea} Carpet Area` : "",
  ].filter(Boolean);
}
