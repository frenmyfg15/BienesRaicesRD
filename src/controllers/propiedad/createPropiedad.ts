// server/src/controllers/propiedad/createPropiedad.ts
import { RequestHandler, Request } from 'express';
import { PrismaClient } from '@prisma/client';
import { JwtPayload } from 'jsonwebtoken';

const prisma = new PrismaClient();

// Mantener la interfaz para el cuerpo de la petición para claridad de los datos de entrada
interface PropiedadBody {
  nombre: string;
  slug: string;
  tipo: string;
  precio: string; // Recibimos como string desde el frontend
  habitaciones?: string | null;
  baños?: string | null;
  parqueos?: string | null;
  metros2?: string | null;
  estado: string;
  descripcion: string;
  ubicacion: string;
  nivel?: string | null;
  ascensor?: boolean | string | null; // Puede venir como boolean o string ("true"/"false")
  amueblado?: boolean | string | null;
  mantenimiento?: string | null;
  anoConstruccion?: string | null;
  gastosLegalesIncluidos?: boolean | string | null;
  disponibleDesde?: string | null; // ISO string
  videoUrl?: string | null;
  tipoPropiedad?: string | null;
  proyectoId?: string | null; // Recibimos como string desde el frontend
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

// --- Funciones de Utilidad para Parseo y Validación ---

// Parsea números (Int o Float) o devuelve null si no es válido/está vacío
const parseNumber = (val: any, isFloat: boolean = false): number | null => {
  if (val === null || val === undefined || val === '') {
    return null;
  }
  const num = isFloat ? parseFloat(val) : parseInt(val, 10);
  return isNaN(num) ? null : num;
};

// Parsea booleanos a partir de strings o booleanos directos
const parseBoolean = (val: any): boolean | null => {
  if (val === null || val === undefined || val === '') {
    return null;
  }
  if (typeof val === 'boolean') {
    return val;
  }
  if (typeof val === 'string') {
    const lowerVal = val.toLowerCase();
    if (lowerVal === 'true' || lowerVal === '1') {
      return true;
    }
    if (lowerVal === 'false' || lowerVal === '0') {
      return false;
    }
  }
  return null; // Si no puede parsearlo a un booleano válido
};

// --- Controlador createPropiedad ---
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

    // 1. Parseo y validación de campos numéricos
    const parsedPrecio = parseNumber(precio, true);
    const parsedHabitaciones = parseNumber(habitaciones);
    const parsedBanios = parseNumber(baños);
    const parsedParqueos = parseNumber(parqueos);
    const parsedMetros2 = parseNumber(metros2, true);
    const parsedNivel = parseNumber(nivel);
    const parsedMantenimiento = parseNumber(mantenimiento, true);
    const parsedAnoConstruccion = parseNumber(anoConstruccion);

    // 2. Parseo y validación de campos booleanos
    const parsedAscensor = parseBoolean(ascensor);
    const parsedAmueblado = parseBoolean(amueblado);
    const parsedGastosLegalesIncluidos = parseBoolean(gastosLegalesIncluidos);

    // 3. Parseo y validación de fecha
    let parsedDisponibleDesde: Date | null = null;
    if (disponibleDesde) {
      const date = new Date(disponibleDesde);
      if (!isNaN(date.getTime())) {
        parsedDisponibleDesde = date;
      } else {
        res.status(400).json({ error: 'Fecha de disponibilidad inválida.' });
        return 
      }
    }

