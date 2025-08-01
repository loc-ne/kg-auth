import { Controller, Post, Body, Get, UseGuards, Request, Res } from '@nestjs/common';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(loginDto.username, loginDto.password);

    // Set httpOnly cookie cho access_token
    res.cookie('access_token', result.access_token, {
      httpOnly: true,
      // secure: false,
      // sameSite: 'lax',
      secure: true,           
      sameSite: 'none',
      maxAge: 15 * 60 * 1000,
      path: '/',
      domain: '.onrender.com',
    });

    res.cookie('refresh_token', result.refresh_token, {
      httpOnly: true,
      // secure: false,
      // sameSite: 'lax',
      secure: true,           
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
      domain: '.onrender.com',
    });

    return {
      success: result.success,
      message: result.message,
      user: result.user,
      expires_in: result.expires_in,
      token_type: result.token_type,
    };
  }

  @Post('refresh_token')
  async refresh(@Request() req, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies['refresh_token'];
    const result = await this.authService.refreshToken(refreshToken);

    res.cookie('access_token', result.access_token, {
      httpOnly: true,
      // secure: false,
      // sameSite: 'lax',
      secure: true,           
      sameSite: 'none',
      maxAge: 15 * 60 * 1000,
      path: '/',
      domain: '.onrender.com',
    });


    res.cookie('refresh_token', result.refresh_token, {
      httpOnly: true,
      secure: true,           
      sameSite: 'none',
      // secure: false,
      // sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
      domain: '.onrender.com',
    });

    return {
      success: result.success,
      message: result.message,
      user: result.user,
      expires_in: result.expires_in,
      token_type: result.token_type,
    };
  }

  // @UseGuards(AuthGuard('jwt'))
  // @Get('profile')
  // getProfile(@Request() req) {
  //   return {
  //     message: 'Profile retrieved successfully',
  //     user: req.user
  //   };
  // }

  // @UseGuards(AuthGuard('jwt'))
  // @Post('logout')
  // async logout(@Request() req) {
  //   return this.authService.logout(req.user.userId);
  // }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  async getProfile(@Request() req) {
    return this.authService.getUserInfo(req);
  }

}