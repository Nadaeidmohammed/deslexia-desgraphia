import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { UsersController } from './controllers/users.controller';
import { UsersService } from './services/users.service';
import { UserProvider } from './providers/user.provider';
import { User } from './entities/user.entity';

@Module({
  imports: [SequelizeModule.forFeature([User])],
  controllers: [UsersController],
  providers: [UsersService, UserProvider],
  exports: [UsersService, SequelizeModule],
})
export class UsersModule {}
