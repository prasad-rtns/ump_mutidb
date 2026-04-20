import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { AuthService }  from '../auth/auth.service';
import { UserService }  from '../user/user.service';
import { ResponseUtil } from '@prasad-rtns/shared';
import { DatabaseType } from '@prasad-rtns/shared';
import { AuthProviderService } from './auth-provider.service';

const dbType = (req: Request): DatabaseType =>
  (req.dbType as DatabaseType) || (process.env.DEFAULT_DB_TYPE as DatabaseType) || 'postgres';

export class AuthController {
  private static authProvider() {
    return AuthProviderService.getProvider();
  }

  private static localAuthFallbackEnabled() {
    return (process.env.ALLOW_LOCAL_AUTH_FALLBACK || 'false').toLowerCase() === 'true';
  }

  private static isTrustedLocalDocsRequest(req: Request) {
    const sources = [req.headers.origin, req.headers.referer]
      .filter((value): value is string => typeof value === 'string')
      .map((value) => value.toLowerCase());

    return sources.some((value) =>
      value.startsWith('http://localhost:8082') || value.startsWith('http://127.0.0.1:8082'),
    );
  }

  private static shouldUseWso2Guard(req: Request) {
    if (this.authProvider() !== 'wso2') {
      return false;
    }

    return !(this.localAuthFallbackEnabled() && this.isTrustedLocalDocsRequest(req));
  }

  // POST /api/auth/register
  static async register(req: Request, res: Response) {
    const errs = validationResult(req);
    if (!errs.isEmpty()) return ResponseUtil.validationError(res, errs.array().map(e => ({ field: (e as { path: string }).path, message: e.msg })));

    if (AuthController.shouldUseWso2Guard(req)) {
      const providerSvc = await AuthProviderService.create(dbType(req));
      const user = await providerSvc.registerWso2User(req.body);
      return ResponseUtil.created(res, user, 'Registration successful via WSO2');
    }

    const svc = await AuthService.create(dbType(req));
    const user = await svc.register(req.body, req.user?.sub);
    return ResponseUtil.created(res, user, 'Registration successful');
  }

  // POST /api/auth/login
  static async login(req: Request, res: Response) {
    const errs = validationResult(req);
    if (!errs.isEmpty()) return ResponseUtil.validationError(res, errs.array().map(e => ({ field: (e as { path: string }).path, message: e.msg })));

    if (AuthController.shouldUseWso2Guard(req)) {
      const providerSvc = await AuthProviderService.create(dbType(req));
      const result = await providerSvc.loginWithWso2(req.body.identifier, req.body.password);
      if (result.refreshToken) {
        res.cookie('refreshToken', result.refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 7 * 86_400_000, path: '/api/auth/refresh' });
      }
      return ResponseUtil.success(res, { user: result.user, accessToken: result.accessToken, expiresIn: result.expiresIn }, 'Login successful via WSO2');
    }

    const svc    = await AuthService.create(dbType(req));
    const result = await svc.login(req.body, req.ip || 'unknown', req.headers['user-agent'] || 'unknown');
    res.cookie('refreshToken', result.refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 7 * 86_400_000, path: '/api/auth/refresh' });
    return ResponseUtil.success(res, { user: result.user, accessToken: result.accessToken, expiresIn: result.expiresIn }, 'Login successful');
  }

  // POST /api/auth/refresh
  static async refresh(req: Request, res: Response) {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!token) return ResponseUtil.unauthorized(res, 'Refresh token required');

    if (AuthController.shouldUseWso2Guard(req)) {
      const providerSvc = await AuthProviderService.create(dbType(req));
      const result = await providerSvc.refreshWso2Token(token);
      if (result.refreshToken) {
        res.cookie('refreshToken', result.refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 7 * 86_400_000, path: '/api/auth/refresh' });
      }
      return ResponseUtil.success(res, { accessToken: result.accessToken, expiresIn: result.expiresIn }, 'Token refreshed via WSO2');
    }

    const svc    = await AuthService.create(dbType(req));
    const result = await svc.refreshToken(token);
    res.cookie('refreshToken', result.refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 7 * 86_400_000, path: '/api/auth/refresh' });
    return ResponseUtil.success(res, { accessToken: result.accessToken, expiresIn: result.expiresIn }, 'Token refreshed');
  }

  // POST /api/auth/logout
  static async logout(req: Request, res: Response) {
    if (AuthController.authProvider() === 'wso2') {
      res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
      return ResponseUtil.success(res, null, 'Logout must be completed through WSO2');
    }
    const svc = await AuthService.create(dbType(req));
    await svc.logout(req.user!.sub, req.headers.authorization?.substring(7) || '', req.cookies?.refreshToken);
    res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
    return ResponseUtil.success(res, null, 'Logged out successfully');
  }

  // POST /api/auth/logout-all
  static async logoutAll(req: Request, res: Response) {
    if (AuthController.authProvider() === 'wso2') {
      res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
      return ResponseUtil.success(res, null, 'Global logout must be completed through WSO2');
    }
    const svc = await AuthService.create(dbType(req));
    await svc.logoutAll(req.user!.sub, req.headers.authorization?.substring(7) || '');
    res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
    return ResponseUtil.success(res, null, 'All sessions revoked');
  }

  // GET /api/auth/me
  static async me(req: Request, res: Response) {
    const svc  = await UserService.create(dbType(req));
    const user = await svc.getById(req.user!.sub);
    if (!user) return ResponseUtil.notFound(res, 'User not found');
    return ResponseUtil.success(res, user);
  }
}
