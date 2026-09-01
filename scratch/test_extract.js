import * as fs from 'fs';
import * as path from 'path';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

const BULLET_RE = /^[•▪◦‣∙·●○■□◘\-\*\u2022\u2013]\s*/;
const DATE_RANGE_RE =
  /((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|\d{4})\s*(?:–|—|-|to|until)\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|\d{4}|Present|Current|Now|Today)/i;
const SINGLE_DATE_RE =
  /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|\b(19|20)\d{2}\b/;

const ROLE_KEYWORDS_RE = /(?:developer|engineer|tutor|producer|executive|member|founder|manager|intern|analyst|assistant|lead|coordinator|president|director|consultant|specialist|officer|writer|designer|representative|educator|instructor|head|fellow|partner|technician|practitioner|student|candidate|volunteer)/i;

const SECTION_PATTERNS = [
  { type: 'summary', re: /^(professional\s+)?(summary|profile|objective|about(\s+me)?|personal\s+statement)$/i },
  { type: 'experience', re: /^((work|professional|employment|relevant)\s+)?(experience|history)$/i },
  { type: 'experience', re: /^employment$/i },
  { type: 'experience', re: /^(projects|personal\s+projects|academic\s+projects|key\s+projects|technical\s+projects)$/i },
  { type: 'experience', re: /^(co-curricular\s+activities|extracurricular\s+activities|co-curriculars|extracurriculars|activities|volunteering|volunteer\s+experience|leadership(\s+experience)?)$/i },
  { type: 'education', re: /^(education(al)?(\s+history)?|academics?)$/i },
  { type: 'skills', re: /^((technical|core|key|relevant)\s+)?(skills|competenc(y|ies)|technologies|tools)(\s+&\s+interests)?$/i },
];

function matchSectionType(title) {
  for (const { type, re } of SECTION_PATTERNS) {
    if (re.test(title)) return type;
  }
  return null;
}

