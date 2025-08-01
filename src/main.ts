import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
 
  // Enable CORS
app.enableCors({
  origin: process.env.FRONTEND_ORIGIN || 'http://localhost:3000',
  credentials: true,
});
  
  app.use(cookieParser());
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  
  await app.listen(process.env.PORT || 4001, '0.0.0.0');
  console.log(`Auth service is running on http://0.0.0.0:${process.env.PORT || 4001}`);
}
bootstrap();