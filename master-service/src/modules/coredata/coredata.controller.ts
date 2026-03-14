import { Request, Response } from 'express';
import { CountryService, StateService, CityService, CategoryService, TagService, DocumentTypeService, SettingsService } from './coredata.service';
import { ResponseUtil } from '@prasad-rtns/shared';
import { DatabaseType } from '@prasad-rtns/shared';

const db = (req: Request): DatabaseType =>
  (req.dbType as DatabaseType) || (process.env.DEFAULT_DB_TYPE as DatabaseType) || 'postgres';

export const CountryController = {
  async list(req: Request, res: Response) { 
    return ResponseUtil.success(res, await (await CountryService.create(db(req))).listAll()); 
  },
  async getById(req: Request, res: Response) { return ResponseUtil.success(res, await (await CountryService.create(db(req))).getById(req.params.id)); },
  async create(req: Request, res: Response) { return ResponseUtil.created(res, await (await CountryService.create(db(req))).create(req.body)); },
  async update(req: Request, res: Response) { return ResponseUtil.success(res, await (await CountryService.create(db(req))).update(req.params.id, req.body)); },
};

export const StateController = {
  async list(req: Request, res: Response) {
    const svc = await StateService.create(db(req));
    const data = req.query.countryId ? await svc.listByCountry(req.query.countryId as string) : await svc.listAll();
    return ResponseUtil.success(res, data);
  },
  async getById(req: Request, res: Response) { return ResponseUtil.success(res, await (await StateService.create(db(req))).getById(req.params.id)); },
  async create(req: Request, res: Response) { return ResponseUtil.created(res, await (await StateService.create(db(req))).create(req.body)); },
};

export const CityController = {
  async list(req: Request, res: Response) {
    const svc = await CityService.create(db(req));
    const { stateId, search } = req.query;
    const data = search ? await svc.search(search as string, stateId as string) : stateId ? await svc.listByState(stateId as string) : [];
    return ResponseUtil.success(res, data);
  },
  async getById(req: Request, res: Response) { return ResponseUtil.success(res, await (await CityService.create(db(req))).getById(req.params.id)); },
  async create(req: Request, res: Response) { return ResponseUtil.created(res, await (await CityService.create(db(req))).create(req.body)); },
};

export const CategoryController = {
  async list(req: Request, res: Response) { return ResponseUtil.success(res, await (await CategoryService.create(db(req))).listAll(req.query.search as string)); },
  async getById(req: Request, res: Response) { return ResponseUtil.success(res, await (await CategoryService.create(db(req))).getById(req.params.id)); },
  async create(req: Request, res: Response) { return ResponseUtil.created(res, await (await CategoryService.create(db(req))).create(req.body)); },
  async update(req: Request, res: Response) { return ResponseUtil.success(res, await (await CategoryService.create(db(req))).update(req.params.id, req.body)); },
  async remove(req: Request, res: Response) { return ResponseUtil.success(res, await (await CategoryService.create(db(req))).delete(req.params.id)); },
};

export const TagController = {
  async list(req: Request, res: Response) { return ResponseUtil.success(res, await (await TagService.create(db(req))).listAll()); },
  async create(req: Request, res: Response) { return ResponseUtil.created(res, await (await TagService.create(db(req))).create(req.body)); },
  async remove(req: Request, res: Response) { return ResponseUtil.success(res, await (await TagService.create(db(req))).delete(req.params.id)); },
};

export const DocumentTypeController = {
  async list(req: Request, res: Response) { return ResponseUtil.success(res, await (await DocumentTypeService.create(db(req))).listAll()); },
  async getById(req: Request, res: Response) { return ResponseUtil.success(res, await (await DocumentTypeService.create(db(req))).getById(req.params.id)); },
  async create(req: Request, res: Response) { return ResponseUtil.created(res, await (await DocumentTypeService.create(db(req))).create(req.body)); },
};

export const SettingsController = {
  async listPublic(req: Request, res: Response) { return ResponseUtil.success(res, await (await SettingsService.create(db(req))).getPublicSettings()); },
  async listAll(req: Request, res: Response) { return ResponseUtil.success(res, await (await SettingsService.create(db(req))).getAllSettings()); },
  async upsert(req: Request, res: Response) { return ResponseUtil.success(res, await (await SettingsService.create(db(req))).upsert(req.body)); },
  async remove(req: Request, res: Response) { return ResponseUtil.success(res, await (await SettingsService.create(db(req))).delete(req.params.key)); },
};
