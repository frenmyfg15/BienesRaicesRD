// server/src/controllers/usuario/favoritesController.ts
import { RequestHandler, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { JwtPayload } from 'jsonwebtoken';

const prisma = new PrismaClient();

// Extiende JwtPayload con los campos de tu usuario (debe coincidir con la definición de tu middleware de autenticación)
interface JwtPayloadExtended extends JwtPayload {
    id: number; // El ID del usuario en el token, que se mapea a Usuario.id
    email?: string;
    rol: string;
    nombre?: string;
}

// Interfaz para el cuerpo de la solicitud para alternar un favorito
interface ToggleFavoriteBody {
    itemId: number;
    itemType: 'propiedad' | 'proyecto'; // Indica si es una propiedad o un proyecto
}

// Extiende la interfaz Request de Express para incluir 'user' y tipar 'body'
interface AuthRequest extends Request {
    user?: JwtPayloadExtended;
    body: ToggleFavoriteBody;
}

/**
 * Controlador para añadir o eliminar una propiedad o proyecto de los favoritos de un usuario.
 * Requiere autenticación.
 */
export const toggleFavorite: RequestHandler = async (req: AuthRequest, res: Response) => {
    try {
        const { itemId, itemType } = req.body; // Obtiene el ID del elemento y su tipo del cuerpo de la solicitud
        const usuarioId = req.user?.id; // Obtiene el ID del usuario autenticado del token (se mapea a usuarioId en Favorito)

        // Validaciones iniciales
        if (!usuarioId) {
            res.status(401).json({ error: 'No autorizado: ID de usuario no encontrado en el token. Asegúrate de estar autenticado.' });
            return
        }

        if (!itemId || typeof itemId !== 'number' || itemId <= 0) {
            res.status(400).json({ error: 'ID de elemento inválido. Debe ser un número positivo.' });
            return
        }

        if (itemType !== 'propiedad' && itemType !== 'proyecto') {
            res.status(400).json({ error: 'Tipo de elemento inválido. Debe ser "propiedad" o "proyecto".' });
            return
        }

        let existingFavorite;
        let itemExists = false;

        // 1. Verificar si el elemento (propiedad o proyecto) existe en la base de datos
        //    y si el usuario ya lo tiene en favoritos.
        if (itemType === 'propiedad') {
            const property = await prisma.propiedad.findUnique({ where: { id: itemId } });
            if (!property) {
                res.status(404).json({ error: 'Propiedad no encontrada.' });
                return
            }
            itemExists = true;
            existingFavorite = await prisma.favorito.findFirst({
                where: { usuarioId, propiedadId: itemId }, // Usar usuarioId y propiedadId
            });
        } else { // itemType === 'proyecto'
            const project = await prisma.proyecto.findUnique({ where: { id: itemId } });
            if (!project) {
                res.status(404).json({ error: 'Proyecto no encontrado.' });
                return
            }
            itemExists = true;
            existingFavorite = await prisma.favorito.findFirst({
                where: { usuarioId, proyectoId: itemId }, // Usar usuarioId y proyectoId
            });
        }

        if (!itemExists) {
            res.status(404).json({ error: `El ${itemType} especificado no existe.` });
            return
        }

        // 2. Alternar el estado de favorito: si existe, se elimina; si no, se añade.
        if (existingFavorite) {
            // Si ya está en favoritos, eliminarlo
            await prisma.favorito.delete({
                where: { id: existingFavorite.id },
            });
            res.status(200).json({
                mensaje: `${itemType === 'propiedad' ? 'Propiedad' : 'Proyecto'} eliminado de favoritos.`,
                favorited: false
            });
            return
        } else {
            // Si no está en favoritos, añadirlo
            const newFavorite = await prisma.favorito.create({
                data: {
                    usuarioId, // Usar usuarioId
                    // Conecta el favorito a la propiedad O al proyecto, dependiendo del tipo
                    propiedadId: itemType === 'propiedad' ? itemId : null, // Usar propiedadId
                    proyectoId: itemType === 'proyecto' ? itemId : null,   // Usar proyectoId
                },
            });
            res.status(201).json({
                mensaje: `${itemType === 'propiedad' ? 'Propiedad' : 'Proyecto'} añadido a favoritos.`,
                favorited: true,
                favorite: newFavorite
            });
            return
        }

    } catch (error: any) {
        console.error('Error al alternar favorito:', error);
        if (error.code === 'P2002') { // Error de unicidad (aunque las claves únicas ya lo previenen)
            res.status(409).json({ error: `Ya tienes este en tus favoritos.` });
            return
        }
        res.status(500).json({ error: 'Error interno del servidor al procesar favoritos.' });
        return
    } finally {
        await prisma.$disconnect();
    }
};

/**
 * Controlador para obtener la lista de favoritos de un usuario.
 * Requiere autenticación.
 */
export const getFavorites: RequestHandler = async (req: AuthRequest, res: Response) => {
    try {
        const usuarioId = req.user?.id; // Obtener usuarioId

        if (!usuarioId) {
            res.status(401).json({ error: 'No autorizado: ID de usuario no encontrado en el token.' });
            return
        }

        // Busca todos los favoritos del usuario, incluyendo las propiedades y proyectos asociados
        const favorites = await prisma.favorito.findMany({ // Usar prisma.favorito
            where: { usuarioId }, // Usar usuarioId
            include: {
                propiedad: { // Relación 'propiedad'
                    select: { // Selecciona solo los campos que necesitas de la propiedad
                        id: true,
                        nombre: true,
                        slug: true,
                        precio: true,
                        ubicacion: true,
                        imagenes: { select: { url: true } }, // Incluye las URLs de las imágenes de la propiedad
                        tipo: true,
                        estado: true,
                        habitaciones: true,
                        baños: true,
                        metros2: true,
                        descripcion: true,
                    }
                },
                proyecto: { // Relación 'proyecto'
                    select: { // Selecciona solo los campos que necesitas del proyecto
                        id: true,
                        nombre: true,
                        slug: true,
                        ubicacion: true,
                        estado: true,
                        imagenDestacada: true,
                        descripcion: true,
                    }
                },
            },
        });

        // Formatear la respuesta para el frontend
        const formattedFavorites = favorites.map(fav => ({
            id: fav.id,
            createdAt: fav.createdAt,
            type: fav.propiedadId ? 'propiedad' : 'proyecto', // Identifica el tipo
            item: fav.propiedad || fav.proyecto, // El objeto de la propiedad o el proyecto
        }));

        res.status(200).json({
            mensaje: 'Favoritos obtenidos exitosamente.',
            favoritos: formattedFavorites
        });
        return

    } catch (error: any) {
        console.error('Error al obtener favoritos:', error);
        res.status(500).json({ error: 'Error interno del servidor al obtener favoritos.' });
        return
    } finally {
        await prisma.$disconnect();
    }
};
