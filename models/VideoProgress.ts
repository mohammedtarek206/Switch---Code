import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IVideoProgress extends Document {
    userId: Types.ObjectId;
    videoId: Types.ObjectId;
    watchedDuration: number; // seconds
    completed: boolean;
    lastWatchedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const VideoProgressSchema: Schema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        videoId: { type: Schema.Types.ObjectId, ref: 'LMSVideo', required: true },
        watchedDuration: { type: Number, default: 0 },
        completed: { type: Boolean, default: false },
        lastWatchedAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

VideoProgressSchema.index({ userId: 1, videoId: 1 }, { unique: true });

export default mongoose.models.VideoProgress ||
    mongoose.model<IVideoProgress>('VideoProgress', VideoProgressSchema);
