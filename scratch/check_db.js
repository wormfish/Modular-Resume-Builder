import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('server/.env') });

const uri = process.env.MONGODB_URI;

async function check() {
  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');
    
    // Define simple schemas
    const ResumeSchema = new mongoose.Schema({}, { strict: false });
    const Resume = mongoose.model('Resume', ResumeSchema, 'resumes');
    
    const BlockSchema = new mongoose.Schema({
      _id: { type: String }
    }, { strict: false });
    const Block = mongoose.model('Block', BlockSchema, 'blocks');
    
    const resume = await Resume.findOne({ title: /William Hansel/i });
    if (!resume) {
      console.log('William Hansel resume not found');
      return;
    }
    console.log('--- RESUME DETAILS ---');
    console.log(JSON.stringify(resume.toObject(), null, 2));

    const blockIds = [];
    if (resume.sections) {
      for (const sectionKey of Object.keys(resume.sections)) {
        blockIds.push(...(resume.sections[sectionKey] || []));
      }
    }

    const blocks = await Block.find({ _id: { $in: blockIds } });
    console.log('\n--- BLOCKS DETAILS ---');
    for (const b of blocks) {
      console.log(JSON.stringify(b.toObject(), null, 2));
      console.log('---------------------');
    }
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

check();