    // 4. Validación de campos obligatorios y formato
    if (!nombre || typeof nombre !== 'string' || nombre.trim().length === 0) {
      res.status(400).json({ error: 'El nombre es obligatorio.' });
      return 
    }
    if (!slug || typeof slug !== 'string' || slug.trim().length === 0) {
      res.status(400).json({ error: 'El slug es obligatorio.' });
      return 
    }
    if (!tipo || typeof tipo !== 'string' || tipo.trim().length === 0) {
      res.status(400).json({ error: 'El tipo es obligatorio.' });
      return 
    }
    if (parsedPrecio === null || parsedPrecio <= 0) { // Precio debe ser un número positivo
      res.status(400).json({ error: 'El precio es obligatorio y debe ser un número positivo.' });
      return 
    }
    if (!estado || typeof estado !== 'string' || estado.trim().length === 0) {
      res.status(400).json({ error: 'El estado es obligatorio.' });
      return 
    }
    if (!descripcion || typeof descripcion !== 'string' || descripcion.trim().length === 0) {
      res.status(400).json({ error: 'La descripción es obligatoria.' });
      return 
    }
    if (!ubicacion || typeof ubicacion !== 'string' || ubicacion.trim().length === 0) {
      res.status(400).json({ error: 'La ubicación es obligatoria.' });
      return 
    }
    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      res.status(400).json({ error: 'Se requiere al menos una imagen (imageUrls).' });
      return 
    }
    if (imageUrls.some(url => typeof url !== 'string' || url.trim().length === 0)) {
      res.status(400).json({ error: 'Las URLs de las imágenes no pueden estar vacías.' });
      return 
    }

    // 5. Validar unicidad del slug
    const existingPropiedad = await prisma.propiedad.findUnique({ where: { slug } });
    if (existingPropiedad) {
      res.status(409).json({ error: 'Ya existe una propiedad con este slug.' });
      return 
    }

    // Construir el objeto 'data' con los valores parseados/validados
    const data: any = { // Se mantiene 'any' si aún no tienes un tipo de salida final, idealmente sería PropiedadCreateInput
      nombre: nombre.trim(),
      slug: slug.trim(),
      tipo: tipo.trim(),
      precio: parsedPrecio,
      habitaciones: parsedHabitaciones,
      baños: parsedBanios,
      parqueos: parsedParqueos,
      metros2: parsedMetros2,
      estado: estado.trim(),
      descripcion: descripcion.trim(),
      ubicacion: ubicacion.trim(),
      nivel: parsedNivel,
      ascensor: parsedAscensor,
      amueblado: parsedAmueblado,
      mantenimiento: parsedMantenimiento,
      anoConstruccion: parsedAnoConstruccion,
      gastosLegalesIncluidos: parsedGastosLegalesIncluidos,
      disponibleDesde: parsedDisponibleDesde,
      videoUrl: videoUrl ? videoUrl.trim() : null,
      tipoPropiedad: tipoPropiedad ? tipoPropiedad.trim() : null,
      usuarioVendedor: { connect: { id: usuarioVendedorId } },
      imagenes: {
        createMany: {
          data: imageUrls.map((url) => ({ url: url.trim() })),
          skipDuplicates: true,
        },
      },
    };

    // 6. Manejo y validación de proyectoId (si está presente)
    if (proyectoId !== undefined && proyectoId !== null && proyectoId !== '') {
      const parsedProyectoId = parseNumber(proyectoId);

      if (parsedProyectoId === null || isNaN(parsedProyectoId)) {
        res.status(400).json({ error: 'ID de proyecto inválido. Debe ser un número.' });
        return 
      }

      const proyecto = await prisma.proyecto.findUnique({ where: { id: parsedProyectoId } });
      if (!proyecto) {
        res.status(400).json({ error: 'El proyecto no existe.' });
        return 
      }
      if (proyecto.usuarioVendedorId !== usuarioVendedorId) {
        res.status(403).json({ error: 'No puedes asociar propiedades a este proyecto.' });
        return 
      }
      data.proyecto = { connect: { id: parsedProyectoId } };
    }

    // 7. Creación de la propiedad en Prisma
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

  } catch (error: unknown) {
    console.error('Error al crear propiedad:', error);
    // Usar 'as any' para acceder a 'code' si sabemos que es un error de Prisma
    if ((error as any).code === 'P2002') {
      res.status(409).json({ error: 'Error de unicidad: El slug ya existe o hay un conflicto.' });
      return 
    } else if ((error as any).code === 'P2025') {
      res.status(400).json({ error: 'Error de relación: No se pudo asociar datos (ej. proyectoId o usuarioVendedorId no existen).' });
      return 
    } else if ((error as any).message && typeof (error as any).message === 'string') {
        // Capturar mensajes de error de validación personalizados si los hubiere
        res.status(400).json({ error: (error as any).message });
        return 
    }
    res.status(500).json({ error: 'Error interno del servidor al crear la propiedad.' });
    return 
  } finally {
    // Asegurarse de desconectar Prisma, pero solo si no estás en un entorno sin estado (ej. serverless)
    // En entornos serverless, el cliente de Prisma se reutiliza.
    // await prisma.$disconnect(); 
  }
};
