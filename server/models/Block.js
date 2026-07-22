import mongoose from 'mongoose';

const blockSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    type: { type: String, required: true, enum: ['summary', 'experience', 'education', 'skills'] },
    jobTypes: { type: [String], default: [] },
    content: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

export default mongoose.model('Block', blockSchema);
