import { describe, it, expect, beforeEach } from 'vitest';
import { UserService } from '../src/users/user.service.ts';
import { PasswordService } from '../src/core/password.service.ts';
import { NotFoundError, ValidationError, ConflictError } from '../src/core/errors.ts';
import { InMemoryUserRepository } from './in-memory-user.repository.ts';

const alice = { username: 'alice', email: 'alice@example.com', password: 'correct-horse' };

describe('UserService', () => {
    let repo: InMemoryUserRepository;
    let service: UserService;

    beforeEach(() => {
        repo = new InMemoryUserRepository();
        service = new UserService(repo);
    });

    it('creates a user, stores a hash and never returns the password', async () => {
        const created = await service.create(alice);

        expect(created).toMatchObject({ id: 1, username: 'alice', email: 'alice@example.com' });
        expect(created).not.toHaveProperty('password');

        const stored = await repo.findById(created.id);
        expect(stored!.password).not.toBe(alice.password);
        expect(await PasswordService.compare(alice.password, stored!.password)).toBe(true);
    });

    it('rejects passwords shorter than 8 characters', async () => {
        await expect(service.create({ ...alice, password: 'short' })).rejects.toBeInstanceOf(ValidationError);
    });

    it('propagates conflicts on duplicate email', async () => {
        await service.create(alice);
        await expect(service.create({ ...alice, username: 'alice2' })).rejects.toBeInstanceOf(ConflictError);
    });

    it('throws NotFoundError for a missing user', async () => {
        await expect(service.findById(42)).rejects.toBeInstanceOf(NotFoundError);
        await expect(service.update(42, { username: 'x-y-z' })).rejects.toBeInstanceOf(NotFoundError);
        await expect(service.delete(42)).rejects.toBeInstanceOf(NotFoundError);
    });

    it('updates fields and re-hashes a new password', async () => {
        const { id } = await service.create(alice);
        const before = (await repo.findById(id))!.password;

        const updated = await service.update(id, { email: 'new@example.com', password: 'another-secret' });

        expect(updated.email).toBe('new@example.com');
        const after = (await repo.findById(id))!.password;
        expect(after).not.toBe(before);
        expect(await PasswordService.compare('another-secret', after)).toBe(true);
    });

    it('validates email format on update', async () => {
        const { id } = await service.create(alice);
        await expect(service.update(id, { email: 'not-an-email' })).rejects.toBeInstanceOf(ValidationError);
    });
});
