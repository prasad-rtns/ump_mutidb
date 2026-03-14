import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { RoleService, DepartmentService, DesignationService } from './master.service';
import { ResponseUtil } from '@prasad-rtns/shared';
import { DatabaseType } from '@prasad-rtns/shared';

const dbType = (req: Request): DatabaseType =>
  (req.dbType as DatabaseType) || (process.env.DEFAULT_DB_TYPE as DatabaseType) || 'postgres';

// ─── Role Controller ──────────────────────────────────────────────────────────
export class RoleController {
  static async list(req: Request, res: Response) {
    const svc  = await RoleService.create(dbType(req));
    const data = await svc.listRoles();
    return ResponseUtil.success(res, data);
  }
  static async getById(req: Request, res: Response) {
    const svc  = await RoleService.create(dbType(req));
    const data = await svc.getById(req.params.id);
    return ResponseUtil.success(res, data);
  }
  static async create(req: Request, res: Response) {
    const errs = validationResult(req);
    if (!errs.isEmpty()) return ResponseUtil.validationError(res, errs.array().map(e => ({ field: (e as { path: string }).path, message: e.msg })));
    const svc  = await RoleService.create(dbType(req));
    const data = await svc.createRole(req.body);
    return ResponseUtil.created(res, data);
  }
  static async update(req: Request, res: Response) {
    const svc  = await RoleService.create(dbType(req));
    const data = await svc.updateRole(req.params.id, req.body);
    return ResponseUtil.success(res, data);
  }
  static async remove(req: Request, res: Response) {
    const svc    = await RoleService.create(dbType(req));
    const result = await svc.deleteRole(req.params.id);
    return ResponseUtil.success(res, result);
  }
}

// ─── Department Controller ────────────────────────────────────────────────────
export class DepartmentController {
  static async list(req: Request, res: Response) {
    const svc  = await DepartmentService.create(dbType(req));
    const data = await svc.listDepartments();
    return ResponseUtil.success(res, data);
  }
  static async getById(req: Request, res: Response) {
    const svc  = await DepartmentService.create(dbType(req));
    const data = await svc.getById(req.params.id);
    return ResponseUtil.success(res, data);
  }
  static async create(req: Request, res: Response) {
    const errs = validationResult(req);
    if (!errs.isEmpty()) return ResponseUtil.validationError(res, errs.array().map(e => ({ field: (e as { path: string }).path, message: e.msg })));
    const svc  = await DepartmentService.create(dbType(req));
    const data = await svc.createDepartment(req.body);
    return ResponseUtil.created(res, data);
  }
  static async update(req: Request, res: Response) {
    const svc  = await DepartmentService.create(dbType(req));
    const data = await svc.updateDepartment(req.params.id, req.body);
    return ResponseUtil.success(res, data);
  }
  static async remove(req: Request, res: Response) {
    const svc    = await DepartmentService.create(dbType(req));
    const result = await svc.deleteDepartment(req.params.id);
    return ResponseUtil.success(res, result);
  }
}

// ─── Designation Controller ───────────────────────────────────────────────────
export class DesignationController {
  static async list(req: Request, res: Response) {
    const svc  = await DesignationService.create(dbType(req));
    const data = await svc.listDesignations(true, req.query.departmentId as string);
    return ResponseUtil.success(res, data);
  }
  static async getById(req: Request, res: Response) {
    const svc  = await DesignationService.create(dbType(req));
    const data = await svc.getById(req.params.id);
    return ResponseUtil.success(res, data);
  }
  static async create(req: Request, res: Response) {
    const errs = validationResult(req);
    if (!errs.isEmpty()) return ResponseUtil.validationError(res, errs.array().map(e => ({ field: (e as { path: string }).path, message: e.msg })));
    const svc  = await DesignationService.create(dbType(req));
    const data = await svc.createDesignation(req.body);
    return ResponseUtil.created(res, data);
  }
  static async update(req: Request, res: Response) {
    const svc  = await DesignationService.create(dbType(req));
    const data = await svc.updateDesignation(req.params.id, req.body);
    return ResponseUtil.success(res, data);
  }
  static async remove(req: Request, res: Response) {
    const svc    = await DesignationService.create(dbType(req));
    const result = await svc.deleteDesignation(req.params.id);
    return ResponseUtil.success(res, result);
  }
}
