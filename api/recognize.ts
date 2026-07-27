import { recognizeWithAzure } from '../server/azure';

declare const process: {
  env: Record<string, string | undefined>;
};

export const config = {
  maxDuration: 60,
  api: {
    bodyParser: {
      sizeLimit: '12mb',
    },
  },
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const result = await recognizeWithAzure(body ?? {}, process.env);
    res.status(200).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : '识别服务暂时不可用';
    res.status(message.includes('Azure') || message.includes('缺少') ? 503 : 400).json({ error: message });
  }
}
