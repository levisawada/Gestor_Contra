// validate.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export const validate = (schema: ZodSchema) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const parsed = await schema.parseAsync({
                body: req.body,
                params: req.params,
                query: req.query,
            });

            if (parsed.body) req.body = parsed.body;
            if (parsed.params) req.params = parsed.params;
            if (parsed.query) req.query = parsed.query;

            next();
        } catch (error) {
            if (error instanceof ZodError) {
                return res.status(400).json({
                    message: 'Error de validación en la petición',
                    errors: error.issues.map((issue) => ({
                        location: issue.path[0], // 'body', 'params' o 'query'
                        field: issue.path.slice(1).join('.'),
                        message: issue.message,
                    })),
                });
            }
            return res
                .status(500)
                .json({ message: 'Error interno del servidor' });
        }
    };
};
