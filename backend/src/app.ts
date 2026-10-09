import express, { Request, Response } from 'express';
import { sqlite } from './db';
import router from './routes/users.route';
import { globalErrorHandler } from './middleware/error.middleware';
import cors from 'cors';
import cookieParser from 'cookie-parser';

export const app = express();

app.use(
    cors({
        // Refleja dinámicamente el origin de la petición para evitar problemas 
        // entre localhost, 127.0.0.1 o diferentes puertos de Vite (5173, 5174)
        origin: function (origin, callback) {
            if (!origin) return callback(null, true);
            if (process.env.NODE_ENV === 'development') {
                return callback(null, origin); // En dev permite cualquier origen local
            }
            const allowed = process.env.CLIENT_URL ? [process.env.CLIENT_URL] : ['http://localhost:5173'];
            if (allowed.includes(origin)) {
                callback(null, origin);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true, // Permite intercambio de cookies
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Master-Password'],
    })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

import passwordsRouter from './routes/passwords.route';

app.use('/api/v1/users', router);
app.use('/api/v1/passwords', passwordsRouter);

app.get('/health', (_req: Request, res: Response) => {
    try {
        sqlite.prepare('SELECT 1').get();

        res.status(200).json({
            status: 'ok',
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
            database: 'connected',
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
            database: 'disconnected',
        });
    }
});

app.use((req, res) => {
    res.status(404).json({
        status: 'fail',
        message: `La ruta ${req.originalUrl} no existe en este servidor`,
    });
});

app.use(globalErrorHandler);

export default app;
