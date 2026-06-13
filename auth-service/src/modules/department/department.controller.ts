import { Request, Response } from 'express';
import { DepartmentService } from './department.service';
import { DatabaseType } from '@rtns/core';

export class DepartmentController {

  private static resolveDbType(req: Request): DatabaseType {
    return (req.headers['x-db-type'] as DatabaseType) || 'postgres';
  }

  static async getAll(req: Request, res: Response) {
    const dbType = DepartmentController.resolveDbType(req);
    const service = new DepartmentService(dbType);

    const data = await service.getAll();

    res.json({ success: true, data });
  }

  static async getById(req: Request, res: Response) {
    const dbType = DepartmentController.resolveDbType(req);
    const service = new DepartmentService(dbType);

    const data = await service.getById(req.params.id);

    res.json({ success: true, data });
  }

  static async create(req: Request, res: Response) {
    const dbType = DepartmentController.resolveDbType(req);
    const service = new DepartmentService(dbType);

    const data = await service.create(req.body);

    res.status(201).json({ success: true, data });
  }

  static async update(req: Request, res: Response) {
    const dbType = DepartmentController.resolveDbType(req);
    const service = new DepartmentService(dbType);

    const data = await service.update(req.params.id, req.body);

    res.json({ success: true, data });
  }

  static async delete(req: Request, res: Response) {
    const dbType = DepartmentController.resolveDbType(req);
    const service = new DepartmentService(dbType);

    await service.delete(req.params.id);

    res.json({ success: true, message: 'Department deleted successfully' });
  }
}