// server/src/controllers/upload/uploadImage.ts
import { RequestHandler } from 'express';
import { v2 as cloudinary } from 'cloudinary'; // Importa Cloudinary v2
import formidable from 'formidable'; // Para parsear multipart/form-data
import dotenv from 'dotenv'; // Para cargar variables de entorno

dotenv.config(); // Carga las variables de entorno

// Configura Cloudinary con tus credenciales
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Middleware para deshabilitar el body-parser de Express para esta ruta
 * Esto es necesario cuando se usa 'formidable' para manejar 'multipart/form-data'.
 */
const disableExpressBodyParser: RequestHandler = (req, res, next) => {
    req.on('data', chunk => {
        // Consume los datos del stream para evitar que Express los parseé
    });
    req.on('end', () => {
        next();
    });
};

/**
 * Controlador para subir una imagen a Cloudinary.
 * Espera un archivo de imagen en el campo 'image' de un formulario 'multipart/form-data'.
 * Ruta: POST /api/upload/image
 * @param {object} req - Objeto de solicitud de Express.
 * @param {object} res - Objeto de respuesta de Express.
 */
export const uploadImage: RequestHandler = async (req, res) => {
    const form = formidable({
        multiples: false, // Esperamos solo un archivo
        keepExtensions: true, // Mantener la extensión original del archivo
        maxFileSize: 5 * 1024 * 1024, // Limite de 5MB por archivo (ajusta si es necesario)
    });

    try {
        // Parsea la solicitud para obtener los campos y archivos
        const [fields, files] = await form.parse(req);

        // Accede al archivo subido por el nombre del campo ('image')
        const imageFile = Array.isArray(files.image) ? files.image[0] : files.image;

        if (!imageFile) {
            res.status(400).json({ mensaje: 'No se encontró ningún archivo de imagen en el campo "image".' });
            return
        }

        // Sube la imagen a Cloudinary
        const result = await cloudinary.uploader.upload(imageFile.filepath, {
            folder: 'BienesRaicesRD', // Carpeta donde se guardarán tus imágenes en Cloudinary
            resource_type: 'image', // Asegura que se sube como imagen
        });

        // Envía la URL segura y el public_id de la imagen subida al frontend
        res.status(200).json({
            mensaje: 'Imagen subida exitosamente a Cloudinary.',
            url: result.secure_url,
            public_id: result.public_id,
        });

    } catch (error: any) { // Tipado de error para manejar errores de formidable/Cloudinary
        console.error('Error al subir imagen a Cloudinary:', error);

        // Manejo de errores específicos de formidable
        if (error.code === 1009) { // Error code for max file size exceeded
            res.status(413).json({ mensaje: 'El archivo de imagen es demasiado grande. Tamaño máximo permitido es 5MB.' });
            return
        }

        res.status(500).json({ mensaje: 'Error interno del servidor al subir la imagen.' });
    }
};

// Exportamos también el middleware para deshabilitar el body parser
export const disableBodyParser = disableExpressBodyParser;
