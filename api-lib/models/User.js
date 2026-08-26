import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    // Job types dictionary: { "jt1": "Software Development", "jt2": "Management", ... }
    // New accounts start with no job types; the user adds them from the dashboard.
    jobTypes: { type: Map, of: String, default: () => new Map() },
    // Marks whether an account was ever initialized. True by default so a
    // brand-new account (empty dictionary) is never backfilled with defaults.
    jobTypesInitialized: { type: Boolean, default: true },
    // Saved personal details used to prefill new resumes ("Save as Default" in
    // the builder, editable from the Dashboard account modal). Empty until set.
    defaultPersonalInfo: {
      name: { type: String, default: '' },
      email: { type: String, default: '' },
      phone: { type: String, default: '' },
      location: { type: String, default: '' },
    },
  },
  { timestamps: true },
);

export default mongoose.models.User || mongoose.model('User', userSchema);
