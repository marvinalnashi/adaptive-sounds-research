import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    const { device } = req.query;
    // TODO: Send real command to that device via WebSocket or Firebase
    console.log(`[Controller] Triggering ring on ${device}`);
    res.status(200).json({ status: 'ring triggered', device });
}