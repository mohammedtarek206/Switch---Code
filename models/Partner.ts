import mongoose, { Document, Schema } from 'mongoose';

export interface IPartner extends Document {
  name: string;
  logo: string;
  driveFileId?: string;
  sourceType: 'url' | 'drive' | 'upload';
  description?: string;
  websiteUrl?: string;
  partnershipType?: string;
  isFeatured: boolean;
  showOnHomepage: boolean;
  isPublished: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const PartnerSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    logo: { type: String, required: true },
    driveFileId: { type: String, default: '' },
    sourceType: {
      type: String,
      enum: ['url', 'drive', 'upload'],
      default: 'url',
    },
    description: { type: String, default: '' },
    websiteUrl: { type: String, default: '' },
    partnershipType: { type: String, default: '' },
    isFeatured: { type: Boolean, default: false },
    showOnHomepage: { type: Boolean, default: true },
    isPublished: { type: Boolean, default: false },
    displayOrder: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

PartnerSchema.index({ isPublished: 1, displayOrder: 1 });

export default mongoose.models.Partner ||
  mongoose.model<IPartner>('Partner', PartnerSchema);
