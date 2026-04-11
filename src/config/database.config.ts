import { ConfigService } from '@nestjs/config';
import { SequelizeModuleOptions } from '@nestjs/sequelize';

export const databaseConfig = (
  configService: ConfigService,
): SequelizeModuleOptions => ({
  dialect: 'mysql',
  host: configService.get<string>('DB_HOST'),
  port: configService.get<number>('DB_PORT'),
  username: configService.get<string>('DB_USERNAME'),
  password: configService.get<string>('DB_PASSWORD'),
  database: configService.get<string>('DB_DATABASE'),
  autoLoadModels: true,
  synchronize: true,

  logging:
    configService.get('NODE_ENV') === 'development' ? console.log : false,

  // dialectOptions: {
  //   ssl: {
  //     rejectUnauthorized: false,
  //   },
  // },
});
