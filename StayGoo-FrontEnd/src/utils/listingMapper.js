const categoryMap = {
  Apartamento: "apartments",
  Cabaña: "cabins",
  Casa: "countryside",
  Habitación: "hotels",
  Hotel: "hotels",
};

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=1200&q=80";

const HIDDEN_STATUSES = new Set(["maintenance", "draft", "borrador", "unavailable"]);

export function isListingVisible(item) {
  if (!item || item.id_housing == null) return false;
  const status = String(item.status || "available").toLowerCase();
  return !HIDDEN_STATUSES.has(status);
}

export function extractHousingsList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.housings)) return payload.housings;
  return [];
}

export const formatCurrencyPrice = (price, currency) => {
  const curr = String(currency || 'COP').toUpperCase();
  const numericPrice = Number(price) || 0;
  if (curr === 'COP') {
    return `$${numericPrice.toLocaleString('es-CO')}`;
  } else if (curr === 'USD') {
    return `$${numericPrice.toLocaleString('en-US')} USD`;
  } else if (curr === 'EUR') {
    return `€${numericPrice.toLocaleString('de-DE')}`;
  }
  return `$${numericPrice.toLocaleString()} ${curr}`;
};

export function mapHousingToListing(item, index = 0) {
  const typeName = item.type_housing ? item.type_housing.name : "";
  const mappedCategory = categoryMap[typeName] || "luxury";

  const images = item.housing_images || [];
  const normalImages = images.filter((img) => !img.is_panorama);
  const firstImage =
    normalImages.length > 0 ? normalImages[0].image_url : DEFAULT_IMAGE;

  const city = item.municipality || item.city || "Ciudad Desconocida";
  const address = item.address || "";

  return {
    id: String(item.id_housing),
    realId: item.id_housing,   // ← numérico, usado por getHousingById en StayDetailPage
    title: item.name || "Sin título",
    category: mappedCategory,
    city,
    address,
    description: item.description || "",
    status: item.status || "available",
    location: address ? `${address}, ${city}` : city,
    maxGuests: item.capacity || 2,
    price: formatCurrencyPrice(item.price_per_night, item.currency),
    currency: item.currency || 'COP',
    rating: item.average_rating ? String(item.average_rating) : "Nuevo",
    featured: index < 3,
    image: firstImage,
    housing_images: images,
    hostName: Array.isArray(item.host)
      ? item.host[0]?.name || "Anfitrión"
      : item.host?.name || "Anfitrión",
    hostAvatar: Array.isArray(item.host)
      ? item.host[0]?.avatar || ""
      : item.host?.avatar || "",
    isSuperHost: true,
  };
}

export function mapHousingsToListings(housings = []) {
  const list = extractHousingsList(housings);
  return list
    .filter(isListingVisible)
    .map((item, index) => {
      try {
        return mapHousingToListing(item, index);
      } catch (err) {
        console.warn("No se pudo mapear alojamiento:", item?.id_housing, err);
        return null;
      }
    })
    .filter(Boolean);
}
