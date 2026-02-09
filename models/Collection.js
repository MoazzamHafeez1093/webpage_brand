import mongoose from 'mongoose';

const CollectionSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please provide a title for this collection.'],
        maxlength: [60, 'Title cannot be more than 60 characters'],
    },
    description: {
        type: String,
        required: [true, 'Please provide a description.'],
    },
    image: {
        type: String,
        required: [true, 'Please provide a cover image for the collection.'],
    },
    products: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ClothingItem',
    }],
    slug: {
        type: String,
        unique: true,
    }
}, { timestamps: true });

// Simple slug generator pre-save
CollectionSchema.pre('save', function (next) {
    if (this.isModified('title')) {
        this.slug = this.title.toLowerCase().split(' ').join('-');
    }
    next();
});

export default mongoose.models.Collection || mongoose.model('Collection', CollectionSchema);
