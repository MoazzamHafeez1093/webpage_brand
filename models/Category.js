import mongoose from 'mongoose';

const CategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a category name.'],
        trim: true,
        maxlength: [50, 'Name cannot be more than 50 characters'],
    },
    slug: {
        type: String,
        unique: true,
        index: true,
    },
    description: {
        type: String,
        maxlength: [500, 'Description cannot be more than 500 characters'],
    },
    image: {
        type: String, // Optional cover image for the category
    },
    parent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        default: null, // Null means it's a top-level category
    },
    order: {
        type: Number,
        default: 0, // For manual ordering
    },
    type: {
        type: String,
        enum: ['retail', 'custom', 'general'],
        default: 'general',
    }
}, { timestamps: true });

// Auto-generate slug from name if not provided
CategorySchema.pre('save', async function (next) {
    if (!this.isModified('name')) return next();

    // Simple slug generator: name-randomString (to avoid duplicates easily)
    // For a cleaner URL, we might want to check for uniqueness, but this is a quick start.
    const baseSlug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    this.slug = baseSlug;

    // Ensure uniqueness
    const existing = await mongoose.models.Category.findOne({ slug: this.slug, _id: { $ne: this._id } });
    if (existing) {
        this.slug = `${baseSlug}-${Math.floor(Math.random() * 10000)}`;
    }
    next();
});

export default mongoose.models.Category || mongoose.model('Category', CategorySchema);
