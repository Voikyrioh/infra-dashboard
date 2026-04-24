import { AppError } from '@errors/app.error'
import { argon2id, hash, verify } from "argon2";
import { z } from "zod";

const passwordSchema = z.string().min(8);
type Password = z.infer<typeof passwordSchema>;

export class PasswordEncoder {
    checkPasswordIsValid(password: string): Password {
        const {error, data} = passwordSchema.safeParse(password);
        if (error) {
            throw new AppError('invalid-payload', 'Password is invalid');
        }
        return data;
    }

    verifyPassword(password: Password, hash: string) {
        const valid = verify(hash, password);
        if (!valid) {
            throw new AppError('invalid-payload', 'Password is invalid');
        }
    }

    hashPassword(password: Password, salt: Buffer) {
        return hash(password, {
            type: argon2id,
            salt: salt,
            memoryCost: 19,
            parallelism: 1,
            timeCost: 2
        });
    }
}
