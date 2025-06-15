import { RequestHandler } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key'; // ¡CAMBIA ESTO EN PRODUCCIÓN!

export const loginUsuario: RequestHandler = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Validar campos obligatorios
        if (!email || !password) {
            res.status(400).json({ error: 'Email y contraseña son requeridos.' });
            return
        }

        // 2. Buscar al usuario por email
        const usuario = await prisma.usuario.findUnique({ where: { email } });

        // Si el usuario no existe, o si existe pero no tiene contraseña (es decir, se registró con Google o similar)
        if (!usuario || !usuario.password) {
            // Registrar el intento de login con credenciales inválidas o método incorrecto
            console.warn(`Intento de login fallido para el email: ${email}. Razón: Usuario no encontrado o sin contraseña.`);
            res.status(401).json({ error: 'Credenciales inválidas o método de autenticación incorrecto.' });
            return
        }

        // 3. Comparar la contraseña proporcionada con la hasheada en la base de datos
        const valido = await bcrypt.compare(password, usuario.password);
        if (!valido) {
            // Registrar el intento de login con contraseña incorrecta
            console.warn(`Intento de login fallido para el email: ${email}. Razón: Contraseña incorrecta.`);
            res.status(401).json({ error: 'Credenciales inválidas.' });
            return
        }

        // 4. Generar el token JWT
        const token = jwt.sign({ id: usuario.id, rol: usuario.rol }, JWT_SECRET, {
            expiresIn: '7d', // El token expira en 7 días
        });

        // 5. Enviar el token en una cookie HttpOnly segura y la respuesta JSON
        res
            .cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000,
            })
            .status(200)
            .json({
                mensaje: 'Login exitoso',
                usuario: {
                    id: usuario.id,
                    nombre: usuario.nombre,
                    email: usuario.email,
                    rol: usuario.rol,
                },
            });
    } catch (error: any) { // Asegúrate de que 'error' sea de tipo 'any' o 'Error'
        // 6. Manejo de errores - ¡MEJORA AQUÍ!
        console.error('Error al iniciar sesión:', error); // Esto registrará el objeto de error completo en el servidor
        // Intenta enviar un mensaje de error más específico al frontend si está disponible
        const errorMessage = error.message || 'Error interno del servidor al iniciar sesión. Por favor, intenta de nuevo.';
        res.status(500).json({ error: errorMessage });
    } finally {
        await prisma.$disconnect();
    }
};

