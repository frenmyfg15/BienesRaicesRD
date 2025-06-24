# Bienes Raíces RD - Backend

Backend de **Bienes Raíces RD**, una plataforma para la gestión de propiedades inmobiliarias en República Dominicana. Esta API está construida con **Node.js**, **Express** y **TypeScript**, usando **Prisma** como ORM con base de datos **MySQL**, y desplegada en **Railway**.

---

## Funcionalidades principales

- Registro y login para **compradores** y **vendedores**
- Autenticación con **tokens JWT**
- Soporte para login con **Google (OAuth 2.0)**
- Creación, edición y eliminación de propiedades
- Subida de imágenes a través de **Cloudinary**
- Protección de rutas privadas con middleware de autenticación
- Middleware para limitar número de solicitudes por IP
- Manejo de CORS y variables de entorno con `dotenv`

---

## Tecnologías utilizadas

- **Node.js** + **Express**
- **TypeScript**
- **Prisma ORM**
- **MySQL** (Railway)
- **Cloudinary** (almacenamiento de imágenes)
- **Google OAuth 2.0**
- **JWT** para autenticación
- **bcryptjs** para hash de contraseñas
- **dotenv**, **cors**, **express-rate-limit**, entre otros

---

## Instalación y configuración

### 1. Clona el repositorio

```bash
git clone https://github.com/frenmyfg15/BienesRaicesRD.git
cd BienesRaicesRD
