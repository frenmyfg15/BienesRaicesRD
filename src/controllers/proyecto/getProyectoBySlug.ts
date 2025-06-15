// src/controllers/proyecto/getProyectoBySlug.ts
import { RequestHandler, Request } from 'express';
import { PrismaClient } from '@prisma/client';
// No necesitamos JwtPayload aquí porque esta ruta debería ser pública

const prisma = new PrismaClient();

// Extiende la interfaz Request de Express para tipar los parámetros de la URL
interface GetProyectoBySlugRequest extends Request {
    params: {
        slug: string; // El slug del proyecto viene en los parámetros de la URL
    };
}

export const getProyectoBySlug: RequestHandler<{ slug: string }> = async (req: GetProyectoBySlugRequest, res) => {
    try {
        const { slug } = req.params; // Obtiene el slug de la URL

        if (!slug) {
            res.status(400).json({ mensaje: 'Slug de proyecto no proporcionado.' });
            return
        }

        // Busca el proyecto por slug en la base de datos
        const proyecto = await prisma.proyecto.findUnique({
            where: { slug: slug },
            include: {
                usuarioVendedor: {
                    select: { // Selecciona solo los campos necesarios del vendedor
                        id: true,
                        nombre: true,
                        email: true,
                    }
                },
                propiedades: { // Opcional: Incluir propiedades asociadas al proyecto
                    select: {
                        id: true,
                        nombre: true,
                        slug: true,
                        precio: true,
                        ubicacion: true,
                        imagenes: { // Incluir imágenes de las propiedades asociadas
                            select: { id: true, url: true }
                        }
                    }
                },
            },
        });

        if (!proyecto) {
            // Si no se encuentra el proyecto, devuelve un 404
            res.status(404).json({ mensaje: 'Proyecto no encontrado.' });
            return
        }

        // Devuelve el proyecto encontrado
        res.status(200).json({ mensaje: 'Proyecto encontrado.', proyecto });

    } catch (error) {
        console.error('Error al obtener proyecto por slug:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor al obtener el proyecto.' });
    } finally {
        await prisma.$disconnect(); // Desconecta Prisma después de la operación
    }
};
