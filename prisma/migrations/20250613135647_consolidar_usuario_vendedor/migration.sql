/*
  Warnings:

  - You are about to drop the column `vendedorId` on the `interaccion` table. All the data in the column will be lost.
  - You are about to drop the column `vendedorId` on the `propiedad` table. All the data in the column will be lost.
  - You are about to drop the column `vendedorId` on the `proyecto` table. All the data in the column will be lost.
  - You are about to drop the `vendedor` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[googleId]` on the table `Usuario` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `usuarioVendedorId` to the `Propiedad` table without a default value. This is not possible if the table is not empty.
  - Added the required column `usuarioVendedorId` to the `Proyecto` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `interaccion` DROP FOREIGN KEY `Interaccion_vendedorId_fkey`;

-- DropForeignKey
ALTER TABLE `propiedad` DROP FOREIGN KEY `Propiedad_vendedorId_fkey`;

-- DropForeignKey
ALTER TABLE `proyecto` DROP FOREIGN KEY `Proyecto_vendedorId_fkey`;

-- DropIndex
DROP INDEX `Interaccion_vendedorId_fkey` ON `interaccion`;

-- DropIndex
DROP INDEX `Propiedad_vendedorId_fkey` ON `propiedad`;

-- DropIndex
DROP INDEX `Proyecto_vendedorId_fkey` ON `proyecto`;

-- AlterTable
ALTER TABLE `interaccion` DROP COLUMN `vendedorId`,
    ADD COLUMN `usuarioVendedorId` INTEGER NULL;

-- AlterTable
ALTER TABLE `propiedad` DROP COLUMN `vendedorId`,
    ADD COLUMN `usuarioVendedorId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `proyecto` DROP COLUMN `vendedorId`,
    ADD COLUMN `usuarioVendedorId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `usuario` ADD COLUMN `googleId` VARCHAR(191) NULL,
    ADD COLUMN `imagenPerfilUrl` VARCHAR(191) NULL,
    ADD COLUMN `telefono` VARCHAR(191) NULL,
    ADD COLUMN `whatsapp` VARCHAR(191) NULL,
    MODIFY `password` VARCHAR(191) NULL,
    MODIFY `rol` ENUM('COMPRADOR', 'VENDEDOR') NOT NULL DEFAULT 'COMPRADOR';

-- DropTable
DROP TABLE `vendedor`;

-- CreateIndex
CREATE UNIQUE INDEX `Usuario_googleId_key` ON `Usuario`(`googleId`);

-- AddForeignKey
ALTER TABLE `Proyecto` ADD CONSTRAINT `Proyecto_usuarioVendedorId_fkey` FOREIGN KEY (`usuarioVendedorId`) REFERENCES `Usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Propiedad` ADD CONSTRAINT `Propiedad_usuarioVendedorId_fkey` FOREIGN KEY (`usuarioVendedorId`) REFERENCES `Usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Interaccion` ADD CONSTRAINT `Interaccion_usuarioVendedorId_fkey` FOREIGN KEY (`usuarioVendedorId`) REFERENCES `Usuario`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
