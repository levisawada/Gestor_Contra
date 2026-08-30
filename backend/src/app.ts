import express, { Request, Response } from 'express';
import { sqlite } from './db';

export const app = express();

// ---------------------------------------------------------------------------
// Global middleware
// ---------------------------------------------------------------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// TODO: mount feature routers here
// e.g. app.use("/api/auth",      authRouter);
//      app.use("/api/passwords", passwordsRouter);
// ---------------------------------------------------------------------------

export default app;
