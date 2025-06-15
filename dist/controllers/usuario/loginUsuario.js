"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginUsuario = void 0;
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const generarToken_1 = require("../../utils/generarToken");
const prisma = new client_1.PrismaClient();
const loginUsuario = async (req, res) => {
    try {
        const { email, password } = req.body;
        const usuario = await prisma.usuario.findUnique({ where: { email } });
        if (!usuario) {
            res.status(401).json({ error: 'Credenciales inválidas' });
            return;
        }
        const valido = await bcrypt_1.default.compare(password, usuario.password);
        if (!valido) {
            res.status(401).json({ error: 'Credenciales inválidas' });
            return;
        }
        const token = (0, generarToken_1.generarToken)({ id: usuario.id, rol: usuario.rol });
        res.json({
            mensaje: 'Login exitoso',
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                email: usuario.email,
                rol: usuario.rol
            },
            token
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Error al iniciar sesión' });
    }
};
exports.loginUsuario = loginUsuario;
