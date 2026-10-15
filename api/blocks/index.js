import { saveBlock } from '../../api-lib/blockUpdates.js';
import { connectToDatabase } from '../../api-lib/db.js';
import Block from '../../api-lib/models/Block.js';
import { requireAuth } from '../../api-lib/auth.js';

export default async function handler(req, res) {
  try {
    const user = await requireAuth(req, res);
    if (!user) return;

    await connectToDatabase();

    if (req.method === 'GET') {
      // Only return blocks owned by the authenticated user
      const blocks = await Block.find({ owner: user.email }).sort({ updatedAt: -1 });
      return res.json(blocks);
    }

    if (req.method === 'POST') {
      const block = await saveBlock(Block, req.body, user.email);
      return res.status(201).json(block);
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Blocks handler error:', err);
    res.status(err.status || 500).json({ error: err.status ? err.message : 'Internal server error' });
  }
}
