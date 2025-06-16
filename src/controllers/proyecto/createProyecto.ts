// src/controllers/proyecto/createProyecto.ts
import { RequestHandler, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { JwtPayload } from 'jsonwebtoken';

const prisma = new PrismaClient();

// 1. Interfaz para los datos del cuerpo de la solicitud para crear un Proyecto
interface CreateProjectBody {
    nombre: string;
    slug: string;
    descripcion: string;
    ubicacion: string;
    estado: string;
    imagenDestacada: string;
    videoUrl?: string;
    imagenes?: string[]; // ✅ múltiples imágenes adicionales del proyecto
}

// 2. Extiende JwtPayload con los campos de tu usuario
interface JwtPayloadExtended extends JwtPayload {
    id: number;
    email?: string;
    rol: string;
    nombre?: string;
}

// 3. Extiende la interfaz Request de Express para incluir 'user' y tipar 'body'
interface AuthRequest extends Request {
    user?: JwtPayloadExtended;
    body: CreateProjectBody;
}

export const createProyecto: RequestHandler = async (req: AuthRequest, res) => {
    try {
        const {
            nombre,
            slug,
            descripcion,
            ubicacion,
            estado,
            imagenDestacada,
            videoUrl,
            imagenes,
        } = req.body;

        const vendedorId = req.user?.id;

        if (!vendedorId) {
            res.status(401).json({ error: 'No autorizado: ID de vendedor no encontrado en el token.' });
            return
        }

        if (!nombre || !slug || !descripcion || !ubicacion || !estado || !imagenDestacada) {
            res.status(400).json({ error: 'Faltan campos obligatorios para el proyecto.' });
            return
        }

        // Crear el Proyecto con relación al vendedor
        const nuevoProyecto = await prisma.proyecto.create({
            data: {
                nombre,
                slug,
                descripcion,
                ubicacion,
                estado,
                imagenDestacada,
                videoUrl,
                usuarioVendedor: { connect: { id: vendedorId } },
                imagenes: imagenes && imagenes.length > 0
                    ? {
                        create: imagenes.map((url) => ({ url })),
                    }
                    : undefined,
            },
            include: {
                imagenes: true,
            },
        });

        res.status(201).json({
            mensaje: 'Proyecto creado exitosamente.',
            proyecto: nuevoProyecto,
        });
        return
    } catch (error: any) {
        console.error('Error al crear proyecto:', error);
        if (error.code === 'P2002') {
            res.status(409).json({ error: 'El slug de proyecto ya existe. Usa uno único.' });
            return
        } else if (error.code === 'P2025') {
            res.status(400).json({ error: 'No se pudo crear el proyecto. Verifica el vendedor.' });
            return
        } else {
            res.status(500).json({ error: 'Error interno del servidor al crear el proyecto.' });
            return
        }
    } finally {
        await prisma.$disconnect();
    }
};
