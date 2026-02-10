'use server'

import dbConnect from '@/lib/mongoose';
import Collection from '@/models/Collection';
import Product from '@/models/Product';
import { revalidatePath } from 'next/cache';
import mongoose from 'mongoose';

// ============================================
// COLLECTION ACTIONS
// ============================================

/**
 * Create a new collection
 */
export async function createCollection(formData) {
    try {
        await dbConnect();

        const name = formData.get('name');
        const description = formData.get('description') || '';
        const coverImage = formData.get('coverImage') || '';
        const parentCollectionId = formData.get('parentCollection') || null;

        if (!name || name.trim() === '') {
            return { success: false, error: 'Collection name is required' };
        }

        // Generate slug
        let baseSlug = name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');

        let slug = baseSlug;
        let counter = 1;

        // Ensure unique slug
        while (await Collection.findOne({ slug })) {
            slug = `${baseSlug}-${counter}`;
            counter++;
        }

        // Get order (last + 1)
        const lastCollection = await Collection.findOne({
            parentCollection: parentCollectionId
        }).sort({ order: -1 });

        const order = lastCollection ? lastCollection.order + 1 : 0;

        // Create collection
        const collection = await Collection.create({
            name: name.trim(),
            description: description.trim(),
            slug,
            coverImage,
            parentCollection: parentCollectionId || null,
            order
        });

        revalidatePath('/');
        revalidatePath('/admin/secret-login');

        return {
            success: true,
            collection: JSON.parse(JSON.stringify(collection))
        };

    } catch (error) {
        console.error('Create collection error:', error);
        return {
            success: false,
            error: error.message || 'Failed to create collection'
        };
    }
}

/**
 * Get all collections (flat list)
 */
export async function getAllCollections() {
    try {
        await dbConnect();
        const collections = await Collection
            .find({ isActive: true })
            .sort({ order: 1 })
            .lean();

        return JSON.parse(JSON.stringify(collections));
    } catch (error) {
        console.error('Get all collections error:', error);
        return [];
    }
}

/**
 * Get collection tree (nested structure)
 */
export async function getCollectionTree() {
    try {
        await dbConnect();
        const collections = await Collection
            .find({ isActive: true })
            .sort({ order: 1 })
            .lean();

        // Build tree structure
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

        const tree = buildTree();
        return JSON.parse(JSON.stringify(tree));

    } catch (error) {
        console.error('Get collection tree error:', error);
        return [];
    }
}

/**
 * Get single collection by ID
 */
export async function getCollectionById(id) {
    try {
        await dbConnect();

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return null;
        }

        const collection = await Collection.findById(id).lean();
        return collection ? JSON.parse(JSON.stringify(collection)) : null;

    } catch (error) {
        console.error('Get collection by ID error:', error);
        return null;
    }
}

/**
 * Get collection by slug
 */
export async function getCollectionBySlug(slug) {
    try {
        await dbConnect();
        const collection = await Collection.findOne({ slug, isActive: true }).lean();
        return collection ? JSON.parse(JSON.stringify(collection)) : null;
    } catch (error) {
        console.error('Get collection by slug error:', error);
        return null;
    }
}

/**
 * Update collection
 */
export async function updateCollection(id, formData) {
    try {
        await dbConnect();

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return { success: false, error: 'Invalid collection ID' };
        }

        const updateData = {
            name: formData.get('name'),
            description: formData.get('description'),
            coverImage: formData.get('coverImage')
        };

        // Remove undefined values
        Object.keys(updateData).forEach(key =>
            updateData[key] === undefined && delete updateData[key]
        );

        const collection = await Collection.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!collection) {
            return { success: false, error: 'Collection not found' };
        }

        revalidatePath('/');
        revalidatePath('/admin/secret-login');

        return {
            success: true,
            collection: JSON.parse(JSON.stringify(collection))
        };

    } catch (error) {
        console.error('Update collection error:', error);
        return {
            success: false,
            error: error.message || 'Failed to update collection'
        };
    }
}

/**
 * Delete collection
 */
export async function deleteCollection(id) {
    try {
        await dbConnect();

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return { success: false, error: 'Invalid collection ID' };
        }

        // Check for child collections
        const hasChildren = await Collection.findOne({ parentCollection: id });
        if (hasChildren) {
            return {
                success: false,
                error: 'Cannot delete collection with subcollections. Delete children first.'
            };
        }

        // Check for products
        const hasProducts = await Product.findOne({ collection: id });
        if (hasProducts) {
            return {
                success: false,
                error: 'Cannot delete collection with products. Move or delete products first.'
            };
        }

        await Collection.findByIdAndDelete(id);

        revalidatePath('/');
        revalidatePath('/admin/secret-login');

        return { success: true };

    } catch (error) {
        console.error('Delete collection error:', error);
        return {
            success: false,
            error: error.message || 'Failed to delete collection'
        };
    }
}

/**
 * Reorder collections
 */
export async function reorderCollections(orderedIds, parentId = null) {
    try {
        await dbConnect();

        const updates = orderedIds.map((id, index) => ({
            updateOne: {
                filter: { _id: id },
                update: { order: index }
            }
        }));

        await Collection.bulkWrite(updates);

        revalidatePath('/');
        revalidatePath('/admin/secret-login');

        return { success: true };

    } catch (error) {
        console.error('Reorder collections error:', error);
        return {
            success: false,
            error: error.message || 'Failed to reorder collections'
        };
    }
}

// ============================================
// PRODUCT ACTIONS
// ============================================

/**
 * Create a new product
 */
