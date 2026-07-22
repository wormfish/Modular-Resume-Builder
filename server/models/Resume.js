import mongoose from 'mongoose';

const sectionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    title: { type: String, default: 'Section' },
    blockIds: { type: [String], default: [] },
  },
  { _id: false },
);

const resumeSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    title: { type: String, default: 'My Resume' },
    templateId: { type: String, default: 'modern' },
    sections: { type: [sectionSchema], default: [] },
    personalInfo: {
      name: { type: String, default: '' },
      contact: { type: String, default: '' },
    },
    jobTypes: { type: [String], default: [] },
  },
  { timestamps: true },
);

export default mongoose.model('Resume', resumeSchema);
