import { PartialType, PickType } from '@nestjs/swagger';
import { User } from '@schema';

export interface AuthPayload {
  uid: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken?: string;
}

export class AuthRequestPayload {
  user: AuthPayload;
  isAuthenticated: boolean;
}

export class LoginInfoPayload extends PartialType(
  PickType(User, ['id', 'refreshToken', 'lastLogin', 'userAgent'] as const),
) {}
