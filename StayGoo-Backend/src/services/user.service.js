import { supabase } from '../config/supabaseClient.js';

/**
 * User Service – Lógica de negocio para gestión de perfil de usuario
 * Consulta la tabla 'users' del schema public
 */

// Obtener perfil de un usuario por su UUID
export const getUserById = async (id_user) => {
    const { data, error } = await supabase
        .from('user')
        .select('*') // Solo trae los datos del usuario, sin roles
        .eq('id_user', id_user)
        .single();

    if (error) {
        console.error('❌ Error de Supabase:', error); // Esto imprimirá el error real en tu consola de VS Code
        throw error;
    }
    return data;
};


// Actualizar datos del perfil de usuario
export const updateUser = async (id_user, updates) => {
    // Intentar actualizar primero
    const { data, error } = await supabase
        .from('user')
        .update(updates)
        .eq('id_user', id_user)
        .select()
        .single();

    if (!error) return data;

    // Log the initial update error for debugging before attempting upsert
    console.error('❌ Initial update error for user', id_user, ':', error);

    // Si la actualización falló (por ejemplo, no existe la fila), intentar upsert
    try {
        const payload = { id_user, ...updates };
        const { data: upsertData, error: upsertError } = await supabase
            .from('user')
            .upsert(payload, { onConflict: 'id_user' })
            .select()
            .single();

        if (upsertError) {
            console.error('❌ Error updating user, upsert failed:', upsertError);
            throw upsertError;
        }
        return upsertData;
    } catch (err) {
        console.error('❌ Error in updateUser:', err);
        throw err;
    }
};

// Listar todos los roles disponibles
export const getRoles = async () => {
    const { data, error } = await supabase
        .from('role')
        .select('*');
    if (error) throw error;
    return data;
};
