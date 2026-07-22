const API_BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

// ---------- Blocks ----------

export async function fetchBlocks() {
  return request('/blocks');
}

export async function createBlock(block) {
  return request('/blocks', {
    method: 'POST',
    body: JSON.stringify({
      id: block.id,
      type: block.type,
      jobTypes: block.jobTypes,
      content: block.content,
    }),
  });
}

export async function updateBlock(id, block) {
  return request(`/blocks/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      type: block.type,
      jobTypes: block.jobTypes,
      content: block.content,
    }),
  });
}

export async function deleteBlock(id) {
  return request(`/blocks/${id}`, { method: 'DELETE' });
}

// ---------- Resumes ----------

export async function fetchResumes() {
  return request('/resumes');
}

export async function saveResume(resume, personalInfo, jobTypes) {
  return request('/resumes', {
    method: 'POST',
    body: JSON.stringify({
      id: resume.id,
      title: resume.title,
      templateId: resume.templateId,
      sections: resume.sections,
      personalInfo,
      jobTypes,
    }),
  });
}

export async function deleteResume(id) {
  return request(`/resumes/${id}`, { method: 'DELETE' });
}

// ---------- Health ----------

export async function checkHealth() {
  return request('/health');
}
