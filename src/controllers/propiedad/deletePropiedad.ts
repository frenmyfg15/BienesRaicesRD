// src/controllers/propiedad/deletePropiedad.ts
import { RequestHandler, Request, Response } from 'express'; // Asegúrate de importar 'Response'
import { PrismaClient } from '@prisma/client';
import { JwtPayload } from 'jsonwebtoken';

const prisma = new PrismaClient();

// Extiende JwtPayload con los campos de tu usuario (debe coincidir con la definición de tu middleware)
interface JwtPayloadExtended extends JwtPayload {
    id: number;
    email?: string;
    rol: string;
    nombre?: string;
}

// Extiende la interfaz Request de Express para incluir 'user' y tipar 'params'
interface AuthRequest extends Request {
    user?: JwtPayloadExtended;
    params: { id: string }; // El ID de la propiedad a eliminar
}

// Corrección: Tipar RequestHandler explícitamente con los parámetros esperados
export const deletePropiedad: RequestHandler<{ id: string }> = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params; // ID de la propiedad a eliminar
        const vendedorId = req.user?.id; // ID del vendedor autenticado

        if (!vendedorId) {
            res.status(401).json({ error: 'No autorizado: ID de vendedor no encontrado en el token.' });
            return
        }

        // Convertir el ID de la propiedad a número
        const propiedadId = parseInt(id, 10);
        if (isNaN(propiedadId)) {
            res.status(400).json({ error: 'ID de propiedad inválido.' });
            return
        }

        // 1. Encontrar la propiedad para verificar la propiedad del vendedor
        const propiedadExistente = await prisma.propiedad.findUnique({
            where: { id: propiedadId },
        });

        if (!propiedadExistente) {
            res.status(404).json({ error: 'Propiedad no encontrada.' });
            return
        }

        // 2. Verificar que el vendedor autenticado es el propietario de la propiedad
        if (propiedadExistente.usuarioVendedorId !== vendedorId) {
            res.status(403).json({ error: 'No tienes permiso para eliminar esta propiedad.' });
            return
        }

        // 3. Eliminar la propiedad de la base de datos
        await prisma.propiedad.delete({
            where: { id: propiedadId },
        });

        res.status(200).json({ mensaje: 'Propiedad eliminada exitosamente.' });

    } catch (error: any) {
        console.error('Error al eliminar propiedad:', error);
        if (error.code === 'P2025') { // Prisma error for record not found (ej. ya fue eliminada)
            res.status(404).json({ error: 'La propiedad ya no existe o no pudo ser encontrada.' });
        } else {
            res.status(500).json({ error: 'Error interno del servidor al eliminar la propiedad.' });
        }
    } finally {
        await prisma.$disconnect();
    }
};
