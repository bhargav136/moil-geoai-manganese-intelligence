import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey =
    req.body?.apiKey ||
    (req.headers['x-gemini-api-key'] as string) ||
    process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.json({ valid: false, message: 'No API key provided' });
  }

  try {
    const client = new GoogleGenAI({ apiKey: apiKey.trim() });
    const response = await client.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: 'Respond with "VALID" if connection works.'
    });
    res.json({ valid: true, reply: response.text?.trim() });
  } catch (err: any) {
    console.error('Validation error:', err);
    res.json({ valid: false, message: err.message || 'Key validation failed' });
  }
}
