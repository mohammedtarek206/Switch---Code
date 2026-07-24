import mongoose, { Document, Schema } from 'mongoose';

export interface ILesson {
  title: string;
  description: string;
  videoUrl: string; // Dailymotion URL or ID
}

export interface ITrack extends Document {
  title: string;
  description: string;
  icon: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  language: string[];
  curriculum: string[];
  lessons: ILesson[];
  price: number;
  imageUrl: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TrackSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    icon: { type: String, required: true },
    level: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      required: true,
    },
    duration: { type: String, required: true },
    language: [{ type: String }],
    curriculum: [{ type: String }],
    lessons: [
      {
        title: { type: String, required: true },
        description: { type: String },
        videoUrl: { type: String, required: true },
      },
    ],
    price: { type: Number, default: 0 },
    imageUrl: { type: String },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Track || mongoose.model<ITrack>('Track', TrackSchema);
