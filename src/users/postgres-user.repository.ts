import { PrismaClient } from "@prisma/client";
import { User } from './user.entity.ts';
import type { IUserRepository } from './user.repository.ts';
import { ConflictError, NotFoundError } from '../core/errors.ts';

type UserRow = {
    id: number;
    username: string;
    email: string;
    password: string;
    createdAt: Date;
    updatedAt: Date;
};

export class PostgresUserRepository implements IUserRepository {
    constructor(private readonly prisma: PrismaClient = new PrismaClient()) {}

    async create(user: User): Promise<User> {
        try {
            const newUser = await this.prisma.user.create({
                data: {
                    username: user.username,
                    email: user.email,
                    password: user.password
                }
            });
            return this.toDomainEntity(newUser);
        } catch (error) {
            throw translatePrismaError(error, user.id);
        }
    }

    async findById(userId: number): Promise<User | null> {
        const foundUser = await this.prisma.user.findUnique({ where: { id: userId } });
        return foundUser ? this.toDomainEntity(foundUser) : null;
    }

    async findAll(): Promise<User[]> {
        const users = await this.prisma.user.findMany({ orderBy: { id: 'asc' } });
        return users.map((user: UserRow) => this.toDomainEntity(user));
    }

    async update(userId: number, user: User): Promise<User> {
        try {
            const updated = await this.prisma.user.update({
                where: { id: userId },
                data: {
                    username: user.username,
                    email: user.email,
                    password: user.password
                }
            });
            return this.toDomainEntity(updated);
        } catch (error) {
            throw translatePrismaError(error, userId);
        }
    }

    async delete(userId: number): Promise<void> {
        try {
            // A single statement: no read-then-delete race.
            await this.prisma.user.delete({ where: { id: userId } });
        } catch (error) {
            throw translatePrismaError(error, userId);
        }
    }

    private toDomainEntity(data: UserRow): User {
        return new User(
            data.id,
            data.username,
            data.email,
            data.password,
            data.createdAt.toISOString(),
            data.updatedAt.toISOString()
        );
    }
}

/**
 * Maps Prisma's known error codes to domain errors.
 * P2002: unique constraint violation. P2025: record not found.
 * https://www.prisma.io/docs/orm/reference/error-reference
 */
function translatePrismaError(error: unknown, userId: number): unknown {
    const code = (error as { code?: string } | null)?.code;
    if (code === 'P2002') {
        const target = (error as { meta?: { target?: string[] | string } }).meta?.target;
        const fields = Array.isArray(target) ? target.join(', ') : target ?? 'unique field';
        return new ConflictError(`A user with that ${fields} already exists`);
    }
    if (code === 'P2025') {
        return new NotFoundError(`User ${userId} not found`);
    }
    return error;
}
