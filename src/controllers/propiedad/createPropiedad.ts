// server/src/controllers/propiedad/createPropiedad.ts
import { RequestHandler, Request } from 'express';
import { PrismaClient } from '@prisma/client';
import { JwtPayload } from 'jsonwebtoken';

const prisma = new PrismaClient();

interface PropiedadBody {
  nombre: string;
  slug: string;
  tipo: string;
  precio: number;
  habitaciones?: number | null;
  baños?: number | null;
  parqueos?: number | null;
  metros2?: number | null;
  estado: string;
  descripcion: string;
  ubicacion: string;
  nivel?: number | null;
  ascensor?: boolean | null;
  amueblado?: boolean | null;
  mantenimiento?: number | null;
  anoConstruccion?: number | null;
  gastosLegalesIncluidos?: boolean | null;
  disponibleDesde?: string | null; // ISO string
  videoUrl?: string | null;
  tipoPropiedad?: string | null;
  proyectoId?: number | null;
  imageUrls: string[];
}

interface JwtPayloadExtended extends JwtPayload {
  id: number;
  email?: string;
  rol: string;
  nombre?: string;
}

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
      parqueos,
      metros2,
      estado,
      descripcion,
      ubicacion,
      nivel,
      ascensor,
      amueblado,
      mantenimiento,
      anoConstruccion,
      gastosLegalesIncluidos,
      disponibleDesde,
      videoUrl,
      tipoPropiedad,
      proyectoId,
      imageUrls,
    } = req.body;

    const usuarioVendedorId = req.user?.id;

    if (!usuarioVendedorId) {
      res.status(401).json({ error: 'No autorizado: ID de vendedor no encontrado en el token.' });
      return
    }

    if (!nombre || !slug || !tipo || precio === undefined || !estado || !descripcion || !ubicacion || !imageUrls?.length) {
      res.status(400).json({ error: 'Faltan campos obligatorios o imágenes.' });
      return
    }

    const existingPropiedad = await prisma.propiedad.findUnique({ where: { slug } });
    if (existingPropiedad) {
      res.status(409).json({ error: 'Ya existe una propiedad con este slug.' });
      return
    }

    const data: any = {
      nombre,
      slug,
      tipo,
      precio,
      habitaciones: habitaciones ?? null,
      baños: baños ?? null,
      parqueos: parqueos ?? null,
      metros2: metros2 ?? null,
      estado,
      descripcion,
      ubicacion,
      nivel: nivel ?? null,
      ascensor: ascensor ?? null,
      amueblado: amueblado ?? null,
      mantenimiento: mantenimiento ?? null,
      anoConstruccion: anoConstruccion ?? null,
      gastosLegalesIncluidos: gastosLegalesIncluidos ?? null,
      disponibleDesde: disponibleDesde ? new Date(disponibleDesde) : null,
      videoUrl: videoUrl ?? null,
      tipoPropiedad: tipoPropiedad ?? null,
      usuarioVendedor: { connect: { id: usuarioVendedorId } },
      imagenes: {
        createMany: {
          data: imageUrls.map((url) => ({ url })),
          skipDuplicates: true,
        },
      },
    };

    if (proyectoId) {
      const proyecto = await prisma.proyecto.findUnique({ where: { id: proyectoId } });
      if (!proyecto) {
        res.status(400).json({ error: 'El proyecto no existe.' });
        return
      }
      if (proyecto.usuarioVendedorId !== usuarioVendedorId) {
        res.status(403).json({ error: 'No puedes asociar propiedades a este proyecto.' });
        return
      }
      data.proyecto = { connect: { id: proyectoId } };
    }

    const nuevaPropiedad = await prisma.propiedad.create({
      data,
      include: {
        imagenes: { select: { id: true, url: true } },
        usuarioVendedor: { select: { id: true, nombre: true, email: true, telefono: true, whatsapp: true } },
        proyecto: { select: { id: true, nombre: true, slug: true, estado: true } },
      },
    });

    res.status(201).json({ mensaje: 'Propiedad creada exitosamente.', propiedad: nuevaPropiedad });
    return

  } catch (error: any) {
    console.error('Error al crear propiedad:', error);
    if (error.code === 'P2002') {
      res.status(409).json({ error: 'El slug ya existe u otro error de unicidad.' });
      return
    } else if (error.code === 'P2025') {
      res.status(400).json({ error: 'Error al asociar datos.' });
      return
    } else {
      res.status(500).json({ error: 'Error interno del servidor.' });
      return
    }
  } finally {
    await prisma.$disconnect();
  }
};
