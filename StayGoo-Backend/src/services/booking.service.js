import { supabase } from '../config/supabaseClient.js';

/**
 * Booking Service – Lógica de negocio para reservas
 * Tabla: booking
 */

// Crear una nueva reserva
export const createBooking = async (bookingData) => {
    const { data, error } = await supabase
        .from('booking')
        .insert([bookingData])
        .select()
        .single();
    if (error) throw error;
    return data;
};

// Consultar detalle de una reserva por ID
export const getBookingById = async (id_booking) => {
    const { data, error } = await supabase
        .from('booking')
        .select(`
            *,
            housing (id_housing, name, address, price_per_night),
            user (id_user, name, email)
        `)
        .eq('id_booking', id_booking)
        .single();
    if (error) throw error;
    return data;
};

// Cancelar una reserva (actualiza el status a 'cancelled')
export const cancelBooking = async (id_booking) => {
    const { data, error } = await supabase
        .from('booking')
        .update({ status: 'cancelled' })
        .eq('id_booking', id_booking)
        .select()
        .single();
    if (error) throw error;
    return data;
};

// Consultar reservas de un usuario
export const getMyBookings = async (id_user) => {
    const { data, error } = await supabase
        .from('booking')
        .select(`
            *,
            housing (id_housing, name, municipality, department, country, address, price_per_night)
        `)
        .eq('id_user', id_user);
    if (error) throw error;
    return data;
};

// Consultar reservas de los alojamientos de un owner (host)
export const getHostBookings = async (id_owner) => {
    // Al usar !inner Forzamos a que actue como inner join y filtra por la relacion
    const { data, error } = await supabase
        .from('booking')
        .select(`
            *,
            housing!inner(id_housing, name, id_owner),
            user (id_user, name, email)
        `)
        .eq('housing.id_owner', id_owner);
    if (error) throw error;
    return data;
};
