import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { UserRating, GameType } from '../entities/user-rating.entity';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
    private readonly SALT_ROUNDS = 10;

    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectRepository(UserRating)
        private ratingRepository: Repository<UserRating>,
    ) { }

    async create(dto: CreateUserDto): Promise<Omit<User, 'password'>> {
        const existingUser = await this.userRepository.findOne({
            where: [
                { username: dto.username },
                { email: dto.email }
            ]
        });

        if (existingUser) {
            if (existingUser.username === dto.username) {
                throw new ConflictException('Username already exists');
            }
            if (existingUser.email === dto.email) {
                throw new ConflictException('Email already exists');
            }
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(dto.password, this.SALT_ROUNDS);

        // Create and save user
        const user = this.userRepository.create({
            ...dto,
            password: hashedPassword,
        });
        const savedUser = await this.userRepository.save(user);

        const ratings = Object.values(GameType).map(gameType => {
            return this.ratingRepository.create({
                userId: savedUser.id,
                gameType,
                rating: dto.elo,
                peakRating: dto.elo,
            });
        });

        await this.ratingRepository.save(ratings);

        const { password, ...userWithoutPassword } = savedUser;
        return userWithoutPassword;
    }

    async findByEmail(email: string): Promise<User | null> {
        return this.userRepository.findOne({
            where: { email }
        });
    }

    async findById(userId: number): Promise<User | null> {
        return this.userRepository.findOne({ where: { id: userId } });
    }

    async findByUsername(username: string): Promise<User | null> {
        return this.userRepository.findOne({
            where: { username }
        });
    }

    async findByEmailWithRatings(email: string): Promise<User | null> {
        return this.userRepository.findOne({
            where: { email },
            relations: ['ratings']
        });
    }

    async findByUsernameWithRatings(username: string): Promise<User | null> {
        return this.userRepository.findOne({
            where: { username },
            relations: ['ratings']
        });
    }

    async findByIdWithRatings(id: number): Promise<User | null> {
        return this.userRepository.findOne({
            where: { id },
            relations: ['ratings']
        });
    }

    formatUserRatings(user: User): Record<string, number> {
        const ratingsObj = {};
        user.ratings?.forEach(rating => {
            ratingsObj[rating.gameType] = rating.rating;
        });

        Object.values(GameType).forEach(gameType => {
            if (!ratingsObj[gameType]) {
                ratingsObj[gameType] = 1200;
            }
        });

        return ratingsObj;
    }

    async updateRating(
        userId: number,
        gameType: GameType,
        newRating: number,
        gameResult: 'win' | 'loss' | 'draw',
        color: 'white' | 'black'
    ): Promise<void> {
        let userRating = await this.ratingRepository.findOne({
            where: { userId, gameType }
        });

        if (!userRating) {
            throw new NotFoundException(`Rating not found for user ${userId}, gameType ${gameType}`);
        }
        if (color === 'white') {
            userRating.whiteGames++;
        }
        else {
            userRating.blackGames++;
        }
        userRating.gamesPlayed++;
        userRating[gameResult === 'win' ? 'wins' : gameResult === 'loss' ? 'losses' : 'draws']++;
        userRating.rating = newRating;

        if (newRating > userRating.peakRating) {
            userRating.peakRating = newRating;
        }

        await this.ratingRepository.save(userRating);
    }

    async getUserRating(userId: number, gameType: GameType): Promise<UserRating | null> {
        return this.ratingRepository.findOne({
            where: { userId, gameType }
        });
    }

    async getAllUserRatings(userId: number): Promise<UserRating[]> {
        return this.ratingRepository.find({
            where: { userId }
        });
    }

    async saveRefreshToken(userId: number, refreshToken: string): Promise<void> {
        await this.userRepository.update(userId, { refreshToken });
    }

    async findByRefreshToken(refreshToken: string): Promise<User | null> {
        return this.userRepository.findOne({
            where: { refreshToken }
        });
    }

    async removeRefreshToken(userId: number): Promise<void> {
        await this.userRepository.update(userId, { refreshToken: undefined });
    }

    async getColorBalance(userId: number, gameType: GameType): Promise<number> {
        const userRating = await this.ratingRepository.findOne({
            where: { userId, gameType }
        });

        if (!userRating) {
            const defaultRating = this.ratingRepository.create({
                userId,
                gameType,
                rating: 1200,
                peakRating: 1200,
                whiteGames: 0,
                blackGames: 0,
                gamesPlayed: 0,
                wins: 0,
                losses: 0,
                draws: 0
            });

            await this.ratingRepository.save(defaultRating);
            return 0;
        }

        const totalGames = userRating.whiteGames + userRating.blackGames;
        const balance = totalGames > 0 ? (userRating.whiteGames - userRating.blackGames) / totalGames : 0;

        return balance;
    }

    async updateColorHistory(
        userId: number,
        gameType: GameType,
        playerColor: 'white' | 'black'
    ): Promise<void> {
        let userRating = await this.ratingRepository.findOne({
            where: { userId, gameType }
        });

        if (!userRating) {
            userRating = this.ratingRepository.create({
                userId,
                gameType,
                rating: 1200,
                peakRating: 1200,
                whiteGames: 0,
                blackGames: 0
            });
        }

        if (playerColor === 'white') {
            userRating.whiteGames++;
        } else {
            userRating.blackGames++;
        }

        await this.ratingRepository.save(userRating);
    }
}