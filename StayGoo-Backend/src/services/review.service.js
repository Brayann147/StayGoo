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
// Listar reviews de un alojamiento específico
export const getReviewsByHousing = async (id_housing) => {
    const { data, error } = await supabase
        .from('review')
        .select(`
            *,
            booking ( 
                id_housing,
                user (id_user, name) 
            )
        `)
        .eq('booking.id_housing', id_housing);
    if (error) throw error;
    return data;
};
