// src/routes/propiedad.ts
import { Router } from 'express';
import { createPropiedad } from '../controllers/propiedad/createPropiedad';
import { updatePropiedad } from '../controllers/propiedad/updatePropiedad';
import { deletePropiedad } from '../controllers/propiedad/deletePropiedad';
import { getPropiedadById } from '../controllers/propiedad/getPropiedadById';
import { getPropiedadBySlug } from '../controllers/propiedad/getPropiedadBySlug';
import { getPropiedadesByProyectoId } from '../controllers/propiedad/getPropiedadesByProyectoId';
import { getAllProperties } from '../controllers/propiedad/getAllProperties'; // <-- Importa el nuevo controlador

// Importa los controladores específicos de vendedor desde su carpeta
import { getPropiedadesByVendedor } from '../controllers/vendedor/getPropiedadesByVendedor';
import { getIndependentPropertiesByVendedor } from '../controllers/vendedor/getIndependentPropertiesByVendedor';

import { verificarToken } from '../middleware/auth'; 

const router = Router();

router.get('/', getAllProperties); 

router.post('/', verificarToken, createPropiedad);

router.put('/:id', verificarToken, updatePropiedad);

router.delete('/:id', verificarToken, deletePropiedad);

router.get('/:id', getPropiedadById);

router.get('/slug/:slug', getPropiedadBySlug);

router.get('/proyecto/:proyectoId', getPropiedadesByProyectoId); 

router.get('/mis-propiedades', verificarToken, getPropiedadesByVendedor); 

router.get('/mis-independientes', verificarToken, getIndependentPropertiesByVendedor);

export default router;
