import { IsNumber, IsEnum } from 'class-validator';
import { GameType } from '../../entities/user-rating.entity';

export class UpdateEloDto {
  @IsNumber()
  newRating: number;

  @IsEnum(['win', 'loss', 'draw'])
  gameResult: 'win' | 'loss' | 'draw';

  @IsEnum(['white', 'black'])
  color: 'white' | 'black';
}