import { createClient } from '@supabase/supabase-js';
import multer from 'multer';
import { extname } from 'path';

// Configuración de multer (almacenamiento en memoria)
const storage = multer.memoryStorage();
export const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10 MB max (panoramas are usually larger)
    },
    fileFilter: (req, file, cb) => {
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten imágenes JPG, PNG o WEBP.'));
        }
    }
});

// Helper para instanciar el cliente con el token del usuario actual
const getAuthClient = (req) => {
    const token = req.headers['authorization']?.split(' ')[1];
    return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
        global: {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        }
    });
};

export const uploadHousingImage = async (req, res) => {
    try {
        const file = req.file;
        const { id_housing } = req.params;
        const is_panorama = req.body.is_panorama === 'true'; // parse boolean from form-data

        if (!file) {
            return res.status(400).json({ error: 'Debes proporcionar una imagen.' });
        }

        if (!id_housing) {
            return res.status(400).json({ error: 'Falta el id del alojamiento.' });
        }

        const authClient = getAuthClient(req);

        // Subir imagen a Supabase Storage
        const fileExt = extname(file.originalname);
        const fileName = `${id_housing}-${Date.now()}${fileExt}`;
        const filePath = `${id_housing}/${fileName}`;

        const { data: storageData, error: storageError } = await authClient.storage
            .from('housing-images')
            .upload(filePath, file.buffer, {
                contentType: file.mimetype,
                upsert: false
            });

        if (storageError) throw storageError;

        // Obtener URL Pública
        const { data: urlData } = authClient.storage
            .from('housing-images')
            .getPublicUrl(storageData.path);

        const publicUrl = urlData.publicUrl;

        // Crear registro en la tabla housing_images
        const { data: imgData, error: dbError } = await authClient
            .from('housing_images')
            .insert([
                {
                    id_housing: parseInt(id_housing, 10),
                    image_url: publicUrl,
                    is_panorama: is_panorama
                }
            ])
            .select()
            .single();

        if (dbError) {
            // Revertir subida si falla DB
            await authClient.storage.from('housing-images').remove([storageData.path]);
            throw dbError;
        }

        return res.status(201).json({
            message: 'Imagen subida y registrada con éxito.',
            image: imgData
        });

    } catch (error) {
        console.error('Error subiendo imagen de alojamiento:', error);
        return res.status(500).json({ error: error.message || 'Error al procesar la solicitud.' });
    }
};

// Eliminar imagen de un alojamiento
export const deleteHousingImage = async (req, res) => {
    try {
        const { id_image } = req.params;
        const authClient = getAuthClient(req);

        // 1. Buscar el registro en DB para obtener el path de storage
        const { data: imageRecord, error: fetchError } = await authClient
            .from('housing_images')
            .select('*')
            .eq('id_image', id_image)
            .single();

        if (fetchError || !imageRecord) {
            return res.status(404).json({ error: 'La imagen no existe.' });
        }

        // 2. Extraer el storage path a partir de la URL pública
        // La URL de Supabase suele ser: https://.../storage/v1/object/public/housing-images/id_housing/filename.ext
        // El storage path es: id_housing/filename.ext
        const storagePath = imageRecord.image_url.split('/housing-images/')[1];

        if (storagePath) {
            await authClient.storage.from('housing-images').remove([storagePath]);
        }

        // 3. Borrar de DB
        const { error: dbError } = await authClient
            .from('housing_images')
            .delete()
            .eq('id_image', id_image);

        if (dbError) throw dbError;

        return res.status(200).json({ message: 'Imagen eliminada correctamente.' });

    } catch (error) {
        console.error('Error eliminando imagen:', error);
        return res.status(500).json({ error: error.message || 'Error interno del servidor.' });
    }
};
