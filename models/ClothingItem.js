import mongoose from 'mongoose';

const ClothingItemSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please provide a name for this clothing item.'],
        maxlength: [60, 'Name cannot be more than 60 characters'],
    },
    description: {
        type: String,
        required: [true, 'Please provide a description.'],
    },
    price: {
        type: Number,
        required: [true, 'Please provide a price.'],
    },
    category: {
        type: String,
        enum: ['Shirts', 'Pants', 'Outerwear', 'Accessories'],
        required: true,
    },
    sizes: {
        type: [String],
        enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
        default: ['M'],
    },
    inStock: {
        type: Boolean,
        default: true,
    },
    images: [{
        thumbnail: {
            type: String,
            required: true,
        },
        fullRes: {
            type: String,
            required: true,
        },
        alt: String,
    }],
}, { timestamps: true });

export default mongoose.models.ClothingItem || mongoose.model('ClothingItem', ClothingItemSchema);
