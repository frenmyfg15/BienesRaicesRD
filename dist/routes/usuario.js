"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const createUsuario_1 = require("../controllers/usuario/createUsuario");
const loginUsuario_1 = require("../controllers/usuario/loginUsuario");
const router = (0, express_1.Router)();
router.post('/registro', createUsuario_1.createUsuario);
router.post('/login', loginUsuario_1.loginUsuario);
exports.default = router;
