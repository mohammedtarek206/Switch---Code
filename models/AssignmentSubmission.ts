import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IAssignmentSubmission extends Document {
    userId: Types.ObjectId;
    assignmentId: Types.ObjectId;
    submissionText?: string;
    submissionUrl?: string;
    submittedAt: Date;
    status: 'submitted' | 'reviewed' | 'graded' | 'returned';
    score?: number;
    feedback?: string;
    gradedBy?: Types.ObjectId;
    gradedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const AssignmentSubmissionSchema: Schema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        assignmentId: { type: Schema.Types.ObjectId, ref: 'LMSAssignment', required: true },
        submissionText: { type: String },
        submissionUrl: { type: String },
        submittedAt: { type: Date, default: Date.now },
        status: {
            type: String,
            enum: ['submitted', 'reviewed', 'graded', 'returned'],
            default: 'submitted',
        },
        score: { type: Number },
        feedback: { type: String },
        gradedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        gradedAt: { type: Date },
    },
    { timestamps: true }
);

AssignmentSubmissionSchema.index({ userId: 1, assignmentId: 1 }, { unique: true });
AssignmentSubmissionSchema.index({ assignmentId: 1 });
AssignmentSubmissionSchema.index({ status: 1 });

export default mongoose.models.AssignmentSubmission ||
    mongoose.model<IAssignmentSubmission>('AssignmentSubmission', AssignmentSubmissionSchema);
