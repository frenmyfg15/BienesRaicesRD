// src/controllers/propiedad/getIndependentPropertiesByVendedor.ts
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

export const getIndependentPropertiesByVendedor: RequestHandler = async (req: AuthRequest, res) => {
    try {
        const vendedorId = req.user?.id; // Obtiene el ID del vendedor autenticado del token

        if (!vendedorId) {
            res.status(401).json({ error: 'No autorizado: ID de vendedor no encontrado en el token.' });
            return
        }

        // Busca todas las propiedades que pertenecen al vendedor autenticado
        // Y que explícitamente NO tienen un proyecto asignado (proyectoId es null)
        const propiedades = await prisma.propiedad.findMany({
            where: {
                usuarioVendedorId: vendedorId,
                proyectoId: null, // <--- ¡Condición clave para propiedades independientes!
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
                // No necesitamos incluir 'proyecto' aquí ya que buscamos propiedades sin proyecto
            },
            orderBy: {
                createdAt: 'desc', // Ordenar por fecha de creación, más reciente primero
            },
        });

        res.status(200).json({ mensaje: 'Propiedades independientes obtenidas exitosamente para el vendedor.', propiedades });

    } catch (error: any) {
        console.error('Error al obtener propiedades independientes del vendedor:', error);
        res.status(500).json({ error: 'Error interno del servidor al obtener las propiedades independientes.' });
    } finally {
        await prisma.$disconnect();
    }
};
