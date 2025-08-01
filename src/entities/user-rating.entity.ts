import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { User } from './user.entity';

export enum GameType {
  BULLET = 'bullet',
  BLITZ = 'blitz',
  RAPID = 'rapid',
  CLASSICAL = 'classical'
}

@Entity('user_ratings')
@Index(['userId', 'gameType'], { unique: true })
export class UserRating {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Index() 
  userId: number;

  @Column({
    type: 'enum',
    enum: GameType
  })
  @Index() 
  gameType: GameType;

  @Column({ default: 0 })
  whiteGames: number; 

  @Column({ default: 0 })
  blackGames: number; 
  @Column({ default: 1200 })
  rating: number;

  @Column({ default: 0 })
  gamesPlayed: number;

  @Column({ default: 0 })
  wins: number;

  @Column({ default: 0 })
  losses: number;

  @Column({ default: 0 })
  draws: number;

  @Column({ default: 1200 })
  peakRating: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, user => user.ratings)
  @JoinColumn({ name: 'userId' })
  user: User;

  get winRate(): number {
    return this.gamesPlayed > 0 ? Math.round((this.wins / this.gamesPlayed) * 100) : 0;
  }

  get colorBalance(): number {
    const totalGames = this.whiteGames + this.blackGames;
    if (totalGames === 0) return 0;
    return (this.whiteGames - this.blackGames) / totalGames;
  }
}