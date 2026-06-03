import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ SUPABASE_URL or SUPABASE_ANON_KEY are missing in env.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const CITIES = [
  {
    name: "Medellín",
    department: "Antioquia",
    latCenter: 6.2442,
    lngCenter: -75.5748,
    neighborhoods: ["El Poblado", "Laureles", "Envigado", "Conquistadores", "Belén"]
  },
  {
    name: "Bogotá",
    department: "Cundinamarca",
    latCenter: 4.7110,
    lngCenter: -74.0721,
    neighborhoods: ["Chapinero", "Usaquén", "Chicó Reservado", "Teusaquillo", "Salitre"]
  },
  {
    name: "Cartagena",
    department: "Bolívar",
    latCenter: 10.3910,
    lngCenter: -75.4794,
    neighborhoods: ["Ciudad Amurallada", "Bocagrande", "Getsemaní", "Castillogrande", "Marbella"]
  },
  {
    name: "Santa Marta",
    department: "Magdalena",
    latCenter: 11.2408,
    lngCenter: -74.1990,
    neighborhoods: ["El Rodadero", "Bello Horizonte", "Centro Histórico", "Pozos Colorados", "Taganga"]
  },
  {
    name: "Cali",
    department: "Valle del Cauca",
    latCenter: 3.4516,
    lngCenter: -76.5320,
    neighborhoods: ["San Antonio", "Granada", "Ciudad Jardín", "El Peñón", "Centenario"]
  }
];

const ADJECTIVES = ["Exclusivo", "Hermoso", "Moderno", "Espectacular", "Lujoso", "Acogedor", "Elegante", "Rústico", "Vanguardista", "Tranquilo"];
const TYPES = [
  { id: 1, name: "Apartamento", key: "Apartamento" },
  { id: 2, name: "Casa", key: "Casa" },
  { id: 3, name: "Cabaña", key: "Cabaña" },
  { id: 4, name: "Habitación", key: "Habitación" }
];

const DETAILS = [
  "con vista panorámica increíble, completamente equipado, zona segura y excelente conectividad.",
  "perfecto para estadías largas o vacaciones familiares, cercano a restaurantes, cafés y parques.",
  "un santuario de tranquilidad con acabados de lujo, seguridad 24 horas y todas las comodidades premium.",
  "con diseño de interiores moderno, luz natural en todos los espacios y una terraza privada de ensueño."
];

