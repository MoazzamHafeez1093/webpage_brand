'use server'

import { dbConnect } from '@/lib/mongoose';
import { revalidatePath } from 'next/cache';
import mongoose from 'mongoose';

// Direct model definition to avoid import issues
const CollectionSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    slug: { type: String, unique: true, lowercase: true },
    coverImage: { type: String, default: '' },
    parentCollection: { type: mongoose.Schema.Types.ObjectId, ref: 'Collection', default: null },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Virtuals
CollectionSchema.virtual('children', {
    ref: 'Collection',
    localField: '_id',
    foreignField: 'parentCollection'
});

// Helper to get or compile model
const getCollectionModel = () => {
    return mongoose.models.Collection || mongoose.model('Collection', CollectionSchema);
};

export async function createCollectionAction(formData) {
    console.log('[CreateCollection] START');
    try {
        await dbConnect();

        const Collection = getCollectionModel();

        const name = formData.get('name');
        if (!name) return { success: false, error: 'Name required' };

        // Slug logic
        let baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        let slug = baseSlug;
        let counter = 1;
        while (await Collection.findOne({ slug })) {
            slug = `${baseSlug}-${counter}`;
            counter++;
        }

        const newDoc = await Collection.create({
            name,
            description: formData.get('description'),
            coverImage: formData.get('coverImage'),
            parentCollection: formData.get('parentCollection') || null,
            slug
        });

        console.log('[CreateCollection] SUCCESS', newDoc._id);

        revalidatePath('/');
        revalidatePath('/admin/secret-login');

        return { success: true, collection: JSON.parse(JSON.stringify(newDoc)) };

    } catch (e) {
        console.error('[CreateCollection] ERROR', e);
        return { success: false, error: e.message };
    }
}

export async function getCollectionsAction() {
    try {
        await dbConnect();
        const Collection = getCollectionModel();
        const docs = await Collection.find({ isActive: true }).sort({ order: 1 }).lean();
        return JSON.parse(JSON.stringify(docs));
    } catch (e) {
        return [];
    }
}

export async function getCollectionTreeAction() {
    try {
        await dbConnect();
        const Collection = getCollectionModel();
        const collections = await Collection.find({ isActive: true }).sort({ order: 1 }).lean();

        const buildTree = (parentId = null) => {
            return collections
                .filter(c => (c.parentCollection?.toString() || null) === (parentId?.toString() || null))
                .map(c => ({
                    ...c,
                    _id: c._id.toString(),
                    children: buildTree(c._id)
                }));
        };

        return JSON.parse(JSON.stringify(buildTree()));
    } catch (e) {
        return [];
    }
}

export async function deleteCollectionAction(id) {
    try {
        await dbConnect();
        const Collection = getCollectionModel();

        // Simple check
        const hasChildren = await Collection.findOne({ parentCollection: id });
        if (hasChildren) return { success: false, error: 'Has subcollections' };

        await Collection.findByIdAndDelete(id);

        revalidatePath('/');
        revalidatePath('/admin/secret-login');
        return { success: true };
    } catch (e) {
        return { success: false, error: e.message };
    }
}
