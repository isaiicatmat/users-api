import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.ts';
import { InMemoryUserRepository } from './in-memory-user.repository.ts';

const alice = { username: 'alice', email: 'alice@example.com', password: 'correct-horse' };

describe('Users HTTP API', () => {
    let app: FastifyInstance;
    let repo: InMemoryUserRepository;

    beforeEach(async () => {
        repo = new InMemoryUserRepository();
        app = await buildApp({ userRepository: repo });
    });

    afterEach(async () => {
        await app.close();
    });

    const createAlice = () => app.inject({ method: 'POST', url: '/users', payload: alice });

    it('POST /users returns 201 without the password', async () => {
        const res = await createAlice();
        expect(res.statusCode).toBe(201);
        expect(res.json()).toMatchObject({ id: 1, username: 'alice' });
        expect(res.json()).not.toHaveProperty('password');
    });

    it('POST /users returns 400 on schema violations', async () => {
        const res = await app.inject({ method: 'POST', url: '/users', payload: { ...alice, email: 'nope' } });
        expect(res.statusCode).toBe(400);
    });

    it('POST /users returns 409 on duplicate username', async () => {
        await createAlice();
        const res = await app.inject({
            method: 'POST', url: '/users', payload: { ...alice, email: 'other@example.com' },
        });
        expect(res.statusCode).toBe(409);
        expect(res.json().error).toMatch(/username/);
    });

    it('GET /users/:id returns 400 for a non-numeric id and 404 for a missing one', async () => {
        expect((await app.inject({ method: 'GET', url: '/users/abc' })).statusCode).toBe(400);
        expect((await app.inject({ method: 'GET', url: '/users/999' })).statusCode).toBe(404);
    });

    it('GET /users lists users', async () => {
        await createAlice();
        const res = await app.inject({ method: 'GET', url: '/users' });
        expect(res.statusCode).toBe(200);
        expect(res.json()).toHaveLength(1);
    });

    it('PUT /users/:id updates and returns the user', async () => {
        const { id } = (await createAlice()).json();
        const res = await app.inject({ method: 'PUT', url: `/users/${id}`, payload: { username: 'alice-renamed' } });
        expect(res.statusCode).toBe(200);
        expect(res.json().username).toBe('alice-renamed');
    });

    it('DELETE /users/:id returns 204, then 404', async () => {
        const { id } = (await createAlice()).json();
        expect((await app.inject({ method: 'DELETE', url: `/users/${id}` })).statusCode).toBe(204);
        expect((await app.inject({ method: 'DELETE', url: `/users/${id}` })).statusCode).toBe(404);
    });

    it('hides internals behind a generic 500 for unexpected errors', async () => {
        repo.findAll = async () => { throw new Error('connection refused at 10.0.0.5'); };
        const res = await app.inject({ method: 'GET', url: '/users' });
        expect(res.statusCode).toBe(500);
        expect(res.json()).toEqual({ error: 'Internal server error' });
    });
});
