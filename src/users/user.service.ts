import type { CreateUserDto } from './dto/create-user.dto.ts';
import type { UserResponseDto } from './dto/user-response.dto.ts';
import type { IUserRepository } from './user.repository.ts';
import { UserFactory } from './user.factory.ts';
import { UserPresenter } from './user.presenter.ts';
import type { UpdateUserDto } from './dto/update-user.dto.ts';
import { NotFoundError } from '../core/errors.ts';

export class UserService {
    constructor(
        private userRepository: IUserRepository
    ) {}

    async create(dto: CreateUserDto): Promise<UserResponseDto> {
        const user = await UserFactory.create(dto.username, dto.email, dto.password);
        const saved = await this.userRepository.create(user);

        return UserPresenter.toJSON(saved);
    }

    async findById(id: number): Promise<UserResponseDto> {
        const user = await this.userRepository.findById(id);
        if (!user) throw new NotFoundError(`User ${id} not found`);
        return UserPresenter.toJSON(user);
    }

    async findAll(): Promise<UserResponseDto[]> {
        const users = await this.userRepository.findAll();
        return users.map(user => UserPresenter.toJSON(user));
    }

    async update(id: number, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
        const user = await this.userRepository.findById(id);
        if (!user) throw new NotFoundError(`User ${id} not found`);

        if (updateUserDto.username) user.changeUsername(updateUserDto.username);
        if (updateUserDto.email) user.changeEmail(updateUserDto.email);
        if (updateUserDto.password) await user.updatePassword(updateUserDto.password);

        const updated = await this.userRepository.update(id, user);
        return UserPresenter.toJSON(updated);
    }

    async delete(id: number) {
        const user = await this.userRepository.findById(id);
        if (!user) throw new NotFoundError(`User ${id} not found`);
        await this.userRepository.delete(id);
    }
}