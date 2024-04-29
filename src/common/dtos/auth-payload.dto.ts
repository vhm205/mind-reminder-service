import type { Request } from 'express';
import { PartialType, PickType } from '@nestjs/swagger';
import { User } from '@schema';

export interface AuthPayload {
  uid: string;
}

export interface TokenResponse {
  accessToken: string;
}

export class AuthRequestPayload extends Request {
  user: AuthPayload;
  isAuthenticated: boolean;
}

export class LoginInfoPayload extends PartialType(
  PickType(User, ['id', 'lastLogin', 'userAgent'] as const),
) {}