// High quality Unsplash image links grouped by type
const STOCK_IMAGES = {
  "Apartamento": [
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1000&q=80",
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1000&q=80",
    "https://images.unsplash.com/photo-1502672090847-032d266d91d8?w=1000&q=80",
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1000&q=80",
    "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1000&q=80",
    "https://images.unsplash.com/photo-1505693395321-883724634266?w=1000&q=80",
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1000&q=80",
    "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=1000&q=80",
    "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=1000&q=80",
    "https://images.unsplash.com/photo-1560185127-6a2806647f81?w=1000&q=80",
    "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1000&q=80",
    "https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=1000&q=80",
    "https://images.unsplash.com/photo-1617806118233-18e1db207f62?w=1000&q=80",
    "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1000&q=80",
    "https://images.unsplash.com/photo-1527030280862-64139fbe04ca?w=1000&q=80",
    "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1000&q=80",
    "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=1000&q=80",
    "https://images.unsplash.com/photo-1615876234886-fd9a39faa97f?w=1000&q=80",
    "https://images.unsplash.com/photo-1617104551722-3b2d51366400?w=1000&q=80",
    "https://images.unsplash.com/photo-1502672545511-3c2294833c87?w=1000&q=80"
  ],
  "Casa": [
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1000&q=80",
    "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=1000&q=80",
    "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1000&q=80",
    "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1000&q=80",
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1000&q=80",
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1000&q=80",
    "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1000&q=80",
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1000&q=80",
    "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=1000&q=80",
    "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1000&q=80",
    "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=1000&q=80",
    "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1000&q=80",
    "https://images.unsplash.com/photo-1602941525421-8f8b81d3edbb?w=1000&q=80",
    "https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?w=1000&q=80",
    "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=1000&q=80",
    "https://images.unsplash.com/photo-1592595896551-12b371d546d5?w=1000&q=80",
    "https://images.unsplash.com/photo-1513584684374-8bab748fbf90?w=1000&q=80",
    "https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=1000&q=80",
    "https://images.unsplash.com/photo-1502005229762-fc1b2b812ca5?w=1000&q=80",
    "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=1000&q=80"
  ],
  "Cabaña": [
    "https://images.unsplash.com/photo-1508333706533-1ab43ecb1606?w=1000&q=80",
    "https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=1000&q=80",
    "https://images.unsplash.com/photo-1449034446853-66c86144b0ad?w=1000&q=80",
    "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=1000&q=80",
    "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=1000&q=80",
    "https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?w=1000&q=80",
    "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1000&q=80",
    "https://images.unsplash.com/photo-1487730116645-74489c95b41b?w=1000&q=80",
    "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1000&q=80",
    "https://images.unsplash.com/photo-1544816155-12df9643f363?w=1000&q=80",
    "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=1000&q=80",
    "https://images.unsplash.com/photo-1472214222541-d510753a4907?w=1000&q=80",
    "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1000&q=80",
    "https://images.unsplash.com/photo-1433832597046-4f10e10ac764?w=1000&q=80",
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1000&q=80",
    "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1000&q=80",
    "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1000&q=80",
    "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=1000&q=80",
    "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=1000&q=80",
    "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?w=1000&q=80"
  ],
  "Habitación": [
    "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=1000&q=80",
    "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1000&q=80",
    "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=1000&q=80",
    "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1000&q=80",
    "https://images.unsplash.com/photo-1540518614846-7eded433c457?w=1000&q=80",
    "https://images.unsplash.com/photo-1582719478250-c89cae4db85b?w=1000&q=80",
    "https://images.unsplash.com/photo-1591088398332-8a7791972843?w=1000&q=80",
    "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=1000&q=80",
    "https://images.unsplash.com/photo-1568495248636-6432b97bd949?w=1000&q=80",
    "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=1000&q=80",
    "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=1000&q=80",
    "https://images.unsplash.com/photo-1541123437800-1bb1317badc2?w=1000&q=80",
    "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=1000&q=80",
    "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=1000&q=80",
    "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1000&q=80",
    "https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=1000&q=80",
    "https://images.unsplash.com/photo-1617806118233-18e1db207f62?w=1000&q=80",
    "https://images.unsplash.com/photo-1527030280862-64139fbe04ca?w=1000&q=80",
    "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1000&q=80",
    "https://images.unsplash.com/photo-1615876234886-fd9a39faa97f?w=1000&q=80"
  ]
};

// Public reliable panorama equirectangular image
const PANORAMA_IMAGE = "https://photo-sphere-viewer-data.netlify.app/assets/sphere.jpg";

// Owners to distribute the properties
const OWNER_IDS = [
  "73151243-0458-42cb-9204-63e8b47a7c88", // Usuario Prueba 1
  "202a6527-21a2-4dca-ba1d-0f8f184de1f3", // Rafael Cristancho
  "10998ceb-2ece-4fe3-9e2a-0110ab8752a9"  // Brayan
];

