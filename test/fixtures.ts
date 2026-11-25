import { randomBytes } from 'node:crypto';

/** Generated per run so no credential-looking literals live in the repo. */
export function randomPassword(): string {
    return randomBytes(12).toString('hex');
}
