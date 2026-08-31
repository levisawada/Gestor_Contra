// src/utils/asyncHandler.ts
import { Request, Response, NextFunction, RequestHandler } from 'express';

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
}

type ControllerFn<T = any> = (
    req: Request<any, any, any, any>,
    res: Response,
    next: NextFunction
) => Promise<T | { data?: T; message?: string; statusCode?: number }>;

export const asyncHandler = (fn: ControllerFn) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await fn(req, res, next);

            // Si el controlador ya envió la respuesta manualmente (ej. un stream o archivo)
            if (res.headersSent) return;

            let data = result;
            let message: string | undefined;
            let statusCode = req.method === 'POST' ? 201 : 200;

            // Si el controlador retornó un objeto de configuración explícito
            if (
                result &&
                typeof result === 'object' &&
                ('data' in result ||
                    'message' in result ||
                    'statusCode' in result)
            ) {
                data = result.data;
                message = result.message;
                statusCode = result.statusCode ?? statusCode;
            }

            // 3. ESTANDARIZACIÓN ÚNICA DE RESPUESTAS EXITOSAS
            const responseBody: ApiResponse<typeof data> = {
                success: true,
                ...(data !== undefined && { data }),
                ...(message && { message }),
            };

            return res.status(statusCode).json(responseBody);
        } catch (error) {
            next(error);
        }
    };
};
