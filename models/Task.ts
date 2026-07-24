import mongoose, { Document, Schema, Types } from 'mongoose';
import './Committee';
import './CommunityTeam';
import './User';

export interface ITaskChecklist {
    label: string;
    done: boolean;
}

export interface ITaskComment {
    authorId: Types.ObjectId;
    content: string;
    createdAt: Date;
}

export interface ITaskActivity {
    actorId: Types.ObjectId;
    action: string;
    detail?: string;
    createdAt: Date;
}

export interface ITask extends Document {
    title: string;
    description?: string;
    committeeId: Types.ObjectId;
    teamId?: Types.ObjectId;
    assignees: Types.ObjectId[]; // multiple assignees
    createdBy: Types.ObjectId;
    deadline?: Date;
    priority: 'low' | 'medium' | 'high' | 'critical';
    status: 'todo' | 'in_progress' | 'review' | 'revision' | 'done' | 'cancelled';
    progress: number;
    comments: ITaskComment[];
    checklist: ITaskChecklist[];
    attachments: string[];     // file URLs
    links: string[];
    tags: string[];
    category?: string;
    reviewNote?: string;       // leader feedback on review
    reviewedBy?: Types.ObjectId;
    reviewedAt?: Date;
    activityLog: ITaskActivity[];
    createdAt: Date;
    updatedAt: Date;
}

const TaskCommentSchema = new Schema(
    {
        authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        content: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
    },
    { _id: true }
);

const TaskChecklistSchema = new Schema(
    { label: { type: String, required: true }, done: { type: Boolean, default: false } },
    { _id: true }
);

const TaskActivitySchema = new Schema(
    {
        actorId: { type: Schema.Types.ObjectId, ref: 'User' },
        action: { type: String, required: true },
        detail: { type: String },
        createdAt: { type: Date, default: Date.now },
    },
    { _id: true }
);

const TaskSchema: Schema = new Schema(
    {
        title: { type: String, required: true },
        description: { type: String },
        committeeId: { type: Schema.Types.ObjectId, ref: 'Committee', required: true },
        teamId: { type: Schema.Types.ObjectId, ref: 'CommunityTeam' },
        assignees: [{ type: Schema.Types.ObjectId, ref: 'User' }],
        createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        deadline: { type: Date },
        priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
        status: { type: String, enum: ['todo', 'in_progress', 'review', 'revision', 'done', 'cancelled'], default: 'todo' },
        progress: { type: Number, min: 0, max: 100, default: 0 },
        comments: [TaskCommentSchema],
        checklist: [TaskChecklistSchema],
        attachments: [{ type: String }],
        links: [{ type: String }],
        tags: [{ type: String }],
        category: { type: String },
        reviewNote: { type: String },
        reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        reviewedAt: { type: Date },
        activityLog: [TaskActivitySchema],
    },
    { timestamps: true }
);

// Cache invalidation
if (mongoose.models.Task && !mongoose.models.Task.schema.paths.assignees) {
    delete (mongoose.models as any).Task;
}

export default mongoose.models.Task || mongoose.model<ITask>('Task', TaskSchema);
