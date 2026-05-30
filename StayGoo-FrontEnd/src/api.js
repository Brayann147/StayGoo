/**
 * api.js — Capa de comunicación con el Backend de StayGo
 * Todos los servicios que hablan con el servidor van aquí.
 */

const DEFAULT_API_BASE_URL = import.meta.env.PROD
  ? "https://staygoo.onrender.com/api"
  : "http://localhost:3000/api";

function normalizeApiBaseUrl(rawUrl) {
  const baseUrl = String(rawUrl || DEFAULT_API_BASE_URL).trim().replace(/\/+$/, "");
  return baseUrl.endsWith("/api") ? baseUrl : `${baseUrl}/api`;
}

export const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_URL);

export const isApiMisconfigured = false;

// ── Helper genérico para hacer peticiones ──────────────────────────────────────
async function request(endpoint, options = {}) {
  if (isApiMisconfigured) {
    throw new Error(
      "VITE_API_URL no está configurada en Vercel. Debe ser https://staygoo.onrender.com/api"
    );
  }

  const { public: isPublicRead = false, headers: extraHeaders, ...fetchOptions } = options;
  const token = localStorage.getItem("staygooToken");

  const headers = {
    "Content-Type": "application/json",
    ...(!isPublicRead && token ? { Authorization: `Bearer ${token}` } : {}),
    ...extraHeaders,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  const rawBody = await response.text();
  let data = null;
  if (rawBody) {
    try {
      data = JSON.parse(rawBody);
    } catch {
      throw new Error(
        `Respuesta inválida del servidor (${response.status}). Verifica VITE_API_URL.`
      );
    }
  }

  if (!response.ok) {
    if (response.status === 401 && data.error === 'Token inválido o expirado.') {
      localStorage.removeItem("staygooToken");
      localStorage.removeItem("staygooSession");
      alert("Tu sesión ha caducado por seguridad. Por favor, inicia sesión nuevamente para continuar.");
      window.location.href = "/login?redirect=" + encodeURIComponent(window.location.pathname);
    }
    throw new Error(data.error || data.message || "Error en el servidor");
  }

  return data;
}

// ── AUTH ───────────────────────────────────────────────────────────────────────

/**
 * Registrar un nuevo usuario
 * @param {Object} userData - Datos del formulario de registro
 */
export async function registerUser(userData) {
  return request("/auth/register", {
    method: "POST",
    body: JSON.stringify(userData),
  });
}

/**
 * Iniciar sesión
 * @param {string} email
 * @param {string} password
 */
export async function loginUser(email, password) {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

/**
 * Cerrar sesión
 */
export async function logoutUser() {
  return request("/auth/logout", { method: "POST" });
}

// ── USERS ──────────────────────────────────────────────────────────────────────

/**
 * Obtener perfil del usuario autenticado
 */
export async function getMyProfile() {
  return request("/users/me");
}

/**
 * Actualizar perfil del usuario autenticado
 * @param {Object} updates
 */
export async function updateMyProfile(updates) {
  return request("/users/me", {
    method: "PUT",
    body: JSON.stringify(updates),
  });
}

/**
 * Subir foto de perfil del usuario autenticado
 * @param {File} file - Archivo de imagen
 * @returns {Promise<{avatar: string}>} URL pública del avatar
 */
export async function uploadUserAvatar(file) {
  const formData = new FormData();
  formData.append("avatar", file);

  const token = localStorage.getItem("staygooToken");

  const response = await fetch(`${API_BASE_URL}/users/me/avatar`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Error al subir la foto de perfil");
  }

  return data;
}



/**
 * Obtener todos los alojamientos
 */
export async function getHousings() {
  return request("/housings", { public: true });
}

/**
 * Obtener un alojamiento por ID
 * @param {string|number} id
 */
export async function getHousingById(id) {
  return request(`/housings/${id}`, { public: true });
}

/**
 * Crear un alojamiento (solo hosts)
 * @param {Object} housingData
 */
export async function createHousing(housingData) {
  return request("/housings", {
    method: "POST",
    body: JSON.stringify(housingData),
  });
}

/**
 * Actualizar un alojamiento (solo hosts)
 * @param {string|number} id
 * @param {Object} housingData
 */
export async function updateHousing(id, housingData) {
  return request(`/housings/${id}`, {
    method: "PUT",
    body: JSON.stringify(housingData),
  });
}

// ── BOOKINGS ───────────────────────────────────────────────────────────────────

/**
 * Crear una reserva
 * @param {Object} bookingData
 */
export async function createBooking(bookingData) {
  return request("/bookings", {
    method: "POST",
    body: JSON.stringify(bookingData),
  });
}

/**
 * Obtener reservas del usuario autenticado (viajes)
 */
export async function getMyBookings() {
  return request("/bookings/me");
}

/**
 * Obtener reservas asociadas a los alojamientos del host
 */
export async function getHostBookings() {
  return request("/bookings/host");
}

// ── REVIEWS ────────────────────────────────────────────────────────────────────

/**
 * Obtener reseñas de un alojamiento
 * @param {string|number} housingId
 */
export async function getReviewsByHousing(housingId) {
  return request(`/reviews?housing_id=${housingId}`);
}

/**
 * Crear una reseña
 * @param {Object} reviewData
 */
export async function createReview(reviewData) {
  return request("/reviews", {
    method: "POST",
    body: JSON.stringify(reviewData),
  });
}

// ── NOTIFICATIONS ──────────────────────────────────────────────────────────────

/**
 * Obtener notificaciones del usuario autenticado
 */
export async function getNotifications() {
  return request("/notifications");
}

// ── MESSAGES ───────────────────────────────────────────────────────────────────

/**
 * Obtener mensajes del usuario autenticado
 */
export async function getMessages() {
  return request("/messages");
}

/**
 * Enviar un mensaje
 * @param {Object} messageData
 */
export async function sendMessage(messageData) {
  return request("/messages", {
    method: "POST",
    body: JSON.stringify(messageData),
  });
}

/**
 * Subir una imagen de alojamiento (normal o panorama)
 * @param {string|number} idHousing
 * @param {File} file
 * @param {boolean} isPanorama
 */
export async function uploadHousingImage(idHousing, file, isPanorama) {
  const formData = new FormData();
  formData.append("image", file);
  formData.append("is_panorama", isPanorama ? "true" : "false");

  const token = localStorage.getItem("staygooToken");

  const response = await fetch(`${API_BASE_URL}/housings/${idHousing}/images`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Error al subir la imagen");
  }

  return data;
}

// ── GEOGRAPHICAL SERVICES ────────────────────────────────────────────────────────

const countryCodeToName = {
  "AR": "Argentina",
  "BO": "Bolivia",
  "BR": "Brazil",
  "CA": "Canada",
  "CL": "Chile",
  "CO": "Colombia",
  "CR": "Costa Rica",
  "CU": "Cuba",
  "EC": "Ecuador",
  "SV": "El Salvador",
  "ES": "Spain",
  "US": "United States",
  "GT": "Guatemala",
  "HN": "Honduras",
  "MX": "Mexico",
  "NI": "Nicaragua",
  "PA": "Panama",
  "PY": "Paraguay",
  "PE": "Peru",
  "PR": "Puerto Rico",
  "DO": "Dominican Republic",
  "UY": "Uruguay",
  "VE": "Venezuela"
};

// Fallback data in case the external API is unreachable or rate limited
const FALLBACK_DEPARTMENTS = {
  "CO": [
    { name: "Antioquia", adminCode1: "Antioquia" },
    { name: "Bogotá D.C.", adminCode1: "Bogota" },
    { name: "Valle del Cauca", adminCode1: "Valle del Cauca" },
    { name: "Atlántico", adminCode1: "Atlantico" },
    { name: "Bolívar", adminCode1: "Bolivar" },
    { name: "Cundinamarca", adminCode1: "Cundinamarca" },
    { name: "Santander", adminCode1: "Santander" }
  ],
  "AR": [
    { name: "Buenos Aires", adminCode1: "Buenos Aires" },
    { name: "Córdoba", adminCode1: "Cordoba" },
    { name: "Santa Fe", adminCode1: "Santa Fe" },
    { name: "Mendoza", adminCode1: "Mendoza" }
  ],
  "MX": [
    { name: "Ciudad de México", adminCode1: "Ciudad de Mexico" },
    { name: "Jalisco", adminCode1: "Jalisco" },
    { name: "Nuevo León", adminCode1: "Nuevo Leon" },
    { name: "Quintana Roo", adminCode1: "Quintana Roo" }
  ],
  "US": [
    { name: "California", adminCode1: "California" },
    { name: "Florida", adminCode1: "Florida" },
    { name: "New York", adminCode1: "New York" },
    { name: "Texas", adminCode1: "Texas" }
  ],
  "ES": [
    { name: "Madrid", adminCode1: "Madrid" },
    { name: "Cataluña", adminCode1: "Catalonia" },
    { name: "Andalucía", adminCode1: "Andalusia" },
    { name: "Comunidad Valenciana", adminCode1: "Valencia" }
  ]
};

const FALLBACK_CITIES = {
  "CO_Antioquia": ["Medellín", "Envigado", "Sabaneta", "Itagüí", "Rionegro", "Bello"],
  "CO_Bogota": ["Bogotá"],
  "CO_Valle del Cauca": ["Cali", "Palmira", "Buga", "Tuluá"],
  "CO_Atlantico": ["Barranquilla", "Soledad", "Puerto Colombia"],
  "CO_Bolivar": ["Cartagena", "Magangué", "Turbaco"],
  "CO_Cundinamarca": ["Soacha", "Chía", "Zipaquirá", "Facatativá"],
  "CO_Santander": ["Bucaramanga", "Floridablanca", "Girón", "Barrancabermeja"],
  
  "AR_Buenos Aires": ["Buenos Aires", "La Plata", "Mar del Plata", "Bahía Blanca"],
  "AR_Cordoba": ["Córdoba", "Villa Carlos Paz", "Río Cuarto"],
  
  "MX_Ciudad de Mexico": ["Ciudad de México"],
  "MX_Jalisco": ["Guadalajara", "Zapopan", "Puerto Vallarta"],
  
  "US_California": ["Los Angeles", "San Francisco", "San Diego", "San Jose"],
  "US_Florida": ["Miami", "Orlando", "Tampa", "Fort Lauderdale"],
  "US_New York": ["New York City", "Buffalo", "Rochester", "Albany"],
  
  "ES_Madrid": ["Madrid", "Alcalá de Henares", "Móstoles"],
  "ES_Catalonia": ["Barcelona", "Girona", "Tarragona", "Lleida"]
};

/**
 * Obtener los departamentos/estados de un país.
 * @param {string} countryCode - Código ISO de 2 letras del país (ej. "CO")
 */
export async function fetchDepartmentsByCountry(countryCode) {
  const countryName = countryCodeToName[countryCode];
  if (!countryName) {
    return FALLBACK_DEPARTMENTS[countryCode] || [];
  }
  try {
    const response = await fetch("https://countriesnow.space/api/v0.1/countries/states", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ country: countryName })
    });
    if (!response.ok) throw new Error("API response error");
    const result = await response.json();
    if (result.error || !result.data || !result.data.states) {
      throw new Error(result.msg || "Error from API");
    }
    return result.data.states.map(state => {
      const displayName = state.name
        .replace(/\bDepartment\b/gi, "")
        .replace(/\bProvince\b/gi, "")
        .replace(/\bState\b/gi, "")
        .trim();
      return {
        name: displayName || state.name,
        adminCode1: state.name
      };
    });
  } catch (error) {
    console.warn(`Error fetching departments for ${countryCode}, using local fallback.`, error);
    return FALLBACK_DEPARTMENTS[countryCode] || [];
  }
}