export async function createProduct(formData) {
    try {
        await dbConnect();

        const collectionId = formData.get('collection');
        if (!collectionId || !mongoose.Types.ObjectId.isValid(collectionId)) {
            return { success: false, error: 'Valid collection is required' };
        }

        const name = formData.get('name');
        if (!name || name.trim() === '') {
            return { success: false, error: 'Product name is required' };
        }

        const imagesString = formData.get('images') || '';
        const images = imagesString
            .split(',')
            .map(img => img.trim())
            .filter(img => img.length > 0);

        if (images.length === 0) {
            return { success: false, error: 'At least one image is required' };
        }

        const availableSizesString = formData.get('availableSizes') || '';
        const availableSizes = availableSizesString
            .split(',')
            .map(size => size.trim())
            .filter(size => size.length > 0);

        // Get order
        const lastProduct = await Product.findOne({
            collection: collectionId
        }).sort({ order: -1 });

        const order = lastProduct ? lastProduct.order + 1 : 0;

        // Create product
        const product = await Product.create({
            name: name.trim(),
            description: (formData.get('description') || '').trim(),
            price: parseFloat(formData.get('price')) || null,
            images,
            collection: collectionId,
            businessType: formData.get('businessType') || 'retail',
            inspirationImage: (formData.get('inspirationImage') || '').trim(),
            availableSizes,
            order
        });

        revalidatePath('/');
        revalidatePath('/admin/secret-login');

        return {
            success: true,
            product: JSON.parse(JSON.stringify(product))
        };

    } catch (error) {
        console.error('Create product error:', error);
        return {
            success: false,
            error: error.message || 'Failed to create product'
        };
    }
}

/**
 * Get all products
 */
export async function getAllProducts() {
    try {
        await dbConnect();
        const products = await Product
            .find({ isActive: true })
            .populate('collection')
            .sort({ order: 1 })
            .lean();

        return JSON.parse(JSON.stringify(products));
    } catch (error) {
        console.error('Get all products error:', error);
        return [];
    }
}

/**
 * Get products by collection
 */
export async function getProductsByCollection(collectionId) {
    try {
        await dbConnect();

        if (!mongoose.Types.ObjectId.isValid(collectionId)) {
            return [];
        }

        const products = await Product
            .find({ collection: collectionId, isActive: true })
            .sort({ order: 1 })
            .lean();

        return JSON.parse(JSON.stringify(products));
    } catch (error) {
        console.error('Get products by collection error:', error);
        return [];
    }
}

/**
 * Get products by business type
 */
export async function getProductsByBusinessType(businessType) {
    try {
        await dbConnect();

        if (!['retail', 'custom'].includes(businessType)) {
            return [];
        }

        const products = await Product
            .find({ businessType, isActive: true })
            .populate('collection')
            .sort({ order: 1 })
            .lean();

        return JSON.parse(JSON.stringify(products));
    } catch (error) {
        console.error('Get products by business type error:', error);
        return [];
    }
}

/**
 * Get featured products
 */
export async function getFeaturedProducts(limit = 6) {
    try {
        await dbConnect();
        const products = await Product
            .find({ isFeatured: true, isActive: true })
            .populate('collection')
            .sort({ order: 1 })
            .limit(limit)
            .lean();

        return JSON.parse(JSON.stringify(products));
    } catch (error) {
        console.error('Get featured products error:', error);
        return [];
    }
}

/**
 * Get product by ID
 */
export async function getProductById(id) {
    try {
        await dbConnect();

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return null;
        }

        const product = await Product
            .findById(id)
            .populate('collection')
            .lean();

        return product ? JSON.parse(JSON.stringify(product)) : null;
    } catch (error) {
        console.error('Get product by ID error:', error);
        return null;
    }
}

/**
 * Update product
 */
export async function updateProduct(id, formData) {
    try {
        await dbConnect();

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return { success: false, error: 'Invalid product ID' };
        }

        const updateData = {};

        const name = formData.get('name');
        if (name) updateData.name = name.trim();

        const description = formData.get('description');
        if (description !== null) updateData.description = description.trim();

        const price = formData.get('price');
        if (price !== null) updateData.price = parseFloat(price) || null;

        const imagesString = formData.get('images');
        if (imagesString) {
            updateData.images = imagesString
                .split(',')
                .map(img => img.trim())
                .filter(img => img.length > 0);
        }

        const product = await Product.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!product) {
            return { success: false, error: 'Product not found' };
        }

        revalidatePath('/');
        revalidatePath('/admin/secret-login');

        return {
            success: true,
            product: JSON.parse(JSON.stringify(product))
        };

    } catch (error) {
        console.error('Update product error:', error);
        return {
            success: false,
            error: error.message || 'Failed to update product'
        };
    }
}

/**
 * Delete product
 */
export async function deleteProduct(id) {
    try {
        await dbConnect();

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return { success: false, error: 'Invalid product ID' };
        }

        await Product.findByIdAndDelete(id);

        revalidatePath('/');
        revalidatePath('/admin/secret-login');

        return { success: true };

    } catch (error) {
        console.error('Delete product error:', error);
        return {
            success: false,
            error: error.message || 'Failed to delete product'
        };
    }
}

/**
 * Increment product view count
 */
export async function incrementProductViews(id) {
    try {
        await dbConnect();

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return { success: false };
        }

        await Product.findByIdAndUpdate(
            id,
            { $inc: { viewCount: 1 } }
        );

        return { success: true };
    } catch (error) {
        console.error('Increment views error:', error);
        return { success: false };
    }
}

/**
 * Increment product inquiry count
 */
export async function incrementProductInquiries(id) {
    try {
        await dbConnect();

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return { success: false };
        }

        await Product.findByIdAndUpdate(
            id,
            { $inc: { inquiryCount: 1 } }
        );

        return { success: true };
    } catch (error) {
        console.error('Increment inquiries error:', error);
        return { success: false };
    }
}
