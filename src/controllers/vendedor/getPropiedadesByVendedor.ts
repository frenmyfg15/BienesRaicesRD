// src/controllers/propiedad/getPropiedadesByVendedor.ts
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

// Extiende la interfaz Request de Express para incluir 'user'
interface AuthRequest extends Request {
    user?: JwtPayloadExtended;
}

export const getPropiedadesByVendedor: RequestHandler = async (req: AuthRequest, res) => {
    try {
        const vendedorId = req.user?.id; // Obtiene el ID del vendedor autenticado del token

        if (!vendedorId) {
            res.status(401).json({ error: 'No autorizado: ID de vendedor no encontrado en el token.' });
            return
        }

        // Busca todas las propiedades donde el usuarioVendedorId coincide con el vendedorId autenticado
        const propiedades = await prisma.propiedad.findMany({
            where: {
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
                    },
                },
                proyecto: { // Incluye información del proyecto si la propiedad está asociada a uno
                    select: {
                        id: true,
                        nombre: true,
                        slug: true,
                        estado: true,
                    },
                },
                // Aquí podrías añadir un include para imágenes si tienes una relación directa de imágenes con propiedades
                // Por ejemplo, si tu modelo Propiedad tiene un campo 'imagenUrls: string[]' en Prisma, 
                // no necesitas un 'include' aquí a menos que tengas un modelo de 'Imagen' separado.
            },
            orderBy: {
                createdAt: 'desc', // Ordenar por fecha de creación, más reciente primero
            },
        });

        res.status(200).json({ mensaje: 'Propiedades obtenidas exitosamente para el vendedor.', propiedades });

    } catch (error: any) {
        console.error('Error al obtener propiedades del vendedor:', error);
        res.status(500).json({ error: 'Error interno del servidor al obtener las propiedades.' });
    } finally {
        await prisma.$disconnect();
    }
};
