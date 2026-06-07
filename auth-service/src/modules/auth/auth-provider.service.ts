import bcrypt from 'bcryptjs';
import https from 'node:https';
import { createRemoteJWKSet, jwtVerify, JWTPayload } from 'jose';
import { v4 as uuidv4 } from 'uuid';
import { JwtPayload } from '@prasad-rtns/shared';
import { DALBundle, DALFactory } from '../../dal/dal.factory';
import { DatabaseType } from '@prasad-rtns/shared';
import { IUser } from '../user/user.types';
import { RegisterInput } from './auth.types';

type AuthProvider = 'local' | 'wso2';

interface ExternalPrincipal {
  sub: string;
  email?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  claims: JWTPayload;
}

interface Wso2TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
}

const WSO2_USERNAME_CLAIM = process.env.WSO2_USERNAME_CLAIM || 'preferred_username';
const WSO2_EMAIL_CLAIM = process.env.WSO2_EMAIL_CLAIM || 'email';
const WSO2_FIRST_NAME_CLAIM = process.env.WSO2_FIRST_NAME_CLAIM || 'given_name';
const WSO2_LAST_NAME_CLAIM = process.env.WSO2_LAST_NAME_CLAIM || 'family_name';
const WSO2_AUTO_PROVISION = process.env.WSO2_AUTO_PROVISION_USERS === 'true';
const WSO2_DEFAULT_ROLE_ID = process.env.WSO2_DEFAULT_ROLE_ID || '';
const WSO2_DEFAULT_DEPARTMENT_ID = process.env.WSO2_DEFAULT_DEPARTMENT_ID || '';
const WSO2_DEFAULT_DESIGNATION_ID = process.env.WSO2_DEFAULT_DESIGNATION_ID || '';
const WSO2_BASE_URL = process.env.WSO2_BASE_URL || 'https://wso2-apim:9443';
const WSO2_SCIM_BASE_PATH = process.env.WSO2_SCIM_BASE_PATH || '/scim2';
const WSO2_ADMIN_USERNAME = process.env.WSO2_ADMIN_USERNAME || 'admin';
const WSO2_ADMIN_PASSWORD = process.env.WSO2_ADMIN_PASSWORD || 'admin';
const WSO2_SCIM_ACCESS_TOKEN = process.env.WSO2_SCIM_ACCESS_TOKEN || '';
const WSO2_OAUTH_CLIENT_ID = process.env.WSO2_OAUTH_CLIENT_ID || '';
const WSO2_OAUTH_CLIENT_SECRET = process.env.WSO2_OAUTH_CLIENT_SECRET || '';
const WSO2_TOKEN_URL = process.env.WSO2_TOKEN_URL || `${WSO2_BASE_URL.replace(/\/$/, '')}/oauth2/token`;
const WSO2_VERIFY_TLS = (process.env.WSO2_VERIFY_TLS || 'false').toLowerCase() === 'true';

let remoteJwks: ReturnType<typeof createRemoteJWKSet> | null = null;

const normalize = (value?: string | null): string | undefined => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

const getStringClaim = (payload: JWTPayload, claimName: string): string | undefined => {
  const raw = payload[claimName];
  if (typeof raw === 'string') return normalize(raw);
  if (Array.isArray(raw) && typeof raw[0] === 'string') return normalize(raw[0]);
  return undefined;
};

const buildUsername = (principal: ExternalPrincipal): string => {
  const fromClaims = normalize(principal.username);
  if (fromClaims) return fromClaims;

  const fromEmail = normalize(principal.email)?.split('@')[0];
  if (fromEmail) return fromEmail;

  return `wso2_${principal.sub.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 24)}`;
};

const buildEmail = (principal: ExternalPrincipal, username: string): string =>
  normalize(principal.email)?.toLowerCase() || `${username}@wso2.local`;

const buildNameParts = (principal: ExternalPrincipal): { firstName: string; lastName: string } => {
  const firstName = normalize(principal.firstName) || 'WSO2';
  const lastName = normalize(principal.lastName) || 'User';
  return { firstName, lastName };
};

const getWso2Audience = (): string[] | undefined => {
  const audience = normalize(process.env.WSO2_AUDIENCE);
  if (!audience) return undefined;
  return audience.split(',').map((item) => item.trim()).filter(Boolean);
};

const getJwks = () => {
  if (remoteJwks) return remoteJwks;

  const issuer = normalize(process.env.WSO2_ISSUER);
  if (!issuer) throw new Error('WSO2_ISSUER is required when AUTH_PROVIDER=wso2');

  const jwksUri = normalize(process.env.WSO2_JWKS_URI) || `${issuer.replace(/\/$/, '')}/oauth2/jwks`;
  remoteJwks = createRemoteJWKSet(new URL(jwksUri));
  return remoteJwks;
};

export class AuthProviderService {
  private dal!: DALBundle;

  private constructor(private readonly dbType: DatabaseType) {}

