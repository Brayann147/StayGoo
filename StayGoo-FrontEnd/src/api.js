/**
 * api.js — Capa de comunicación con el Backend de StayGo
 * Todos los servicios que hablan con el servidor van aquí.
 */
import Swal from 'sweetalert2';

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
      Swal.fire({
        title: 'Error',
        text: 'Tu sesión ha caducado por seguridad. Por favor, inicia sesión nuevamente para continuar.',
        icon: 'error'
      }).then(() => {
        window.location.href = "/login?redirect=" + encodeURIComponent(window.location.pathname);
      });
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
  const data = await request('/users/me');
  // Sincroniza el avatar al localStorage cada vez que se carga el perfil
  if (data?.avatar) localStorage.setItem('staygooProfilePhoto', data.avatar);
  return data;
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

export async function uploadProfilePhoto(file) {
  const formData = new FormData();
  formData.append('photo', file);
  const token = localStorage.getItem('staygooToken');
  const res = await fetch(`${BASE_URL}/users/me/photo`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  if (!res.ok) throw new Error('Error al subir la foto');
  return res.json();
}

// ── HOUSINGS ───────────────────────────────────────────────────────────────────

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

/**
 * Eliminar un alojamiento (solo hosts)
 * @param {string|number} id
 */
export async function deleteHousing(id) {
  return request(`/housings/${id}`, {
    method: "DELETE",
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
export async function getMessages(id_user) {
  return request(`/messages/conversation/${id_user}`);
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

/**
 * Eliminar una imagen de alojamiento por su ID
 * @param {string|number} idImage
 */
export async function deleteHousingImage(idImage) {
  return request(`/housings/images/${idImage}`, {
    method: "DELETE",
  });
}


/**
 * Obtener departamentos directo del dataset de GeoNames (featureCode=ADM1)
 */
export async function fetchDepartmentsByCountry(countryCode) {
  try {
    const response = await fetch(
      `https://secure.geonames.org/searchJSON?country=${countryCode}&featureCode=ADM1&maxRows=100&username=rafaelc26`
    );
    const data = await response.json();

    if (!data || !data.geonames) {
      return [];
    }

    return data.geonames.map(dep => ({
      name: dep.name,
      adminCode1: dep.adminCode1
    })).sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error("Error directo a GeoNames (Departamentos):", error);
    return [];
  }
}

/**
 * Obtener ciudades directo del dataset de GeoNames por departamento
 */
export async function fetchCitiesByDepartment(countryCode, adminCode1) {
  try {
    const response = await fetch(
      `https://secure.geonames.org/searchJSON?country=${countryCode}&adminCode1=${adminCode1}&featureClass=P&maxRows=100&username=rafaelc26`
    );
    const data = await response.json();

    if (!data || !data.geonames) {
      return [];
    }

    return data.geonames.map(city => ({
      name: city.name,
      lat: city.lat,
      lng: city.lng
    })).sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error("Error directo a GeoNames (Ciudades):", error);
    return [];
  }
}
export async function getReviewsByHousing(housingId) {
  return request(`/reviews/housing/${housingId}`, { public: true });
}

export async function createReview(reviewData) {
  return request("/reviews", {
    method: "POST",
    body: JSON.stringify(reviewData),
  });
}

