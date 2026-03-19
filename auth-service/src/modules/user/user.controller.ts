import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { UserService }  from './user.service';
import { ResponseUtil } from '@prasad-rtns/shared';
import { DatabaseType } from '@prasad-rtns/shared';
import { UserFilter }   from './user.types';

const dbType = (req: Request): DatabaseType =>
  (req.dbType as DatabaseType) || (process.env.DEFAULT_DB_TYPE as DatabaseType) || 'postgres';

export class UserController {
  // GET /api/users
  static async list(req: Request, res: Response) {
    const svc    = await UserService.create(dbType(req));
    const filter: UserFilter = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
      search: req.query.search as string,
      sortBy: (req.query.sortBy as string) || 'createdAt',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
      status: req.query.status as UserFilter['status'],
      departmentId: req.query.departmentId as string,
      roleId: req.query.roleId as string,
      departmentFilter: req.query.departmentFilter as string,
      userFilter: req.query.userFilter as string,
    };
    const result = await svc.listUsers(filter);
    return ResponseUtil.paginate(res, result.data, result.total, filter.page!, filter.limit!);
  }

  // GET /api/users/dashboard
  static async dashboard(req: Request, res: Response) {
    const svc   = await UserService.create(dbType(req));
    const stats = await svc.getDashboardStats(req.user!.sub, req.user!.role, req.user!.departmentId);
    return ResponseUtil.success(res, stats);
  }

  // GET /api/users/:id
  static async getById(req: Request, res: Response) {
    const svc  = await UserService.create(dbType(req));
    const user = await svc.getById(req.params.id);
    if (!user) return ResponseUtil.notFound(res, 'User not found');
    return ResponseUtil.success(res, user);
  }

  // POST /api/users
  static async create(req: Request, res: Response) {
    const errs = validationResult(req);
    if (!errs.isEmpty()) return ResponseUtil.validationError(res, errs.array().map(e => ({ field: (e as { path: string }).path, message: e.msg })));
    
    const svc  = await UserService.create(dbType(req));
    const user = await svc.createUser(req.body, req.user!.sub);
    return ResponseUtil.created(res, user, 'User created successfully');
  }

  // PUT /api/users/:id
  static async update(req: Request, res: Response) {
    const errs = validationResult(req);
    if (!errs.isEmpty()) return ResponseUtil.validationError(res, errs.array().map(e => ({ field: (e as { path: string }).path, message: e.msg })));
    const svc  = await UserService.create(dbType(req));
    const user = await svc.updateUser(req.params.id, req.body, req.user!.sub);
    return ResponseUtil.success(res, user, 'User updated');
  }

  // DELETE /api/users/:id
  static async remove(req: Request, res: Response) {
    const svc    = await UserService.create(dbType(req));
    const result = await svc.deleteUser(req.params.id, req.user!.sub);
    return ResponseUtil.success(res, result);
  }

  // PATCH /api/users/:id/status
  static async changeStatus(req: Request, res: Response) {
    const { status } = req.body;
    if (!['active', 'inactive', 'suspended'].includes(status))
      return ResponseUtil.validationError(res, [{ field: 'status', message: 'Invalid status' }]);
    const svc    = await UserService.create(dbType(req));
    const result = await svc.changeStatus(req.params.id, status, req.user!.sub);
    return ResponseUtil.success(res, result);
  }

  // POST /api/auth/change-password
  static async changePassword(req: Request, res: Response) {
    const errs = validationResult(req);
    if (!errs.isEmpty()) return ResponseUtil.validationError(res, errs.array().map(e => ({ field: (e as { path: string }).path, message: e.msg })));
    const svc    = await UserService.create(dbType(req));
    const result = await svc.changePassword(req.user!.sub, req.body);
    return ResponseUtil.success(res, result);
  }
}