  static getProvider(): AuthProvider {
    return (process.env.AUTH_PROVIDER || 'local').toLowerCase() === 'wso2' ? 'wso2' : 'local';
  }

  static async create(dbType: DatabaseType): Promise<AuthProviderService> {
    const svc = new AuthProviderService(dbType);
    svc.dal = await DALFactory.get(dbType);
    return svc;
  }

  static toJwtPayload(user: IUser): JwtPayload {
    return {
      sub: user.id,
      username: user.username,
      email: user.email,
      role: (user.role?.slug ?? 'user') as JwtPayload['role'],
      roleId: user.roleId,
      departmentId: user.departmentId,
      designationId: user.designationId,
      sessionId: 'wso2',
    };
  }

  async registerWso2User(input: RegisterInput): Promise<IUser> {
    const [byEmail, byUsername] = await Promise.all([
      this.dal.user.findByEmail(input.email.toLowerCase()),
      this.dal.user.findByUsername(input.username),
    ]);
    if (byEmail) throw new Error('Email already registered');
    if (byUsername) throw new Error('Username already taken');

    await this.createWso2User(input);

    const user = await this.dal.user.create({
      username: input.username,
      email: input.email.toLowerCase(),
      password: await bcrypt.hash(uuidv4(), 12),
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      roleId: input.roleId || WSO2_DEFAULT_ROLE_ID,
      companyId: input.companyId ?? null,
      departmentId: input.departmentId || WSO2_DEFAULT_DEPARTMENT_ID,
      designationId: input.designationId || WSO2_DEFAULT_DESIGNATION_ID,
      createdBy: 'wso2',
    });

    await this.dal.user.update(user.id, {
      isEmailVerified: true,
      updatedBy: 'wso2',
    });

    return user;
  }

  async loginWithWso2(identifier: string, password: string): Promise<{
    user: IUser;
    accessToken: string;
    refreshToken?: string;
    expiresIn: string;
  }> {
    const tokenResponse = await this.requestWso2Token({
      grant_type: 'password',
      username: identifier,
      password,
    });
    const user = await this.resolveAuthenticatedUser(tokenResponse.access_token);

    return {
      user,
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
      expiresIn: String(tokenResponse.expires_in ?? 3600),
    };
  }

  async refreshWso2Token(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresIn: string;
  }> {
    const tokenResponse = await this.requestWso2Token({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    });

    return {
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
      expiresIn: String(tokenResponse.expires_in ?? 3600),
    };
  }

  async resolveAuthenticatedUser(token: string): Promise<IUser> {
    const principal = await this.verifyWso2Token(token);
    let user = await this.findLocalUser(principal);

    if (!user && WSO2_AUTO_PROVISION) {
      user = await this.provisionLocalUser(principal);
    }

    if (!user) {
      throw new Error('No local user mapping found for authenticated WSO2 user');
    }

    const fullUser = await this.dal.user.findByIdWithRelations(user.id);
    if (!fullUser) {
      throw new Error('Authenticated user profile could not be loaded');
    }

    if (fullUser.status !== 'active') {
      throw new Error(`Account is ${fullUser.status}. Contact admin.`);
    }

    return fullUser;
  }

  private async verifyWso2Token(token: string): Promise<ExternalPrincipal> {
    const issuer = normalize(process.env.WSO2_ISSUER);
    if (!issuer) throw new Error('WSO2_ISSUER is required when AUTH_PROVIDER=wso2');

    const verifyOptions: { issuer: string; audience?: string | string[] } = { issuer };
    const audience = getWso2Audience();
    if (audience?.length) {
      verifyOptions.audience = audience.length === 1 ? audience[0] : audience;
    }

    const { payload } = await jwtVerify(token, getJwks(), verifyOptions);
    const sub = normalize(payload.sub);
    if (!sub) throw new Error('WSO2 token is missing sub claim');

    return {
      sub,
      email: getStringClaim(payload, WSO2_EMAIL_CLAIM),
      username: getStringClaim(payload, WSO2_USERNAME_CLAIM),
      firstName: getStringClaim(payload, WSO2_FIRST_NAME_CLAIM),
      lastName: getStringClaim(payload, WSO2_LAST_NAME_CLAIM),
      claims: payload,
    };
  }

  private async findLocalUser(principal: ExternalPrincipal): Promise<IUser | null> {
    const email = normalize(principal.email)?.toLowerCase();
    if (email) {
      const byEmail = await this.dal.user.findByEmail(email);
      if (byEmail) return byEmail;
    }

    const username = normalize(principal.username);
    if (username) {
      const byUsername = await this.dal.user.findByUsername(username);
      if (byUsername) return byUsername;
    }

    return null;
  }

