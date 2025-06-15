// server/src/routes/upload.ts
import { Router } from 'express';
import { uploadImage } from '../controllers/upload/uploadImage'; // Importa el controlador y el middleware

const router = Router();

// Ruta para subir imágenes a Cloudinary
// POST /api/upload/image
// Usamos disableBodyParser antes del controlador para que formidable pueda manejar el body.
router.post('/image', uploadImage);

export default router;
