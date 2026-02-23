import { Router } from 'express';
import { checkDbHealth } from '../database/health/db.health';

const router = Router();

router.get('/', async (_, res) => {
  const health = await checkDbHealth();

  const isHealthy = Object.values(health).every(
    (s: any) => s.status === 'UP'
  );

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'OK' : 'DEGRADED',
    services: health,
    timestamp: new Date().toISOString()
  });
});

export default router;