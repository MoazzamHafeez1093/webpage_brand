import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true,
        maxLength: [200, 'Product name cannot exceed 200 characters']
    },

    description: {
        type: String,
        default: '',
        maxLength: [2000, 'Description cannot exceed 2000 characters']
    },

    // Main product images (can be multiple)
    images: [{
        type: String,
        validate: {
            validator: function (v) {
                return /^https?:\/\/.+/.test(v);
            },
            message: 'Image must be a valid URL'
        }
    }],

    // Optional price (may not be needed for custom items)
    price: {
        type: Number,
        min: [0, 'Price cannot be negative'],
        default: null
    },

    // CRITICAL: Link to Collection instead of Category
    collection: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Collection',
        required: [true, 'Collection is required'],
        index: true
    },

    // CRITICAL: Distinguish between Retail and Custom
    businessType: {
        type: String,
        enum: {
            values: ['retail', 'custom'],
            message: 'Business type must be either retail or custom'
        },
        required: [true, 'Business type is required'],
        index: true
    },

    // For Custom work: Customer's inspiration photo
    inspirationImage: {
        type: String,
        default: '',
        validate: {
            validator: function (v) {
                return v === '' || /^https?:\/\/.+/.test(v);
            },
            message: 'Inspiration image must be a valid URL'
        }
    },

    // For Custom work: Additional notes about customization
    customizationNotes: {
        type: String,
        default: '',
        maxLength: [1000, 'Notes cannot exceed 1000 characters']
    },

    // For Retail: Available sizes (if applicable)
    availableSizes: [{
        type: String,
        enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Custom']
    }],

    // For Retail: Stock status
    inStock: {
        type: Boolean,
        default: true
    },

    // Display order within collection
    order: {
        type: Number,
        default: 0
    },

    // Active/Inactive
    isActive: {
        type: Boolean,
        default: true
    },

    // Featured product (for homepage highlights)
    isFeatured: {
        type: Boolean,
        default: false
    },

    // SEO fields
    metaTitle: {
        type: String,
        maxLength: [60, 'Meta title cannot exceed 60 characters']
    },

    metaDescription: {
        type: String,
        maxLength: [160, 'Meta description cannot exceed 160 characters']
    },

    // Tags for filtering
    tags: [{
        type: String,
        trim: true
    }],

    // View count for analytics
    viewCount: {
        type: Number,
        default: 0
    },

    // WhatsApp inquiry count
    inquiryCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Indexes for performance
ProductSchema.index({ collection: 1, order: 1 });
ProductSchema.index({ businessType: 1, isActive: 1 });
ProductSchema.index({ isFeatured: 1, isActive: 1 });
ProductSchema.index({ tags: 1 });

// Virtual for primary image (first image in array)
ProductSchema.virtual('primaryImage').get(function () {
    return this.images && this.images.length > 0 ? this.images[0] : '';
});

// Method to get WhatsApp inquiry message
ProductSchema.methods.getWhatsAppMessage = function (collectionName) {
    if (this.businessType === 'retail') {
        return `Hi! I'm interested in checking the size availability for "${this.name}" from the ${collectionName} collection.`;
    } else {
        return `Hi! I'd like to get a price estimate for a custom design like "${this.name}" from the ${collectionName} collection.`;
    }
};

// Method to increment view count
ProductSchema.methods.incrementViews = async function () {
    this.viewCount += 1;
    await this.save();
};

// Method to increment inquiry count
ProductSchema.methods.incrementInquiries = async function () {
    this.inquiryCount += 1;
    await this.save();
};

// Static method to get products by business type
ProductSchema.statics.getByBusinessType = async function (businessType) {
    return await this.find({
        businessType,
        isActive: true
    })
        .populate('collection')
        .sort({ order: 1 });
};

// Static method to get featured products
ProductSchema.statics.getFeatured = async function (limit = 6) {
    return await this.find({
        isFeatured: true,
        isActive: true
    })
        .populate('collection')
        .sort({ order: 1 })
        .limit(limit);
};

// Ensure at least one image exists before saving
ProductSchema.pre('save', function (next) {
    if (this.images.length === 0) {
        next(new Error('At least one product image is required'));
    }
    next();
});

// Auto-generate meta fields if not provided
ProductSchema.pre('save', function (next) {
    if (!this.metaTitle) {
        this.metaTitle = this.name.substring(0, 60);
    }
    if (!this.metaDescription) {
        this.metaDescription = this.description.substring(0, 160);
    }
    next();
});

export default mongoose.models.Product || mongoose.model('Product', ProductSchema);
