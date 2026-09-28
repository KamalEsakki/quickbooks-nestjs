import { Body, Controller, Get, Post } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CredentialEntity } from './entities/credential.entity';

@Controller('credentials')
export class CredentialsController {
  constructor(
    @InjectRepository(CredentialEntity)
    private readonly credentialRepository: Repository<CredentialEntity>,
  ) {}

  @Get()
  async getCredentials() {
    return await this.credentialRepository.find();
  }

  @Post()
  async credentials(@Body() reqBody: any) {
    const { action } = reqBody;

    if (!action) {
      return {
        message: 'Action is required',
      };
    }

    if (action === 'create') {
      const trimmedRealmId = String(reqBody.realmId).trim();
      const existing = await this.credentialRepository.findOne({
        where: { realmId: trimmedRealmId },
        order: { id: 'DESC' },
      });

      if (existing) {
        existing.accessToken = reqBody.accessToken;
        existing.refreshToken = reqBody.refreshToken;
        if (reqBody.expiresAt !== undefined) {
          existing.expiresAt = reqBody.expiresAt
            ? new Date(reqBody.expiresAt)
            : undefined;
        }
        return await this.credentialRepository.save(existing);
      }

      const credential = this.credentialRepository.create({
        realmId: trimmedRealmId,
        accessToken: reqBody.accessToken,
        refreshToken: reqBody.refreshToken,
        expiresAt: reqBody.expiresAt ? new Date(reqBody.expiresAt) : undefined,
      });

      return await this.credentialRepository.save(credential);
    }

    if (action === 'get') {
      if (reqBody.id) {
        return await this.credentialRepository.findOne({
          where: {
            id: Number(reqBody.id),
          },
        });
      }

      if (reqBody.realmId) {
        return await this.credentialRepository.findOne({
          where: {
            realmId: String(reqBody.realmId).trim(),
          },
          order: { id: 'DESC' },
        });
      }

      return null;
    }

    if (action === 'update') {
      await this.credentialRepository.update(Number(reqBody.id), {
        realmId: reqBody.realmId,
        accessToken: reqBody.accessToken,
        refreshToken: reqBody.refreshToken,
        expiresAt: reqBody.expiresAt ? new Date(reqBody.expiresAt) : undefined,
      });

      return await this.credentialRepository.findOne({
        where: {
          id: Number(reqBody.id),
        },
      });
    }

    if (action === 'delete') {
      await this.credentialRepository.delete(Number(reqBody.id));

      return {
        message: 'Credential deleted successfully',
      };
    }

    return {
      message: 'Invalid action',
    };
  }
}
