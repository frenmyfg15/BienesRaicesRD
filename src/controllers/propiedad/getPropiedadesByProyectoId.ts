// src/controllers/propiedad/getPropiedadesByProyectoId.ts
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
    params: { proyectoId: string }; // El ID del proyecto vendrá en los parámetros de la URL
}

export const getPropiedadesByProyectoId: RequestHandler<{ proyectoId: string }> = async (req: AuthRequest, res) => {
    try {
        const { proyectoId } = req.params; // ID del proyecto
        const vendedorId = req.user?.id; // ID del vendedor autenticado

        if (!vendedorId) {
            res.status(401).json({ error: 'No autorizado: ID de vendedor no encontrado en el token.' });
            return
        }

        const idProyecto = parseInt(proyectoId, 10);
        if (isNaN(idProyecto)) {
            res.status(400).json({ error: 'ID de proyecto inválido.' });
            return
        }

        // Opcional: Verificar que el proyecto exista y pertenezca al vendedor autenticado
        const proyectoExistente = await prisma.proyecto.findUnique({
            where: { id: idProyecto },
            select: { usuarioVendedorId: true },
        });

        if (!proyectoExistente) {
            res.status(404).json({ error: 'Proyecto no encontrado.' });
            return
        }

        if (proyectoExistente.usuarioVendedorId !== vendedorId) {
            res.status(403).json({ error: 'No tienes permiso para ver las propiedades de este proyecto.' });
            return
        }

        // Obtener todas las propiedades asociadas a ese proyecto y que pertenecen al vendedor
        const propiedades = await prisma.propiedad.findMany({
            where: {
                proyectoId: idProyecto,
                usuarioVendedorId: vendedorId, // Asegurarse de que el vendedor es el propietario
            },
            include: {
                usuarioVendedor: {
                    select: {
                        id: true,
                        nombre: true,
                    },
                },
                proyecto: {
                    select: {
                        id: true,
                        nombre: true,
                        slug: true,
                    },
                },
            },
        });

        res.status(200).json({ mensaje: 'Propiedades del proyecto obtenidas exitosamente.', propiedades });

    } catch (error: any) {
        console.error('Error al obtener propiedades por ID de proyecto:', error);
        res.status(500).json({ error: 'Error interno del servidor al obtener las propiedades del proyecto.' });
    } finally {
        await prisma.$disconnect();
    }
};
