// src/controllers/proyecto/createProyecto.ts
import { RequestHandler, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { JwtPayload } from 'jsonwebtoken';

const prisma = new PrismaClient();

// 1. Interfaz para los datos del cuerpo de la solicitud para crear solo Proyecto
interface CreateProjectBody {
    nombre: string;
    slug: string;
    descripcion: string;
    ubicacion: string;
    estado: string;
    imagenDestacada: string;
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
    body: CreateProjectBody; // ¡Ahora tipamos el cuerpo solo con datos de proyecto!
}

export const createProyecto: RequestHandler = async (req: AuthRequest, res) => {
    console.log('dentro')
    try {
        const {
            nombre,
            slug,
            descripcion,
            ubicacion,
            estado,
            imagenDestacada,
        } = req.body;

        const vendedorId = req.user?.id; // ID del vendedor autenticado desde el token

        if (!vendedorId) {
            res.status(401).json({ error: 'No autorizado: ID de vendedor no encontrado en el token.' });
            return
        }

        // Validaciones básicas para el proyecto
        if (!nombre || !slug || !descripcion || !ubicacion || !estado || !imagenDestacada) {
            res.status(400).json({ error: 'Faltan campos obligatorios para el proyecto.' });
            return
        }

        // Crear el Proyecto
        const nuevoProyecto = await prisma.proyecto.create({
            data: {
                nombre,
                slug,
                descripcion,
                ubicacion,
                estado,
                imagenDestacada,
                usuarioVendedor: { connect: { id: vendedorId } },
            },
        });

        res.status(201).json({
            mensaje: 'Proyecto creado exitosamente.',
            proyecto: nuevoProyecto,
        });

    } catch (error: any) {
        console.error('Error al crear proyecto:', error);
        if (error.code === 'P2002') { // Error de unicidad (ej. slug de proyecto)
            res.status(409).json({ error: 'Conflicto de datos: El slug de proyecto ya existe. Por favor, usa un slug único.' });
            return
        } else if (error.code === 'P2025') { // Recurso no encontrado (ej. vendedorId)
            res.status(400).json({ error: 'No se pudo crear el proyecto. Asegúrate de que el vendedor existe.' });
            return
        } else {
            res.status(500).json({ error: 'Error interno del servidor al crear el proyecto.' });
            return
        }
    } finally {
        await prisma.$disconnect();
    }
};
