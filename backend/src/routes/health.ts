import { Request, Response, Router } from 'express';
import { appConfig } from '../config/app';
import { HealthStatus } from '../types/config';

const router: Router = Router();

router.get('/', (_req: Request, res: Response): void => {
  const healthStatus: HealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: appConfig.nodeEnv,
    version: process.env['npm_package_version'] || '1.0.0',
  };

  res.status(200).json(healthStatus);
});

export default router;
