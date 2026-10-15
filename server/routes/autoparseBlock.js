import { SYSTEM_PROMPT } from '../../api-lib/autoparsePrompt.js';
import { Router } from 'express';
import { requireAuth } from '../lib/auth.js';

const router = Router();


function parseModelJson(content) {
  try {
    return JSON.parse(content);
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error('Unparseable model output');
  }
}

// POST /api/autoparse-block - AI parsing of user notes into structured STAR block
router.post('/', requireAuth, async (req, res) => {
  try {
    const { text, targetType, currentBlock, clientDate } = req.body || {};
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Please enter details or notes to parse.' });
    }

    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'NVIDIA API key not configured' });
    }

    const now = clientDate ? new Date(clientDate) : new Date();
    const currentDateStr = !isNaN(now.getTime())
      ? now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      : new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const currentMonthYear = !isNaN(now.getTime())
      ? now.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      : new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

    const userPrompt = `TODAY'S DATE REFERENCE:
- Today's Date: ${currentDateStr} (Current Month: ${currentMonthYear})
- When the user mentions relative time expressions (e.g. "2 months ago", "last month", "started 3 months ago", "since January", "until 2 months ago"), calculate the exact calendar month & year relative to ${currentDateStr}.
- Format dates for "startDate" and "endDate" as standard concise resume format: "Mon YYYY" (e.g. "Jul 2026", "Jan 2024", "Present").

Target Block Type: ${targetType || 'experience'}
Existing Block Details: ${JSON.stringify(currentBlock || {})}

User Experience / Raw Notes:
"""
${String(text).slice(0, 10000)}
"""

Please convert the above input into a structured, STAR-formatted resume block JSON.`;

    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'meta/llama-3.2-11b-vision-instruct',
        messages: [
          { role: 'user', content: `${SYSTEM_PROMPT}\n\n${userPrompt}` },
        ],
        temperature: 0.2,
        max_tokens: 2500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('NVIDIA API error:', errorText);
      return res.status(500).json({ error: 'Failed to auto-parse block', details: errorText });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '{}';

    let parsed;
    try {
      parsed = parseModelJson(content);
    } catch (parseError) {
      console.error('Failed to parse AI output:', content);
      return res.status(500).json({ error: 'Failed to parse AI model response' });
    }

    const validTypes = ['summary', 'experience', 'projects', 'activities', 'cca', 'education', 'skills'];
    let type = validTypes.includes(parsed.type) ? parsed.type : (targetType || 'experience');
    if (type === 'cca') type = 'activities';

    const fields = parsed.fields && typeof parsed.fields === 'object' ? parsed.fields : {};
    const name = parsed.name || '';

    return res.json({
      type,
      name,
      fields,
    });
  } catch (err) {
    console.error('Auto-parse error:', err);
    return res.status(500).json({ error: err.message || 'Failed to auto-parse block' });
  }
});

export default router;
