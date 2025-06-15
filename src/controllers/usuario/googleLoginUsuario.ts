// src/controllers/usuario/googleLoginUsuario.ts
import { RequestHandler } from 'express';
import { PrismaClient, RolUsuario } from '@prisma/client';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_for_backend'; // ¡CAMBIA ESTO EN PRODUCCIÓN!
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID; // Debe ser el mismo que usas en el frontend

if (!GOOGLE_CLIENT_ID) {
    throw new Error('GOOGLE_CLIENT_ID no está definido en las variables de entorno del backend.');
}
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

export const googleLoginUsuario: RequestHandler = async (req, res) => {
    try {
        const { idToken } = req.body;

        console.log('[GoogleLogin] Recibiendo solicitud para ID Token.');

        if (!idToken) {
            console.log('[GoogleLogin] ERROR: Token de ID no proporcionado.');
            res.status(400).json({ error: 'Token de ID de Google no proporcionado.' });
            return
        }

        // 1. Verificar el token de ID con Google
        let payload;
        try {
            const ticket = await client.verifyIdToken({
                idToken: idToken,
                audience: GOOGLE_CLIENT_ID,
            });
            payload = ticket.getPayload();
            console.log('[GoogleLogin] Token de Google verificado con éxito. Payload:', payload);
        } catch (error: any) {
            console.error('[GoogleLogin] ERROR al verificar el token de Google:', error);
            res.status(401).json({ error: 'Token de Google inválido o expirado. Vuelve a intentar.' });
            return
        }

        if (!payload || !payload.email || !payload.sub) {
            console.log('[GoogleLogin] ERROR: Payload de Google incompleto. Faltan email o sub.');
            res.status(401).json({ error: 'No se pudo verificar el token de Google o faltan datos esenciales.' });
            return
        }

        const googleId = payload.sub;
        const email = payload.email;
        const name = payload.name || payload.given_name || email.split('@')[0];
        const picture = payload.picture || null;

        console.log(`[GoogleLogin] Datos extraídos: email=${email}, googleId=${googleId}, name=${name}`);

        // 2. Buscar o crear el usuario en tu base de datos (con Prisma)
        let usuario = null;

        // Intento 1: Buscar por googleId
        usuario = await prisma.usuario.findUnique({
            where: { googleId: googleId },
        });

        if (usuario) {
            console.log(`[GoogleLogin] Usuario encontrado por googleId: ${usuario.id}.`);
        } else {
            console.log('[GoogleLogin] No se encontró usuario por googleId. Intentando buscar por email...');
            // Intento 2: Si no se encontró por googleId, buscar por email para vincular
            usuario = await prisma.usuario.findUnique({
                where: { email: email },
            });

            if (usuario) {
                console.log(`[GoogleLogin] Usuario encontrado por email: ${usuario.id}. Verificando si necesita vincularse...`);
                // Si el usuario existe por email pero no tiene googleId, actualízalo para vincular
                if (!usuario.googleId) {
                    console.log(`[GoogleLogin] Usuario ${usuario.id} existe por email, vinculando con googleId y imagen...`);
                    usuario = await prisma.usuario.update({
                        where: { id: usuario.id },
                        data: { googleId: googleId, imagenPerfilUrl: picture },
                    });
                    console.log(`[GoogleLogin] Usuario ${usuario.id} actualizado y vinculado con Google.`);
                } else if (usuario.googleId !== googleId) {
                    // Esto es un escenario raro: email duplicado, pero diferentes googleId (no debería pasar con @unique)
                    // O un usuario se registró manualmente, luego con Google, y luego otro Google con el mismo email si no fuera @unique
                    // Si el email ya está vinculado a un *diferente* googleId, esto podría indicar un problema.
                    console.warn(`[GoogleLogin] ADVERTENCIA: Email '${email}' ya vinculado a un googleId diferente. Esto no debería ocurrir si 'googleId' es @unique.`);
                    res.status(409).json({ error: 'Este correo electrónico ya está asociado a otra cuenta de Google.' });
                    return
                } else {
                    // Usuario encontrado por email, y ya tiene el googleId correcto.
                    console.log(`[GoogleLogin] Usuario ${usuario.id} encontrado por email y ya vinculado.`);
                }
            } else {
                // Si el usuario no existe en absoluto (ni por googleId ni por email), créalo.
                console.log('[GoogleLogin] Usuario no encontrado. Creando nuevo usuario...');
                usuario = await prisma.usuario.create({
                    data: {
                        nombre: name,
                        email: email,
                        googleId: googleId,
                        imagenPerfilUrl: picture,
                        rol: RolUsuario.COMPRADOR, // Asigna un rol por defecto.
                    },
                });
                console.log(`[GoogleLogin] Nuevo usuario creado: ${usuario.id}.`);
            }
        }

        // Si por alguna razón 'usuario' sigue siendo null aquí (ej. un error de Prisma silencioso)
        if (!usuario) {
            console.error('[GoogleLogin] ERROR FATAL: No se pudo encontrar ni crear el usuario.');
            res.status(500).json({ error: 'Error interno del servidor: No se pudo procesar el usuario.' });
            return
        }

        // 3. Generar un JWT propio para tu aplicación
        const token = jwt.sign(
            { id: usuario.id, rol: usuario.rol, email: usuario.email },
            JWT_SECRET,
            { expiresIn: '7d' }
        );
        console.log('[GoogleLogin] JWT generado para el usuario:', usuario.id);

        // 4. Enviar la respuesta con el token en una cookie HttpOnly
        res
            .cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000,
                path: '/',
            })
            .status(200)
            .json({
                mensaje: 'Inicio de sesión exitoso con Google',
                usuario: {
                    id: usuario.id,
                    nombre: usuario.nombre,
                    email: usuario.email,
                    rol: usuario.rol,
                    // No devuelvas googleId, password, etc. por seguridad
                },
            });
        console.log('[GoogleLogin] Respuesta enviada al cliente.');

    } catch (error: any) {
        console.error('[GoogleLogin] ERROR GENERAL en el controlador:', error);
        if (error.code === 'P2002' && error.meta?.target?.includes('googleId')) {
            // Error de unicidad de googleId, aunque el código ya lo maneja implícitamente
            res.status(409).json({ error: 'Este correo electrónico o cuenta de Google ya está registrada.' });
            return
        }
        res.status(500).json({ error: 'Error interno del servidor al procesar el inicio de sesión con Google.' });
    } finally {
        await prisma.$disconnect();
    }
};

