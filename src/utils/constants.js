export const DEFAULT_JOB_TYPES = [
  'Software Development',
  'Management',
  'Technical Skills',
  'Design',
  'Product Management',
  'Data Science',
  'Marketing',
  'Sales',
  'Operations',
  'Research',
];

export const SECTION_TYPES = [
  { key: 'summary', label: 'Summary' },
  { key: 'experience', label: 'Experience' },
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
      title: b.content.headline || 'Professional Summary',
      body: b.content.body || '',
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
      title: b.content.role || 'Role',
      subtitle: `${b.content.company || ''}${b.content.company && b.content.location ? ' — ' : ''}${b.content.location || ''}`,
      dates: `${b.content.startDate || ''}${b.content.startDate && b.content.endDate ? ' – ' : ''}${b.content.endDate || ''}`,
      body: b.content.description || '',
    }),
  },
  education: {
    label: 'Education',
    fields: [
      { name: 'institution', label: 'Institution', type: 'text' },
      { name: 'degree', label: 'Degree', type: 'text' },
      { name: 'field', label: 'Field of Study', type: 'text' },
      { name: 'startDate', label: 'Start Date', type: 'text' },
      { name: 'endDate', label: 'End Date', type: 'text' },
      { name: 'gpa', label: 'GPA / Honors', type: 'text' },
    ],
    render: (b) => ({
      title: b.content.institution || 'Institution',
      subtitle: `${b.content.degree || ''}${b.content.degree && b.content.field ? ', ' : ''}${b.content.field || ''}`,
      dates: `${b.content.startDate || ''}${b.content.startDate && b.content.endDate ? ' – ' : ''}${b.content.endDate || ''}`,
      body: b.content.gpa || '',
    }),
  },
  skills: {
    label: 'Skills',
    fields: [
      { name: 'category', label: 'Category', type: 'text' },
      { name: 'skills', label: 'Skills (comma separated)', type: 'textarea' },
    ],
    render: (b) => ({
      title: b.content.category || 'Skills',
      body: b.content.skills || '',
    }),
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
    description: 'A traditional serif layout with centered header.',
    className: 'template-classic',
  },
};

export const INITIAL_BLOCKS = [
  {
    id: 'b1',
    type: 'summary',
    jobTypes: ['Software Development', 'Management'],
    content: {
      headline: 'Senior Software Engineer',
      body: 'Results-driven engineer with 8+ years of experience building scalable web applications and leading cross-functional teams.',
    },
  },
  {
    id: 'b2',
    type: 'experience',
    jobTypes: ['Software Development'],
    content: {
      company: 'TechCorp',
      role: 'Senior Software Engineer',
      location: 'San Francisco, CA',
      startDate: '2020',
      endDate: 'Present',
      description: 'Lead backend architecture for a high-traffic SaaS platform. Mentor junior engineers and drive CI/CD best practices.',
    },
  },
  {
    id: 'b3',
    type: 'experience',
    jobTypes: ['Management'],
    content: {
      company: 'StartupXYZ',
      role: 'Engineering Manager',
      location: 'Remote',
      startDate: '2017',
      endDate: '2020',
      description: 'Managed a team of 10 engineers across two product squads. Improved delivery predictability by 40%.',
    },
  },
  {
    id: 'b4',
    type: 'education',
    jobTypes: ['Software Development', 'Data Science'],
    content: {
      institution: 'State University',
      degree: 'Bachelor of Science',
      field: 'Computer Science',
      startDate: '2012',
      endDate: '2016',
      gpa: 'GPA: 3.8 / 4.0',
    },
  },
  {
    id: 'b5',
    type: 'skills',
    jobTypes: ['Technical Skills', 'Software Development'],
    content: {
      category: 'Technical Skills',
      skills: 'JavaScript, TypeScript, React, Node.js, Python, SQL, AWS, Docker',
    },
  },
];

export const INITIAL_RESUME = {
  id: 'r1',
  title: 'My Resume',
  templateId: 'modern',
  sections: [
    { id: 's1', title: 'Summary', blockIds: ['b1'] },
    { id: 's2', title: 'Experience', blockIds: ['b2', 'b3'] },
    { id: 's3', title: 'Education', blockIds: ['b4'] },
    { id: 's4', title: 'Skills', blockIds: ['b5'] },
  ],
};

export const INITIAL_PERSONAL_INFO = {
  name: 'Your Name',
  email: 'your.email@example.com',
  phone: '(123) 456-7890',
  location: 'City, Country',
};

export const SECTION_NAME_SUGGESTIONS = [
  'Summary',
  'Experience',
  'Education',
  'Skills',
  'Projects',
  'Certifications',
  'Awards',
];
