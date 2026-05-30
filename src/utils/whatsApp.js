function buildLeadName(lead = {}) {
  const fullName = [lead?.fname, lead?.lname].filter(Boolean).join(" ").trim();
  return fullName || lead?.name || "there";
}

export function formatWhatsAppNumber(rawPhone) {
  if (!rawPhone) return "";

  const digitsOnly = String(rawPhone).replace(/[^\d]/g, "").trim();
  if (!digitsOnly) return "";

  if (!/^\d+$/.test(digitsOnly)) return "";

  if (digitsOnly.length === 10) {
    return `91${digitsOnly}`;
  }

  if (digitsOnly.length >= 11 && digitsOnly.length <= 15) {
    return digitsOnly;
  }

  return "";
}

export function buildWhatsAppMessage(lead) {
  const leadName = buildLeadName(lead);
  return `Hello ${leadName},

This is Vespera Estates.

We are contacting you regarding your property enquiry.

Please let us know if you are available to discuss further.

Thank you.`;
}

export function buildWhatsAppUrl(lead) {
  const formattedNumber = formatWhatsAppNumber(lead?.mobile);
  if (!formattedNumber) return "";

  const encodedMessage = encodeURIComponent(buildWhatsAppMessage(lead));
  return `https://wa.me/${formattedNumber}?text=${encodedMessage}`;
}
