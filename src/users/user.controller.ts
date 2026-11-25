import type { FastifyRequest, FastifyReply } from "fastify";
import { UserService } from './user.service.ts';
import type { CreateUserDto } from './dto/create-user.dto.ts';
import type { UpdateUserDto } from './dto/update-user.dto.ts';
import { ValidationError } from '../core/errors.ts';

/**
 * Thin HTTP adapter. Errors are not caught here: domain errors bubble up
 * to the app-level error handler, which maps them to status codes.
 */
export class UserController {
    constructor(private userService: UserService){}

    async create(req: FastifyRequest, reply: FastifyReply) {
        const dto = req.body as CreateUserDto;
        const result = await this.userService.create(dto);
        return reply.code(201).send(result);
    }

    async findById(req: FastifyRequest, reply: FastifyReply) {
        const result = await this.userService.findById(parseId(req));
        return reply.send(result);
    }

    async findAll(_req: FastifyRequest, reply: FastifyReply) {
        const result = await this.userService.findAll();
        return reply.send(result);
    }

    async update(req: FastifyRequest, reply: FastifyReply) {
        const dto = req.body as Partial<UpdateUserDto>;
        const result = await this.userService.update(parseId(req), dto);
        return reply.send(result);
    }

    async delete(req: FastifyRequest, reply: FastifyReply) {
        await this.userService.delete(parseId(req));
        return reply.code(204).send();
    }
}

function parseId(req: FastifyRequest): number {
    const { id } = req.params as { id: string };
    const parsed = Number(id);
    if (!Number.isInteger(parsed) || parsed <= 0) {
        throw new ValidationError(`Invalid user id: ${id}`);
    }
    return parsed;
}
