// src/controllers/proyecto/getProyectos.ts
import { Request, RequestHandler, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { JwtPayload } from 'jsonwebtoken'; // Necesario si usas req.user

const prisma = new PrismaClient();

// Extiende JwtPayload para TypeScript
interface JwtPayloadExtended extends JwtPayload {
  id: number;
  email?: string;
  rol: string;
  nombre?: string;
}

// Extiende la interfaz Request de Express para incluir 'user' y 'query'
interface AuthRequest extends Request {
  user?: JwtPayloadExtended;
  query: { vendedorId?: string }; // Permite el filtro opcional por vendedorId
}

export const getProyectos: RequestHandler = async (req: AuthRequest, res: Response) => {
  try {
    const vendedorIdFromQuery = req.query.vendedorId;
    

    
    const whereClause: any = {};

    if (vendedorIdFromQuery) {

      whereClause.usuarioVendedorId = parseInt(vendedorIdFromQuery as string, 10);
    } 


    const proyectos = await prisma.proyecto.findMany({
      where: whereClause,
      include: {
        usuarioVendedor: {
          select: {
            id: true,
            nombre: true,
            email: true,
          },
        },
        // Si un proyecto incluye propiedades, puedes añadirlas aquí:
        // propiedades: {
        //   select: {
        //     id: true,
        //     nombre: true,
        //     slug: true,
        //   }
        // }
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.status(200).json({ mensaje: 'Proyectos obtenidos exitosamente.', proyectos });
    return 
  } catch (error: any) {
    console.error('Error al obtener proyectos:', error);
    res.status(500).json({ error: 'Error interno del servidor al obtener los proyectos.' });
    return 
  } finally {
    await prisma.$disconnect();
  }
};
