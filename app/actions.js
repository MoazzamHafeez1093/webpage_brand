'use server'

import { dbConnect } from '@/lib/mongoose';
import { revalidatePath } from 'next/cache';
import mongoose from 'mongoose';

// SIDE EFFECT IMPORTS TO REGISTER MODELS
import '@/models/Collection';
import '@/models/Product';

// ============================================
// COLLECTION ACTIONS
// ============================================

export async function createNewCollectionAction(formData) {
    console.log('[CreateCollection] 1. START');

    try {
        // 1. CONNECT DB
        await dbConnect();
        console.log('[CreateCollection] 2. DB Connected');

        // 2. PARSE DATA
        const name = formData.get('name');
        if (!name || name.trim() === '') {
            return { success: false, error: 'Collection name is required' };
        }

        // 3. GET MODEL SAFELY
        // We do not import Collection directly to avoid "a is not a function" bundler issues
        const Collection = mongoose.models.Collection;
        if (!Collection) {
            throw new Error('Collection Model not registered even after side-effect import');
        }

        // 4. LOGIC
        let baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        let slug = baseSlug;
        let counter = 1;

        while (await Collection.findOne({ slug })) {
            slug = `${baseSlug}-${counter}`;
            counter++;
        }

        const newCollection = await Collection.create({
            name: name.trim(),
            description: (formData.get('description') || '').trim(),
            slug,
            coverImage: formData.get('coverImage') || '',
            parentCollection: formData.get('parentCollection') || null,
            order: 0
        });
        console.log('[CreateCollection] Created:', newCollection._id);

        // 5. REVALIDATE
        try {
            revalidatePath('/');
            revalidatePath('/admin/secret-login');
        } catch (e) {
            console.warn('Revalidate warning:', e);
        }

        return {
            success: true,
            collection: JSON.parse(JSON.stringify(newCollection))
        };

    } catch (error) {
        console.error('[CreateCollection] ERROR:', error);
        return {
            success: false,
            error: `Server Error: ${error.message}`
        };
    }
}

export async function getAllCollections() {
    try {
        await dbConnect();
        const Collection = mongoose.models.Collection;
        if (!Collection) return [];

        const collections = await Collection.find({ isActive: true }).sort({ order: 1 }).lean();
        return JSON.parse(JSON.stringify(collections));
    } catch (error) {
        console.error('Get all collections error:', error);
        return [];
    }
}

export async function getCollectionTree() {
    try {
        await dbConnect();
        const Collection = mongoose.models.Collection;
        if (!Collection) return [];

        const collections = await Collection.find({ isActive: true }).sort({ order: 1 }).lean();

        const buildTree = (parentId = null) => {
            return collections
                .filter(col => {
                    const colParentId = col.parentCollection?.toString() || null;
                    const targetParentId = parentId?.toString() || null;
                    return colParentId === targetParentId;
                })
                .map(col => ({
                    ...col,
                    _id: col._id.toString(),
                    children: buildTree(col._id)
                }));
        };

        return JSON.parse(JSON.stringify(buildTree()));
    } catch (error) {
        console.error('Get collection tree error:', error);
        return [];
    }
}

export async function deleteCollection(id) {
    try {
        await dbConnect();
        const Collection = mongoose.models.Collection;
        const Product = mongoose.models.Product;

        const hasChildren = await Collection.findOne({ parentCollection: id });
        if (hasChildren) return { success: false, error: 'Cannot delete: Has subcollections' };

        const hasProducts = await Product.findOne({ collection: id });
        if (hasProducts) return { success: false, error: 'Cannot delete: Contains products' };

        await Collection.findByIdAndDelete(id);

        revalidatePath('/');
        revalidatePath('/admin/secret-login');
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// ============================================
// PRODUCT ACTIONS
// ============================================

export async function createProduct(formData) {
    try {
        await dbConnect();
        const Product = mongoose.models.Product;

        const collectionId = formData.get('collection');
        if (!collectionId) return { success: false, error: 'Collection required' };

        const name = formData.get('name');
        const imagesString = formData.get('images') || '';
        const images = imagesString.split(',').filter(x => x);

        const product = await Product.create({
            name,
            description: formData.get('description'),
            price: parseFloat(formData.get('price')) || 0,
            images,
            collection: collectionId,
            businessType: formData.get('businessType') || 'retail',
            inspirationImage: formData.get('inspirationImage'),
        });

        revalidatePath('/');
        revalidatePath('/admin/secret-login');

        return { success: true, product: JSON.parse(JSON.stringify(product)) };
    } catch (error) {
        console.error('[CreateProduct] Error:', error);
        return { success: false, error: error.message };
    }
}

export async function getAllProducts() {
    try {
        await dbConnect();
        const Product = mongoose.models.Product;
        if (!Product) return [];

        const products = await Product.find({ isActive: true }).populate('collection').sort({ order: 1 }).lean();
        return JSON.parse(JSON.stringify(products));
    } catch (error) {
        console.error('Get products error:', error);
        return [];
    }
}
