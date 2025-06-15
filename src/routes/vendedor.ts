
import { Router } from 'express';

import { getPropiedadesByVendedor } from '../controllers/vendedor/getPropiedadesByVendedor';
import { getIndependentPropertiesByVendedor } from '../controllers/vendedor/getIndependentPropertiesByVendedor';
import { verificarToken } from '../middleware/auth'; 

const router = Router();

router.get('/mis-propiedades', verificarToken, getPropiedadesByVendedor); 
router.get('/mis-independientes', verificarToken, getIndependentPropertiesByVendedor);

export default router;
