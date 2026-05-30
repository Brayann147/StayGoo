import * as userService from '../services/user.service.js';
import { supabase } from '../config/supabaseClient.js';
import multer from 'multer';
import { extname } from 'path';

// Multer config para avatares (solo en memoria, max 5 MB)
const avatarStorage = multer.memoryStorage();
export const uploadAvatarMiddleware = multer({
    storage: avatarStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (allowed.includes(file.mimetype)) cb(null, true);
        else cb(new Error('Solo se permiten imágenes JPG, PNG, WEBP o GIF.'));
    }
});

/**
 * User Controller – Maneja peticiones HTTP para gestión de usuarios
 */

// GET /api/users/me  → Obtener perfil del usuario autenticado
export const getMyProfile = async (req, res) => {
    try {
        const id_user = req.user.id;
        let data = await userService.getUserById(id_user).catch(() => null);
        
        // Si no existe en la tabla pública, traer lo básico del Auth
        if (!data) {
            data = {
                id_user: req.user.id,
                email: req.user.email,
                name: req.user.user_metadata?.name || 'Usuario',
                phone: req.user.phone || '',
                created_at: req.user.created_at
            };
        }
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener el perfil.' });
    }
};

// GET /api/users/:id_user  → Obtener perfil de usuario
export const getUserById = async (req, res) => {
    try {
        const { id_user } = req.params;
        const data = await userService.getUserById(id_user);
        res.status(200).json(data);
    } catch (error) {
        res.status(404).json({ error: 'Usuario no encontrado.' });
    }
};

// PUT /api/users/:id_user  → Actualizar datos del usuario
export const updateUser = async (req, res) => {
    try {
        let { id_user } = req.params;
        const updates = req.body;

        if (id_user === 'me') {
            id_user = req.user.id;
        }

        // Sólo permite actualizar su propio perfil
        if (req.user.id !== id_user) {
            return res.status(403).json({ error: 'No autorizado para editar este perfil.' });
        }

        const data = await userService.updateUser(id_user, updates);
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// POST /api/users/me/avatar  → Subir y actualizar foto de perfil
export const uploadAvatar = async (req, res) => {
    try {
        const file = req.file;
        if (!file) {
            return res.status(400).json({ error: 'Debes proporcionar una imagen.' });
        }

        const id_user = req.user.id;
        const fileExt = extname(file.originalname) || '.jpg';
        const fileName = `${id_user}-${Date.now()}${fileExt}`;
        const filePath = `${id_user}/${fileName}`;

        // Subir a Supabase Storage bucket 'avatars'
        const { data: storageData, error: storageError } = await supabase.storage
            .from('avatars')
            .upload(filePath, file.buffer, {
                contentType: file.mimetype,
                upsert: true
            });

        if (storageError) throw storageError;

        // Obtener URL pública
        const { data: urlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(storageData.path);

        const publicUrl = urlData.publicUrl;

        // Actualizar la columna avatar en la tabla user
        await userService.updateUser(id_user, { avatar: publicUrl });

        return res.status(200).json({ avatar: publicUrl });
    } catch (error) {
        console.error('❌ Error subiendo avatar:', error);
        return res.status(500).json({ error: error.message || 'Error al subir la imagen.' });
    }
};

// GET /api/roles  → Listar roles disponibles
export const getRoles = async (req, res) => {
    try {
        const data = await userService.getRoles();
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

