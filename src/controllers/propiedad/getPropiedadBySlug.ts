// src/controllers/propiedad/getPropiedadBySlug.ts
import { RequestHandler, Request } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface GetPropiedadBySlugRequest extends Request {
  params: {
    slug: string;
  };
}

export const getPropiedadBySlug: RequestHandler<{ slug: string }> = async (req: GetPropiedadBySlugRequest, res) => {
  try {
    const { slug } = req.params;

    if (!slug) {
      res.status(400).json({ mensaje: 'Slug de propiedad no proporcionado.' });
      return
    }

    const propiedad = await prisma.propiedad.findUnique({
      where: { slug },
      include: {
        usuarioVendedor: {
          select: {
            id: true,
            nombre: true,
            email: true,
            telefono: true,
            whatsapp: true,
            imagenPerfilUrl: true,
          },
        },
        proyecto: {
          select: {
            id: true,
            nombre: true,
            slug: true,
            estado: true,
          },
        },
        imagenes: {
          select: {
            id: true,
            url: true,
          },
        },
      },
    });

    if (!propiedad) {
      res.status(404).json({ mensaje: 'Propiedad no encontrada.' });
      return
    }

    res.status(200).json({
      mensaje: 'Propiedad encontrada.',
      propiedad: {
        ...propiedad,
        // Los campos nuevos ya se incluyen automáticamente desde Prisma
        // Si quieres agregar lógica adicional o transformar algo, lo puedes hacer aquí
      },
    });
    return
  } catch (error) {
    console.error('Error al obtener propiedad por slug:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor al obtener la propiedad.' });
    return
  } finally {
    await prisma.$disconnect();
  }
};
