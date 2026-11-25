import { User } from '../src/users/user.entity.ts';
import type { IUserRepository } from '../src/users/user.repository.ts';
import { ConflictError, NotFoundError } from '../src/core/errors.ts';

/**
 * Test double that mimics the Postgres repository contract,
 * including unique constraints on username and email.
 */
export class InMemoryUserRepository implements IUserRepository {
    private rows = new Map<number, User>();
    private nextId = 1;

    async create(user: User): Promise<User> {
        this.assertUnique(user);
        const now = new Date().toISOString();
        const saved = new User(this.nextId++, user.username, user.email, user.password, now, now);
        this.rows.set(saved.id, saved);
        return clone(saved);
    }

    async findById(id: number): Promise<User | null> {
        const row = this.rows.get(id);
        return row ? clone(row) : null;
    }

    async findAll(): Promise<User[]> {
        return [...this.rows.values()].map(clone);
    }

    async update(id: number, user: User): Promise<User> {
        if (!this.rows.has(id)) throw new NotFoundError(`User ${id} not found`);
        this.assertUnique(user, id);
        const prev = this.rows.get(id)!;
        const saved = new User(id, user.username, user.email, user.password, prev.createdAt, new Date().toISOString());
        this.rows.set(id, saved);
        return clone(saved);
    }

    async delete(id: number): Promise<void> {
        if (!this.rows.delete(id)) throw new NotFoundError(`User ${id} not found`);
    }

    private assertUnique(user: User, ignoreId?: number) {
        for (const row of this.rows.values()) {
            if (row.id === ignoreId) continue;
            if (row.username === user.username) throw new ConflictError('A user with that username already exists');
            if (row.email === user.email) throw new ConflictError('A user with that email already exists');
        }
    }
}

function clone(u: User): User {
    return new User(u.id, u.username, u.email, u.password, u.createdAt, u.updatedAt);
}
