export function normalizeSearchText(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function matchesSearchQuery(listing, query) {
  const needle = normalizeSearchText(query);
  if (!needle) return true;

  const fields = [
    listing.title,
    listing.location,
    listing.city,
    listing.description,
    listing.address,
  ];

  return fields.some((field) => normalizeSearchText(field).includes(needle));
}
