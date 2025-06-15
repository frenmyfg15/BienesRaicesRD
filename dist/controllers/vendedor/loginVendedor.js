"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginVendedor = void 0;
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const generarToken_1 = require("../../utils/generarToken");
const prisma = new client_1.PrismaClient();
const loginVendedor = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ error: 'Email y contraseña son requeridos' });
            return;
        }
        const vendedor = await prisma.vendedor.findUnique({ where: { email } });
        if (!vendedor) {
            res.status(401).json({ error: 'Credenciales inválidas' });
            return;
        }
        const valido = await bcrypt_1.default.compare(password, vendedor.password);
        if (!valido) {
            res.status(401).json({ error: 'Credenciales inválidas' });
            return;
        }
        const token = (0, generarToken_1.generarToken)({ id: vendedor.id, rol: 'VENDEDOR' });
        res.json({
            mensaje: 'Login exitoso',
            vendedor: {
                id: vendedor.id,
                nombre: vendedor.nombre,
                email: vendedor.email
            },
            token
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Error al iniciar sesión como vendedor' });
    }
};
exports.loginVendedor = loginVendedor;
