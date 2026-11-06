import mongoose from 'mongoose';

const EventGalleryImageSchema = new mongoose.Schema({
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true,
    },
    imageUrl: {
        type: String,
        required: true,
    },
    publicId: {
        type: String,
        required: true,
    },
    title: {
        type: String,
        default: '',
    },
    caption: {
        type: String,
        default: '',
    },
    altText: {
        type: String,
        default: '',
    },
    order: {
        type: Number,
        default: 0,
    },
    isPublished: {
        type: Boolean,
        default: true,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }
}, { timestamps: true });

// Avoid model recompilation errors in Next.js dev server
export default mongoose.models.EventGalleryImage || mongoose.model('EventGalleryImage', EventGalleryImageSchema);