async function seed() {
  console.log("🚀 Starting database seeding...");

  try {
    // 1. Clean up references in correct order due to foreign keys
    console.log("🧹 Cleaning up old housing tables...");
    
    const { error: delImagesErr } = await supabase.from('housing_images').delete().neq('id_image', 0);
    if (delImagesErr) console.log("Note on images cleanup:", delImagesErr.message);

    const { error: delServicesErr } = await supabase.from('housing_service').delete().neq('id_housing', 0);
    if (delServicesErr) console.log("Note on services cleanup:", delServicesErr.message);

    const { error: delAvailErr } = await supabase.from('availability').delete().neq('id_availability', 0);
    if (delAvailErr) console.log("Note on availability cleanup:", delAvailErr.message);

    const { error: delHousingErr } = await supabase.from('housing').delete().neq('id_housing', 0);
    if (delHousingErr) {
      console.error("❌ Error cleaning up housing table:", delHousingErr.message);
      process.exit(1);
    }
    console.log("✅ Tables cleared successfully.");

    // 2. Generate 55 properties
    console.log("Generating 55 premium housings...");
    const housingsToInsert = [];

    for (let i = 1; i <= 55; i++) {
      const city = CITIES[i % CITIES.length];
      const type = TYPES[i % TYPES.length];
      const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
      const neighborhood = city.neighborhoods[Math.floor(Math.random() * city.neighborhoods.length)];
      const detail = DETAILS[Math.floor(Math.random() * DETAILS.length)];
      
      const name = `${adjective} ${type.name} en ${city.name} (${neighborhood})`;
      const description = `${type.name} de diseño en el exclusivo sector de ${neighborhood}, ${city.name}. Cuenta ${detail}`;
      const address = `Calle ${Math.floor(Math.random() * 100) + 1} # ${Math.floor(Math.random() * 80) + 1} - ${Math.floor(Math.random() * 90) + 1}`;
      
      const price_per_night = (Math.floor(Math.random() * 8) + 2) * 100000; // 200,000 to 900,000 COP
      const capacity = Math.floor(Math.random() * 5) + 2; // 2 to 6 guests
      const id_owner = OWNER_IDS[i % OWNER_IDS.length];

      // Add coordinate jitter from city center
      const lat = city.latCenter + (Math.random() - 0.5) * 0.04;
      const lng = city.lngCenter + (Math.random() - 0.5) * 0.04;

      housingsToInsert.push({
        id_owner,
        id_type: type.id,
        name,
        status: "available",
        description,
        country: "Colombia",
        department: city.department,
        municipality: city.name,
        address,
        price_per_night,
        capacity,
        latitude: parseFloat(lat.toFixed(6)),
        longitude: parseFloat(lng.toFixed(6)),
        currency: "COP"
      });
    }

    // 3. Insert housings
    console.log("Saving housings to database...");
    const { data: insertedHousings, error: insErr } = await supabase
      .from('housing')
      .insert(housingsToInsert)
      .select();

    if (insErr) {
      console.error("❌ Error inserting housings:", insErr.message);
      process.exit(1);
    }
    console.log(`✅ Successfully seeded ${insertedHousings.length} housings.`);

    // 4. Seeding images for each housing
    console.log("Seeding premium gallery and 360 panorama images...");
    const imagesToInsert = [];

    insertedHousings.forEach((housing) => {
      // Get type key
      let typeKey = "Apartamento";
      if (housing.id_type === 2) typeKey = "Casa";
      if (housing.id_type === 3) typeKey = "Cabaña";
      if (housing.id_type === 4) typeKey = "Habitación";

      const urls = STOCK_IMAGES[typeKey];
      
      // Select 5 random normal images (no repetition)
      const shuffled = [...urls].sort(() => 0.5 - Math.random());
      const selectedNormal = shuffled.slice(0, 5);

      // Add normal images
      selectedNormal.forEach((url) => {
        imagesToInsert.push({
          id_housing: housing.id_housing,
          image_url: url,
          is_panorama: false
        });
      });

      // Add 1 panorama image for the 360 viewer
      imagesToInsert.push({
        id_housing: housing.id_housing,
        image_url: PANORAMA_IMAGE,
        is_panorama: true
      });
    });

    console.log("Saving images to database...");
    const { data: insertedImages, error: imgInsErr } = await supabase
      .from('housing_images')
      .insert(imagesToInsert)
      .select();

    if (imgInsErr) {
      console.error("❌ Error inserting images:", imgInsErr.message);
      process.exit(1);
    }
    console.log(`✅ Successfully seeded ${insertedImages.length} images to the galleries.`);
    console.log("🎉 Seeding completed successfully!");

  } catch (error) {
    console.error("❌ Unexpected error during seed:", error);
  }
}

seed();
