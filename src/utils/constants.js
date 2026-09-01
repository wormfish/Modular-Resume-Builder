// Owner identifier — will be replaced by real auth later
export const DEFAULT_OWNER = 'kit@catship.nya';

export const SECTION_TYPES = [
  { key: 'summary', label: 'Summary' },
  { key: 'experience', label: 'Experience' },
  { key: 'projects', label: 'Projects' },
  { key: 'cca', label: 'CCA' },
  { key: 'education', label: 'Education' },
  { key: 'skills', label: 'Skills' },
];

export const BLOCK_SCHEMA = {
  summary: {
    label: 'Summary',
    fields: [
      { name: 'headline', label: 'Headline', type: 'text' },
      { name: 'body', label: 'Summary', type: 'textarea' },
    ],
    render: (b) => ({
      title: b.headline || 'Professional Summary',
      body: b.body || '',
    }),
  },
  experience: {
    label: 'Experience',
    fields: [
      { name: 'company', label: 'Company', type: 'text' },
      { name: 'role', label: 'Role', type: 'text' },
      { name: 'location', label: 'Location', type: 'text' },
      { name: 'startDate', label: 'Start Date', type: 'text' },
      { name: 'endDate', label: 'End Date', type: 'text' },
      { name: 'description', label: 'Description', type: 'textarea' },
    ],
    render: (b) => ({
      title: b.role || 'Role',
      subtitle: b.company || '',
      location: b.location || '',
      dates: `${b.startDate || ''}${b.startDate && b.endDate ? ' – ' : ''}${b.endDate || ''}`,
      body: b.description || '',
    }),
  },
  projects: {
    label: 'Projects',
    fields: [
      { name: 'role', label: 'Role / Title', type: 'text' },
      { name: 'company', label: 'Project / Organization', type: 'text' },
      { name: 'location', label: 'Location / Link', type: 'text' },
      { name: 'startDate', label: 'Start Date', type: 'text' },
      { name: 'endDate', label: 'End Date', type: 'text' },
      { name: 'description', label: 'Description', type: 'textarea' },
    ],
    render: (b) => ({
      title: b.role || 'Project Name',
      subtitle: b.company || '',
      location: b.location || '',
      dates: `${b.startDate || ''}${b.startDate && b.endDate ? ' – ' : ''}${b.endDate || ''}`,
      body: b.description || '',
    }),
  },
  cca: {
    label: 'CCA',
    fields: [
      { name: 'role', label: 'Role / Position', type: 'text' },
      { name: 'company', label: 'Club / Organization', type: 'text' },
      { name: 'location', label: 'Location', type: 'text' },
      { name: 'startDate', label: 'Start Date', type: 'text' },
      { name: 'endDate', label: 'End Date', type: 'text' },
      { name: 'description', label: 'Description', type: 'textarea' },
    ],
    render: (b) => ({
      title: b.role || 'Position',
      subtitle: b.company || '',
      location: b.location || '',
      dates: `${b.startDate || ''}${b.startDate && b.endDate ? ' – ' : ''}${b.endDate || ''}`,
      body: b.description || '',
    }),
  },
  education: {
    label: 'Education',
    fields: [
      { name: 'institution', label: 'Institution', type: 'text' },
      { name: 'degree', label: 'Degree', type: 'text' },
      { name: 'field', label: 'Field of Study', type: 'text' },
      { name: 'location', label: 'Location', type: 'text' },
      { name: 'startDate', label: 'Start Date', type: 'text' },
      { name: 'endDate', label: 'End Date', type: 'text' },
      { name: 'gpa', label: 'GPA / Honors', type: 'text' },
    ],
    render: (b) => ({
      title: b.institution || 'Institution',
      subtitle: `${b.degree || ''}${b.degree && b.field ? ', ' : ''}${b.field || ''}`,
      location: b.location || '',
      dates: `${b.startDate || ''}${b.startDate && b.endDate ? ' – ' : ''}${b.endDate || ''}`,
      body: b.gpa || '',
    }),
  },
  skills: {
    label: 'Skills',
    fields: [
      { name: 'category', label: 'Category', type: 'text' },
      { name: 'skills', label: 'Skills', type: 'textarea' },
    ],
    render: (b) => {
      let items = Array.isArray(b.items) ? b.items : [];
      if (!items.length && (b.skills || b.category)) {
        const rawSkills = String(b.skills || '');
        const lines = rawSkills.split('\n').map((l) => l.trim()).filter(Boolean);
        if (lines.length > 1 && lines.some((l) => l.includes(':'))) {
          items = lines.map((l) => {
            const colonIdx = l.indexOf(':');
            if (colonIdx !== -1) {
              const cat = l.slice(0, colonIdx).replace(/^[•\-\*]\s*/, '').trim();
              const val = l.slice(colonIdx + 1).trim();
              return { category: cat, skills: val };
            }
            return { category: '', skills: l.replace(/^[•\-\*]\s*/, '').trim() };
          });
        } else {
          items = [{ category: b.category || '', skills: b.skills || '' }];
        }
      }

      const formattedLines = items
        .filter((item) => (item.category && item.category.trim()) || (item.skills && item.skills.trim()))
        .map((item) => {
          const cat = item.category?.trim();
          const val = item.skills?.trim() || '';
          if (cat && val) return `• **${cat}:** ${val}`;
          if (cat) return `• **${cat}**`;
          return `• ${val}`;
        });

      return {
        title: '',
        body: formattedLines.join('\n'),
      };
    },
  },
};

