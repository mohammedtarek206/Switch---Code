import mongoose, { Document, Schema } from 'mongoose';

export interface ITeam extends Document {
  name: string;
  role: string;
  bio: string;
  imageUrl: string;
  socials: {
    linkedin?: string;
    twitter?: string;
    github?: string;
    email?: string;
  };
  languages: string[];
  expertise: string[];
  createdAt: Date;
  updatedAt: Date;
}

const TeamSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    role: { type: String, required: true },
    bio: { type: String, required: true },
    imageUrl: { type: String, required: true },
    socials: {
      linkedin: { type: String },
      twitter: { type: String },
      github: { type: String },
      email: { type: String },
    },
    languages: [{ type: String }],
    expertise: [{ type: String }],
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Team || mongoose.model<ITeam>('Team', TeamSchema);
