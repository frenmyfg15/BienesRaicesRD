// src/controllers/propiedad/getPropiedadById.ts
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
    params: { id: string }; // El ID de la propiedad vendrá en los parámetros de la URL
}

export const getPropiedadById: RequestHandler<{ id: string }> = async (req: AuthRequest, res) => {
    try {
        const { id } = req.params; // ID de la propiedad a obtener

        const propiedadId = parseInt(id, 10);
        if (isNaN(propiedadId)) {
            res.status(400).json({ error: 'ID de propiedad inválido.' });
            return
        }

        // Buscar la propiedad por ID
        const propiedad = await prisma.propiedad.findUnique({
            where: { id: propiedadId },
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
                proyecto: {
                    select: {
                        id: true,
                        nombre: true,
                        slug: true,
                    },
                },
                // Aquí podrías incluir también las imágenes si tienes un modelo de imágenes relacionado
                // imagenes: true, // Si tienes un modelo de Imagen que se relaciona con Propiedad
            },
        });

        if (!propiedad) {
            res.status(404).json({ error: 'Propiedad no encontrada.' });
            return
        }

        res.status(200).json({ mensaje: 'Propiedad obtenida exitosamente.', propiedad });

    } catch (error: any) {
        console.error('Error al obtener propiedad por ID:', error);
        res.status(500).json({ error: 'Error interno del servidor al obtener la propiedad.' });
    } finally {
        await prisma.$disconnect();
    }
};