/**
 * Obtener las ciudades de un departamento/estado.
 * @param {string} countryCode - Código ISO de 2 letras del país (ej. "CO")
 * @param {string} adminCode1 - Nombre o código del departamento (ej. "Antioquia")
 */
export async function fetchCitiesByDepartment(countryCode, adminCode1) {
  const countryName = countryCodeToName[countryCode];
  if (!countryName) {
    const fallbackKey = `${countryCode}_${adminCode1}`;
    return (FALLBACK_CITIES[fallbackKey] || []).map(city => ({ name: city }));
  }
  try {
    const response = await fetch("https://countriesnow.space/api/v0.1/countries/state/cities", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ country: countryName, state: adminCode1 })
    });
    if (!response.ok) throw new Error("API response error");
    const result = await response.json();
    if (result.error || !result.data) {
      throw new Error(result.msg || "Error from API");
    }
    return result.data.map(cityName => ({ name: cityName }));
  } catch (error) {
    console.warn(`Error fetching cities for ${countryCode} - ${adminCode1}, using local fallback.`, error);
    const fallbackKey = `${countryCode}_${adminCode1}`;
    const fallbackCities = FALLBACK_CITIES[fallbackKey] || [];
    if (fallbackCities.length > 0) {
      return fallbackCities.map(city => ({ name: city }));
    }
    return [{ name: adminCode1.replace(/\bDepartment\b/gi, "").trim() }];
  }
}


