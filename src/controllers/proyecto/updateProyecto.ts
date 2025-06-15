// src/controllers/proyecto/updateProyecto.ts
import { RequestHandler, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { JwtPayload } from 'jsonwebtoken';

const prisma = new PrismaClient();

// Interfaz para los datos que se esperan en el cuerpo de la solicitud (req.body) al actualizar un proyecto.
// Todos los campos son opcionales para permitir actualizaciones parciales.
interface ProyectoUpdateBody {
    nombre?: string;
    slug?: string;
    descripcion?: string;
    ubicacion?: string;
    estado?: string;
    imagenDestacada?: string;
}

// Extiende JwtPayload con los campos de tu usuario
interface JwtPayloadExtended extends JwtPayload {
    id: number;
    email?: string;
    rol: string;
    nombre?: string;
}

// Extiende la interfaz Request de Express para incluir 'user' y tipar 'body' y 'params'
interface AuthRequest extends Request {
    user?: JwtPayloadExtended;
    body: ProyectoUpdateBody;
    params: { id: string }; // El ID del proyecto vendrá en los parámetros de la URL
}

// Tipado explícito para RequestHandler
export const updateProyecto: RequestHandler<{ id: string }> = async (req: AuthRequest, res) => {
    try {
        const { id } = req.params; // ID del proyecto a actualizar
        const updatedData = req.body; // Datos para actualizar
        const vendedorId = req.user?.id; // ID del vendedor autenticado

        if (!vendedorId) {
            res.status(401).json({ error: 'No autorizado: ID de vendedor no encontrado en el token.' });
            return
        }

        // Convertir el ID del proyecto a número
        const proyectoId = parseInt(id, 10);
        if (isNaN(proyectoId)) {
            res.status(400).json({ error: 'ID de proyecto inválido.' });
            return
        }

        // 1. Encontrar el proyecto para verificar la propiedad del vendedor
        const proyectoExistente = await prisma.proyecto.findUnique({
            where: { id: proyectoId },
        });

        if (!proyectoExistente) {
            res.status(404).json({ error: 'Proyecto no encontrado.' });
            return
        }

        // 2. Verificar que el vendedor autenticado es el propietario del proyecto
        if (proyectoExistente.usuarioVendedorId !== vendedorId) {
            res.status(403).json({ error: 'No tienes permiso para editar este proyecto.' });
            return
        }

        // 3. Si se intenta actualizar el slug, verificar que el nuevo slug no exista para otro proyecto
        if (updatedData.slug && updatedData.slug !== proyectoExistente.slug) {
            const existingProyectoWithNewSlug = await prisma.proyecto.findUnique({
                where: { slug: updatedData.slug },
            });
            if (existingProyectoWithNewSlug) {
                res.status(409).json({ error: 'El nuevo slug ya existe para otro proyecto.' });
                return
            }
        }

        // 4. Actualizar el proyecto en la base de datos
        const proyectoActualizado = await prisma.proyecto.update({
            where: { id: proyectoId },
            data: updatedData, // Aquí se pasan los datos actualizados
        });

        res.status(200).json({ mensaje: 'Proyecto actualizado exitosamente.', proyecto: proyectoActualizado });

    } catch (error: any) {
        console.error('Error al actualizar proyecto:', error);
        if (error.code === 'P2002') { // Conflicto de unicidad (ej. slug)
            res.status(409).json({ error: 'Conflicto de datos: El slug del proyecto ya existe.' });
        } else if (error.code === 'P2025') { // No se encontró el registro para actualizar
            res.status(404).json({ error: 'El proyecto no fue encontrado o ya no existe.' });
        } else {
            res.status(500).json({ error: 'Error interno del servidor al actualizar el proyecto.' });
        }
    } finally {
        await prisma.$disconnect();
    }
};
