import { RequestHandler } from 'express';
import { PrismaClient, RolUsuario } from '@prisma/client'; // Asegúrate de importar RolUsuario
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export const createUsuario: RequestHandler = async (req, res) => {
  try {
    const {
      nombre,
      email,
      password,
      rol,      // Ahora podemos recibir el rol desde el body
      telefono, // Ahora podemos recibir el teléfono
      whatsapp, // Ahora podemos recibir el WhatsApp
    } = req.body;

    // 1. Validaciones básicas para campos obligatorios (nombre, email, password)
    // Para esta ruta de registro manual, la contraseña sigue siendo obligatoria.
    if (!nombre || !email || !password) {
      res.status(400).json({ error: 'Nombre, correo electrónico y contraseña son obligatorios.' });
      return
    }

    // 2. Determinar el rol del usuario
    // Asignamos 'COMPRADOR' por defecto si el rol no se especifica o es inválido.
    let userRole: RolUsuario = RolUsuario.COMPRADOR;
    if (rol) {
      const upperCaseRol = (rol as string).toUpperCase(); // <--- ¡MEJORA! Normalizar a mayúsculas
      // Validar si el rol proporcionado es uno de los valores válidos del enum
      if (!Object.values(RolUsuario).includes(upperCaseRol as RolUsuario)) {
        res.status(400).json({ error: `Rol inválido: ${rol}. Los roles permitidos son ${Object.values(RolUsuario).join(', ')}.` });
        return
      }
      userRole = upperCaseRol as RolUsuario;
    }

    // 3. Validaciones condicionales para campos de VENDEDOR
    if (userRole === RolUsuario.VENDEDOR) {
      if (!telefono || !whatsapp) {
        res.status(400).json({ error: 'Teléfono y WhatsApp son obligatorios para usuarios con rol VENDEDOR.' });
        return
      }
    }

    // 4. Verificar si el correo electrónico ya está registrado
    const existe = await prisma.usuario.findUnique({ where: { email } });
    if (existe) {
      res.status(400).json({ error: 'El correo electrónico ya está registrado.' });
      return
    }

    // 5. Hashear la contraseña
    const hash = await bcrypt.hash(password, 10);

    // 6. Crear el nuevo usuario en la base de datos
    const nuevo = await prisma.usuario.create({
      data: {
        nombre,
        email,
        password: hash,
        rol: userRole,
        // Incluir teléfono y WhatsApp solo si están presentes y el rol es VENDEDOR
        // Si no se proporcionan o el rol no es VENDEDOR, estos campos serán null (como definimos en el schema.prisma)
        ...(telefono && userRole === RolUsuario.VENDEDOR && { telefono }),
        ...(whatsapp && userRole === RolUsuario.VENDEDOR && { whatsapp }),
      },
    });

    // 7. Enviar respuesta de éxito
    res.status(201).json({
      mensaje: 'Usuario creado correctamente',
      usuario: {
        id: nuevo.id,
        nombre: nuevo.nombre,
        email: nuevo.email,
        rol: nuevo.rol,
        telefono: nuevo.telefono, // Incluir en la respuesta (será null si no se proporcionó)
        whatsapp: nuevo.whatsapp, // Incluir en la respuesta (será null si no se proporcionó)
      },
    });
  } catch (error) {
    // 8. Manejo de errores
    console.error('Error al crear usuario:', error); // Para depuración
    res.status(500).json({ error: 'Error al crear usuario. Por favor, intenta de nuevo.' });
  } finally {
    // Es una buena práctica desconectar el cliente de Prisma en entornos de función serverless o rutas específicas.
    // En una aplicación Express tradicional, a menudo se gestiona la conexión a nivel global.
    // Si estás usando Prisma en un entorno Next.js API Routes, esta desconexión podría ser útil.
    await prisma.$disconnect();
  }
};
