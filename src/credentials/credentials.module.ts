import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CredentialEntity } from './entities/credential.entity';
import { CredentialsController } from './credentials.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CredentialEntity])],

  controllers: [CredentialsController],
})
export class CredentialsModule {}
