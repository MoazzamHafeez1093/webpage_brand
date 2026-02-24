import mongoose from 'mongoose';

const CollectionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Collection name is required'],
        trim: true,
        maxLength: [100, 'Collection name cannot exceed 100 characters']
    },

    description: {
        type: String,
        default: '',
        maxLength: [500, 'Description cannot exceed 500 characters']
    },

    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },

    coverImage: {
        type: String,
        default: '',
        validate: {
            validator: function (v) {
                // Allow empty string or valid URL
                return v === '' || /^https?:\/\/.+/.test(v);
            },
            message: 'Cover image must be a valid URL'
        }
    },

    // This enables unlimited nesting: null = top-level, ObjectId = child of another collection
    parentCollection: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Collection',
        default: null
    },

    // For controlling display order
    order: {
        type: Number,
        default: 0
    },

    // For show/hide collections
    isActive: {
        type: Boolean,
        default: true
    },

    // Archived (hidden from admin default view + storefront)
    isArchived: {
        type: Boolean,
        default: false
    },

    // Metadata
    createdBy: {
        type: String,
        default: 'admin'
    }
}, {
    timestamps: true // Automatically adds createdAt and updatedAt
});

// Indexes for performance
CollectionSchema.index({ parentCollection: 1, order: 1 });
CollectionSchema.index({ slug: 1 });
CollectionSchema.index({ isActive: 1 });

// Virtual for getting child collections
CollectionSchema.virtual('children', {
    ref: 'Collection',
    localField: '_id',
    foreignField: 'parentCollection'
});

// Method to get full path (e.g., "Custom Couture > Bridal > 2026 Velvet Series")
CollectionSchema.methods.getFullPath = async function () {
    let path = [this.name];
    let current = this;

    while (current.parentCollection) {
        current = await mongoose.model('Collection').findById(current.parentCollection);
        if (current) {
            path.unshift(current.name);
        } else {
            break;
        }
    }

    return path.join(' > ');
};

// Pre-save hook REMOVED to avoid "a is not a function" error in minified builds.
// Slug generation is now handled explicitly in the Server Action (app/actions.js).

// Static method to get collection tree
CollectionSchema.statics.getTree = async function (parentId = null) {
    const collections = await this.find({
        parentCollection: parentId,
        isActive: true
    }).sort({ order: 1 });

    const tree = await Promise.all(
        collections.map(async (collection) => {
            const children = await this.getTree(collection._id);
            return {
                ...collection.toObject(),
                children
            };
        })
    );

    return tree;
};

// Prevent deletion if has children or products
CollectionSchema.pre('remove', async function (next) {
    const Product = mongoose.model('Product');

    // Check for child collections
    const childCount = await mongoose.model('Collection').countDocuments({
        parentCollection: this._id
    });

    if (childCount > 0) {
        throw new Error('Cannot delete collection with subcollections. Delete children first.');
    }

    // Check for products
    const productCount = await Product.countDocuments({
        collectionRef: this._id
    });

    if (productCount > 0) {
        throw new Error('Cannot delete collection with products. Move or delete products first.');
    }

    next();
});

export default mongoose.models.Collection || mongoose.model('Collection', CollectionSchema);
