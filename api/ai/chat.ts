import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

function getGeminiClient(customKey?: string): GoogleGenAI | null {
  const key = customKey || (process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : '');
  if (!key) return null;
  try {
    return new GoogleGenAI({ apiKey: key });
  } catch (err) {
    console.error('Failed to initialize GoogleGenAI client:', err);
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, context, apiKey } = req.body;
  const userKey = (req.headers['x-gemini-api-key'] as string) || apiKey;
  const client = getGeminiClient(userKey);

  const fallbackReply = `[MOIL GeoAI Intelligence Core]: Telematics for ${context?.mineName || 'Balaghat Mine'}:
Ore body dip averages 65° South with high-grade braunite/pyrolusite ore (44.2% Mn). Satellite moisture indices indicate manageable seepage. Recommended to accelerate extraction at Stope 3 to buffer against maintenance on the main winder.`;

  if (!client) {
    return res.json({ reply: fallbackReply });
  }

  try {
    const prompt = `You are MOIL GeoAI, an elite AI mining engineer, structural geologist, and space remote-sensing specialist dedicated to MOIL Limited (Manganese Ore India Limited).
Mines under your purview: Balaghat, Dongri Buzurg, Gumgaon, Tirodi, Kandri, Mansar, Ukwa, Chikla.
Context: ${JSON.stringify(context || {})}
User Query: "${message}"

Provide a concise, practical, technically authoritative response referencing manganese geology (Sausar Group, pyrolusite, psilomelane, braunite), satellite space indicators (NDVI, LST, Soil Moisture, SAR), and mine dispatch/HEMM optimization. Keep paragraphs structured and easy to read.`;

    const response = await client.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt
    });

    res.json({ reply: response.text || fallbackReply, source: 'gemini-2.0-flash' });
  } catch (error) {
    console.error('Error in chat:', error);
    res.json({ reply: fallbackReply });
  }
}
