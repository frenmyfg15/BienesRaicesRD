// src/controllers/propiedad/getPropiedadBySlug.ts
import { RequestHandler, Request } from 'express';
import { PrismaClient } from '@prisma/client';
// No necesitamos JwtPayload aquí porque esta ruta debería ser pública

const prisma = new PrismaClient();

// Extiende la interfaz Request de Express para tipar los parámetros de la URL
interface GetPropiedadBySlugRequest extends Request {
  params: {
    slug: string; // El slug de la propiedad viene en los parámetros de la URL
  };
}

export const getPropiedadBySlug: RequestHandler<{ slug: string }> = async (req: GetPropiedadBySlugRequest, res) => {
  try {
    const { slug } = req.params; // Obtiene el slug de la URL

    if (!slug) {
        res.status(400).json({ mensaje: 'Slug de propiedad no proporcionado.' });
      return 
    }

    // Busca la propiedad por slug en la base de datos
    const propiedad = await prisma.propiedad.findUnique({
      where: { slug: slug },
      include: {
        usuarioVendedor: {
          select: { // Selecciona solo los campos necesarios del vendedor
            id: true,
            nombre: true,
            email: true,
            telefono: true,
            whatsapp: true,
          }
        },
        proyecto: {
          select: { // Selecciona solo los campos necesarios del proyecto
            id: true,
            nombre: true,
            slug: true,
            estado: true,
          }
        },
        imagenes: { // Incluye todas las imágenes relacionadas con la propiedad
          select: {
            id: true,
            url: true,
          }
        }
      },
    });

    if (!propiedad) {
      // Si no se encuentra la propiedad, devuelve un 404
      res.status(404).json({ mensaje: 'Propiedad no encontrada.' });
      return 
    }

    // Devuelve la propiedad encontrada
    res.status(200).json({ mensaje: 'Propiedad encontrada.', propiedad });

  } catch (error) {
    console.error('Error al obtener propiedad por slug:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor al obtener la propiedad.' });
  } finally {
    await prisma.$disconnect(); // Desconecta Prisma después de la operación
  }
};
