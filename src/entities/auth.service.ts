import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { User } from '../entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private jwtService: JwtService
  ) { }

  private isEmail(text: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(text);
  }

  private async generateTokens(user: any) {

    const payload = {
      sub: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    };
    const access_token = this.jwtService.sign(payload, { expiresIn: '15m' });

    // Refresh token (long-lived random string)
    const refresh_token = crypto.randomBytes(32).toString('hex');

    // Save refresh token to database
    await this.userService.saveRefreshToken(user.id, refresh_token);

    return {
      access_token,
      refresh_token,
      token_type: 'Bearer',
      expires_in: 900, // 15 minutes
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      }
    };
  }

  async validateUser(username: string, password: string) {
    let user: User | null = null;
    if (this.isEmail(username)) {
      user = await this.userService.findByEmailWithRatings(username);
    } else {
      user = await this.userService.findByUsernameWithRatings(username);
    }

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is disabled');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async register(createUserDto: CreateUserDto) {
    const user = await this.userService.create(createUserDto); 
 
    return {
      "success": true,
      message: 'User registered successfully',
    };
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
    const tokens = await this.generateTokens(user);

    return {
      "success": true,
      message: 'Login successful',
      ...tokens
    };
  }

  async refreshToken(refreshToken: string) {
    const user = await this.userService.findByRefreshToken(refreshToken); // ✅ Load với ratings

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokens = await this.generateTokens(user);

    return {
      "success": true,
      message: 'Token refreshed successfully',
      ...tokens
    };
  }

  async getUserInfo(req: any) {
    const userId = req.user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Invalid token or user not found');
    }

    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    }
  }

}