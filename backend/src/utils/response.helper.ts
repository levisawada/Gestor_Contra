import { Response } from 'express';

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
    error?: unknown;
}

export const sendResponse = <T>(
    res: Response,
    statusCode: number,
    data?: T,
    message?: string
): Response<ApiResponse<T>> => {
    return res.status(statusCode).json({
        success: statusCode >= 200 && statusCode < 300,
        ...(data !== undefined && { data }),
        ...(message && { message }),
    });
};
