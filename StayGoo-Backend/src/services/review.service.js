import { supabase } from '../config/supabaseClient.js';

/**
 * Review Service – Lógica de negocio para reseñas
 * Tabla: review
 */

// Registrar una review asociada a un booking
export const createReview = async (reviewData) => {
    const { data, error } = await supabase
        .from('review')
        .insert([reviewData])
        .select()
        .single();
    if (error) throw error;
    return data;
};

// Listar reviews de un booking específico
export const getReviewsByBooking = async (id_booking) => {
    const { data, error } = await supabase
        .from('review')
        .select(`
            *,
            booking ( user (id_user, name) )
        `)
        .eq('id_booking', id_booking);
    if (error) throw error;
    return data;
};

// Listar reviews de un alojamiento específico (unión a través de booking)
export const getReviewsByHousing = async (id_housing) => {
    const { data, error } = await supabase
        .from('review')
        .select(`
            *,
            booking!inner(
                id_housing,
                user(id_user, name)
            )
        `)
        .eq('booking.id_housing', id_housing);
    if (error) throw error;
    return data;
};

