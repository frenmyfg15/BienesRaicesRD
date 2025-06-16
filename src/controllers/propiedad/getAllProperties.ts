// src/controllers/propiedad/getAllProperties.ts
import { Request, RequestHandler, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAllProperties: RequestHandler = async (req: Request, res: Response) => {
  try {
    const propiedades = await prisma.propiedad.findMany({
      where: {
        proyectoId: null, // Solo propiedades independientes
      },
      include: {
        usuarioVendedor: {
          select: {
            id: true,
            nombre: true,
            email: true,
            telefono: true,
            whatsapp: true,
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
            url: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Si quieres también los nuevos campos explícitamente incluidos en la respuesta (aunque Prisma ya los da),
    // puedes mapearlos manualmente si planeas filtrar/transformar la salida, pero no es obligatorio.

    res.status(200).json({
      mensaje: 'Propiedades independientes obtenidas exitosamente.',
      propiedades,
    });
  } catch (error: any) {
    console.error('Error al obtener propiedades independientes:', error);
    res.status(500).json({
      error: 'Error interno del servidor al obtener propiedades independientes.',
    });
  } finally {
    await prisma.$disconnect();
  }
};
