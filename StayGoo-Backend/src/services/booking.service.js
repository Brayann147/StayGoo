// booking.service.js — v3 (fix: use municipality, include housing_images for trips carousel)
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
            housing (id_housing, name, address, municipality, department, country, price_per_night),
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

// Consultar reservas de un usuario (mis viajes)
export const getMyBookings = async (id_user) => {
    const { data, error } = await supabase
        .from('booking')
        .select(`
            *,
            housing (
                id_housing,
                name,
                municipality,
                department,
                country,
                address,
                price_per_night,
                housing_images (image_url, is_panorama)
            )
        `)
        .eq('id_user', id_user)
        .order('start_date', { ascending: true });
    if (error) throw error;
    return data;
};

// Consultar reservas de los alojamientos de un owner (host)
export const getHostBookings = async (id_owner) => {
    const { data, error } = await supabase
        .from('booking')
        .select(`
            *,
            housing!inner(id_housing, name, municipality, department, country, address, price_per_night, id_owner),
            user (id_user, name, email)
        `)
        .eq('housing.id_owner', id_owner)
        .order('start_date', { ascending: false });
    if (error) throw error;
    return data;
};
