import { createApp } from './app';
import type { Request, Response } from 'express';

let appPromise: Promise<any> | undefined;

async function getApp() {
  if (!appPromise) {
    appPromise = createApp();
  }
  return await appPromise;
}

// This handler is written to be bundled into a CommonJS file that Vercel can use
export default async function handler(req: Request, res: Response) {
  const app = await getApp();
  // Express apps are callable as functions (req,res)
  return app(req as any, res as any);
}
