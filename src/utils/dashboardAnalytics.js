const METRIC_TITLES = {
  "Lead Stage": "Lead Stage Distribution",
  "Deal Size": "Deal Size Distribution",
  "Product Groups": "Product Group Distribution",
  "Customer Groups": "Customer Group Distribution",
  Tags: "Tag Distribution",
  Potential: "Lead Potential Distribution",
};

function normalizeString(value) {
  if (value == null) return "";
  return String(value).trim();
}

function toDisplayValue(value, fallback = "Unspecified") {
  const normalized = normalizeString(value);
  return normalized || fallback;
}

function getScopedLeads(leads = [], selectedList = "") {
  if (!selectedList) return Array.isArray(leads) ? leads : [];
  return (Array.isArray(leads) ? leads : []).filter(
    (lead) => String(lead?.list_id ?? lead?.listId ?? "") === String(selectedList)
  );
}

function sortRows(rows = []) {
  return [...rows].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

function bucketDealSize(rawValue) {
  const value = Number(rawValue);
  if (!Number.isFinite(value) || value <= 0) {
    return normalizeString(rawValue) ? String(rawValue) : "";
  }

  if (value < 2500000) return "Under 25L";
  if (value < 5000000) return "25L - 50L";
  if (value < 10000000) return "50L - 1Cr";
  if (value < 20000000) return "1Cr - 2Cr";
  return "2Cr+";
}

function getLeadStage(lead) {
  return lead?.lead_stage || lead?.leadStage || lead?.stage || "";
}

function getDealSize(lead) {
  return lead?.deal_size || lead?.dealSize || lead?.deal_value || lead?.dealValue || "";
}

function getProductGroup(lead) {
  return lead?.product_group || lead?.productGroup || "";
}

function getCustomerGroup(lead) {
  return lead?.customer_group || lead?.customerGroup || "";
}

function getPotential(lead) {
  return lead?.lead_potential || lead?.leadPotential || lead?.potential || "";
}

function getLeadTags(lead, tagNameMap = {}) {
  const rawTags = lead?.tags;
  if (Array.isArray(rawTags)) {
    return rawTags
      .map((tag) => tagNameMap[String(tag)] || normalizeString(tag))
      .filter(Boolean);
  }

  if (typeof rawTags === "string") {
    return rawTags
      .split(",")
      .map((tag) => normalizeString(tag))
      .filter(Boolean)
      .map((tag) => tagNameMap[tag] || tag);
  }

  return [];
}

function buildGroupedRows(leads, activeMetric, tagNameMap) {
  const grouped = new Map();

  for (const lead of leads) {
    let values = [];

    switch (activeMetric) {
      case "Lead Stage":
        values = [toDisplayValue(getLeadStage(lead), "")];
        break;
      case "Deal Size":
        values = [toDisplayValue(bucketDealSize(getDealSize(lead)), "")];
        break;
      case "Product Groups":
        values = [toDisplayValue(getProductGroup(lead), "")];
        break;
      case "Customer Groups":
        values = [toDisplayValue(getCustomerGroup(lead), "")];
        break;
      case "Tags":
        values = getLeadTags(lead, tagNameMap);
        break;
      case "Potential":
        values = [toDisplayValue(getPotential(lead), "")];
        break;
      default:
        values = [];
        break;
    }

    const cleanValues = values.filter(Boolean);
    for (const value of cleanValues) {
      grouped.set(value, (grouped.get(value) || 0) + 1);
    }
  }

  return sortRows(
    [...grouped.entries()].map(([label, count]) => ({ label, count }))
  );
}

export function buildDashboardAnalytics(leads, selectedList, activeMetric, options = {}) {
  const scopedLeads = getScopedLeads(leads, selectedList);
  const rows = buildGroupedRows(scopedLeads, activeMetric, options.tagNameMap || {});

  return {
    title: METRIC_TITLES[activeMetric] || "Lead Analytics",
    rows,
    total: rows.reduce((sum, row) => sum + row.count, 0),
    scopedLeads,
  };
}

