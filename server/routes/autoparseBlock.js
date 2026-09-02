import { Router } from 'express';
import { requireAuth } from '../lib/auth.js';

const router = Router();

const SYSTEM_PROMPT = `You are an elite executive resume writer and career strategist specializing in high-impact, ATS-optimized resume blocks.

TASK:
Convert the user's raw experience notes, achievements, or descriptions into a structured, professional resume block.

CRITICAL RESUME WRITING INSTRUCTIONS:
1. STAR METHOD: For bullet points (descriptions), structure each bullet using the STAR framework (Situation, Task, Action, Result):
   - Lead with a powerful, active past-tense action verb (e.g., Spearheaded, Architected, Engineered, Optimized, Streamlined, Orchestrated, Accelerated, Championed).
   - Clearly describe the challenge/context and the proactive action taken.
   - Quantify results and business impact with concrete numbers, metrics, percentages, dollar values, or performance improvements (e.g., "increasing throughput by 35%", "reducing latency by 45%", "delivering $150k in annual savings", "scaling to 500k+ users", "mentoring 6 engineers"). If exact metrics are absent from the user's notes, derive realistic, plausible impact numbers or strong qualitative outcomes based on the context.
2. CONCISENESS & IMPACT: Write concise, punchy, professional bullets (2 to 4 bullets per role/project). Each bullet MUST start with "• ".
3. FORMAT: Return ONLY valid JSON (no markdown formatting, no code fencing, no conversational text) matching the schema:

For "experience":
{
  "type": "experience",
  "name": "<Role> — <Company>",
  "fields": {
    "role": "Role / Job Title",
    "company": "Company / Organization Name",
    "location": "City, State / Remote",
    "startDate": "Start Date",
    "endDate": "End Date",
    "description": "• Spearheaded ... resulting in 30% increase in ...\\n• Architected ... reducing latency by 45%\\n• Collaborated with ... delivering project 2 weeks ahead of schedule"
  }
}

For "projects":
{
  "type": "projects",
  "name": "<Role / Title> — <Project Name>",
  "fields": {
    "role": "Role / Title (e.g. Creator & Lead Developer)",
    "company": "Project / Organization Name",
    "location": "Location or Link (e.g. github.com/... or Remote)",
    "startDate": "Start Date",
    "endDate": "End Date",
    "description": "• Built and launched ... achieving 2,000+ active users\\n• Implemented ... cutting query execution time by 60%"
  }
}

For "activities":
{
  "type": "activities",
  "name": "<Role> — <Organization/Club>",
  "fields": {
    "role": "Role / Position (e.g. President / Volunteer Lead)",
    "company": "Club / Non-Profit / Community Organization",
    "location": "Location",
    "startDate": "Start Date",
    "endDate": "End Date",
    "description": "• Directed ... leading team of 15 members to organize event for 400+ attendees\\n• Secured $25k in corporate sponsorships through targeted outreach"
  }
}

For "summary":
{
  "type": "summary",
  "name": "Professional Summary",
  "fields": {
    "headline": "Target Headline (e.g. Senior Full-Stack Engineer)",
    "body": "Results-driven Senior Full-Stack Engineer with 6+ years of experience building scalable distributed systems and high-throughput microservices. Proven track record of boosting system performance by 40% and leading agile teams to deliver mission-critical software solutions."
  }
}

For "education":
{
  "type": "education",
  "name": "<Degree> — <Institution>",
  "fields": {
    "institution": "University / College / Institution",
    "degree": "Degree (e.g. B.S., M.S., B.A.)",
    "field": "Field of Study (e.g. Computer Science)",
    "location": "City, State",
    "startDate": "Start Date",
    "endDate": "End Date / Graduation Year",
    "gpa": "GPA: 3.8/4.0 · Honors / Relevant Coursework"
  }
}

For "skills":
{
  "type": "skills",
  "name": "Technical Skills",
  "fields": {
    "category": "Languages & Frameworks",
    "skills": "Python, TypeScript, React, Node.js, PostgreSQL, Docker, AWS",
    "items": [
      { "category": "Languages", "skills": "TypeScript, Python, Go, SQL" },
      { "category": "Frameworks & Tools", "skills": "React, Node.js, Next.js, Docker, Kubernetes, AWS" }
    ]
  }
}
`;

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
    const { text, targetType, currentBlock } = req.body || {};
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Please enter details or notes to parse.' });
    }

    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'NVIDIA API key not configured' });
    }

    const userPrompt = `Target Block Type: ${targetType || 'experience'}
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
