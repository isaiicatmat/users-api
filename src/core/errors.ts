/**
 * Domain errors carry the HTTP status they map to, so the HTTP layer
 * can translate them in a single place (see app.ts error handler).
 */
export abstract class AppError extends Error {
    abstract readonly statusCode: number;

    constructor(message: string) {
        super(message);
        this.name = new.target.name;
    }
}

export class ValidationError extends AppError {
    readonly statusCode = 400;
}

export class NotFoundError extends AppError {
    readonly statusCode = 404;
}

export class ConflictError extends AppError {
    readonly statusCode = 409;
}
