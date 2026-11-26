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
  | 'committee_applicant'
  | 'member'
  | 'student';

export type AccountType = 'student' | 'instructor' | 'committee_applicant' | 'member' | 'admin';

export type AccountStatus =
  | 'pending_verification'
  | 'pending_review'
  | 'active'
  | 'rejected'
  | 'suspended';

export interface IUser extends Document {
  name: string;
  email?: string;
  password?: string;
  role: UserRole;
  roles: UserRole[];
  accountType?: AccountType;
  accountStatus: AccountStatus;
  emailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;

  accessCode?: string;
  username?: string;
  phone?: string;
  tempPassword?: string;
  activationCode?: string;
  mustChangePassword?: boolean;
  firstLogin?: boolean;
  profileCompleted?: boolean;

  governorate?: string;
  university?: string;
  academicYear?: string;
  graduationYear?: string;
  goals?: string;
  interestedTracks?: Types.ObjectId[];
  experienceYears?: number;
  previousExperience?: string;
  canPublishDirectly?: boolean;
  termsAcceptedAt?: Date;
  lastLoginAt?: Date;

  isActive: boolean;
  permissions?: string[];
  committeeId?: Types.ObjectId;
  teamId?: Types.ObjectId;
  position?: string;
  notes?: string;
  createdBy?: Types.ObjectId;
  avatar?: string;
  avatarDriveFileId?: string;
  avatarSource?: 'google_drive' | 'cloudinary' | 'url';
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
    name: { type: String, required: true, trim: true },
    email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    password: { type: String },
    role: {
      type: String,
      enum: [
        'super_admin', 'admin', 'president', 'vice_president',
        'hr', 'pr', 'marketing', 'media', 'technical',
        'instructor', 'mentor', 'committee_leader',
        'vice_committee_leader', 'committee_applicant', 'member', 'student',
      ],
      default: 'member',
    },
    roles: [
      {
        type: String,
        enum: [
          'super_admin', 'admin', 'president', 'vice_president',
          'hr', 'pr', 'marketing', 'media', 'technical',
          'instructor', 'mentor', 'committee_leader',
          'vice_committee_leader', 'committee_applicant', 'member', 'student',
        ],
      },
    ],
    accountType: {
      type: String,
      enum: ['student', 'instructor', 'committee_applicant', 'member', 'admin'],
    },
    accountStatus: {
      type: String,
      enum: ['pending_verification', 'pending_review', 'active', 'rejected', 'suspended'],
      default: 'active',
    },
    emailVerified: { type: Boolean, default: true },
    emailVerificationToken: { type: String },
    emailVerificationExpires: { type: Date },
    passwordResetToken: { type: String },
    passwordResetExpires: { type: Date },

    accessCode: { type: String, unique: true, sparse: true },
    username: { type: String, unique: true, sparse: true },
    phone: { type: String, unique: true, sparse: true },
    tempPassword: { type: String },
    activationCode: { type: String },
    mustChangePassword: { type: Boolean, default: false },
    firstLogin: { type: Boolean, default: false },
    profileCompleted: { type: Boolean, default: false },

    governorate: { type: String },
    university: { type: String },
    academicYear: { type: String },
    graduationYear: { type: String },
    goals: { type: String },
    interestedTracks: [{ type: Schema.Types.ObjectId, ref: 'LMSTrack' }],
    experienceYears: { type: Number, default: 0 },
    previousExperience: { type: String },
    canPublishDirectly: { type: Boolean, default: false },
    termsAcceptedAt: { type: Date },
    lastLoginAt: { type: Date },

    isActive: { type: Boolean, default: true },
    permissions: [{ type: String }],
    committeeId: { type: Schema.Types.ObjectId, ref: 'Committee' },
    teamId: { type: Schema.Types.ObjectId, ref: 'CommunityTeam' },
    position: { type: String },
    notes: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    avatar: { type: String },
    avatarDriveFileId: { type: String },
    avatarSource: { type: String, enum: ['google_drive', 'cloudinary', 'url'] },
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
UserSchema.index({ accountStatus: 1 });
UserSchema.index({ accountType: 1 });
UserSchema.index({ committeeId: 1 });
UserSchema.index({ isActive: 1 });
UserSchema.index({ createdAt: -1 });

if (
  mongoose.models.User &&
  (!mongoose.models.User.schema.paths.accountStatus ||
    !mongoose.models.User.schema.paths.roles ||
    !mongoose.models.User.schema.paths.teamId ||
    !mongoose.models.User.schema.paths.committeeId ||
    !mongoose.models.User.schema.paths.avatarDriveFileId)
) {
  delete (mongoose.models as Record<string, unknown>).User;
}

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
