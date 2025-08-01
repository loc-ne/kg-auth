import { Controller, Get, Param, NotFoundException, BadRequestException, Body, Put, } from '@nestjs/common';
import { UserService } from './user.service';
import { GameType } from '../entities/user-rating.entity';
import { UpdateEloDto } from './dto/update-elo.dto';

@Controller('api/v1/users')
export class UserController {
    constructor(private userService: UserService) { }

    @Get(':userId/rating/:gameType/balance')
    async getUserColorBalance(
        @Param('userId') userId: string,
        @Param('gameType') gameType: string
    ) {
        try {
            const balance = await this.userService.getColorBalance(parseInt(userId), gameType as GameType);
            return {
                balance,
                userId: parseInt(userId),
                gameType
            };
        } catch (error) {
            throw new NotFoundException(`User rating not found for user ${userId}, gameType ${gameType}`);
        }
    }

    @Get(':userId/rating/:gameType')
    async getUserRating(
        @Param('userId') userId: string,
        @Param('gameType') gameType: string
    ) {
        try {
            const rating = await this.userService.getUserRating(parseInt(userId), gameType as GameType);

            if (!rating) {
                throw new NotFoundException(`Rating not found for user ${userId}, gameType ${gameType}`);
            }

            return {
                userId: parseInt(userId),
                gameType: rating.gameType,
                rating: rating.rating,
                gamesPlayed: rating.gamesPlayed,
                wins: rating.wins,
                losses: rating.losses,
                draws: rating.draws,
                peakRating: rating.peakRating,
                winRate: rating.winRate
            };
        } catch (error) {
            throw new NotFoundException(`Rating not found for user ${userId}, gameType ${gameType}`);
        }
    }

    @Get(':userId/ratings')
    async getAllUserRatings(@Param('userId') userId: string) {
        try {
            const ratings = await this.userService.getAllUserRatings(parseInt(userId));

            return {
                userId: parseInt(userId),
                ratings: ratings.map(rating => ({
                    gameType: rating.gameType,
                    rating: rating.rating,
                    gamesPlayed: rating.gamesPlayed,
                    wins: rating.wins,
                    losses: rating.losses,
                    draws: rating.draws,
                    peakRating: rating.peakRating,
                    winRate: rating.winRate
                }))
            };
        } catch (error) {
            throw new NotFoundException(`Ratings not found for user ${userId}`);
        }
    }

    @Get(':userId/elo/:gameType')
    async getUserElo(
        @Param('userId') userId: string,
        @Param('gameType') gameType: string
    ) {
        try {
            const rating = await this.userService.getUserRating(parseInt(userId), gameType as GameType);
            if (!rating) {
                throw new NotFoundException(`Elo not found for user ${userId}, gameType ${gameType}`);
            }
            return {
                elo: rating.rating
            };
        } catch (error) {
            throw new NotFoundException(`Elo not found for user ${userId}, gameType ${gameType}`);
        }
    }

    @Put(':userId/elo/:gameType')
    async updateUserElo(
        @Param('userId') userId: string,
        @Param('gameType') gameType: string,
        @Body() body: UpdateEloDto
    ) {
        try {
            await this.userService.updateRating(
                parseInt(userId),
                gameType as GameType,
                body.newRating,
                body.gameResult,
                body.color
            );
            return { success: true, message: 'Elo updated successfully' };
        } catch (error) {
            throw new BadRequestException(error.message);
        }
    }
}