import { Router } from 'express';
import { createUsuario } from '../controllers/usuario/createUsuario';
import { loginUsuario } from '../controllers/usuario/loginUsuario';
import { body } from 'express-validator';
import { validarCampos } from '../middleware/validator';
import { googleLoginUsuario } from '../controllers/usuario/googleLoginUsuario';
import { logoutUsuario } from '../controllers/usuario/logoutUsuario';
import { toggleFavorite, getFavorites } from '../controllers/usuario/favoritesController'; 
import { verificarToken } from '../middleware/auth';

const router = Router();

router.post('/registro',
    [
    body('nombre')
      .notEmpty().withMessage('El nombre es obligatorio')
      .trim()
      .escape(),
    body('email')
      .isEmail().withMessage('El email es inválido')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres')
      .trim()
  ],
    validarCampos,
    createUsuario);

router.post('/login',
  [
    body('email')
      .isEmail().withMessage('El email es inválido')
      .normalizeEmail(),
    body('password')
      .notEmpty().withMessage('La contraseña es obligatoria')
      .trim()
  ],
  validarCampos,
  loginUsuario
);

// Nueva ruta para el inicio de sesión con Google
router.post('/google-login', googleLoginUsuario);
router.post('/logout', logoutUsuario);
router.post('/favorites', verificarToken, toggleFavorite);
// Ruta para obtener todos los favoritos de un usuario (requiere autenticación)
router.get('/favorites', verificarToken, getFavorites);

export default router;
