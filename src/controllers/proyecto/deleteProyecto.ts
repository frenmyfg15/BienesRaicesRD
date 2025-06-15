// src/controllers/proyecto/deleteProyecto.ts
import { RequestHandler, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { JwtPayload } from 'jsonwebtoken';

const prisma = new PrismaClient();

// Extiende JwtPayload con los campos de tu usuario
interface JwtPayloadExtended extends JwtPayload {
    id: number;
    email?: string;
    rol: string;
    nombre?: string;
}

// Extiende la interfaz Request de Express para incluir 'user' y tipar 'params'
interface AuthRequest extends Request {
    user?: JwtPayloadExtended;
    params: { id: string }; // El ID del proyecto a eliminar
}

// Tipado explícito para RequestHandler
export const deleteProyecto: RequestHandler<{ id: string }> = async (req: AuthRequest, res) => {
    try {
        const { id } = req.params; // ID del proyecto a eliminar
        const vendedorId = req.user?.id; // ID del vendedor autenticado

        if (!vendedorId) {
            res.status(401).json({ error: 'No autorizado: ID de vendedor no encontrado en el token.' });
            return
        }

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
            res.status(403).json({ error: 'No tienes permiso para eliminar este proyecto.' });
            return
        }

        // 3. Iniciar una transacción para eliminar propiedades asociadas y luego el proyecto
        // Esto asegura que si algo falla en el proceso, todo se revierte.
        await prisma.$transaction(async (prismaTransaction) => {
            // Eliminar todas las propiedades que están relacionadas con este proyecto
            await prismaTransaction.propiedad.deleteMany({
                where: { proyectoId: proyectoId },
            });

            // Finalmente, eliminar el proyecto
            await prismaTransaction.proyecto.delete({
                where: { id: proyectoId },
            });
        });

        res.status(200).json({ mensaje: 'Proyecto y propiedades asociadas eliminados exitosamente.' });

    } catch (error: any) {
        console.error('Error al eliminar proyecto (cascada):', error);
        if (error.code === 'P2025') { // Si el proyecto ya no existe
            res.status(404).json({ error: 'El proyecto ya no existe o no pudo ser encontrado.' });
        } else {
            res.status(500).json({ error: 'Error interno del servidor al eliminar el proyecto y sus propiedades.' });
        }
    } finally {
        await prisma.$disconnect();
    }
};
