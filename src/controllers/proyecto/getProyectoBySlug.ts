import { RequestHandler, Request } from 'express';
import { PrismaClient, Proyecto } from '@prisma/client';

const prisma = new PrismaClient();

interface GetProyectoBySlugRequest extends Request {
    params: {
        slug: string;
    };
}

export const getProyectoBySlug: RequestHandler<{ slug: string }> = async (
    req: GetProyectoBySlugRequest,
    res
) => {
    try {
        const { slug } = req.params;

        if (!slug) {
            res.status(400).json({ mensaje: 'Slug de proyecto no proporcionado.' });
            return;
        }

        const proyecto = await prisma.proyecto.findUnique({
            where: { slug },
            include: {
                usuarioVendedor: true, // Incluir todos los campos del vendedor
                // === AÑADIDO: Incluir las imágenes directamente asociadas al Proyecto ===
                imagenes: {
                    select: {
                        id: true,
                        url: true,
                    },
                },
                // === AÑADIDO: Si `videoUrl` es una relación y no un campo directo, inclúyelo aquí ===
                // Por ejemplo, si tienes un modelo 'VideoProyecto' con una relación 1:1 o 1:Many
                // video: {
                //     select: {
                //         url: true,
                //     },
                // },
                // Si `videoUrl` es un campo directo en el modelo Proyecto, no necesita `include`.

                propiedades: { // Incluir propiedades anidadas y sus imágenes
                    include: {
                        imagenes: {
                            select: {
                                id: true,
                                url: true,
                            },
                        },
                        // Puedes ajustar si necesitas `proyecto` y `usuarioVendedor` aquí o si ya los tienes en la raíz
                        // proyecto: true, // Ya lo tienes si es de donde viene el query
                        // usuarioVendedor: true, // Ya lo tienes en la raíz del proyecto
                    },
                },
            },
        });

        if (!proyecto) {
            res.status(404).json({ mensaje: 'Proyecto no encontrado.' });
            return;
        }

        res.status(200).json({ mensaje: 'Proyecto encontrado.', proyecto });
        return;

    } catch (error) {
        console.error('Error al obtener proyecto por slug:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor al obtener el proyecto.' });
        return;
    } finally {
        await prisma.$disconnect();
    }
};
