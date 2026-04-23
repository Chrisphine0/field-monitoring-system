import type { VercelRequest, VercelResponse } from '@vercel/node';
import app from '../server/app.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // The `app` instance is an Express app, so we can pass the request and response directly
    await app(req, res);
  } catch (error) {
    console.error('Unhandled error in Vercel function:', error);
    res.status(500).send('Internal Server Error');
  }
}
