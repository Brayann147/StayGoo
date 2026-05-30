import { supabase } from '../config/supabaseClient.js';

/**
 * Housing Service – Lógica de negocio para alojamientos
 * Tabla: housing, type_housing
 */

// Listar todos los alojamientos con su tipo, dueño y ratings promedio reales
export const getHousings = async () => {
    const { data: housings, error: hError } = await supabase
        .from('housing')
        .select(`
            *,
            type_housing (id_type, name),
            host:user!housing_id_owner_fkey (id_user, name, avatar),
            housing_images (*)
        `);
    if (hError) throw hError;

    // Obtener todas las reseñas con la relación del id_housing de su reserva
    const { data: reviews, error: rError } = await supabase
        .from('review')
        .select(`
            rating,
            booking!inner(id_housing)
        `);

    if (rError) {
        console.error("Error fetching reviews for housings:", rError);
        return housings;
    }

    const ratingsMap = {};
    reviews.forEach(rev => {
        const hId = rev.booking?.id_housing;
        if (hId) {
            if (!ratingsMap[hId]) ratingsMap[hId] = [];
            ratingsMap[hId].push(rev.rating);
        }
    });

    return housings.map(h => {
        const hRatings = ratingsMap[h.id_housing] || [];
        const avg = hRatings.length > 0 
            ? parseFloat((hRatings.reduce((a, b) => a + b, 0) / hRatings.length).toFixed(1))
            : null;
        return {
            ...h,
            average_rating: avg,
            review_count: hRatings.length
        };
    });
};

// Obtener detalle de un alojamiento por ID con rating promedio real
export const getHousingById = async (id_housing) => {
    const { data: housing, error } = await supabase
        .from('housing')
        .select(`
            *,
            type_housing (id_type, name),
            host:user!housing_id_owner_fkey (id_user, name, email, phone, avatar),
            availability (*),
            housing_images (*),
            housing_service (
                service (id_service, name)
            )
        `)
        .eq('id_housing', id_housing)
        .single();
    if (error) throw error;

    const { data: reviews, error: rError } = await supabase
        .from('review')
        .select(`
            rating,
            booking!inner(id_housing)
        `)
        .eq('booking.id_housing', id_housing);

    let avg = null;
    let count = 0;
    if (!rError && reviews && reviews.length > 0) {
        count = reviews.length;
        avg = parseFloat((reviews.reduce((sum, r) => sum + r.rating, 0) / count).toFixed(1));
    }

    return {
        ...housing,
        average_rating: avg,
        review_count: count
    };
};

// Publicar un nuevo alojamiento
export const createHousing = async (housingData) => {
    const { data, error } = await supabase
        .from('housing')
        .insert([housingData])
        .select()
        .single();
    if (error) throw error;
    return data;
};

// Actualizar información de un alojamiento
export const updateHousing = async (id_housing, updates) => {
    const { data, error } = await supabase
        .from('housing')
        .update(updates)
        .eq('id_housing', id_housing)
        .select()
        .single();
    if (error) throw error;
    return data;
};

// Eliminar un alojamiento
export const deleteHousing = async (id_housing) => {
    const { error } = await supabase
        .from('housing')
        .delete()
        .eq('id_housing', id_housing);
    if (error) throw error;
    return { message: 'Housing eliminado correctamente.' };
};

// Listar tipos de alojamiento
export const getTypeHousings = async () => {
    const { data, error } = await supabase
        .from('type_housing')
        .select('*');
    if (error) throw error;
    return data;
};
