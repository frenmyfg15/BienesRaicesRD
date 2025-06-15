// src/routes/proyecto.ts
import { Router } from 'express';
import { getProyectoWithProperties } from '../controllers/proyecto/getProyectoWithProperties';
import { createProyecto } from '../controllers/proyecto/createProyecto';
import { updateProyecto } from '../controllers/proyecto/updateProyecto';
import { deleteProyecto } from '../controllers/proyecto/deleteProyecto';
import { verificarToken } from '../middleware/auth';
import { getProyectos } from '../controllers/proyecto/getProyectos';
import { getProyectoBySlug } from '../controllers/proyecto/getProyectoBySlug';

const router = Router();

router.get('/', getProyectos);
router.post('/', verificarToken, createProyecto);
router.get('/', verificarToken, getProyectoWithProperties);
router.put('/:id', verificarToken, updateProyecto);
router.delete('/:id', verificarToken, deleteProyecto);
router.get('/slug/:slug', getProyectoBySlug);

export default router;
