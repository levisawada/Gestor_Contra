import express, { Request, Response } from 'express';
import { sqlite } from './db';
import router from './routes/users.route';

export const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/v1/users', router);

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

export default app;
