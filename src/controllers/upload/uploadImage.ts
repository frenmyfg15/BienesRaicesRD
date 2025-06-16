import { RequestHandler } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import formidable from 'formidable';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Middleware para evitar que Express procese el body
export const disableBodyParser: RequestHandler = (req, res, next) => {
    req.on('data', () => { });
    req.on('end', () => next());
};

// Subida de imágenes o videos
export const uploadImage: RequestHandler = async (req, res) => {
    const form = formidable({
        multiples: true,
        keepExtensions: true,
        maxFileSize: 20 * 1024 * 1024, // Máximo 20MB por archivo
    });

    try {
        const [fields, files] = await form.parse(req);

        const allFiles = [];
        const images = files.images || files.image; // Asume que el frontend envía 'images' o 'image'
        const video = files.video;

        // Aplanar array si es necesario
        const imageFiles = Array.isArray(images) ? images : images ? [images] : [];

        // Subir imágenes
        for (const file of imageFiles) {
            const result = await cloudinary.uploader.upload(file.filepath, {
                folder: 'BienesRaicesRD',
                resource_type: 'image',
            });
            allFiles.push({
                type: 'image',
                url: result.secure_url,
                public_id: result.public_id,
            });
        }

        // Subir video si existe
        if (video) {
            const videoFile = Array.isArray(video) ? video[0] : video;
            const result = await cloudinary.uploader.upload(videoFile.filepath, {
                folder: 'BienesRaicesRD/videos',
                resource_type: 'video',
            });
            allFiles.push({
                type: 'video',
                url: result.secure_url,
                public_id: result.public_id,
            });
        }

        if (allFiles.length === 0) {
            res.status(400).json({ mensaje: 'No se encontraron archivos válidos para subir.' });
            return
        }

        res.status(200).json({
            mensaje: 'Archivos subidos exitosamente.',
            archivos: allFiles,
        });
        return
    } catch (error: any) {
        console.error('Error al subir archivos:', error);
        if (error.code === 1009) { // Error específico de formidable para archivo demasiado grande
            res.status(413).json({ mensaje: 'Archivo demasiado grande. Límite de 20MB.' });
            return
        }
        res.status(500).json({ mensaje: 'Error interno al subir archivos.' });
        return
    }
};
