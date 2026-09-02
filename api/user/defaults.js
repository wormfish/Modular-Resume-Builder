import { connectToDatabase } from '../../api-lib/db.js';
import User from '../../api-lib/models/User.js';
import { requireAuth } from '../../api-lib/auth.js';

const DEFAULT_SUGGESTIONS = ['Email', 'Phone', 'LinkedIn', 'GitHub', 'Portfolio', 'Website', 'Location', 'Twitter'];

// Sanitize personal-info fields, preserving order in fields array with a minimum length of 3.
function sanitize(body) {
  if (!body || typeof body !== 'object') {
    return {
      name: '',
      email: '',
      phone: '',
      linkedin: '',
      fields: [
        { id: 'f-email', label: 'Email', value: '' },
        { id: 'f-phone', label: 'Phone', value: '' },
        { id: 'f-linkedin', label: 'LinkedIn', value: '' },
      ],
    };
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  let fields = [];

  if (Array.isArray(body.fields)) {
    fields = body.fields
      .filter((f) => f && typeof f === 'object')
      .map((f, idx) => ({
        id: typeof f.id === 'string' && f.id ? f.id : `f-${idx + 1}-${Date.now()}`,
        label: typeof f.label === 'string' && f.label.trim() ? f.label.trim() : `Field ${idx + 1}`,
        value: typeof f.value === 'string' ? f.value.trim() : '',
      }));
  } else {
    const thirdVal = typeof body.linkedin === 'string' && body.linkedin ? body.linkedin.trim() : (typeof body.location === 'string' ? body.location.trim() : '');
    const thirdLabel = typeof body.linkedin === 'string' && body.linkedin ? 'LinkedIn' : (typeof body.location === 'string' && body.location ? 'Location' : 'LinkedIn');
    fields = [
      { id: 'f-email', label: 'Email', value: typeof body.email === 'string' ? body.email.trim() : '' },
      { id: 'f-phone', label: 'Phone', value: typeof body.phone === 'string' ? body.phone.trim() : '' },
      { id: 'f-linkedin', label: thirdLabel, value: thirdVal },
    ];
  }

  // Ensure minimum length of 3
  while (fields.length < 3) {
    const existing = new Set(fields.map((f) => f.label.toLowerCase()));
    const nextLabel =
      DEFAULT_SUGGESTIONS.find((l) => !existing.has(l.toLowerCase())) || `Field ${fields.length + 1}`;
    fields.push({
      id: `f-${fields.length + 1}-${Date.now()}`,
      label: nextLabel,
      value: '',
    });
  }

  const email = fields.find((f) => f.label.toLowerCase() === 'email')?.value || fields[0]?.value || '';
  const phone = fields.find((f) => f.label.toLowerCase() === 'phone')?.value || fields[1]?.value || '';
  const linkedin =
    fields.find((f) => f.label.toLowerCase() === 'linkedin')?.value || fields[2]?.value || '';

  return {
    name,
    email,
    phone,
    linkedin,
    fields,
  };
}

export default async function handler(req, res) {
  try {
    const authUser = requireAuth(req, res);
    if (!authUser) return;

    if (req.method !== 'GET' && req.method !== 'PUT') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    await connectToDatabase();

    const user = await User.findOne({ email: authUser.email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (req.method === 'GET') {
      return res.json(sanitize(user.defaultPersonalInfo || {}));
    }

    // PUT — save/replace the defaults
    const defaults = sanitize(req.body);
    user.defaultPersonalInfo = defaults;
    await user.save();
    return res.json(defaults);
  } catch (err) {
    console.error('Default personal info handler error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
