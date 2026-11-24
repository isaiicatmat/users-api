import bcrypt from 'bcrypt';
import { ValidationError } from './errors.ts';

export class PasswordService {
    private static readonly SALT_ROUNDS = 10;
    private static readonly MIN_LENGTH = 8;
    private static readonly MAX_LENGTH = 128;

    static async hash(plainPassword: string): Promise<string> {
        this.validatePassword(plainPassword);
        return bcrypt.hash(plainPassword, this.SALT_ROUNDS)
    }

    static async compare(plain: string, hashed: string): Promise<boolean> {
        return bcrypt.compare(plain, hashed);
    }

    private static validatePassword(password: string): void {
        if (!password || password.length < this.MIN_LENGTH) {
            throw new ValidationError(`Password must be at least ${this.MIN_LENGTH} characters`);
        }

        if (password.length > this.MAX_LENGTH) {
            throw new ValidationError(`Password must be at most ${this.MAX_LENGTH} characters`);
        }
    }
}
