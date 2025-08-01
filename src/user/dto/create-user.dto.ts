import { IsString, IsEmail, MinLength, MaxLength, IsOptional, IsEnum, IsNumber, Min, Max } from 'class-validator';

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

export class CreateUserDto {
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  username: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  @MaxLength(50)
  password: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsNumber()
  @Min(800)            
  @Max(2000)
  elo: number;
}