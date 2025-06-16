// src/controllers/propiedad/getPropiedadesByProyectoId.ts
import { RequestHandler, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { JwtPayload } from 'jsonwebtoken';

const prisma = new PrismaClient();

interface JwtPayloadExtended extends JwtPayload {
    id: number;
    email?: string;
    rol: string;
    nombre?: string;
}

interface AuthRequest extends Request {
    user?: JwtPayloadExtended;
    params: { proyectoId: string };
}

export const getPropiedadesByProyectoId: RequestHandler<{ proyectoId: string }> = async (req: AuthRequest, res) => {
    try {
        const { proyectoId } = req.params;
        const vendedorId = req.user?.id;

        if (!vendedorId) {
            res.status(401).json({ error: 'No autorizado: ID de vendedor no encontrado en el token.' });
            return
        }

        const idProyecto = parseInt(proyectoId, 10);
        if (isNaN(idProyecto)) {
            res.status(400).json({ error: 'ID de proyecto inválido.' });
            return
        }

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

        const propiedades = await prisma.propiedad.findMany({
            where: {
                proyectoId: idProyecto,
                usuarioVendedorId: vendedorId,
            },
            include: {
                usuarioVendedor: {
                    select: {
                        id: true,
                        nombre: true,
                        email: true,
                        telefono: true,
                        whatsapp: true,
                        imagenPerfilUrl: true,
                    },
                },
                proyecto: {
                    select: {
                        id: true,
                        nombre: true,
                        slug: true,
                        estado: true,
                    },
                },
                imagenes: {
                    select: {
                        id: true,
                        url: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        res.status(200).json({
            mensaje: 'Propiedades del proyecto obtenidas exitosamente.',
            propiedades,
        });
        return

    } catch (error) {
        console.error('Error al obtener propiedades por ID de proyecto:', error);
        res.status(500).json({ error: 'Error interno del servidor al obtener las propiedades del proyecto.' });
        return
    } finally {
        await prisma.$disconnect();
    }
};
