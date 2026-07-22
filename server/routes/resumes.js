import { Router } from 'express';
import Resume from '../models/Resume.js';

const router = Router();

// GET all resumes
router.get('/', async (_req, res) => {
  try {
    const resumes = await Resume.find().sort({ updatedAt: -1 });
    res.json(resumes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create or upsert a resume
router.post('/', async (req, res) => {
  try {
    const { id, title, templateId, sections, personalInfo, jobTypes } = req.body;
    const resume = await Resume.findByIdAndUpdate(
      id,
      { _id: id, title, templateId, sections, personalInfo, jobTypes },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    res.status(201).json(resume);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT update a resume
router.put('/:id', async (req, res) => {
  try {
    const { title, templateId, sections, personalInfo, jobTypes } = req.body;
    const resume = await Resume.findByIdAndUpdate(
      req.params.id,
      { title, templateId, sections, personalInfo, jobTypes },
      { new: true },
    );
    if (!resume) return res.status(404).json({ error: 'Resume not found' });
    res.json(resume);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE a resume
router.delete('/:id', async (req, res) => {
  try {
    const resume = await Resume.findByIdAndDelete(req.params.id);
    if (!resume) return res.status(404).json({ error: 'Resume not found' });
    res.json({ success: true, id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
