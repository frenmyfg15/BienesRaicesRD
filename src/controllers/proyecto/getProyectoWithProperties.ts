// src/controllers/proyecto/getProyectoWithProperties.ts
import { RequestHandler, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { JwtPayload } from 'jsonwebtoken';

const prisma = new PrismaClient();

// Extiende JwtPayload con los campos de tu usuario
interface JwtPayloadExtended extends JwtPayload {
    id: number;
    email?: string; // Opcional, según tu configuración de token
    rol: string;
    nombre?: string;
}

// Extiende la interfaz Request de Express para incluir 'user' y tipar 'params'
interface AuthRequest extends Request {
    user?: JwtPayloadExtended;
    params: { id: string }; // El ID del proyecto vendrá en los parámetros de la URL
}

// Tipado explícito para RequestHandler
export const getProyectoWithProperties: RequestHandler<{ id: string }> = async (req: AuthRequest, res) => {
    try {
        const { id } = req.params; // ID del proyecto a obtener
        const vendedorId = req.user?.id; // ID del vendedor autenticado desde el token

        if (!vendedorId) {
            res.status(401).json({ error: 'No autorizado: ID de vendedor no encontrado en el token.' });
            return
        }

        const proyectoId = parseInt(id, 10);
        if (isNaN(proyectoId)) {
            res.status(400).json({ error: 'ID de proyecto inválido.' });
            return
        }

        // Buscar el proyecto por ID, incluyendo todas sus propiedades asociadas
        const proyecto = await prisma.proyecto.findUnique({
            where: { id: proyectoId },
            include: {
                propiedades: true, // Incluye todas las propiedades relacionadas con este proyecto
                usuarioVendedor: { // Opcional: También podrías incluir los datos del vendedor
                    select: {
                        id: true,
                        nombre: true,
                        email: true,
                    },
                },
            },
        });

        if (!proyecto) {
            res.status(404).json({ error: 'Proyecto no encontrado.' });
            return
        }

        // Verificar que el vendedor autenticado es el propietario del proyecto
        if (proyecto.usuarioVendedorId !== vendedorId) {
            res.status(403).json({ error: 'No tienes permiso para ver este proyecto o sus propiedades.' });
            return
        }

        res.status(200).json({ mensaje: 'Proyecto y propiedades obtenidos exitosamente.', proyecto });

    } catch (error: any) {
        console.error('Error al obtener proyecto con propiedades:', error);
        res.status(500).json({ error: 'Error interno del servidor al obtener el proyecto y sus propiedades.' });
    } finally {
        await prisma.$disconnect();
    }
};
