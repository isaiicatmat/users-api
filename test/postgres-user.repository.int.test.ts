import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { PostgresUserRepository } from '../src/users/postgres-user.repository.ts';
import { User } from '../src/users/user.entity.ts';
import { ConflictError, NotFoundError } from '../src/core/errors.ts';
import { randomPassword } from './fixtures.ts';

// Runs against a real Postgres. Requires DATABASE_URL and applied migrations
// (`npx prisma migrate deploy`). Skipped when DATABASE_URL is not set.
const hasDb = Boolean(process.env.DATABASE_URL);

const draft = (username: string, email: string) => new User(0, username, email, randomPassword(), '', '');

describe.skipIf(!hasDb)('PostgresUserRepository (integration)', () => {
    let prisma: PrismaClient;
    let repo: PostgresUserRepository;

    beforeAll(() => {
        prisma = new PrismaClient();
        repo = new PostgresUserRepository(prisma);
    });

    beforeEach(async () => {
        await prisma.$executeRawUnsafe('TRUNCATE TABLE "users" RESTART IDENTITY');
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    it('creates and reads back a user', async () => {
        const created = await repo.create(draft('alice', 'alice@example.com'));
        const found = await repo.findById(created.id);
        expect(found).toMatchObject({ username: 'alice', email: 'alice@example.com' });
    });

    it('maps unique violations (P2002) to ConflictError', async () => {
        await repo.create(draft('alice', 'alice@example.com'));
        await expect(repo.create(draft('alice', 'other@example.com'))).rejects.toBeInstanceOf(ConflictError);
    });

    it('maps missing rows (P2025) to NotFoundError on update and delete', async () => {
        await expect(repo.update(999, draft('ghost', 'ghost@example.com'))).rejects.toBeInstanceOf(NotFoundError);
        await expect(repo.delete(999)).rejects.toBeInstanceOf(NotFoundError);
    });
});
