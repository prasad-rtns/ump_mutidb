import { Router, Request, Response } from 'express';
import { ResponseUtil } from '@rtns/core';
import { MASTER_SCHEMA } from './meta.config';

const router = Router();

// Returns the full schema catalogue for all master entities — consumed by frontend for dynamic forms/tables
router.get('/schema', (_req: Request, res: Response) => {
  return ResponseUtil.success(res, MASTER_SCHEMA);
});

// Returns schema for a single entity
router.get('/schema/:entity', (req: Request, res: Response) => {
  const meta = MASTER_SCHEMA[req.params.entity];
  if (!meta) return ResponseUtil.notFound(res, `No schema for entity '${req.params.entity}'`);
  return ResponseUtil.success(res, meta);
});

export default router;
