import { Router } from 'express';
import { enviarCodigo } from '../controllers/verificacion/enviarCodigo';
import { comprobarCodigo } from '../controllers/verificacion/comprobarCodigo';

const router = Router();

router.post('/enviar', enviarCodigo);
router.post('/comprobar', comprobarCodigo);

export default router;
