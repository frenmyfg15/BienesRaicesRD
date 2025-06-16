// src/controllers/propiedad/updatePropiedad.ts
import { RequestHandler, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { JwtPayload } from 'jsonwebtoken';

const prisma = new PrismaClient();

interface PropiedadUpdateBody {
    nombre?: string;
    slug?: string;
    tipo?: string;
    precio?: number;
    habitaciones?: number;
    baños?: number;
    metros2?: number;
    estado?: string;
    descripcion?: string;
    ubicacion?: string;
    proyectoId?: number | null;

    // Nuevos campos
    parqueos?: number;
    mantenimiento?: number;
    conAscensor?: boolean;
    amueblado?: boolean;
    aceptaMascotas?: boolean;
    nivel?: number;
}

interface JwtPayloadExtended extends JwtPayload {
    id: number;
    email?: string;
    rol: string;
    nombre?: string;
}

interface AuthRequest extends Request {
    user?: JwtPayloadExtended;
    body: PropiedadUpdateBody;
    params: { id: string };
}

export const updatePropiedad: RequestHandler<{ id: string }> = async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;
        const updatedData = req.body;
        const vendedorId = req.user?.id;

        if (!vendedorId) {
            res.status(401).json({ error: 'No autorizado: ID de vendedor no encontrado en el token.' });
            return
        }

        const propiedadId = parseInt(id, 10);
        if (isNaN(propiedadId)) {
            res.status(400).json({ error: 'ID de propiedad inválido.' });
            return
        }

        const propiedadExistente = await prisma.propiedad.findUnique({ where: { id: propiedadId } });
        if (!propiedadExistente) {
            res.status(404).json({ error: 'Propiedad no encontrada.' });
            return
        }

        if (propiedadExistente.usuarioVendedorId !== vendedorId) {
            res.status(403).json({ error: 'No tienes permiso para editar esta propiedad.' });
            return
        }

        if (updatedData.slug && updatedData.slug !== propiedadExistente.slug) {
            const existingSlug = await prisma.propiedad.findUnique({ where: { slug: updatedData.slug } });
            if (existingSlug) {
                res.status(409).json({ error: 'El nuevo slug ya existe para otra propiedad.' });
                return
            }
        }

        if (updatedData.proyectoId !== undefined && updatedData.proyectoId !== null) {
            const proyectoExistente = await prisma.proyecto.findUnique({ where: { id: updatedData.proyectoId } });
            if (!proyectoExistente) {
                res.status(400).json({ error: 'El proyecto al que intentas asociar la propiedad no existe.' });
                return
            }
            if (proyectoExistente.usuarioVendedorId !== vendedorId) {
                res.status(403).json({ error: 'No tienes permiso para asociar propiedades a este proyecto.' });
                return
            }
        }

        const dataToUpdate: any = {
            ...updatedData,
            precio: updatedData.precio !== undefined ? Number(updatedData.precio) : undefined,
            habitaciones: updatedData.habitaciones !== undefined ? Number(updatedData.habitaciones) : undefined,
            baños: updatedData.baños !== undefined ? Number(updatedData.baños) : undefined,
            metros2: updatedData.metros2 !== undefined ? Number(updatedData.metros2) : undefined,
            parqueos: updatedData.parqueos !== undefined ? Number(updatedData.parqueos) : undefined,
            mantenimiento: updatedData.mantenimiento !== undefined ? Number(updatedData.mantenimiento) : undefined,
            conAscensor: updatedData.conAscensor,
            amueblado: updatedData.amueblado,
            aceptaMascotas: updatedData.aceptaMascotas,
            nivel: updatedData.nivel !== undefined ? Number(updatedData.nivel) : undefined,
            proyecto: updatedData.proyectoId === null
                ? { disconnect: true }
                : updatedData.proyectoId !== undefined
                    ? { connect: { id: updatedData.proyectoId } }
                    : undefined,
        };

        delete dataToUpdate.proyectoId;

        const propiedadActualizada = await prisma.propiedad.update({
            where: { id: propiedadId },
            data: dataToUpdate,
        });

        res.status(200).json({ mensaje: 'Propiedad actualizada exitosamente.', propiedad: propiedadActualizada });

    } catch (error: any) {
        console.error('Error al actualizar propiedad:', error);
        if (error.code === 'P2002') {
            res.status(409).json({ error: 'Conflicto de datos: El slug de la propiedad ya existe o hay otro problema de unicidad.' });
        } else if (error.code === 'P2025') {
            res.status(404).json({ error: 'La propiedad o el recurso relacionado no fue encontrado.' });
        } else {
            res.status(500).json({ error: 'Error interno del servidor al actualizar la propiedad.' });
        }
    } finally {
        await prisma.$disconnect();
    }
};
