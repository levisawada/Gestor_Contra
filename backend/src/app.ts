import express, { Request, Response } from 'express';
import { sqlite } from './db';
import router from './routes/users.route';
import { globalErrorHandler } from './middleware/error.middleware';
import cors from 'cors';
import cookieParser from 'cookie-parser';

export const app = express();

app.use(
    cors({
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
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
