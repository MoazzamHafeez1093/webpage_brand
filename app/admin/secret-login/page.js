'use client'
import { useState, useEffect } from 'react';
import {
    createCollection,
    getAllCollections,
    getCollectionTree,
    updateCollection,
    deleteCollection,
    createProduct,
    getAllProducts,
    getProductsByCollection
} from '@/app/actions';
import styles from './admin.module.css'; // Create this CSS file

export default function AdminDashboard() {
    // ============ STATE MANAGEMENT ============
    const [activeTab, setActiveTab] = useState('collections');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Collections state
    const [collections, setCollections] = useState([]);
    const [collectionTree, setCollectionTree] = useState([]);
    const [selectedCollectionId, setSelectedCollectionId] = useState('');

    // Products state
    const [products, setProducts] = useState([]);

    // Collection form
    const [collectionForm, setCollectionForm] = useState({
        name: '',
        description: '',
        coverImage: '',
        parentCollection: ''
    });

    // Product form
    const [productForm, setProductForm] = useState({
        name: '',
        description: '',
        price: '',
        images: [],
        collection: '',
        businessType: 'retail',
        inspirationImage: '',
        availableSizes: []
    });

    // ============ LOAD DATA ON MOUNT ============
    useEffect(() => {
        loadAllData();
    }, []);

    // ============ DATA LOADING FUNCTIONS ============
    async function loadAllData() {
        setLoading(true);
        setError('');

        try {
            const [collectionsData, treeData, productsData] = await Promise.all([
                getAllCollections(),
                getCollectionTree(),
                getAllProducts()
            ]);

            setCollections(collectionsData || []);
            setCollectionTree(treeData || []);
            setProducts(productsData || []);
        } catch (err) {
            console.error('Error loading data:', err);
            setError('Failed to load data. Please refresh the page.');
        } finally {
            setLoading(false);
        }
    }

    // ============ COLLECTION HANDLERS ============

    // FIX FOR "a is not a function" ERROR - Properly defined handler
    const handleCollectionSubmit = async (e) => {
        e.preventDefault(); // CRITICAL: Prevent default form behavior

        if (!collectionForm.name.trim()) {
            setError('Collection name is required');
            return;
        }

        setLoading(true);
        setError('');
        setSuccessMessage('');

        try {
            const formData = new FormData();
            formData.append('name', collectionForm.name.trim());
            formData.append('description', collectionForm.description.trim());
            formData.append('coverImage', collectionForm.coverImage);

            if (collectionForm.parentCollection) {
                formData.append('parentCollection', collectionForm.parentCollection);
            }

            const result = await createCollection(formData);

            if (result.success) {
                setSuccessMessage('Collection created successfully!');
                resetCollectionForm();
                await loadAllData(); // Reload all data
            } else {
                setError(result.error || 'Failed to create collection');
            }
        } catch (err) {
            console.error('Collection submission error:', err);
            setError('An error occurred while creating the collection');
        } finally {
            setLoading(false);
        }
    };

    const resetCollectionForm = () => {
        setCollectionForm({
            name: '',
            description: '',
            coverImage: '',
            parentCollection: ''
        });
    };

    const handleDeleteCollection = async (id) => {
        if (!confirm('Are you sure you want to delete this collection?')) {
            return;
        }

        setLoading(true);
        setError('');

        try {
            const result = await deleteCollection(id);

            if (result.success) {
                setSuccessMessage('Collection deleted successfully!');
                await loadAllData();
            } else {
                setError(result.error || 'Failed to delete collection');
            }
        } catch (err) {
            console.error('Delete error:', err);
            setError('An error occurred while deleting');
        } finally {
            setLoading(false);
        }
    };

    // ============ PRODUCT HANDLERS ============

    // FIX FOR "a is not a function" ERROR - Properly defined handler
    const handleProductSubmit = async (e) => {
        e.preventDefault(); // CRITICAL: Prevent default form behavior

        if (!productForm.name.trim()) {
            setError('Product name is required');
            return;
        }

        if (!productForm.collection) {
            setError('Please select a collection');
            return;
        }

        if (productForm.images.length === 0) {
            setError('Please upload at least one image');
            return;
        }

        setLoading(true);
        setError('');
        setSuccessMessage('');

        try {
            const formData = new FormData();
            formData.append('name', productForm.name.trim());
            formData.append('description', productForm.description.trim());
            formData.append('price', productForm.price || '0');
            formData.append('images', productForm.images.join(','));
            formData.append('collection', productForm.collection);
            formData.append('businessType', productForm.businessType);
            formData.append('inspirationImage', productForm.inspirationImage);

            if (productForm.availableSizes.length > 0) {
                formData.append('availableSizes', productForm.availableSizes.join(','));
            }

            const result = await createProduct(formData);

            if (result.success) {
                setSuccessMessage('Product created successfully!');
                resetProductForm();
                await loadAllData();
            } else {
                setError(result.error || 'Failed to create product');
            }
        } catch (err) {
            console.error('Product submission error:', err);
            setError('An error occurred while creating the product');
        } finally {
            setLoading(false);
        }
    };

    const resetProductForm = () => {
        setProductForm({
            name: '',
            description: '',
            price: '',
            images: [],
            collection: '',
            businessType: 'retail',
            inspirationImage: '',
            availableSizes: []
        });
    };

    // ============ CLOUDINARY WIDGET ============
    const openCloudinaryWidget = (onSuccess, multiple = true) => {
        if (typeof window === 'undefined' || !window.cloudinary) {
            setError('Cloudinary widget not loaded. Please refresh the page.');
            return;
        }

        const widget = window.cloudinary.createUploadWidget(
            {
                cloudName: 'dk9pid4ec', // REPLACE WITH YOUR CLOUDINARY NAME
                uploadPreset: 'my_unsigned_preset', // REPLACE WITH YOUR PRESET
                sources: ['local', 'url', 'camera'],
                multiple: multiple,
                maxFiles: multiple ? 10 : 1,
                clientAllowedFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
                maxFileSize: 5000000, // 5MB
                cropping: false,
                folder: 'digital-atelier'
            },
            (error, result) => {
                if (error) {
                    console.error('Cloudinary error:', error);
                    setError('Image upload failed. Please try again.');
                    return;
                }

                if (result && result.event === 'success') {
                    onSuccess(result.info.secure_url);
                }
            }
        );

        widget.open();
    };

    // ============ HELPER FUNCTIONS ============
    const renderCollectionTree = (tree, level = 0) => {
        return tree.map(collection => (
            <div key={collection._id} style={{ paddingLeft: `${level * 20}px`, marginBottom: '10px' }}>
                <div className={styles.collectionItem}>
                    <strong>{collection.name}</strong>
                    {collection.coverImage && (
                        <img
                            src={collection.coverImage}
                            alt={collection.name}
                            style={{ width: '50px', marginLeft: '10px' }}
                        />
                    )}
                    <button
                        onClick={() => handleDeleteCollection(collection._id)}
                        className={styles.deleteBtn}
                    >
                        Delete
                    </button>
                </div>
                {collection.children && collection.children.length > 0 && (
                    <div style={{ marginLeft: '20px' }}>
                        {renderCollectionTree(collection.children, level + 1)}
                    </div>
                )}
            </div>
        ));
    };

    // ============ RENDER ============
    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1>Admin Dashboard</h1>
                <a href="/" className={styles.viewSiteBtn}>View Website</a>
            </header>

            {/* Error/Success Messages */}
            {error && (
                <div className={styles.errorMessage}>
                    {error}
                    <button onClick={() => setError('')}>×</button>
                </div>
            )}

            {successMessage && (
                <div className={styles.successMessage}>
                    {successMessage}
                    <button onClick={() => setSuccessMessage('')}>×</button>
                </div>
            )}

            {/* Tab Navigation */}
            <div className={styles.tabs}>
                <button
                    className={activeTab === 'collections' ? styles.activeTab : ''}
                    onClick={() => setActiveTab('collections')}
                >
                    Collections
                </button>
                <button
                    className={activeTab === 'products' ? styles.activeTab : ''}
                    onClick={() => setActiveTab('products')}
                >
                    Products
                </button>
            </div>

            {/* Collections Tab */}
            {activeTab === 'collections' && (
                <div className={styles.tabContent}>
                    <h2>Create New Collection</h2>

                    <form onSubmit={handleCollectionSubmit} className={styles.form}>
                        <div className={styles.formGroup}>
                            <label>Collection Name *</label>
                            <input
                                type="text"
                                value={collectionForm.name}
                                onChange={(e) => setCollectionForm({
                                    ...collectionForm,
                                    name: e.target.value
                                })}
                                placeholder="e.g., Custom Couture"
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Description</label>
                            <textarea
                                value={collectionForm.description}
                                onChange={(e) => setCollectionForm({
                                    ...collectionForm,
                                    description: e.target.value
                                })}
                                placeholder="Describe this collection..."
                                rows="3"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Parent Collection (Optional)</label>
                            <select
                                value={collectionForm.parentCollection}
                                onChange={(e) => setCollectionForm({
                                    ...collectionForm,
                                    parentCollection: e.target.value
                                })}
                            >
                                <option value="">-- Top Level (No Parent) --</option>
                                {collections.map(col => (
                                    <option key={col._id} value={col._id}>
                                        {col.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.formGroup}>
                            <label>Cover Image</label>
                            <button
                                type="button"
                                onClick={() => openCloudinaryWidget((url) => {
                                    setCollectionForm({ ...collectionForm, coverImage: url });
                                }, false)}
                                className={styles.uploadBtn}
                            >
                                {collectionForm.coverImage ? 'Change Image' : '+ Upload Cover Image'}
                            </button>

                            {collectionForm.coverImage && (
                                <div className={styles.imagePreview}>
                                    <img src={collectionForm.coverImage} alt="Preview" />
                                    <button
                                        type="button"
                                        onClick={() => setCollectionForm({ ...collectionForm, coverImage: '' })}
                                    >
                                        Remove
                                    </button>
                                </div>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={styles.submitBtn}
                        >
                            {loading ? 'Creating...' : 'CREATE COLLECTION'}
                        </button>
                    </form>

                    <hr />

                    <h2>Existing Collections</h2>
                    <div className={styles.collectionTree}>
                        {collectionTree.length > 0 ? (
                            renderCollectionTree(collectionTree)
                        ) : (
                            <p>No collections yet. Create one above!</p>
                        )}
                    </div>
                </div>
            )}

            {/* Products Tab */}
            {activeTab === 'products' && (
                <div className={styles.tabContent}>
                    <h2>New Product</h2>

                    <form onSubmit={handleProductSubmit} className={styles.form}>
                        <div className={styles.formGroup}>
                            <label>Product Name *</label>
                            <input
                                type="text"
                                value={productForm.name}
                                onChange={(e) => setProductForm({
                                    ...productForm,
                                    name: e.target.value
                                })}
                                placeholder="e.g., Velvet Bridal Dress"
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Collection *</label>
                            <select
                                value={productForm.collection}
                                onChange={(e) => setProductForm({
                                    ...productForm,
                                    collection: e.target.value
                                })}
                                required
                            >
                                <option value="">-- Select Collection --</option>
                                {collections.map(col => (
                                    <option key={col._id} value={col._id}>
                                        {col.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.formGroup}>
                            <label>Business Type *</label>
                            <select
                                value={productForm.businessType}
                                onChange={(e) => setProductForm({
                                    ...productForm,
                                    businessType: e.target.value
                                })}
                            >
                                <option value="retail">Retail</option>
                                <option value="custom">Custom</option>
                            </select>
                        </div>

                        <div className={styles.formGroup}>
                            <label>Description</label>
                            <textarea
                                value={productForm.description}
                                onChange={(e) => setProductForm({
                                    ...productForm,
                                    description: e.target.value
                                })}
                                placeholder="Describe the product..."
                                rows="4"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Price (Optional)</label>
                            <input
                                type="number"
                                value={productForm.price}
                                onChange={(e) => setProductForm({
                                    ...productForm,
                                    price: e.target.value
                                })}
                                placeholder="0"
                                min="0"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Product Images *</label>
                            <button
                                type="button"
                                onClick={() => openCloudinaryWidget((url) => {
                                    setProductForm({
                                        ...productForm,
                                        images: [...productForm.images, url]
                                    });
                                }, true)}
                                className={styles.uploadBtn}
                            >
                                + Upload Images
                            </button>

                            {productForm.images.length > 0 && (
                                <div className={styles.imageGallery}>
                                    {productForm.images.map((img, idx) => (
                                        <div key={idx} className={styles.imageItem}>
                                            <img src={img} alt={`Product ${idx + 1}`} />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newImages = productForm.images.filter((_, i) => i !== idx);
                                                    setProductForm({ ...productForm, images: newImages });
                                                }}
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {productForm.businessType === 'custom' && (
                            <div className={styles.formGroup}>
                                <label>Inspiration Image (Optional)</label>
                                <button
                                    type="button"
                                    onClick={() => openCloudinaryWidget((url) => {
                                        setProductForm({ ...productForm, inspirationImage: url });
                                    }, false)}
                                    className={styles.uploadBtn}
                                >
                                    {productForm.inspirationImage ? 'Change Image' : '+ Upload Inspiration'}
                                </button>

                                {productForm.inspirationImage && (
                                    <div className={styles.imagePreview}>
                                        <img src={productForm.inspirationImage} alt="Inspiration" />
                                        <button
                                            type="button"
                                            onClick={() => setProductForm({ ...productForm, inspirationImage: '' })}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className={styles.submitBtn}
                        >
                            {loading ? 'Creating...' : 'CREATE PRODUCT'}
                        </button>
                    </form>

                    <hr />

                    <h2>All Products ({products.length})</h2>
                    {products.length > 0 ? (
                        <div className={styles.productGrid}>
                            {products.map(product => (
                                <div key={product._id} className={styles.productCard}>
                                    {product.images && product.images[0] && (
                                        <img src={product.images[0]} alt={product.name} />
                                    )}
                                    <h4>{product.name}</h4>
                                    <p>{product.businessType === 'retail' ? 'Retail' : 'Custom'}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p>No products yet. Create one above!</p>
                    )}
                </div>
            )}
        </div>
    );
}
