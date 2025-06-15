"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createVendedor = void 0;
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma = new client_1.PrismaClient();
const createVendedor = async (req, res) => {
    try {
        const { nombre, email, password, telefono, whatsapp } = req.body;
        if (!nombre || !email || !password || !telefono || !whatsapp) {
            res.status(400).json({ error: 'Todos los campos son obligatorios' });
            return;
        }
        const existente = await prisma.vendedor.findUnique({ where: { email } });
        if (existente) {
            res.status(400).json({ error: 'Ese correo ya está en uso' });
            return;
        }
        const hash = await bcrypt_1.default.hash(password, 10);
        const nuevoVendedor = await prisma.vendedor.create({
            data: {
                nombre,
                email,
                password: hash,
                telefono,
                whatsapp
            }
        });
        res.status(201).json({
            mensaje: 'Vendedor creado exitosamente',
            vendedor: {
                id: nuevoVendedor.id,
                nombre: nuevoVendedor.nombre,
                email: nuevoVendedor.email
            }
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Error al crear vendedor' });
    }
};
exports.createVendedor = createVendedor;
