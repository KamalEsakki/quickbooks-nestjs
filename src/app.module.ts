import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { QuickbooksController } from './quickbooks/quickbooks.controller';
import { CredentialsModule } from './credentials/credentials.module';

import { CredentialEntity } from './credentials/entities/credential.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],

      useFactory: (configService: ConfigService) => ({
        type: 'postgres',

        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),

        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),

        database: configService.get<string>('DB_DATABASE'),

        autoLoadEntities: true,
        synchronize: true,
      }),
    }),

    // CredentialEntity repository
    TypeOrmModule.forFeature([CredentialEntity]),

    CredentialsModule,
  ],

  controllers: [AppController, QuickbooksController],

  providers: [AppService],
})
export class AppModule {}
