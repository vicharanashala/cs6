import mongoose from 'mongoose';

const organizationSchema = new mongoose.Schema({
  orgName: {
    type: String,
    required: true,
    trim: true
  },
  workspaceConfig: {
    type: Object,
    default: {}
  }
});

export default mongoose.model('Organization', organizationSchema);
