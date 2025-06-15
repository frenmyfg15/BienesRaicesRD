"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUsuario = void 0;
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma = new client_1.PrismaClient();
const createUsuario = async (req, res) => {
    console.log('dentro del controlador...');
    try {
        const { nombre, email, password } = req.body;
        if (!nombre || !email || !password) {
            res.status(400).json({ error: 'Todos los campos son obligatorios' });
            return;
        }
        console.log('parametros correctos...');
        const existente = await prisma.usuario.findUnique({ where: { email } });
        if (existente) {
            res.status(400).json({ error: 'Correo ya registrado' });
            return;
        }
        const hash = await bcrypt_1.default.hash(password, 10);
        const nuevo = await prisma.usuario.create({
            data: {
                nombre,
                email,
                password: hash,
                rol: 'COMPRADOR'
            }
        });
        res.status(201).json({
            mensaje: 'Usuario registrado correctamente',
            usuario: {
                id: nuevo.id,
                nombre: nuevo.nombre,
                email: nuevo.email
            }
        });
        return;
    }
    catch (error) {
        console.log('error al crear');
        res.status(500).json({ error: 'Error al registrar usuario' });
        return;
    }
};
exports.createUsuario = createUsuario;
