import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Req,
  Res,
  Post,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import axios from 'axios';

import { CredentialEntity } from '../credentials/entities/credential.entity';
import { REPORT_MODULES, ENTITY_CONFIG } from './quickbooks.config';

@Controller('quickbooks')
export class QuickbooksController {
  constructor(
    private readonly configService: ConfigService,

    @InjectRepository(CredentialEntity)
    private readonly credentialRepository: Repository<CredentialEntity>,
  ) { }

  // GET - QuickBooks OAuth Initiate (Browser Flow)
  @Get('auth')
  async auth(@Res() res: Response) {
    const clientId = this.configService
      .get<string>('QUICKBOOKS_CLIENT_ID')
      ?.trim();

    const redirectUri = this.configService
      .get<string>('QUICKBOOKS_REDIRECT_URI')
      ?.trim();

    if (!clientId || !redirectUri) {
      throw new HttpException(
        'QuickBooks OAuth configuration is missing',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const authUrl =
      'https://appcenter.intuit.com/connect/oauth2' +
      '?client_id=' +
      clientId +
      '&redirect_uri=' +
      encodeURIComponent(redirectUri) +
      '&response_type=code' +
      '&scope=com.intuit.quickbooks.accounting' +
      '&state=quickbooks';

    return res.redirect(authUrl);
  }

  // GET - OAuth Callback (Browser Flow)
  @Get('callback')
  async callback(@Req() req: Request) {
    try {
      const code = (req.query.code as string)?.trim();
      const state = (req.query.state as string)?.trim() || 'quickbooks';
      const realmId = (
        (req.query.realmId as string) ||
        (req.query.realm_id as string) ||
        (req.query.realmid as string)
      )?.trim();

      if (!code) {
        throw new HttpException(
          'Missing authorization code in query',
          HttpStatus.BAD_REQUEST,
        );
      }

      if (!realmId) {
        throw new HttpException(
          'Missing realmId in query',
          HttpStatus.BAD_REQUEST,
        );
      }

      const clientId = this.configService
        .get<string>('QUICKBOOKS_CLIENT_ID')
        ?.trim();

      const clientSecret = this.configService
        .get<string>('QUICKBOOKS_CLIENT_SECRET')
        ?.trim();

      const redirectUri = this.configService
        .get<string>('QUICKBOOKS_REDIRECT_URI')
        ?.trim();

      if (!clientId || !clientSecret || !redirectUri) {
        throw new HttpException(
          'QuickBooks OAuth configuration is missing',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const formData = new URLSearchParams();
      formData.append('grant_type', 'authorization_code');
      formData.append('redirect_uri', redirectUri);
      formData.append('code', code);

      const tokenResponse = await axios.post(
        'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
        formData.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
            Authorization:
              'Basic ' +
              Buffer.from(clientId + ':' + clientSecret).toString('base64'),
          },
        },
      );

      const tokens = tokenResponse.data;
      const accessToken = tokens.access_token || tokens.accessToken;
      const refreshToken = tokens.refresh_token || tokens.refreshToken;
      const expiresIn = Number(tokens.expires_in || tokens.expiresIn || 3600);

      if (!accessToken || !refreshToken) {
        throw new HttpException(
          'Intuit did not return valid tokens',
          HttpStatus.BAD_GATEWAY,
        );
      }

      const trimmedRealmId = String(realmId).trim();
      const expiresAtDate = new Date(Date.now() + expiresIn * 1000);

      let existingCredential = await this.credentialRepository.findOne({
        where: { realmId: trimmedRealmId },
        order: { id: 'DESC' },
      });

      let savedCredential: CredentialEntity;
      if (existingCredential) {
        existingCredential.accessToken = accessToken;
        existingCredential.refreshToken = refreshToken;
        existingCredential.expiresAt = expiresAtDate;

        savedCredential =
          await this.credentialRepository.save(existingCredential);
      } else {
        const credential = this.credentialRepository.create({
          realmId: trimmedRealmId,
          accessToken: accessToken,
          refreshToken: refreshToken,
          expiresAt: expiresAtDate,
        });

        savedCredential = await this.credentialRepository.save(credential);
      }

      return {
        message: 'QuickBooks OAuth successful',
        state,
        realmId: trimmedRealmId,
        credentialId: savedCredential.id,
        expiresAt: savedCredential.expiresAt,
        expiresIn,
      };
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        error.response?.data || error.message || 'QuickBooks OAuth error',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Module: oauth
  @Post('oauth/authorize')
  async authorize(@Body() data: any) {
    try {
      const clientId = this.configService
        .get<string>('QUICKBOOKS_CLIENT_ID')
        ?.trim();
      const redirectUri = this.configService
        .get<string>('QUICKBOOKS_REDIRECT_URI')
        ?.trim();

      if (!clientId || !redirectUri) {
        throw new HttpException(
          'QuickBooks OAuth configuration is missing',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const authUrl =
        'https://appcenter.intuit.com/connect/oauth2' +
        '?client_id=' +
        clientId +
        '&redirect_uri=' +
        encodeURIComponent(redirectUri) +
        '&response_type=code' +
        '&scope=com.intuit.quickbooks.accounting' +
        '&state=quickbooks';

      return {
        message: 'QuickBooks OAuth authorize URL generated successfully',
        response: { url: authUrl },
        status: HttpStatus.OK,
      };
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        error.message || 'QuickBooks authorize error',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Module: oauth
  @Post('oauth/callback')
  async callbackOAuth(@Body() data: any) {
    if (!data) {
      throw new HttpException(
        'Request body cannot be empty',
        HttpStatus.BAD_REQUEST,
      );
    }
    const { code, realmId } = data;
    const state = data.state || 'quickbooks';

    if (!code || !realmId) {
      throw new HttpException(
        'code and realmId are required',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const clientId = this.configService
        .get<string>('QUICKBOOKS_CLIENT_ID')
        ?.trim();
      const clientSecret = this.configService
        .get<string>('QUICKBOOKS_CLIENT_SECRET')
        ?.trim();
      const redirectUri = this.configService
        .get<string>('QUICKBOOKS_REDIRECT_URI')
        ?.trim();

      if (!clientId || !clientSecret || !redirectUri) {
        throw new HttpException(
          'QuickBooks OAuth configuration is missing',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const formData = new URLSearchParams();
      formData.append('grant_type', 'authorization_code');
      formData.append('redirect_uri', redirectUri);
      formData.append('code', String(code).trim());

      const tokenResponse = await axios.post(
        'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
        formData.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
            Authorization:
              'Basic ' +
              Buffer.from(clientId + ':' + clientSecret).toString('base64'),
          },
        },
      );

      const tokens = tokenResponse.data;
      const accessToken = tokens.access_token || tokens.accessToken;
      const refreshToken = tokens.refresh_token || tokens.refreshToken;
      const expiresIn = Number(tokens.expires_in || tokens.expiresIn || 3600);

      if (!accessToken || !refreshToken) {
        throw new HttpException(
          'Intuit did not return valid tokens',
          HttpStatus.BAD_GATEWAY,
        );
      }

      const trimmedRealmId = String(realmId).trim();
      const expiresAtDate = new Date(Date.now() + expiresIn * 1000);

      let existingCredential = await this.credentialRepository.findOne({
        where: { realmId: trimmedRealmId },
        order: { id: 'DESC' },
      });

      let savedCredential: CredentialEntity;
      if (existingCredential) {
        existingCredential.accessToken = accessToken;
        existingCredential.refreshToken = refreshToken;
        existingCredential.expiresAt = expiresAtDate;
        savedCredential =
          await this.credentialRepository.save(existingCredential);
      } else {
        const credential = this.credentialRepository.create({
          realmId: trimmedRealmId,
          accessToken: accessToken,
          refreshToken: refreshToken,
          expiresAt: expiresAtDate,
        });
        savedCredential = await this.credentialRepository.save(credential);
      }

      return {
        message: 'QuickBooks OAuth callback executed successfully',
        response: {
          state,
          realmId: trimmedRealmId,
          credentialId: savedCredential.id,
          expiresAt: savedCredential.expiresAt,
          expiresIn,
        },
        status: HttpStatus.OK,
      };
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        error.response?.data || error.message || 'QuickBooks OAuth error',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Module: oauth
  @Post('oauth/refreshToken')
  async refreshToken(@Body() data: any) {
    if (!data) {
      throw new HttpException(
        'Request body cannot be empty',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (!data.realmId) {
      throw new HttpException('realmId is required', HttpStatus.BAD_REQUEST);
    }

    try {
      const credential = await this.credentialRepository.findOne({
        where: { realmId: String(data.realmId).trim() },
        order: { id: 'DESC' },
      });

      if (!credential) {
        throw new HttpException(
          'Credentials not found for realmId ' + data.realmId,
          HttpStatus.NOT_FOUND,
        );
      }

      if (data.refreshToken) {
        credential.refreshToken = String(data.refreshToken).trim();
      }

      const result = await this.refreshTokenInternal(credential);
      return {
        message: 'QuickBooks token refreshed successfully',
        response: result,
        status: HttpStatus.OK,
      };
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        error.response?.data ||
        error.message ||
        'QuickBooks token refresh error',
        error.status ||
        error.response?.status ||
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Module:
  // Module: credentials
  @Post('credentials/create')
  async createCredential(@Body() data: any) {
    if (!data) {
      throw new HttpException(
        'Request body cannot be empty',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (!data.realmId || !data.accessToken || !data.refreshToken) {
      throw new HttpException(
        'realmId, accessToken, and refreshToken are required',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const trimmedRealmId = String(data.realmId).trim();
      const existing = await this.credentialRepository.findOne({
        where: { realmId: trimmedRealmId },
        order: { id: 'DESC' },
      });

      if (existing) {
        existing.accessToken = data.accessToken;
        existing.refreshToken = data.refreshToken;
        if (data.expiresAt !== undefined) {
          existing.expiresAt = data.expiresAt
            ? new Date(data.expiresAt)
            : undefined;
        }
        const result = await this.credentialRepository.save(existing);
        return {
          message: 'QuickBooks credential created successfully',
          response: result,
          status: HttpStatus.OK,
        };
      }

      const credential = this.credentialRepository.create({
        realmId: trimmedRealmId,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      });

      const result = await this.credentialRepository.save(credential);
      return {
        message: 'QuickBooks credential created successfully',
        response: result,
        status: HttpStatus.OK,
      };
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        error.message || 'Credential create error',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Module: credentials
  @Post('credentials/get')
  async getCredential(@Body() data: any) {
    if (!data) {
      throw new HttpException(
        'Request body cannot be empty',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      let credential: CredentialEntity | null = null;
      if (data.id) {
        credential = await this.credentialRepository.findOne({
          where: { id: Number(data.id) },
        });
      } else if (data.realmId) {
        credential = await this.credentialRepository.findOne({
          where: { realmId: String(data.realmId).trim() },
          order: { id: 'DESC' },
        });
      } else {
        throw new HttpException(
          'Credential id or realmId is required',
          HttpStatus.BAD_REQUEST,
        );
      }

      if (!credential) {
        throw new HttpException('Credentials not found', HttpStatus.NOT_FOUND);
      }

      return {
        message: 'QuickBooks credential retrieved successfully',
        response: credential,
        status: HttpStatus.OK,
      };
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        error.message || 'Credential get error',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Module: credentials
  @Post('credentials/update')
  async updateCredential(@Body() data: any) {
    if (!data) {
      throw new HttpException(
        'Request body cannot be empty',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      let credential: CredentialEntity | null = null;
      if (data.id) {
        credential = await this.credentialRepository.findOne({
          where: { id: Number(data.id) },
        });
      } else if (data.realmId) {
        credential = await this.credentialRepository.findOne({
          where: { realmId: String(data.realmId).trim() },
          order: { id: 'DESC' },
        });
      } else {
        throw new HttpException(
          'Credential id or realmId is required',
          HttpStatus.BAD_REQUEST,
        );
      }

      if (!credential) {
        throw new HttpException('Credentials not found', HttpStatus.NOT_FOUND);
      }

      if (data.realmId !== undefined)
        credential.realmId = String(data.realmId).trim();
      if (data.accessToken !== undefined)
        credential.accessToken = data.accessToken;
      if (data.refreshToken !== undefined)
        credential.refreshToken = data.refreshToken;
      if (data.expiresAt !== undefined)
        credential.expiresAt = new Date(data.expiresAt);

      const result = await this.credentialRepository.save(credential);
      return {
        message: 'QuickBooks credential updated successfully',
        response: result,
        status: HttpStatus.OK,
      };
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        error.message || 'Credential update error',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Module: credentials
  @Post('credentials/delete')
  async deleteCredential(@Body() data: any) {
    if (!data) {
      throw new HttpException(
        'Request body cannot be empty',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      let credential: CredentialEntity | null = null;
      if (data.id) {
        credential = await this.credentialRepository.findOne({
          where: { id: Number(data.id) },
        });
      } else if (data.realmId) {
        credential = await this.credentialRepository.findOne({
          where: { realmId: String(data.realmId).trim() },
          order: { id: 'DESC' },
        });
      } else {
        throw new HttpException(
          'Credential id or realmId is required',
          HttpStatus.BAD_REQUEST,
        );
      }

      if (!credential) {
        throw new HttpException('Credentials not found', HttpStatus.NOT_FOUND);
      }

      await this.credentialRepository.delete(credential.id);
      return {
        message: 'Credential deleted successfully',
        response: { id: credential.id },
        status: HttpStatus.OK,
      };
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        error.message || 'Credential delete error',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Module:
  // Module: account
  @Post('account/create')
  async createAccount(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: account
  @Post('account/query')
  async queryAccount(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: account
  @Post('account/get')
  async getAccount(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: account
  @Post('account/update')
  async updateAccount(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module:
  // Module: accountListDetail
  @Post('accountListDetail/get')
  async getAccountListDetail(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: accountListDetail
  @Post('accountListDetail/getMany')
  async getmanyAccountListDetail(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module:
  // Module: apAgingDetail
  @Post('apAgingDetail/get')
  async getAPAgingDetail(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module:
  // Module: apAgingSummary
  @Post('apAgingSummary/get')
  async getAPAgingSummary(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module:
  // Module: arAgingDetail
  @Post('arAgingDetail/get')
  async getARAgingDetail(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module:
  // Module: arAgingSummary
  @Post('arAgingSummary/get')
  async getARAgingSummary(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module:
  // Module: attachable
  @Post('attachable/create')
  async createAttachable(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: attachable
  @Post('attachable/update')
  async updateAttachable(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: attachable
  @Post('attachable/get')
  async getAttachable(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: attachable
  @Post('attachable/getMany')
  async getmanyAttachable(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: attachable
  @Post('attachable/delete')
  async deleteAttachable(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module:
  // Module: balanceSheet
  @Post('balanceSheet/get')
  async getBalanceSheet(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module:
  // Module: batch
  @Post('batch/create')
  async createBatch(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module:
  // Module: bill
  @Post('bill/create')
  async createBill(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: bill
  @Post('bill/update')
  async updateBill(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: bill
  @Post('bill/get')
  async getBill(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: bill
  @Post('bill/getMany')
  async getmanyBill(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: bill
  @Post('bill/delete')
  async deleteBill(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module:
  // Module: billPayment
  @Post('billPayment/create')
  async createBillPayment(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: billPayment
  @Post('billPayment/update')
  async updateBillPayment(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: billPayment
  @Post('billPayment/get')
  async getBillPayment(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: billPayment
  @Post('billPayment/getMany')
  async getmanyBillPayment(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: billPayment
  @Post('billPayment/delete')
  async deleteBillPayment(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module:
  // Module: budget
  @Post('budget/create')
  async createBudget(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: budget
  @Post('budget/update')
  async updateBudget(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: budget
  @Post('budget/get')
  async getBudget(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: budget
  @Post('budget/getMany')
  async getmanyBudget(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: budget
  @Post('budget/delete')
  async deleteBudget(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module:
  // Module: cashFlow
  @Post('cashFlow/get')
  async getCashFlow(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module:
  // Module: changeDataCapture
  @Post('changeDataCapture/get')
  async getChangeDataCapture(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module:
  // Module: changeOrder
  @Post('changeOrder/create')
  async createChangeOrder(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: changeOrder
  @Post('changeOrder/update')
  async updateChangeOrder(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: changeOrder
  @Post('changeOrder/get')
  async getChangeOrder(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: changeOrder
  @Post('changeOrder/getMany')
  async getmanyChangeOrder(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module:
  // Module: class
  @Post('class/create')
  async createClass(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: class
  @Post('class/update')
  async updateClass(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: class
  @Post('class/get')
  async getClass(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: class
  @Post('class/getMany')
  async getmanyClass(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: class
  @Post('class/delete')
  async deleteClass(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module:
  // Module: companyCurrency
  @Post('companyCurrency/get')
  async getCompanyCurrency(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: companyCurrency
  @Post('companyCurrency/getMany')
  async getmanyCompanyCurrency(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module:
  // Module: companyInfo
  @Post('companyInfo/get')
  async getCompanyInfo(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: companyInfo
  @Post('companyInfo/update')
  async updateCompanyInfo(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module:
  // Module: creditMemo
  @Post('creditMemo/create')
  async createCreditMemo(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: creditMemo
  @Post('creditMemo/update')
  async updateCreditMemo(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: creditMemo
  @Post('creditMemo/get')
  async getCreditMemo(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: creditMemo
  @Post('creditMemo/getMany')
  async getmanyCreditMemo(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: creditMemo
  @Post('creditMemo/delete')
  async deleteCreditMemo(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module:
  // Module: creditCardPayment
  @Post('creditCardPayment/create')
  async createCreditCardPayment(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: creditCardPayment
  @Post('creditCardPayment/get')
  async getCreditCardPayment(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: creditCardPayment
  @Post('creditCardPayment/getMany')
  async getmanyCreditCardPayment(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module:
  // Module: customer
  @Post('customer/create')
  async createCustomer(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: customer
  @Post('customer/update')
  async updateCustomer(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: customer
  @Post('customer/get')
  async getCustomer(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: customer
  @Post('customer/getMany')
  async getmanyCustomer(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: customer
  @Post('customer/delete')
  async deleteCustomer(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module:
  // Module: customerBalance
  @Post('customerBalance/get')
  async getCustomerBalance(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module:
  // Module: customerBalanceDetail
  @Post('customerBalanceDetail/get')
  async getCustomerBalanceDetail(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module:
  // Module: customerIncome
  @Post('customerIncome/get')
  async getCustomerIncome(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module:
  // Module: customerType
  @Post('customerType/create')
  async createCustomerType(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: customerType
  @Post('customerType/update')
  async updateCustomerType(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: customerType
  @Post('customerType/get')
  async getCustomerType(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: customerType
  @Post('customerType/getMany')
  async getmanyCustomerType(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: customerType
  @Post('customerType/delete')
  async deleteCustomerType(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module:
  // Module: department
  @Post('department/create')
  async createDepartment(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: department
  @Post('department/update')
  async updateDepartment(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: department
  @Post('department/get')
  async getDepartment(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: department
  @Post('department/getMany')
  async getmanyDepartment(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: department
  @Post('department/delete')
  async deleteDepartment(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module:
  // Module: deposit
  @Post('deposit/create')
  async createDeposit(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: deposit
  @Post('deposit/update')
  async updateDeposit(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: deposit
  @Post('deposit/get')
  async getDeposit(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: deposit
  @Post('deposit/getMany')
  async getmanyDeposit(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: deposit
  @Post('deposit/delete')
  async deleteDeposit(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module:
  // Module: employee
  @Post('employee/create')
  async createEmployee(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: employee
  @Post('employee/update')
  async updateEmployee(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: employee
  @Post('employee/get')
  async getEmployee(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: employee
  @Post('employee/getMany')
  async getmanyEmployee(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: employee
  @Post('employee/delete')
  async deleteEmployee(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module:
  // Module: entitlements
  @Post('entitlements/get')
  async getEntitlements(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module:
  // Module: estimate
  @Post('estimate/create')
  async createEstimate(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: estimate
  @Post('estimate/update')
  async updateEstimate(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: estimate
  @Post('estimate/get')
  async getEstimate(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: estimate
  @Post('estimate/getMany')
  async getmanyEstimate(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: estimate
  @Post('estimate/delete')
  async deleteEstimate(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module:
  // Module: exchangeRate
  @Post('exchangeRate/get')
  async getExchangeRate(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: exchangeRate
  @Post('exchangeRate/getMany')
  async getmanyExchangeRate(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module:
  // Module: generalLedger
  @Post('generalLedger/get')
  async getGeneralLedger(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module:
  // Module: inventoryAdjustment
  @Post('inventoryAdjustment/create')
  async createInventoryAdjustment(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: inventoryAdjustment
  @Post('inventoryAdjustment/update')
  async updateInventoryAdjustment(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: inventoryAdjustment
  @Post('inventoryAdjustment/get')
  async getInventoryAdjustment(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: inventoryAdjustment
  @Post('inventoryAdjustment/getMany')
  async getmanyInventoryAdjustment(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module:
  // Module: inventoryValuationDetail
  @Post('inventoryValuationDetail/get')
  async getInventoryValuationDetail(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module:
  // Module: inventoryValuationSummary
  @Post('inventoryValuationSummary/get')
  async getInventoryValuationSummary(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module:
  // Module: invoice
  @Post('invoice/create')
  async createInvoice(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: invoice
  @Post('invoice/update')
  async updateInvoice(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: invoice
  @Post('invoice/get')
  async getInvoice(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: invoice
  @Post('invoice/getMany')
  async getmanyInvoice(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: invoice
  @Post('invoice/delete')
  async deleteInvoice(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: invoice
  @Post('invoice/send')
  async sendInvoice(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module:
  // Module: item
  @Post('item/create')
  async createItem(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: item
  @Post('item/update')
  async updateItem(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: item
  @Post('item/get')
  async getItem(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: item
  @Post('item/getMany')
  async getmanyItem(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: item
  @Post('item/delete')
  async deleteItem(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module:
  // Module: journalEntry
  @Post('journalEntry/create')
  async createJournalEntry(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: journalEntry
  @Post('journalEntry/update')
  async updateJournalEntry(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: journalEntry
  @Post('journalEntry/get')
  async getJournalEntry(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: journalEntry
  @Post('journalEntry/getMany')
  async getmanyJournalEntry(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: journalEntry
  @Post('journalEntry/delete')
  async deleteJournalEntry(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module:
  // Module: journalReport
  @Post('journalReport/get')
  async getJournalReport(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module:
  // Module: payment
  @Post('payment/create')
  async createPayment(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: payment
  @Post('payment/update')
  async updatePayment(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: payment
  @Post('payment/get')
  async getPayment(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: payment
  @Post('payment/getMany')
  async getmanyPayment(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: payment
  @Post('payment/delete')
  async deletePayment(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module:
  // Module: paymentMethod
  @Post('paymentMethod/create')
  async createPaymentMethod(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: paymentMethod
  @Post('paymentMethod/update')
  async updatePaymentMethod(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: paymentMethod
  @Post('paymentMethod/get')
  async getPaymentMethod(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: paymentMethod
  @Post('paymentMethod/getMany')
  async getmanyPaymentMethod(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: paymentMethod
  @Post('paymentMethod/delete')
  async deletePaymentMethod(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module:
  // Module: preferences
  @Post('preferences/get')
  async getPreferences(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: preferences
  @Post('preferences/update')
  async updatePreferences(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module:
  // Module: profitAndLoss
  @Post('profitAndLoss/get')
  async getProfitAndLoss(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module:
  // Module: profitAndLossDetail
  @Post('profitAndLossDetail/get')
  async getProfitAndLossDetail(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module:
  // Module: purchase
  @Post('purchase/create')
  async createPurchase(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: purchase
  @Post('purchase/update')
  async updatePurchase(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: purchase
  @Post('purchase/get')
  async getPurchase(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: purchase
  @Post('purchase/getMany')
  async getmanyPurchase(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: purchase
  @Post('purchase/delete')
  async deletePurchase(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module:
  // Module: purchaseOrder
  @Post('purchaseOrder/create')
  async createPurchaseOrder(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: purchaseOrder
  @Post('purchaseOrder/update')
  async updatePurchaseOrder(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: purchaseOrder
  @Post('purchaseOrder/get')
  async getPurchaseOrder(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: purchaseOrder
  @Post('purchaseOrder/getMany')
  async getmanyPurchaseOrder(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: purchaseOrder
  @Post('purchaseOrder/delete')
  async deletePurchaseOrder(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module:
  // Module: recurringTransaction
  @Post('recurringTransaction/create')
  async createRecurringTransaction(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: recurringTransaction
  @Post('recurringTransaction/update')
  async updateRecurringTransaction(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: recurringTransaction
  @Post('recurringTransaction/get')
  async getRecurringTransaction(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: recurringTransaction
  @Post('recurringTransaction/getMany')
  async getmanyRecurringTransaction(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: recurringTransaction
  @Post('recurringTransaction/delete')
  async deleteRecurringTransaction(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module:
  // Module: refundReceipt
  @Post('refundReceipt/create')
  async createRefundReceipt(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: refundReceipt
  @Post('refundReceipt/update')
  async updateRefundReceipt(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: refundReceipt
  @Post('refundReceipt/get')
  async getRefundReceipt(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: refundReceipt
  @Post('refundReceipt/getMany')
  async getmanyRefundReceipt(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: refundReceipt
  @Post('refundReceipt/delete')
  async deleteRefundReceipt(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module:
  // Module: reimburseCharge
  @Post('reimburseCharge/create')
  async createReimburseCharge(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: reimburseCharge
  @Post('reimburseCharge/update')
  async updateReimburseCharge(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: reimburseCharge
  @Post('reimburseCharge/get')
  async getReimburseCharge(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: reimburseCharge
  @Post('reimburseCharge/getMany')
  async getmanyReimburseCharge(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: reimburseCharge
  @Post('reimburseCharge/delete')
  async deleteReimburseCharge(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module:
  // Module: salesByClassSummary
  @Post('salesByClassSummary/get')
  async getSalesByClassSummary(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module:
  // Module: salesByCustomer
  @Post('salesByCustomer/get')
  async getSalesByCustomer(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module:
  // Module: salesByDepartment
  @Post('salesByDepartment/get')
  async getSalesByDepartment(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module:
  // Module: salesByProduct
  @Post('salesByProduct/get')
  async getSalesByProduct(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module:
  // Module: salesReceipt
  @Post('salesReceipt/create')
  async createSalesReceipt(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: salesReceipt
  @Post('salesReceipt/update')
  async updateSalesReceipt(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: salesReceipt
  @Post('salesReceipt/get')
  async getSalesReceipt(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: salesReceipt
  @Post('salesReceipt/getMany')
  async getmanySalesReceipt(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: salesReceipt
  @Post('salesReceipt/delete')
  async deleteSalesReceipt(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module:
  // Module: taxClassification
  @Post('taxClassification/get')
  async getTaxClassification(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module:
  // Module: taxCode
  @Post('taxCode/create')
  async createTaxCode(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: taxCode
  @Post('taxCode/update')
  async updateTaxCode(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: taxCode
  @Post('taxCode/get')
  async getTaxCode(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: taxCode
  @Post('taxCode/getMany')
  async getmanyTaxCode(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: taxCode
  @Post('taxCode/delete')
  async deleteTaxCode(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module:
  // Module: taxPayment
  @Post('taxPayment/create')
  async createTaxPayment(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: taxPayment
  @Post('taxPayment/update')
  async updateTaxPayment(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: taxPayment
  @Post('taxPayment/get')
  async getTaxPayment(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: taxPayment
  @Post('taxPayment/getMany')
  async getmanyTaxPayment(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: taxPayment
  @Post('taxPayment/delete')
  async deleteTaxPayment(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module:
  // Module: taxRate
  @Post('taxRate/create')
  async createTaxRate(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: taxRate
  @Post('taxRate/update')
  async updateTaxRate(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: taxRate
  @Post('taxRate/get')
  async getTaxRate(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: taxRate
  @Post('taxRate/getMany')
  async getmanyTaxRate(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: taxRate
  @Post('taxRate/delete')
  async deleteTaxRate(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module:
  // Module: taxService
  @Post('taxService/get')
  async getTaxService(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module:
  // Module: taxSummary
  @Post('taxSummary/get')
  async getTaxSummary(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module:
  // Module: taxAgency
  @Post('taxAgency/create')
  async createTaxAgency(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: taxAgency
  @Post('taxAgency/update')
  async updateTaxAgency(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: taxAgency
  @Post('taxAgency/get')
  async getTaxAgency(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: taxAgency
  @Post('taxAgency/getMany')
  async getmanyTaxAgency(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: taxAgency
  @Post('taxAgency/delete')
  async deleteTaxAgency(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module:
  // Module: term
  @Post('term/create')
  async createTerm(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: term
  @Post('term/update')
  async updateTerm(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: term
  @Post('term/get')
  async getTerm(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: term
  @Post('term/getMany')
  async getmanyTerm(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: term
  @Post('term/delete')
  async deleteTerm(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module:
  // Module: timeActivity
  @Post('timeActivity/create')
  async createTimeActivity(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: timeActivity
  @Post('timeActivity/update')
  async updateTimeActivity(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: timeActivity
  @Post('timeActivity/get')
  async getTimeActivity(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: timeActivity
  @Post('timeActivity/getMany')
  async getmanyTimeActivity(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: timeActivity
  @Post('timeActivity/delete')
  async deleteTimeActivity(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module:
  // Module: transactionList
  @Post('transactionList/get')
  async getTransactionList(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module:
  // Module: transactionListByVendor
  @Post('transactionListByVendor/get')
  async getTransactionListByVendor(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module:
  // Module: transactionListByCustomer
  @Post('transactionListByCustomer/get')
  async getTransactionListByCustomer(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module:
  // Module: transactionListWithSplits
  @Post('transactionListWithSplits/get')
  async getTransactionListWithSplits(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module:
  // Module: transfer
  @Post('transfer/create')
  async createTransfer(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: transfer
  @Post('transfer/update')
  async updateTransfer(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: transfer
  @Post('transfer/get')
  async getTransfer(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: transfer
  @Post('transfer/getMany')
  async getmanyTransfer(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: transfer
  @Post('transfer/delete')
  async deleteTransfer(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module:
  // Module: trialBalance
  @Post('trialBalance/get')
  async getTrialBalance(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module:
  // Module: vendor
  @Post('vendor/create')
  async createVendor(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: vendor
  @Post('vendor/update')
  async updateVendor(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: vendor
  @Post('vendor/get')
  async getVendor(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: vendor
  @Post('vendor/getMany')
  async getmanyVendor(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: vendor
  @Post('vendor/delete')
  async deleteVendor(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module:
  // Module: vendorBalance
  @Post('vendorBalance/get')
  async getVendorBalance(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module:
  // Module: vendorBalanceDetail
  @Post('vendorBalanceDetail/get')
  async getVendorBalanceDetail(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module:
  // Module: vendorCredit
  @Post('vendorCredit/create')
  async createVendorCredit(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: vendorCredit
  @Post('vendorCredit/update')
  async updateVendorCredit(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: vendorCredit
  @Post('vendorCredit/get')
  async getVendorCredit(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: vendorCredit
  @Post('vendorCredit/getMany')
  async getmanyVendorCredit(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module: vendorCredit
  @Post('vendorCredit/delete')
  async deleteVendorCredit(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Module:
  // Module: vendorExpenses
  @Post('vendorExpenses/get')
  async getVendorExpenses(@Body() data: any) {
    return await this.handleQuickBooksOperation(data, () =>
      this.performQuickBooksAction(data),
    );
  }

  // Helper: handleQuickBooksOperation
  async handleQuickBooksOperation(data: any, operationFn: () => Promise<any>) {
    if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
      throw new HttpException(
        'Request body cannot be empty',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!data.realmId) {
      throw new HttpException('realmId is required', HttpStatus.BAD_REQUEST);
    }

    if (!data.module) {
      throw new HttpException('module is required', HttpStatus.BAD_REQUEST);
    }


    if (!data.action) {
      throw new HttpException('action is required', HttpStatus.BAD_REQUEST);
    }

    if (!data.method) {
      throw new HttpException('method is required', HttpStatus.BAD_REQUEST);
    }

    const operationName = `${data.module} ${data.action}`;

    try {
      const result = await operationFn();
      return {
        message: `QuickBooks ${operationName} executed successfully`,
        response: result,
        status: HttpStatus.OK,
      };
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        error.response?.data ||
        error.message ||
        `QuickBooks ${operationName} error`,
        error.status ||
        error.response?.status ||
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Helper: performQuickBooksAction
  async performQuickBooksAction(data: any): Promise<any> {
    return await this.curl(data.module, data.action, data.method, data);
  }

  // Helper: curl
  async curl(
    module: string,
    action: string,
    method: string,
    argumentdata: any,
  ): Promise<any> {
    const realmId = argumentdata?.realmId
      ? String(argumentdata.realmId).trim()
      : '';
    if (!realmId) {
      throw new HttpException('realmId is required', HttpStatus.BAD_REQUEST);
    }

    const mod = (module || argumentdata?.module || '').trim();
    if (!mod) {
      throw new HttpException('module is required', HttpStatus.BAD_REQUEST);
    }

    const act = (action || argumentdata?.action || '').trim();
    if (!act) {
      throw new HttpException('action is required', HttpStatus.BAD_REQUEST);
    }

    const httpMethod = (
      method ||
      argumentdata?.method ||
      'GET'
    ).toUpperCase() as 'GET' | 'POST';

    // Extract payload data
    let innerData = argumentdata.data;
    if (innerData === undefined || innerData === null) {
      innerData = {};
    }

    // Load latest credentials from PostgreSQL
    const credential = await this.credentialRepository.findOne({
      where: {
        realmId,
      },
      order: {
        id: 'DESC',
      },
    });

    if (!credential) {
      throw new HttpException(
        `Credentials not found for realmId ${realmId}`,
        HttpStatus.NOT_FOUND,
      );
    }

    let reqPath = '';
    let reqMethod: 'GET' | 'POST' = httpMethod;
    let reqParams: Record<string, any> | undefined = undefined;
    let reqBodyData: any = undefined;

    // 1. Account module special handling
    if (mod === 'account') {
      if (act === 'create') {
        reqPath = 'account';
        reqMethod = 'POST';
        const name = innerData.name || innerData.Name;
        const accountType = innerData.accountType || innerData.AccountType;
        if (!name) {
          throw new HttpException(
            'Account name is required',
            HttpStatus.BAD_REQUEST,
          );
        }
        if (!accountType) {
          throw new HttpException(
            'Account type is required',
            HttpStatus.BAD_REQUEST,
          );
        }
        const payload: Record<string, any> = {
          Name: name,
          AccountType: accountType,
        };
        if (innerData.accountSubType || innerData.AccountSubType) {
          payload.AccountSubType =
            innerData.accountSubType || innerData.AccountSubType;
        }
        for (const key of Object.keys(innerData)) {
          if (
            ![
              'name',
              'Name',
              'accountType',
              'AccountType',
              'accountSubType',
              'AccountSubType',
            ].includes(key)
          ) {
            payload[key] = innerData[key];
          }
        }
        reqBodyData = payload;
      } else if (act === 'update') {
        reqPath = 'account';
        reqMethod = 'POST';
        const accountId = innerData.id ?? innerData.Id;
        const syncToken = innerData.syncToken ?? innerData.SyncToken;
        if (!accountId) {
          throw new HttpException(
            'Account id is required',
            HttpStatus.BAD_REQUEST,
          );
        }
        if (syncToken === undefined || syncToken === null) {
          throw new HttpException(
            'SyncToken is required',
            HttpStatus.BAD_REQUEST,
          );
        }
        const name = innerData.name || innerData.Name;
        const accountType = innerData.accountType || innerData.AccountType;
        if (!name) {
          throw new HttpException(
            'Account name is required',
            HttpStatus.BAD_REQUEST,
          );
        }
        if (!accountType) {
          throw new HttpException(
            'Account type is required',
            HttpStatus.BAD_REQUEST,
          );
        }
        const payload: Record<string, any> = {
          Id: String(accountId),
          SyncToken: String(syncToken),
          Name: name,
          AccountType: accountType,
        };
        if (innerData.accountSubType || innerData.AccountSubType) {
          payload.AccountSubType =
            innerData.accountSubType || innerData.AccountSubType;
        }
        for (const key of Object.keys(innerData)) {
          if (
            ![
              'id',
              'Id',
              'syncToken',
              'SyncToken',
              'name',
              'Name',
              'accountType',
              'AccountType',
              'accountSubType',
              'AccountSubType',
            ].includes(key)
          ) {
            payload[key] = innerData[key];
          }
        }
        reqBodyData = payload;
      } else if (act === 'get') {
        const id = innerData.id ?? innerData.Id;
        if (id) {
          reqPath = `account/${id}`;
          reqMethod = 'GET';
        } else {
          reqPath = 'query';
          reqMethod = 'GET';
          reqParams = { query: innerData.query || 'SELECT * FROM Account' };
        }
      } else if (act === 'query') {
        reqPath = 'query';
        reqMethod = 'GET';
        reqParams = { query: innerData.query || 'SELECT * FROM Account' };
      }
    }
    // 2. Reports
    else if (REPORT_MODULES[mod]) {
      reqPath = `reports/${REPORT_MODULES[mod]}`;
      reqMethod = 'GET';
      const params: Record<string, any> = {};
      if (typeof innerData === 'object' && innerData !== null) {
        for (const key of Object.keys(innerData)) {
          if (innerData[key] !== undefined) {
            params[key] = innerData[key];
          }
        }
      }
      if (Object.keys(params).length > 0) {
        reqParams = params;
      }
    }
    // 3. Batch
    else if (mod === 'batch' && act === 'create') {
      reqPath = 'batch';
      reqMethod = 'POST';
      const batchPayload =
        innerData.BatchItemRequest ||
        innerData.batchItemRequest ||
        (Array.isArray(innerData) ? innerData : null) ||
        innerData;

      if (
        !batchPayload ||
        (Array.isArray(batchPayload) && batchPayload.length === 0)
      ) {
        throw new HttpException(
          'BatchItemRequest is required',
          HttpStatus.BAD_REQUEST,
        );
      }
      reqBodyData = {
        BatchItemRequest: Array.isArray(batchPayload)
          ? batchPayload
          : batchPayload.BatchItemRequest || batchPayload,
      };
    }
    // 4. Change Data Capture
    else if (mod === 'changeDataCapture' && act === 'get') {
      reqPath = 'cdc';
      reqMethod = 'GET';
      const entities =
        innerData.entities || 'Account,Customer,Invoice,Payment,Bill,Vendor';
      const changedSince =
        innerData.changedSince ||
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      reqParams = { entities, changedSince };
    }
    // 5. Entitlements
    else if (mod === 'entitlements' && act === 'get') {
      reqPath = 'entitlements';
      reqMethod = 'GET';
    }
    // 6. Preferences
    else if (mod === 'preferences') {
      if (act === 'get') {
        reqPath = 'preferences';
        reqMethod = 'GET';
      } else if (act === 'update') {
        reqPath = 'preferences';
        reqMethod = 'POST';
        reqBodyData =
          typeof innerData === 'object' ? { ...innerData } : innerData;
      }
    }
    // 7. TaxClassification
    else if (mod === 'taxClassification' && act === 'get') {
      reqPath = 'taxclassification';
      reqMethod = 'GET';
    }
    // 8. TaxService
    else if (mod === 'taxService' && act === 'get') {
      reqPath = 'taxservice/taxcode';
      reqMethod = 'GET';
    }
    // 9. CompanyInfo
    else if (mod === 'companyInfo') {
      if (act === 'get') {
        reqPath = `companyinfo/${realmId}`;
        reqMethod = 'GET';
      } else if (act === 'update') {
        reqPath = 'companyinfo';
        reqMethod = 'POST';
        const id = innerData.id ?? innerData.Id;
        const syncToken = innerData.syncToken ?? innerData.SyncToken;
        if (!id) {
          throw new HttpException(
            'Entity id is required for update',
            HttpStatus.BAD_REQUEST,
          );
        }
        if (syncToken === undefined || syncToken === null) {
          throw new HttpException(
            'SyncToken is required for update',
            HttpStatus.BAD_REQUEST,
          );
        }
        const payload: Record<string, any> = {
          ...innerData,
          Id: String(id),
          SyncToken: String(syncToken),
        };
        delete payload.id;
        delete payload.syncToken;
        reqBodyData = payload;
      }
    }
    // 10. Invoice Send special action
    else if (mod === 'invoice' && act === 'send') {
      const id = innerData.id ?? innerData.Id;
      if (!id) {
        throw new HttpException('id is required', HttpStatus.BAD_REQUEST);
      }
      const query = innerData.sendTo
        ? `?sendTo=${encodeURIComponent(innerData.sendTo)}`
        : '';
      reqPath = `invoice/${id}/send${query}`;
      reqMethod = 'POST';
    }
    // 11. Standard Entities
    else if (ENTITY_CONFIG[mod]) {
      const conf = ENTITY_CONFIG[mod];
      if (act === 'create') {
        reqPath = conf.path;
        reqMethod = 'POST';
        reqBodyData =
          typeof innerData === 'object' ? { ...innerData } : innerData;
      } else if (act === 'update') {
        reqPath = conf.path;
        reqMethod = 'POST';
        const id = innerData.id ?? innerData.Id;
        const syncToken = innerData.syncToken ?? innerData.SyncToken;
        if (!id) {
          throw new HttpException(
            'Entity id is required for update',
            HttpStatus.BAD_REQUEST,
          );
        }
        if (syncToken === undefined || syncToken === null) {
          throw new HttpException(
            'SyncToken is required for update',
            HttpStatus.BAD_REQUEST,
          );
        }
        const payload: Record<string, any> = {
          ...innerData,
          Id: String(id),
          SyncToken: String(syncToken),
        };
        delete payload.id;
        delete payload.syncToken;
        reqBodyData = payload;
      } else if (act === 'get') {
        const id = innerData.id ?? innerData.Id;
        if (id) {
          reqPath = `${conf.path}/${id}`;
          reqMethod = 'GET';
        } else {
          reqPath = 'query';
          reqMethod = 'GET';
          reqParams = {
            query: innerData.query || `SELECT * FROM ${conf.queryTable}`,
          };
        }
      } else if (act === 'getMany' || act === 'query') {
        reqPath = 'query';
        reqMethod = 'GET';
        let query = innerData.query;
        if (!query) {
          query = `SELECT * FROM ${conf.queryTable}`;
          const start = innerData.startposition ?? innerData.startPosition;
          const max = innerData.maxresults ?? innerData.maxResults;
          if (start) query += ` STARTPOSITION ${start}`;
          if (max) query += ` MAXRESULTS ${max}`;
        }
        reqParams = { query };
      } else if (act === 'delete') {
        const id = innerData.id ?? innerData.Id;
        if (!id) {
          throw new HttpException(
            'Entity id is required for delete',
            HttpStatus.BAD_REQUEST,
          );
        }
        const syncToken = innerData.syncToken ?? innerData.SyncToken ?? '0';
        if (conf.isMasterData) {
          reqPath = conf.path;
          reqMethod = 'POST';
          reqBodyData = {
            Id: String(id),
            SyncToken: String(syncToken),
            Active: false,
          };
        } else {
          reqPath = `${conf.path}?operation=delete`;
          reqMethod = 'POST';
          reqBodyData = {
            Id: String(id),
            SyncToken: String(syncToken),
          };
        }
      }
    }
    // 12. Fallback
    else {
      reqPath = mod.toLowerCase();
      reqMethod = httpMethod;
      if (httpMethod === 'GET') {
        reqParams = typeof innerData === 'object' ? innerData : undefined;
      } else {
        reqBodyData = typeof innerData === 'object' ? innerData : undefined;
      }
    }

    // Build full QuickBooks URL
    const baseUrl = this.getQuickBooksBaseUrl();
    const cleanPath = reqPath.startsWith('/') ? reqPath.slice(1) : reqPath;
    const url = `${baseUrl}/v3/company/${realmId}/${cleanPath}`;

    const headers: Record<string, string> = {
      Authorization: 'Bearer ' + credential.accessToken,
      Accept: 'application/json',
    };

    if (reqBodyData !== undefined && reqBodyData !== null) {
      headers['Content-Type'] = 'application/json';
    }

    try {
      const response = await axios({
        method: reqMethod,
        url,
        params:
          reqParams && Object.keys(reqParams).length > 0
            ? reqParams
            : undefined,
        data: reqBodyData,
        headers,
      });

      return response.data;
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }

      if (error.response?.status === 401) {
        return await this.refreshAndRetry(
          credential,
          url,
          reqParams && Object.keys(reqParams).length > 0
            ? reqParams
            : undefined,
          reqMethod,
          reqBodyData,
        );
      }

      throw new HttpException(
        error.response?.data || error.message || 'QuickBooks API error',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Helper: getQuickBooksBaseUrl
  getQuickBooksBaseUrl(): string {
    const baseUrl = this.configService
      .get<string>('QUICKBOOKS_BASE_URL')
      ?.trim();

    if (!baseUrl) {
      throw new HttpException(
        'QUICKBOOKS_BASE_URL configuration is missing',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return baseUrl.replace(/\/+$/, '');
  }

  // Helper: refreshTokenInternal
  async refreshTokenInternal(credential: CredentialEntity) {
    const clientId = this.configService
      .get<string>('QUICKBOOKS_CLIENT_ID')
      ?.trim();

    const clientSecret = this.configService
      .get<string>('QUICKBOOKS_CLIENT_SECRET')
      ?.trim();

    if (!clientId || !clientSecret) {
      throw new HttpException(
        'QuickBooks OAuth configuration is missing',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const refreshToken = String(credential.refreshToken || '').trim();
    if (!refreshToken) {
      throw new HttpException(
        'Refresh token is missing or empty in credentials',
        HttpStatus.BAD_REQUEST,
      );
    }

    const formData = new URLSearchParams();
    formData.append('grant_type', 'refresh_token');
    formData.append('refresh_token', refreshToken);

    try {
      const tokenResponse = await axios.post(
        'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
        formData.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
            Authorization:
              'Basic ' +
              Buffer.from(clientId + ':' + clientSecret).toString('base64'),
          },
        },
      );

      const tokens = tokenResponse.data;

      credential.accessToken =
        tokens.access_token || tokens.accessToken || credential.accessToken;
      credential.refreshToken =
        tokens.refresh_token || tokens.refreshToken || credential.refreshToken;
      credential.expiresAt = new Date(
        Date.now() + (tokens.expires_in || 3600) * 1000,
      );

      await this.credentialRepository.save(credential);

      return {
        message: 'QuickBooks token refreshed successfully',
        realmId: credential.realmId,
        accessToken: credential.accessToken,
        refreshToken: credential.refreshToken,
        expiresIn: tokens.expires_in,
      };
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        error.response?.data ||
        error.message ||
        'QuickBooks token refresh failed',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Helper: refreshAndRetry
  async refreshAndRetry(
    credential: CredentialEntity,
    url: string,
    params?: Record<string, any>,
    method: 'GET' | 'POST' = 'GET',
    data?: any,
  ) {
    const latestCredential =
      (await this.credentialRepository.findOne({
        where: { realmId: String(credential.realmId).trim() },
        order: { id: 'DESC' },
      })) || credential;

    await this.refreshTokenInternal(latestCredential);

    try {
      const retryResponse = await axios({
        method,
        url,
        params,
        data,
        headers: {
          Authorization: 'Bearer ' + latestCredential.accessToken,
          Accept: 'application/json',
          ...(data ? { 'Content-Type': 'application/json' } : {}),
        },
      });

      return retryResponse.data;
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        error.response?.data ||
        error.message ||
        'QuickBooks retry after refresh failed',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
