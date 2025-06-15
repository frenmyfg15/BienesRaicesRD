"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const createVendedor_1 = require("../controllers/vendedor/createVendedor");
const loginVendedor_1 = require("../controllers/vendedor/loginVendedor");
const router = (0, express_1.Router)();
// ⚠️ Esta ruta de creación debería usarse solo desde Thunder Client o protegida con un token temporal.
router.post('/crear', createVendedor_1.createVendedor);
router.post('/login', loginVendedor_1.loginVendedor);
exports.default = router;
