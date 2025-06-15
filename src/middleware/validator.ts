import { RequestHandler } from 'express';
import { validationResult } from 'express-validator';

type ErrorValidacion = {
    campo: string;
    mensaje: string;
};

export const validarCampos: RequestHandler = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const erroresParseados: ErrorValidacion[] = errors.array().reduce((acc, err) => {
            // Solo toma errores con 'param' definido
            if ('param' in err && typeof err.param === 'string') {
                acc.push({
                    campo: err.param,
                    mensaje: err.msg,
                });
            }
            return acc;
        }, [] as ErrorValidacion[]);

        res.status(400).json({ errores: erroresParseados });
        return
    }
    next();
};
