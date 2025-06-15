// src/controllers/usuario/logoutUsuario.ts
import { RequestHandler } from 'express';

export const logoutUsuario: RequestHandler = (req, res) => {
  try {
    // Limpia la cookie 'token'. Los parámetros deben coincidir
    // con los que usaste al establecer la cookie en el login.
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Solo si tu app está en HTTPS en producción
      sameSite: 'strict',
      path: '/', // Debe ser el mismo path que se usó al establecer la cookie
    });
    // Envía una respuesta de éxito al cliente
    res.status(200).json({ mensaje: 'Sesión cerrada exitosamente.' });
  } catch (error) {
    console.error('Error al cerrar sesión en el backend:', error);
    res.status(500).json({ error: 'Error interno del servidor al cerrar sesión.' });
  }
};
