import { buildApp } from './app.ts';
import { PostgresUserRepository } from './users/postgres-user.repository.ts';

const PORT = Number(process.env.PORT ?? 3000);

const start = async () => {
    const app = await buildApp({
        userRepository: new PostgresUserRepository(),
        logger: true,
    });

    try {
        await app.listen({ port: PORT, host: '0.0.0.0' });
        app.log.info(`Docs available at http://localhost:${PORT}/docs`);
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};

start();
