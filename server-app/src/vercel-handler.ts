// server/vercel-handler.ts
import { createApp } from './app';
import type { Request, Response } from 'express';

let appPromise: Promise<any> | undefined;

async function getApp() {
  if (!appPromise) {
    appPromise = createApp();
  }
  return await appPromise;
}

async function handler(req: Request, res: Response) {
  const app = await getApp();
  return app(req as any, res as any);
}

// For CommonJS compatibility
module.exports = handler;
export default handler;