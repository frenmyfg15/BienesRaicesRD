import express, { Request, Response } from 'express';
import cors from 'cors';
import usuarioRoutes from './routes/usuario';
import vendedorRoutes from './routes/vendedor';
import propiedadRoutes from './routes/propiedad';
import proyectoRoutes from './routes/proyecto';
import uploadRoutes from './routes/upload';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { verificarToken } from './middleware/auth';
import { JwtPayload } from 'jsonwebtoken';
import { limiter } from './middleware/limitator';

interface JwtPayloadExtended extends JwtPayload {
  id: number;
  rol: string;
}

interface AuthRequest extends Request {
  user?: JwtPayloadExtended;
}

dotenv.config();

const app = express();
app.use(cookieParser());
const PORT = process.env.PORT || 4000;

// Configuración de CORS
// Es una buena práctica usar una variable de entorno para el origen del frontend
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000', // Asegúrate que esta variable de entorno esté definida
  credentials: true
}));
app.use(express.json());
app.use(limiter); // Limitador de peticiones

// Endpoint para verificar token y obtener datos del usuario autenticado
// Lo movemos bajo /api para consistencia de API
app.get('/api/me', verificarToken, (req: AuthRequest, res: Response) => { // <--- RUTA CAMBIADA A /api/me
  if (req.user) {
    res.json({
      mensaje: `Token válido. Bienvenido/a ${req.user.rol || 'usuario'} con ID ${req.user.id}`,
      usuario: req.user
    });
    return
  }
  res.status(401).json({ error: 'No autorizado o datos de usuario no encontrados' });
  return;
});

// Obtener las rutas de usuario
// Montamos las rutas de autenticación bajo /api/auth para consistencia
app.use('/api/auth', usuarioRoutes); // <--- RUTA CAMBIADA A /api/auth
app.use('/api/propiedades', propiedadRoutes);
app.use('/api/proyectos', proyectoRoutes);
app.use('/api/vendedor', vendedorRoutes);
app.use('/api/upload', uploadRoutes);

// Ejemplo de ruta protegida por verificarToken
app.get('/api/ruta-protegida', verificarToken, (req: AuthRequest, res: Response) => { // <--- RUTA CAMBIADA A /api/ruta-protegida
  res.json({ mensaje: `Hola usuario con ID ${req.user?.id}` });
});

// Ruta de bienvenida general de la API
app.get('/', (req, res) => {
  res.json({ mensaje: 'API de Bienes Raíces RD funcionando' });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
