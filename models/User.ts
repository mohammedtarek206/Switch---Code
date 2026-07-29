import mongoose, { Document, Schema, Types } from 'mongoose';
import './Committee';
import './CommunityTeam';

export type UserRole =
  | 'super_admin'
  | 'admin'
  | 'president'
  | 'vice_president'
  | 'hr'
  | 'pr'
  | 'marketing'
  | 'media'
  | 'technical'
  | 'instructor'
  | 'mentor'
  | 'committee_leader'
  | 'vice_committee_leader'
  | 'member'
  | 'student';

export interface IUser extends Document {
  name: string;
  email?: string;
  password?: string;
  role: UserRole;
  accessCode?: string;
  username?: string;
  phone?: string;
  tempPassword?: string;
  activationCode?: string;
  mustChangePassword?: boolean;
  firstLogin?: boolean;
  profileCompleted?: boolean;

  isActive: boolean;
  permissions?: string[];
  committeeId?: Types.ObjectId;
  teamId?: Types.ObjectId;
  position?: string;
  notes?: string;
  createdBy?: Types.ObjectId;
  avatar?: string;
  bio?: string;
  skills?: string[];
  social?: {
    linkedin?: string;
    github?: string;
    portfolio?: string;
  };
  performanceScore?: number;
  badges?: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, unique: true, sparse: true },
    password: { type: String },
    role: {
      type: String,
      enum: [
        'super_admin', 'admin', 'president', 'vice_president',
        'hr', 'pr', 'marketing', 'media', 'technical',
        'instructor', 'mentor', 'committee_leader',
        'vice_committee_leader', 'member', 'student',
      ],
      default: 'member',
    },
    accessCode: { type: String, unique: true, sparse: true },
    username: { type: String, unique: true, sparse: true },
    phone: { type: String, unique: true, sparse: true },
    tempPassword: { type: String },
    activationCode: { type: String },
    mustChangePassword: { type: Boolean, default: true },
    firstLogin: { type: Boolean, default: true },
    profileCompleted: { type: Boolean, default: false },

    isActive: { type: Boolean, default: true },
    permissions: [{ type: String }],
    committeeId: { type: Schema.Types.ObjectId, ref: 'Committee' },
    teamId: { type: Schema.Types.ObjectId, ref: 'CommunityTeam' },
    position: { type: String },
    notes: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    avatar: { type: String },
    bio: { type: String },
    skills: [{ type: String }],
    social: {
      linkedin: { type: String },
      github: { type: String },
      portfolio: { type: String },
    },
    performanceScore: { type: Number, default: 0 },
    badges: [{ type: Schema.Types.ObjectId, ref: 'Badge' }],
  },
  {
    timestamps: true,
  }
);

// Performance indexes
UserSchema.index({ role: 1 });
UserSchema.index({ committeeId: 1 });
UserSchema.index({ isActive: 1 });
UserSchema.index({ createdAt: -1 });


// If cached User model exists without teamId or committeeId, delete cache to force fresh compilation
if (
  mongoose.models.User &&
  (!mongoose.models.User.schema.paths.teamId || !mongoose.models.User.schema.paths.committeeId || !mongoose.models.User.schema.paths.firstLogin)
) {
  delete (mongoose.models as any).User;
}

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
