const DEFAULT_SUGGESTIONS = ['Email', 'Phone', 'LinkedIn', 'GitHub', 'Portfolio', 'Website', 'Location', 'Twitter'];

// Sanitize personal-info fields, preserving order in fields array with a minimum length of 3.
export function sanitizePersonalInfo(body) {
  if (!body || typeof body !== 'object') {
    return {
      name: '',
      email: '',
      phone: '',
      linkedin: '',
      fields: [
        { id: 'f-email', label: 'Email', value: '', url: '' },
        { id: 'f-phone', label: 'Phone', value: '', url: '' },
        { id: 'f-linkedin', label: 'LinkedIn', value: '', url: '' },
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
        url: typeof f.url === 'string' ? f.url.trim() : (typeof f.link === 'string' ? f.link.trim() : ''),
      }));
  } else {
    const thirdVal = typeof body.linkedin === 'string' && body.linkedin ? body.linkedin.trim() : (typeof body.location === 'string' ? body.location.trim() : '');
    const thirdLabel = typeof body.linkedin === 'string' && body.linkedin ? 'LinkedIn' : (typeof body.location === 'string' && body.location ? 'Location' : 'LinkedIn');
    fields = [
      { id: 'f-email', label: 'Email', value: typeof body.email === 'string' ? body.email.trim() : '', url: '' },
      { id: 'f-phone', label: 'Phone', value: typeof body.phone === 'string' ? body.phone.trim() : '', url: '' },
      { id: 'f-linkedin', label: thirdLabel, value: thirdVal, url: '' },
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
      url: '',
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

