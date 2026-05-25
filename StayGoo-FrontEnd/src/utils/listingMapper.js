const categoryMap = {
  Apartamento: "apartments",
  Cabaña: "cabins",
  Casa: "countryside",
  Habitación: "hotels",
  Hotel: "hotels",
};

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=1200&q=80";

export function mapHousingToListing(item, index = 0) {
  const typeName = item.type_housing ? item.type_housing.name : "";
  const mappedCategory = categoryMap[typeName] || "luxury";

  const images = item.housing_images || [];
  const normalImages = images.filter((img) => !img.is_panorama);
  const firstImage =
    normalImages.length > 0 ? normalImages[0].image_url : DEFAULT_IMAGE;

  const city = item.city || "Ciudad Desconocida";
  const address = item.address || "";

  return {
    id: item.id_housing.toString(),
    title: item.name || "Sin título",
    category: mappedCategory,
    city,
    address,
    description: item.description || "",
    status: item.status || "available",
    location: address ? `${address}, ${city}` : city,
    maxGuests: item.capacity || 2,
    price: `$${item.price_per_night || 0}`,
    rating: 4.8,
    featured: index < 3,
    image: firstImage,
    housing_images: images,
    hostName: Array.isArray(item.host)
      ? item.host[0]?.name || "Anfitrión"
      : item.host?.name || "Anfitrión",
    isSuperHost: true,
  };
}

export function mapHousingsToListings(housings = []) {
  const list = Array.isArray(housings) ? housings : housings?.data ?? [];
  return list
    .filter((item) => (item.status || "available") === "available")
    .map((item, index) => mapHousingToListing(item, index));
}
