import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { User } from '../entities/user.entity';
import { UserRating } from '../entities/user-rating.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserRating])], 
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService], 
})
export class UserModule {}