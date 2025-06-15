// src/controllers/propiedad/getAllProperties.ts
import { Request, RequestHandler, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAllProperties: RequestHandler = async (req: Request, res: Response) => {
    try {
        // Busca solo las propiedades donde el campo proyectoId es null
        const propiedades = await prisma.propiedad.findMany({
            where: {
                proyectoId: null, // <--- Filtra para obtener solo propiedades independientes
            },
            include: {
                usuarioVendedor: { // Incluye información del vendedor
                    select: {
                        id: true,
                        nombre: true,
                        email: true,
                        telefono: true,
                        whatsapp: true,
                    },
                },
                // El proyecto se incluirá, pero para propiedades independientes será null,
                // lo cual es consistente con el filtro anterior.
                proyecto: {
                    select: {
                        id: true,
                        nombre: true,
                        slug: true,
                        estado: true,
                    },
                },
                // Si tienes un modelo de Imagen y las relacionas con Propiedad, puedes incluirlo aquí:
                imagenes: {
                    select: {
                        url: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc', // Ordena por la fecha de creación más reciente
            },
        });

        res.status(200).json({ mensaje: 'Propiedades independientes obtenidas exitosamente.', propiedades });
        return;
    } catch (error: any) {
        console.error('Error al obtener propiedades independientes:', error);
        res.status(500).json({ error: 'Error interno del servidor al obtener propiedades independientes.' });
        return;
    } finally {
        await prisma.$disconnect();
    }
};
