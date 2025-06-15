// server/src/controllers/propiedad/createPropiedad.ts
import { RequestHandler, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { JwtPayload } from 'jsonwebtoken';

const prisma = new PrismaClient();

// 1. Interfaz para los datos que se esperan en el cuerpo de la solicitud (req.body)
// ¡CAMBIO CLAVE! Ahora espera 'imageUrls' como un array de strings
interface PropiedadBody {
  nombre: string;
  slug: string;
  tipo: string;
  precio: number;
  habitaciones?: number | null;
  baños?: number | null;
  metros2?: number | null;
  estado: string;
  descripcion: string;
  ubicacion: string;
  proyectoId?: number | null;
  imageUrls: string[]; // ¡CAMBIO! Array de URLs de imágenes
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
  body: PropiedadBody;
}

export const createPropiedad: RequestHandler = async (req: AuthRequest, res) => {
  try {
    const {
      nombre,
      slug,
      tipo,
      precio,
      habitaciones,
      baños,
      metros2,
      estado,
      descripcion,
      ubicacion,
      proyectoId,
      imageUrls // ¡Nuevo campo del body! Array de URLs
    } = req.body;

    const usuarioVendedorId = req.user?.id;

    if (!usuarioVendedorId) {
      res.status(401).json({ error: 'No autorizado: ID de vendedor no encontrado en el token.' });
      return
    }

    // Validaciones básicas, incluyendo el array de URLs
    if (!nombre || !slug || !tipo || precio === undefined || !estado || !descripcion || !ubicacion || !imageUrls || imageUrls.length === 0) {
      res.status(400).json({ error: 'Faltan campos obligatorios para la propiedad, incluyendo al menos una URL de imagen.' });
      return
    }

    // Verificar si el slug ya existe
    const existingPropiedad = await prisma.propiedad.findUnique({
      where: { slug },
    });

    if (existingPropiedad) {
      res.status(409).json({ error: 'Ya existe una propiedad con este slug. Por favor, elige uno diferente.' });
      return
    }

    // Preparar los datos para la creación de la propiedad
    const data: any = {
      nombre,
      slug,
      tipo,
      precio,
      habitaciones: habitaciones !== undefined ? Number(habitaciones) : null,
      baños: baños !== undefined ? Number(baños) : null,
      metros2: metros2 !== undefined ? Number(metros2) : null,
      estado,
      descripcion,
      ubicacion,
      usuarioVendedor: { connect: { id: usuarioVendedorId } },
      imagenes: { // ¡CAMBIO! Crea múltiples entradas en el modelo Imagen
        createMany: {
          data: imageUrls.map(url => ({ url })), // Mapea cada URL a un objeto { url: '...' }
          skipDuplicates: true, // Opcional: para evitar errores si hay URLs duplicadas (aunque poco probable aquí)
        }
      }
    };

    // Si se proporciona un proyectoId, asociar la propiedad a ese proyecto
    if (proyectoId) {
      const existingProyecto = await prisma.proyecto.findUnique({
        where: { id: proyectoId },
      });

      if (!existingProyecto) {
        res.status(400).json({ error: 'El proyecto al que intentas asociar la propiedad no existe.' });
        return
      }
      if (existingProyecto.usuarioVendedorId !== usuarioVendedorId) {
        res.status(403).json({ error: 'No tienes permiso para asociar propiedades a este proyecto.' });
        return
      }
      data.proyecto = { connect: { id: proyectoId } };
    }

    // Crear la propiedad y sus imágenes asociadas en la base de datos
    const nuevaPropiedad = await prisma.propiedad.create({
      data,
      include: {
        imagenes: { select: { id: true, url: true } },
        usuarioVendedor: { select: { id: true, nombre: true, email: true, telefono: true, whatsapp: true } },
        proyecto: { select: { id: true, nombre: true, slug: true, estado: true } }
      }
    });

    res.status(201).json({ mensaje: 'Propiedad creada exitosamente.', propiedad: nuevaPropiedad });
    return

  } catch (error: any) {
    console.error('Error al crear propiedad:', error);
    if (error.code === 'P2002') {
      res.status(409).json({ error: 'Conflicto de datos: El slug de la propiedad ya existe o hay otro problema de unicidad.' });
      return
    } else if (error.code === 'P2025') {
      res.status(400).json({ error: 'No se pudo asociar la propiedad. ID de vendedor o proyecto no válido.' });
      return
    } else {
      res.status(500).json({ error: 'Error interno del servidor al crear la propiedad.' });
      return
    }
  } finally {
    await prisma.$disconnect();
  }
};
