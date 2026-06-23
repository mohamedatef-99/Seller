import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import type { LoginDto as ILogin, SignupDto as ISignup } from '@cod/shared';

export class SignupDto implements ISignup {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72) // argon2/bcrypt practical ceiling
  password: string;

  @IsString()
  @MinLength(2)
  businessName: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

export class LoginDto implements ILogin {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}