export const TEMPLATES = {
  modern: {
    name: 'Modern Clean',
    description: 'A clean, single-column layout with a bold header.',
    className: 'template-modern',
  },
  classic: {
    name: 'Classic Professional',
    description: 'A traditional serif layout with a centered header.',
    className: 'template-classic',
  },
};

// Blocks are flat JSON objects — owner + id + type + jobTypeIds + content fields at top level
// jobTypeIds reference the user's jobTypes dictionary
export const INITIAL_BLOCKS = [
  {
    id: 'b1',
    owner: DEFAULT_OWNER,
    type: 'summary',
    jobTypeIds: ['jt1', 'jt2'],
    headline: 'Senior Software Engineer',
    body: 'Results-driven engineer with 8+ years of experience building scalable web applications and leading cross-functional teams.',
  },
  {
    id: 'b2',
    owner: DEFAULT_OWNER,
    type: 'experience',
    jobTypeIds: ['jt1'],
    company: 'TechCorp',
    role: 'Senior Software Engineer',
    location: 'San Francisco, CA',
    startDate: '2020',
    endDate: 'Present',
    description: 'Lead backend architecture for a high-traffic SaaS platform. Mentor junior engineers and drive CI/CD best practices.',
  },
  {
    id: 'b3',
    owner: DEFAULT_OWNER,
    type: 'experience',
    jobTypeIds: ['jt2'],
    company: 'StartupXYZ',
    role: 'Engineering Manager',
    location: 'Remote',
    startDate: '2017',
    endDate: '2020',
    description: 'Managed a team of 10 engineers across two product squads. Improved delivery predictability by 40%.',
  },
  {
    id: 'b4',
    owner: DEFAULT_OWNER,
    type: 'education',
    jobTypeIds: ['jt1', 'jt6'],
    institution: 'State University',
    degree: 'Bachelor of Science',
    field: 'Computer Science',
    startDate: '2012',
    endDate: '2016',
    gpa: 'GPA: 3.8 / 4.0',
  },
  {
    id: 'b5',
    owner: DEFAULT_OWNER,
    type: 'skills',
    jobTypeIds: ['jt3', 'jt1'],
    name: 'Technical Skills',
    items: [
      { category: 'Languages', skills: 'JavaScript, TypeScript, React, Node.js, Python, SQL' },
      { category: 'Cloud & DevOps', skills: 'AWS, Docker, CI/CD, Git' },
    ],
  },
  {
    id: 'b6',
    owner: DEFAULT_OWNER,
    type: 'projects',
    jobTypeIds: ['jt1', 'jt3'],
    role: 'Creator & Maintainer',
    company: 'Open-Source Markdown Engine',
    location: 'github.com/example/engine',
    startDate: '2022',
    endDate: 'Present',
    description: 'Built a high-performance streaming markdown parser in TypeScript with 2,000+ GitHub stars.',
  },
  {
    id: 'b7',
    owner: DEFAULT_OWNER,
    type: 'cca',
    jobTypeIds: ['jt2'],
    role: 'President',
    company: 'University Computing Society',
    location: 'Campus Chapter',
    startDate: '2014',
    endDate: '2016',
    description: 'Organized annual 48-hour national hackathon with 400+ participants and raised $25k in industry sponsorships.',
  },
];

// Resume is a self-contained JSON object: owner + personalInfo + section keys (block ID arrays).
// sectionOrder preserves display order.
export const INITIAL_RESUME = {
  id: 'r1',
  owner: DEFAULT_OWNER,
  title: 'My Resume',
  templateId: 'modern',
  personalInfo: {
    name: 'Your Name',
    email: 'your.email@example.com',
    phone: '(123) 456-7890',
    location: 'City, Country',
  },
  sectionOrder: ['Summary', 'Experience', 'Education', 'Skills'],
  sections: {
    Summary: ['b1'],
    Experience: ['b2', 'b3'],
    Education: ['b4'],
    Skills: ['b5'],
  },
};

export const BLANK_RESUME = {
  id: 'r1',
  owner: DEFAULT_OWNER,
  title: 'Untitled Resume',
  templateId: 'modern',
  personalInfo: {
    name: '',
    email: '',
    phone: '',
    location: '',
  },
  sectionOrder: [],
  sections: {},
};

export const BLANK_BLOCKS = [];

export const SECTION_NAME_SUGGESTIONS = [
  'Summary',
  'Experience',
  'Projects',
  'CCA',
  'Education',
  'Skills',
  'Certifications',
  'Awards',
];