  private async provisionLocalUser(principal: ExternalPrincipal): Promise<IUser> {
    if (!WSO2_DEFAULT_ROLE_ID || !WSO2_DEFAULT_DEPARTMENT_ID || !WSO2_DEFAULT_DESIGNATION_ID) {
      throw new Error(
        'WSO2 auto provisioning requires WSO2_DEFAULT_ROLE_ID, WSO2_DEFAULT_DEPARTMENT_ID, and WSO2_DEFAULT_DESIGNATION_ID',
      );
    }

    const username = buildUsername(principal);
    const email = buildEmail(principal, username);
    const existingByUsername = await this.dal.user.findByUsername(username);
    const finalUsername = existingByUsername ? `${username}_${uuidv4().slice(0, 8)}` : username;
    const { firstName, lastName } = buildNameParts(principal);

    const hashedPassword = await bcrypt.hash(uuidv4(), 12);
    const user = await this.dal.user.create({
      username: finalUsername,
      email,
      password: hashedPassword,
      firstName,
      lastName,
      roleId: WSO2_DEFAULT_ROLE_ID,
      departmentId: WSO2_DEFAULT_DEPARTMENT_ID,
      designationId: WSO2_DEFAULT_DESIGNATION_ID,
      createdBy: 'wso2',
    });

    await this.dal.user.update(user.id, {
      isEmailVerified: true,
      updatedBy: 'wso2',
    });

    return user;
  }

  private async createWso2User(input: RegisterInput): Promise<void> {
    const endpoint = new URL(`${WSO2_BASE_URL.replace(/\/$/, '')}${WSO2_SCIM_BASE_PATH}/Users`);
    const payload = JSON.stringify({
      schemas: ['urn:ietf:params:scim:schemas:core:2.0:User'],
      userName: input.username,
      password: input.password,
      name: {
        givenName: input.firstName,
        familyName: input.lastName,
      },
      emails: [
        {
          primary: true,
          value: input.email.toLowerCase(),
        },
      ],
      ...(input.phone
        ? {
            phoneNumbers: [
              {
                type: 'mobile',
                value: input.phone,
              },
            ],
          }
        : {}),
    });

    await new Promise<void>((resolve, reject) => {
      const req = https.request(
        endpoint,
        {
          method: 'POST',
          headers: {
            Authorization: WSO2_SCIM_ACCESS_TOKEN
              ? `Bearer ${WSO2_SCIM_ACCESS_TOKEN}`
              : `Basic ${Buffer.from(`${WSO2_ADMIN_USERNAME}:${WSO2_ADMIN_PASSWORD}`).toString('base64')}`,
            'Content-Type': 'application/scim+json',
            Accept: 'application/scim+json',
            'Content-Length': Buffer.byteLength(payload),
          },
          rejectUnauthorized: WSO2_VERIFY_TLS,
        },
        (res) => {
          let responseBody = '';
          res.setEncoding('utf8');
          res.on('data', (chunk) => {
            responseBody += chunk;
          });
          res.on('end', () => {
            if ((res.statusCode ?? 500) >= 200 && (res.statusCode ?? 500) < 300) {
              resolve();
              return;
            }

            reject(
              new Error(
                `WSO2 registration failed (${res.statusCode ?? 500}): ${responseBody || 'No response body'}`,
              ),
            );
          });
        },
      );

      req.on('error', reject);
      req.write(payload);
      req.end();
    });
  }

  private async requestWso2Token(body: Record<string, string>): Promise<Wso2TokenResponse> {
    if (!WSO2_OAUTH_CLIENT_ID || !WSO2_OAUTH_CLIENT_SECRET) {
      throw new Error('WSO2 OAuth client credentials are missing. Set WSO2_OAUTH_CLIENT_ID and WSO2_OAUTH_CLIENT_SECRET.');
    }

    const endpoint = new URL(WSO2_TOKEN_URL);
    const payload = new URLSearchParams({
      ...body,
      scope: body.grant_type === 'password' ? 'openid' : '',
    });
    if (!payload.get('scope')) {
      payload.delete('scope');
    }

    return await new Promise<Wso2TokenResponse>((resolve, reject) => {
      const req = https.request(
        endpoint,
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${Buffer.from(`${WSO2_OAUTH_CLIENT_ID}:${WSO2_OAUTH_CLIENT_SECRET}`).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
            'Content-Length': Buffer.byteLength(payload.toString()),
          },
          rejectUnauthorized: WSO2_VERIFY_TLS,
        },
        (res) => {
          let responseBody = '';
          res.setEncoding('utf8');
          res.on('data', (chunk) => {
            responseBody += chunk;
          });
          res.on('end', () => {
            const statusCode = res.statusCode ?? 500;
            if (statusCode < 200 || statusCode >= 300) {
              reject(new Error(`WSO2 token request failed (${statusCode}): ${responseBody || 'No response body'}`));
              return;
            }

            try {
              resolve(JSON.parse(responseBody) as Wso2TokenResponse);
            } catch (error) {
              reject(new Error(`WSO2 token response was not valid JSON: ${(error as Error).message}`));
            }
          });
        },
      );

      req.on('error', reject);
      req.write(payload.toString());
      req.end();
    });
  }
}
