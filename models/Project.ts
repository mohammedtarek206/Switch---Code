import mongoose, { Document, Schema } from 'mongoose';

export interface IProject extends Document {
  title: string;
  summary: string;
  imageUrl: string;
  tags: string[];
  githubUrl?: string;
  liveUrl?: string;
  description: string;
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    summary: { type: String, required: true },
    imageUrl: { type: String, required: true },
    tags: [{ type: String }],
    githubUrl: { type: String },
    liveUrl: { type: String },
    description: { type: String, required: true },
    featured: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Project || mongoose.model<IProject>('Project', ProjectSchema);