function median(arr) {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

function looksLikeHeading(line, bodySize) {
  const text = line.text.trim();
  if (text.length > 60) return false;
  const letters = text.replace(/[^a-zA-Z]/g, '');
  const allCaps = letters.length >= 3 && text === text.toUpperCase() && !/\d/.test(text);
  const bigger = line.size >= bodySize + 1.2;
  return (allCaps && line.size >= bodySize) || bigger;
}

function isBulletLine(line, sectionX0) {
  return BULLET_RE.test(line.text) || line.x0 - sectionX0 > 14;
}

function splitDates(text) {
  const range = text.match(DATE_RANGE_RE);
  if (range) {
    return {
      startDate: range[1].trim(),
      endDate: range[2].trim(),
      rest: (text.replace(range[0], '').replace(/[|,·;]\s*$/, '').replace(/^[|,·;]\s*/, '')).trim(),
    };
  }
  const single = text.match(SINGLE_DATE_RE);
  if (single) {
    return { startDate: single[0].trim(), endDate: '', rest: text.replace(single[0], '').trim() };
  }
  return { startDate: '', endDate: '', rest: text.trim() };
}

function parseExperienceEntry(entryLines, sectionX0) {
  const bullets = [];
  const headerLines = [];
  for (const line of entryLines) {
    if (isBulletLine(line, sectionX0) && headerLines.length > 0) {
      bullets.push(line.text.replace(BULLET_RE, '').trim());
    } else {
      headerLines.push(line.text.replace(BULLET_RE, '').trim());
    }
  }
  if (!headerLines.length && !bullets.length) return null;

  let role = '';
  let company = '';
  let location = '';
  let startDate = '';
  let endDate = '';

  // Use gap | separated parsing if the first line contains it
  if (headerLines[0] && headerLines[0].includes('|')) {
    const parts0 = headerLines[0].split('|').map(s => s.trim());
    const parts1 = headerLines[1] ? headerLines[1].split('|').map(s => s.trim()) : [];

    const dates0 = splitDates(parts0[1] || '');
    const dates1 = parts1[0] ? splitDates(parts1[1] || parts1[0]) : null;

    if (dates1 && (dates1.startDate || dates1.endDate)) {
      startDate = dates1.startDate;
      endDate = dates1.endDate;
      role = parts1[0];
      company = parts0[0];
      location = parts0[1] || '';
    } else if (dates0 && (dates0.startDate || dates0.endDate)) {
      startDate = dates0.startDate;
      endDate = dates0.endDate;
      role = parts0[0];
      company = parts1[0] || '';
      location = parts1[1] || '';
    } else {
      // Swapped keyword detection fallback (e.g. Zero Edu | Bandung)
      const firstIsRole = ROLE_KEYWORDS_RE.test(parts0[0]);
      const secondIsRole = parts1[0] && ROLE_KEYWORDS_RE.test(parts1[0]);
      if (secondIsRole && !firstIsRole) {
        role = parts1[0];
        company = parts0[0];
        location = parts0[1] || '';
      } else {
        role = parts0[0];
        company = parts1[0] || '';
        location = parts0[1] || parts1[1] || '';
      }
    }
  } else {
    // Traditional heuristics
    let rawRole = headerLines[0] || '';
    let companyLine = headerLines[1] || '';
    
    // Check if the order is Company then Role (swapped)
    const firstIsRole = ROLE_KEYWORDS_RE.test(rawRole);
    const secondIsRole = companyLine && ROLE_KEYWORDS_RE.test(companyLine);
    
    if (secondIsRole && !firstIsRole) {
      const compDates = splitDates(rawRole);
      company = compDates.rest;
      startDate = compDates.startDate;
      endDate = compDates.endDate;
      
      const roleDates = splitDates(companyLine);
      role = roleDates.rest;
      if (!startDate) {
        startDate = roleDates.startDate;
        endDate = roleDates.endDate;
      }
      
      // Try to split location from company
      const parts = company.split(/\s*[—–-]\s*/);
      company = (parts[0] || '').trim();
      location = (parts[1] || '').trim();
      if (!location && company.includes(', ')) {
        const segs = company.split(', ').map((s) => s.trim());
        if (segs.length > 1 && segs[segs.length - 1].length <= 24) {
          location = segs.pop();
          company = segs.join(', ');
        }
      }
    } else {
      const roleDates = splitDates(rawRole);
      role = roleDates.rest || rawRole;
      startDate = roleDates.startDate;
      endDate = roleDates.endDate;

      if (companyLine) {
        const compDates = splitDates(companyLine);
        if (!startDate) {
          startDate = compDates.startDate;
          endDate = compDates.endDate;
        }
        const parts = compDates.rest.split(/\s*[—–-]\s*/);
        company = (parts[0] || '').trim();
        location = (parts[1] || '').trim();
        if (!location && company.includes(', ')) {
          const segs = company.split(', ').map((s) => s.trim());
          if (segs.length > 1 && segs[segs.length - 1].length <= 24) {
            location = segs.pop();
            company = segs.join(', ');
          }
        }
      }
    }
  }

  if (!company) {
    const at = role.split(/\s+(?:at|@)\s+|\s+\|\s+/i);
    if (at.length === 2) {
      role = at[0].trim();
      company = at[1].trim();
    }
  }

  const extra = headerLines.slice(2).map((t) => t.trim()).filter(Boolean);
  let description = bullets.map((b) => `• ${b}`).join('\n');
  if (extra.length) {
    const paragraph = extra.join(' ');
    description = description ? `${description}\n${paragraph}` : paragraph;
  }

  return {
    type: 'experience',
    name: [role, company].filter(Boolean).join(' — ') || 'Experience',
    fields: {
      role,
      company,
      location,
      startDate,
      endDate,
      description,
    },
  };
}

function parseEducationEntry(entryLines, sectionX0) {
  const bullets = [];
  const headerLines = [];
  for (const line of entryLines) {
    if (isBulletLine(line, sectionX0) && headerLines.length > 0) {
      bullets.push(line.text.replace(BULLET_RE, '').trim());
    } else {
      headerLines.push(line.text.replace(BULLET_RE, '').trim());
    }
  }
  if (!headerLines.length) return null;

  const degreeLike = (t) =>
    /(bachelor|master|doctor|ph\.?d|mba|b\.?sc|m\.?sc|b\.?a\b|m\.?a\b|diploma|certificat|degree|coursework)/i.test(t);
  
  // Clean up any pipe character on lines if they are not split yet
  const cleanedHeaders = headerLines.map(hl => hl.replace(/\s*\|\s*/g, ' | '));

  const first = splitDates(cleanedHeaders[0] || '');
  const second = cleanedHeaders[1] ? splitDates(cleanedHeaders[1]) : null;
  let degree = '';
  let institution = '';
  let startDate = '';
  let endDate = '';
  
  if (second && second.startDate && (!first.startDate || degreeLike(second.rest))) {
    institution = first.rest.split(/\s*[—–|]\s*/)[0].trim();
    degree = second.rest || cleanedHeaders[1] || '';
    startDate = second.startDate;
    endDate = second.endDate;
  } else {
    degree = first.rest || cleanedHeaders[0] || '';
    startDate = first.startDate;
    endDate = first.endDate;
    if (second) {
      if (!startDate) {
        startDate = second.startDate;
        endDate = second.endDate;
      }
      institution = second.rest.split(/\s*[—–|]\s*/)[0].trim();
    }
  }

  // Clean up degree and institution trailing/leading pipes
  degree = degree.replace(/[|]\s*$/, '').trim();
  institution = institution.replace(/^[|]\s*/, '').replace(/[|]\s*$/, '').trim();

  let field = '';
  const commaField = degree.match(/^([A-Za-z.\s]+?(?:of|in)\s+[A-Za-z\s]+?)\s*,\s*(.+)$/i);
  if (commaField) field = commaField[2].trim();
  else {
    const fieldMatch = degree.match(/(?:in|of)\s+(.+)$/i);
    if (fieldMatch) field = fieldMatch[1].trim();
  }
  const detailLines = [...bullets, ...cleanedHeaders.slice(2)];
  const gpaLine = detailLines.find((b) => /\bgpa\b\s*:?\s*\d/i.test(b)) || '';

  return {
    type: 'education',
    name: [degree, institution].filter(Boolean).join(' — ') || 'Education',
    fields: {
      institution,
      degree,
      field,
      startDate,
      endDate,
      gpa: gpaLine,
    },
  };
}

function parseResumeLines(lines) {
  if (!lines.length) return { personalInfo: {}, blocks: [], skippedSections: [] };

  const bodySize = median(lines.map((l) => l.size)) || 10;
  const subheadingLike = (line) => {
    const t = line.text.trim();
    return t.length > 0 && t.length <= 60 && line.size >= bodySize + 0.4;
  };

  const segments = [];
  let current = { title: null, type: null, lines: [] };
  for (const line of lines) {
    const type = matchSectionType(line.text.replace(/[:.]+$/, '').trim());
    const heading = type !== null || looksLikeHeading(line, bodySize);
    if (heading && (type || line.text.length <= 40)) {
      if (current.title && current.type && current.type === type && !current.lines.length) {
        current.title = line.text.replace(/[:.]+$/, '').trim();
      } else {
        if (current.lines.length || current.title) segments.push(current);
        current = { title: line.text.replace(/[:.]+$/, '').trim(), type, lines: [] };
      }
    } else {
      current.lines.push(line);
    }
  }
  if (current.lines.length || current.title) segments.push(current);

  const personalInfo = { name: '', email: '', phone: '', location: '' };
  const headerSeg = segments.length && !segments[0].type ? segments[0] : null;
  if (headerSeg) {
    const texts = [headerSeg.title, ...headerSeg.lines.map((l) => l.text)].filter(Boolean);
    personalInfo.name =
      texts.find(
        (t) => !t.includes('@') && !/\d{3}/.test(t) && !/linkedin|github|http/i.test(t) && !BULLET_RE.test(t),
      ) || '';
    const joined = texts.join(' ');
    personalInfo.email = joined.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)?.[0] || '';
    personalInfo.phone = joined.match(/(\+?\(?\d[\d\s().-]{7,}\d)/)?.[0]?.trim() || '';
  }

  const blocks = [];
  const skippedSections = [];

  segments.forEach((seg, segIdx) => {
    if (!seg.title) return;
    if (!seg.type || (!seg.lines.length && seg.type !== 'summary')) {
      if (seg.lines.length && segIdx > 0) skippedSections.push(seg.title);
      return;
    }
    const sectionX0 = Math.min(...seg.lines.map((l) => l.x0));

    if (seg.type === 'summary') {
      const segLines = [...seg.lines];
      let name = seg.title;
      if (segLines.length && subheadingLike(segLines[0])) {
        name = segLines.shift().text;
      }
      const body = segLines.map((l) => l.text).join(' ');
      blocks.push({
        type: 'summary',
        name,
        fields: { headline: name, body },
      });
      return;
    }

    if (seg.type === 'skills') {
      const headingLines = seg.lines.filter((l) => subheadingLike(l));
      if (headingLines.length) {
        let cat = null;
        let items = [];
        const flush = () => {
          if (cat && items.length) {
            blocks.push({
              type: 'skills',
              name: cat,
              fields: { category: cat, skills: items.join(', ') },
            });
          }
          cat = null;
          items = [];
        };
        for (const l of seg.lines) {
          if (subheadingLike(l)) {
            flush();
            cat = l.text;
          } else {
            const t = l.text.replace(BULLET_RE, '').trim();
            if (!t) continue;
            items.push(...(t.includes(',') ? t.split(',').map((s) => s.trim()).filter(Boolean) : [t]));
          }
        }
        flush();
      } else {
        const items = [];
        for (const l of seg.lines) {
          const t = l.text.replace(BULLET_RE, '').trim();
          if (!t) continue;
          items.push(...(t.includes(',') ? t.split(',').map((s) => s.trim()).filter(Boolean) : [t]));
        }
        blocks.push({
          type: 'skills',
          name: seg.title,
          fields: { category: seg.title, skills: items.join(', ') },
        });
      }
      return;
    }

    const sizes = seg.lines.map((l) => l.size);
    const headingSize = Math.max(...sizes);
    const bodySizeInSec = median(sizes);
    const useSizeGrouping = headingSize >= bodySizeInSec + 0.5;
    const entries = [];
    if (useSizeGrouping) {
      for (const line of seg.lines) {
        if (line.size >= headingSize - 0.2 || !entries.length) entries.push([line]);
        else entries[entries.length - 1].push(line);
      }
    } else {
      for (const line of seg.lines) {
        const bullet = isBulletLine(line, sectionX0);
        const atEdge = line.x0 - sectionX0 <= 6;
        if (!bullet && atEdge && (!entries.length || entries[entries.length - 1].length > 1)) {
          entries.push([line]);
        } else if (!entries.length) {
          entries.push([line]);
        } else {
          entries[entries.length - 1].push(line);
        }
      }
    }
    const parser = seg.type === 'experience' ? parseExperienceEntry : parseEducationEntry;
    for (const entryLines of entries) {
      const block = parser(entryLines, sectionX0);
      if (block) blocks.push(block);
    }
  });

  return { personalInfo, blocks, skippedSections };
}

async function test() {
  try {
    const pdfPath = path.resolve('.vercel-tmp/william_hansel_resume.pdf');
    if (!fs.existsSync(pdfPath)) {
      console.log('PDF file not found at:', pdfPath);
      return;
    }
    console.log('Reading PDF:', pdfPath);
    const data = new Uint8Array(fs.readFileSync(pdfPath));
    const loadingTask = getDocument({ data });
    const doc = await loadingTask.promise;
    
    const lines = [];
    for (let p = 1; p <= doc.numPages; p++) {
      const page = await doc.getPage(p);
      const tc = await page.getTextContent();
      
      const rows = new Map();
      for (const item of tc.items) {
        if (!item.str || !item.str.trim()) continue;
        const y = Math.round(item.transform[5]);
        const key = `${p}:${y}`;
        if (!rows.has(key)) rows.set(key, { page: p, y, items: [], size: 0 });
        const row = rows.get(key);
        row.items.push({ x: item.transform[4], str: item.str });
        row.size = Math.max(row.size, Math.abs(item.transform[0]) || item.height || 0);
      }

      const sortedRows = [...rows.values()].sort((a, b) => b.y - a.y);
      const merged = [];
      for (const row of sortedRows) {
        const last = merged[merged.length - 1];
        if (last && last.page === row.page && Math.abs(last.y - row.y) <= 2) {
          last.items.push(...row.items);
          last.size = Math.max(last.size, row.size);
        } else {
          merged.push(row);
        }
      }

      for (const row of merged) {
        row.items.sort((a, b) => a.x - b.x);
        const textParts = [];
        for (let i = 0; i < row.items.length; i++) {
          const item = row.items[i];
          if (i > 0 && item.x - row.items[i-1].x >= 150) {
            textParts.push('|');
          }
          textParts.push(item.str);
        }
        const text = textParts.join(' ').replace(/\s+/g, ' ').replace(/\s*\|\s*/g, ' | ').trim();
        lines.push({
          text,
          page: row.page,
          y: row.y,
          x0: row.items[0].x,
          size: row.size
        });
      }
    }

    const parsed = parseResumeLines(lines);
    console.log('\n--- HEURISTIC PARSED BLOCKS ---');
    console.log(JSON.stringify(parsed, null, 2));

  } catch (err) {
    console.error('Error in test:', err);
  }
}

test();
