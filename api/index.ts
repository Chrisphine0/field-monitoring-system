import type { VercelRequest, VercelResponse } from '@vercel/node';
import app from '../server/app.js';

// Vercel will use this handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await app(req, res);
  } catch (error) {
    console.error('Unhandled error in Vercel function:', error);
    res.status(500).send('Internal Server Error');
  }
}

// This block will only run for local development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
