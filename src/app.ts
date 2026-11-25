import Fastify, { type FastifyError, type FastifyInstance } from 'fastify';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import { registerUserRoutes } from './users/users.routes.ts';
import type { IUserRepository } from './users/user.repository.ts';
import { AppError } from './core/errors.ts';

export interface AppOptions {
    userRepository: IUserRepository;
    logger?: boolean;
}

/**
 * Builds the Fastify app without listening, so tests can drive it with
 * `app.inject()` and swap the repository for an in-memory one.
 */
export async function buildApp({ userRepository, logger = false }: AppOptions): Promise<FastifyInstance> {
    const app = Fastify({ logger });

    await app.register(fastifySwagger, {
        swagger: {
            info: { title: 'Users API', version: '1.0.0' },
            consumes: ['application/json'],
            produces: ['application/json'],
        },
    });
    await app.register(fastifySwaggerUi, { routePrefix: '/docs' });

    app.setErrorHandler((error: FastifyError, request, reply) => {
        if (error instanceof AppError) {
            return reply.code(error.statusCode).send({ error: error.message });
        }
        // Schema validation failures raised by Fastify itself.
        if (error.validation) {
            return reply.code(400).send({ error: error.message });
        }
        // Anything else is unexpected: log it, but don't leak internals.
        request.log.error(error);
        return reply.code(500).send({ error: 'Internal server error' });
    });

    await registerUserRoutes(app, userRepository);

    return app;
}
