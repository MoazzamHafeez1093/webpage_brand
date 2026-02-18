'use client'
import { useState, useEffect } from 'react';
import {
    createCollectionAction,
    getCollectionsAction,
    getCollectionTreeAction,
    deleteCollectionAction,
    updateCollectionAction,
    createProductAction,
    getAllProductsAction,
    updateProductAction,
    deleteProductAction
} from '@/app/actions';
import styles from './admin.module.css';

const AVAILABLE_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Custom'];

export default function AdminDashboard() {
    // ============ AUTH STATE ============
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [pin, setPin] = useState('');
    const [authError, setAuthError] = useState('');

    // ============ DASHBOARD STATE ============
    const [activeTab, setActiveTab] = useState('collections');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Collections state
    const [collections, setCollections] = useState([]);
    const [collectionTree, setCollectionTree] = useState([]);
    const [editingCollectionId, setEditingCollectionId] = useState(null);

    // Products state
    const [products, setProducts] = useState([]);
    const [editingProductId, setEditingProductId] = useState(null);

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
        availableSizes: [],
        customizationNotes: '',
        inStock: true,
        order: 0,
        isActive: true,
        isFeatured: false,
        metaTitle: '',
        metaDescription: '',
        tags: ''
    });

    // ============ LOAD DATA ============
    useEffect(() => {
        if (isAuthenticated) {
            loadAllData();
        }
    }, [isAuthenticated]);

    // ============ AUTH HANDLER ============
    const handleLogin = (e) => {
        e.preventDefault();
        if (pin === '1234') {
            setIsAuthenticated(true);
            setAuthError('');
        } else {
            setAuthError('Incorrect PIN');
        }
    };

    // ============ DATA LOADING ============
    async function loadAllData() {
        setLoading(true);

        try {
            const [collectionsData, treeData, productsData] = await Promise.all([
                getCollectionsAction(),
                getCollectionTreeAction(),
                getAllProductsAction()
            ]);

            setCollections(collectionsData || []);
            setCollectionTree(treeData || []);
            setProducts(productsData || []);
        } catch (err) {
            console.error('Error loading data:', err);
        } finally {
            setLoading(false);
        }
    }

    // ============ COLLECTION HANDLERS ============
    const handleEditCollection = (col) => {
        setEditingCollectionId(col._id);
        setCollectionForm({
            name: col.name,
            description: col.description || '',
            coverImage: col.coverImage || '',
            parentCollection: col.parentCollection || ''
        });
        window.scrollTo(0, 0);
    };

    const handleCollectionSubmit = async (e) => {
        e.preventDefault();

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

            let result;
            if (editingCollectionId) {
                result = await updateCollectionAction(editingCollectionId, formData);
            } else {
                result = await createCollectionAction(formData);
            }

            if (result.success) {
                setSuccessMessage(editingCollectionId ? 'Collection updated!' : 'Collection created!');
                resetCollectionForm();
                await loadAllData();
            } else {
                setError(result.error || 'Operation failed');
            }
        } catch (err) {
            console.error('Collection submission catch:', err);
            setError('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const resetCollectionForm = () => {
        setEditingCollectionId(null);
        setCollectionForm({
            name: '',
            description: '',
            coverImage: '',
            parentCollection: ''
        });
    };

    const handleDeleteCollection = async (id) => {
        if (!confirm('Are you sure you want to delete this collection?')) return;

        setLoading(true);
        try {
            const result = await deleteCollectionAction(id);
            if (result.success) {
                setSuccessMessage('Collection deleted successfully!');
                await loadAllData();
            } else {
                setError(result.error || 'Failed to delete collection');
            }
        } catch (err) {
            setError('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    // ============ PRODUCT HANDLERS ============
    const handleEditProduct = (p) => {
        setEditingProductId(p._id);
        setProductForm({
            name: p.name,
            description: p.description || '',
            price: p.price || '',
            images: p.images || [],
            collection: p.collectionRef?._id || p.collectionRef || '',
            businessType: p.businessType || 'retail',
            inspirationImage: p.inspirationImage || '',
            availableSizes: p.availableSizes || [],
            customizationNotes: p.customizationNotes || '',
            inStock: p.inStock !== false,
            order: p.order || 0,
            isActive: p.isActive !== false,
            isFeatured: p.isFeatured || false,
            metaTitle: p.metaTitle || '',
            metaDescription: p.metaDescription || '',
            tags: (p.tags || []).join(', ')
        });
        setActiveTab('products');
        window.scrollTo(0, 0);
    };

    const handleDeleteProduct = async (id) => {
        if (!confirm('Are you sure?')) return;
        setLoading(true);
        try {
            await deleteProductAction(id);
            setSuccessMessage('Product deleted');
            await loadAllData();
        } catch (e) {
            setError('Failed to delete');
        } finally {
            setLoading(false);
        }
    };

    const handleProductSubmit = async (e) => {
        e.preventDefault();

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
            formData.append('availableSizes', productForm.availableSizes.join(','));
            formData.append('customizationNotes', productForm.customizationNotes.trim());
            formData.append('inStock', String(productForm.inStock));
            formData.append('order', String(productForm.order));
            formData.append('isActive', String(productForm.isActive));
            formData.append('isFeatured', String(productForm.isFeatured));
            formData.append('metaTitle', productForm.metaTitle.trim());
            formData.append('metaDescription', productForm.metaDescription.trim());
            formData.append('tags', productForm.tags);

            let result;
            if (editingProductId) {
                result = await updateProductAction(editingProductId, formData);
            } else {
                result = await createProductAction(formData);
            }

            if (result.success) {
                setSuccessMessage(editingProductId ? 'Product updated!' : 'Product created!');
                resetProductForm();
                await loadAllData();
            } else {
                setError(result.error || 'Operation failed');
            }
        } catch (err) {
            console.error('Product submission error:', err);
            setError('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const resetProductForm = () => {
        setEditingProductId(null);
        setProductForm({
            name: '',
            description: '',
            price: '',
            images: [],
            collection: '',
            businessType: 'retail',
            inspirationImage: '',
            availableSizes: [],
            customizationNotes: '',
            inStock: true,
            order: 0,
            isActive: true,
            isFeatured: false,
            metaTitle: '',
            metaDescription: '',
            tags: ''
        });
    };

    const toggleSize = (size) => {
        setProductForm(prev => ({
            ...prev,
            availableSizes: prev.availableSizes.includes(size)
                ? prev.availableSizes.filter(s => s !== size)
                : [...prev.availableSizes, size]
        }));
    };

    // ============ CLOUDINARY ============
    const openCloudinaryWidget = (onSuccess, multiple = true) => {
        if (typeof window === 'undefined' || !window.cloudinary) {
            setError('Cloudinary widget not loaded. Refresh page.');
            return;
        }
        const widget = window.cloudinary.createUploadWidget(
            {
                cloudName: 'dk9pid4ec',
                uploadPreset: 'my_unsigned_preset',
                sources: ['local', 'url', 'camera'],
                multiple: multiple,
                folder: 'digital-atelier'
            },
            (error, result) => {
                if (!error && result && result.event === 'success') {
                    onSuccess(result.info.secure_url);
                }
            }
        );
        widget.open();
    };

    // ============ HELPER: Flat list with indentation for parent dropdown ============
    const getCollectionOptions = (tree, level = 0) => {
        let options = [];
        tree.forEach(col => {
            options.push({ _id: col._id, name: '\u00A0\u00A0'.repeat(level) + col.name, level });
            if (col.children && col.children.length > 0) {
                options = options.concat(getCollectionOptions(col.children, level + 1));
            }
        });
        return options;
    };

    // ============ HELPER: RECURSIVE TREE RENDER ============
    const renderCollectionTree = (tree, level = 0) => {
        return tree.map(col => (
            <div key={col._id} style={{ paddingLeft: `${level * 20}px`, marginBottom: '10px' }}>
                <div className={styles.collectionItem}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {col.coverImage && (
                            <img src={col.coverImage} alt="" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                        )}
                        <strong>{col.name}</strong>
                    </div>
                    <div className={styles.actionButtons}>
                        <button
                            onClick={() => handleEditCollection(col)}
                            className={styles.editBtn}
                        >
                            Edit
                        </button>
                        <button
                            onClick={() => handleDeleteCollection(col._id)}
                            className={styles.deleteBtn}
                        >
                            Delete
                        </button>
                    </div>
                </div>
                {col.children && col.children.length > 0 && (
                    <div style={{ paddingLeft: '10px', borderLeft: '2px solid #eee' }}>
                        {renderCollectionTree(col.children, level + 1)}
                    </div>
                )}
            </div>
        ));
    };

    // ============ LOGIN SCREEN ============
    if (!isAuthenticated) {
        return (
            <div style={{
                height: '100vh',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                background: '#f5f5f5'
            }}>
                <form onSubmit={handleLogin} style={{
                    background: 'white',
                    padding: '40px',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    textAlign: 'center',
                    width: '100%',
                    maxWidth: '400px'
                }}>
                    <h1 style={{ marginBottom: '20px', fontFamily: 'serif' }}>Digital Atelier Admin</h1>
                    {authError && <p style={{ color: 'red', marginBottom: '15px' }}>{authError}</p>}
                    <input
                        type="password"
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        placeholder="Enter Admin PIN"
                        style={{
                            padding: '12px',
                            width: '100%',
                            marginBottom: '20px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            boxSizing: 'border-box'
                        }}
                        autoFocus
                    />
                    <button
                        type="submit"
                        style={{
                            width: '100%',
                            padding: '12px',
                            background: '#2c2c2c',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        LOGIN
                    </button>
                </form>
            </div>
        );
    }

    const nestedCollectionOptions = getCollectionOptions(collectionTree);

    // ============ DASHBOARD UI ============
    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1>Admin Dashboard</h1>
                <div>
                    <a href="/" className={styles.viewSiteBtn} style={{ marginRight: '10px' }}>View Website</a>
                    <button onClick={() => setIsAuthenticated(false)} className={styles.viewSiteBtn} style={{ background: '#666' }}>Logout</button>
                </div>
            </header>

            {error && (
                <div className={styles.errorMessage}>
                    {error}
                    <button onClick={() => setError('')}>&times;</button>
                </div>
            )}
            {successMessage && (
                <div className={styles.successMessage}>
                    {successMessage}
                    <button onClick={() => setSuccessMessage('')}>&times;</button>
                </div>
            )}

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

            {/* COLLECTIONS TAB */}
            {activeTab === 'collections' && (
                <div className={styles.tabContent}>
                    <h2>{editingCollectionId ? 'Edit Collection' : 'Create New Collection'}</h2>
                    {editingCollectionId && (
                        <button onClick={resetCollectionForm} style={{ marginBottom: '1rem', padding: '5px 10px' }}>Cancel Edit</button>
                    )}
                    <form onSubmit={handleCollectionSubmit} className={styles.form}>
                        <div className={styles.formGroup}>
                            <label>Collection Name *</label>
                            <input
                                type="text"
                                value={collectionForm.name}
                                onChange={(e) => setCollectionForm({ ...collectionForm, name: e.target.value })}
                                placeholder="e.g. Bridal, Evening Wear, 2026 Velvet Series"
                                required
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Description</label>
                            <textarea
                                value={collectionForm.description}
                                onChange={(e) => setCollectionForm({ ...collectionForm, description: e.target.value })}
                                placeholder="Brief description of this collection"
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Parent Collection (for nesting)</label>
                            <select
                                value={collectionForm.parentCollection}
                                onChange={(e) => setCollectionForm({ ...collectionForm, parentCollection: e.target.value })}
                            >
                                <option value="">-- Top Level (No Parent) --</option>
                                {nestedCollectionOptions
                                    .filter(c => c._id !== editingCollectionId)
                                    .map(col => (
                                        <option key={col._id} value={col._id}>{col.name}</option>
                                    ))}
                            </select>
                            <small style={{ color: '#888', marginTop: '4px', display: 'block' }}>
                                Select a parent to nest this inside another collection. E.g. Custom Couture &rarr; Bridal &rarr; 2026 Velvet Series
                            </small>
                        </div>
                        <div className={styles.formGroup}>
                            <label>Cover Image</label>
                            <button
                                type="button"
                                onClick={() => openCloudinaryWidget((url) => setCollectionForm({ ...collectionForm, coverImage: url }), false)}
                                className={styles.uploadBtn}
                            >
                                {collectionForm.coverImage ? 'Change Image' : 'Upload Image'}
                            </button>
                            {collectionForm.coverImage && <img src={collectionForm.coverImage} alt="Preview" style={{ height: '80px', marginTop: '10px', borderRadius: '4px' }} />}
                        </div>
                        <button type="submit" disabled={loading} className={styles.submitBtn}>
                            {loading ? 'Processing...' : (editingCollectionId ? 'UPDATE COLLECTION' : 'CREATE COLLECTION')}
                        </button>
                    </form>

                    <h2>Existing Collections</h2>
                    <div className={styles.collectionTree}>
                        {collectionTree.length ? renderCollectionTree(collectionTree) : <p>No collections found. Create your first collection above.</p>}
                    </div>
                </div>
            )}

            {/* PRODUCTS TAB */}
            {activeTab === 'products' && (
                <div className={styles.tabContent}>
                    <h2>{editingProductId ? 'Edit Product' : 'Create New Product'}</h2>
                    {editingProductId && (
                        <button onClick={resetProductForm} style={{ marginBottom: '1rem', padding: '5px 10px' }}>Cancel Edit</button>
                    )}
                    <form onSubmit={handleProductSubmit} className={styles.form}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div className={styles.formGroup}>
                                <label>Name *</label>
                                <input
                                    type="text"
                                    value={productForm.name}
                                    onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                                    placeholder="Product name"
                                    required
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Collection *</label>
                                <select
                                    value={productForm.collection}
                                    onChange={e => setProductForm({ ...productForm, collection: e.target.value })}
                                    required
                                >
                                    <option value="">-- Select Collection --</option>
                                    {nestedCollectionOptions.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className={styles.formGroup}>
                            <label>Description</label>
                            <textarea
                                value={productForm.description}
                                onChange={e => setProductForm({ ...productForm, description: e.target.value })}
                                placeholder="Product description"
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div className={styles.formGroup}>
                                <label>Business Type</label>
                                <select
                                    value={productForm.businessType}
                                    onChange={e => setProductForm({ ...productForm, businessType: e.target.value })}
                                >
                                    <option value="retail">Retail</option>
                                    <option value="custom">Custom</option>
                                </select>
                            </div>
                            <div className={styles.formGroup}>
                                <label>Price {productForm.businessType === 'custom' ? '(optional for custom)' : ''}</label>
                                <input
                                    type="number"
                                    value={productForm.price}
                                    onChange={e => setProductForm({ ...productForm, price: e.target.value })}
                                    placeholder="0.00"
                                    min="0"
                                    step="0.01"
                                />
                            </div>
                        </div>

                        {/* Sizes - only show for retail */}
                        {productForm.businessType === 'retail' && (
                            <div className={styles.formGroup}>
                                <label>Available Sizes</label>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    {AVAILABLE_SIZES.map(size => (
                                        <button
                                            key={size}
                                            type="button"
                                            onClick={() => toggleSize(size)}
                                            style={{
                                                padding: '8px 16px',
                                                border: productForm.availableSizes.includes(size) ? '2px solid #2c2c2c' : '1px solid #ddd',
                                                background: productForm.availableSizes.includes(size) ? '#2c2c2c' : 'white',
                                                color: productForm.availableSizes.includes(size) ? 'white' : '#333',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontSize: '13px',
                                                fontWeight: productForm.availableSizes.includes(size) ? '600' : '400',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            {size}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className={styles.formGroup}>
                            <label>Product Images *</label>
                            <button
                                type="button"
                                onClick={() => openCloudinaryWidget((url) => setProductForm(prev => ({ ...prev, images: [...prev.images, url] })), true)}
                                className={styles.uploadBtn}
                            >
                                Upload Images
                            </button>
                            <div className={styles.imageGallery}>
                                {productForm.images.map((img, i) => (
                                    <div key={i} style={{ position: 'relative', display: 'inline-block', marginRight: 5 }}>
                                        <img src={img} alt="Product" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px' }} />
                                        <button
                                            type="button"
                                            onClick={() => setProductForm(prev => ({ ...prev, images: prev.images.filter((_, idx) => idx !== i) }))}
                                            style={{ position: 'absolute', top: -5, right: -5, background: '#e53e3e', color: 'white', border: 'none', borderRadius: '50%', width: 20, height: 20, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        >
                                            &times;
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Inspiration Image - only show for custom */}
                        {productForm.businessType === 'custom' && (
                            <div className={styles.formGroup}>
                                <label>Customer Inspiration Image (for side-by-side comparison)</label>
                                <button
                                    type="button"
                                    onClick={() => openCloudinaryWidget((url) => setProductForm(prev => ({ ...prev, inspirationImage: url })), false)}
                                    className={styles.uploadBtn}
                                >
                                    {productForm.inspirationImage ? 'Change Inspiration Image' : 'Upload Inspiration Image'}
                                </button>
                                {productForm.inspirationImage && (
                                    <div style={{ position: 'relative', display: 'inline-block', marginTop: '10px' }}>
                                        <img src={productForm.inspirationImage} alt="Inspiration" style={{ height: '100px', borderRadius: '4px' }} />
                                        <button
                                            type="button"
                                            onClick={() => setProductForm(prev => ({ ...prev, inspirationImage: '' }))}
                                            style={{ position: 'absolute', top: -5, right: -5, background: '#e53e3e', color: 'white', border: 'none', borderRadius: '50%', width: 20, height: 20, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        >
                                            &times;
                                        </button>
                                    </div>
                                )}
                                <small style={{ color: '#888', marginTop: '4px', display: 'block' }}>
                                    Upload the customer&apos;s inspiration photo. It will be shown side-by-side with your creation on the website.
                                </small>
                            </div>
                        )}

                        {/* Customization Notes - only show for custom */}
                        {productForm.businessType === 'custom' && (
                            <div className={styles.formGroup}>
                                <label>Customization Notes</label>
                                <textarea
                                    value={productForm.customizationNotes}
                                    onChange={e => setProductForm({ ...productForm, customizationNotes: e.target.value })}
                                    placeholder="Details about the customization process, turnaround time, materials used, etc."
                                    maxLength={1000}
                                />
                                <small style={{ color: '#888', marginTop: '4px', display: 'block' }}>
                                    Shown on product page. Max 1000 characters.
                                </small>
                            </div>
                        )}

                        {/* Tags */}
                        <div className={styles.formGroup}>
                            <label>Tags</label>
                            <input
                                type="text"
                                value={productForm.tags}
                                onChange={e => setProductForm({ ...productForm, tags: e.target.value })}
                                placeholder="bridal, velvet, 2026, luxury (comma-separated)"
                            />
                            <small style={{ color: '#888', marginTop: '4px', display: 'block' }}>
                                Comma-separated tags for filtering and display on product page.
                            </small>
                        </div>

                        {/* Order + Toggles */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '20px', alignItems: 'end' }}>
                            <div className={styles.formGroup}>
                                <label>Display Order</label>
                                <input
                                    type="number"
                                    value={productForm.order}
                                    onChange={e => setProductForm({ ...productForm, order: parseInt(e.target.value) || 0 })}
                                    placeholder="0"
                                    min="0"
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>In Stock</label>
                                <button
                                    type="button"
                                    onClick={() => setProductForm(prev => ({ ...prev, inStock: !prev.inStock }))}
                                    style={{
                                        padding: '10px 16px',
                                        width: '100%',
                                        border: '1px solid #ddd',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontSize: '13px',
                                        fontWeight: '600',
                                        background: productForm.inStock ? '#48bb78' : '#e53e3e',
                                        color: 'white',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {productForm.inStock ? 'In Stock' : 'Out of Stock'}
                                </button>
                            </div>
                            <div className={styles.formGroup}>
                                <label>Featured</label>
                                <button
                                    type="button"
                                    onClick={() => setProductForm(prev => ({ ...prev, isFeatured: !prev.isFeatured }))}
                                    style={{
                                        padding: '10px 16px',
                                        width: '100%',
                                        border: '1px solid #ddd',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontSize: '13px',
                                        fontWeight: '600',
                                        background: productForm.isFeatured ? '#c9a961' : '#f5f5f5',
                                        color: productForm.isFeatured ? 'white' : '#666',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {productForm.isFeatured ? 'Featured' : 'Not Featured'}
                                </button>
                            </div>
                            <div className={styles.formGroup}>
                                <label>Active</label>
                                <button
                                    type="button"
                                    onClick={() => setProductForm(prev => ({ ...prev, isActive: !prev.isActive }))}
                                    style={{
                                        padding: '10px 16px',
                                        width: '100%',
                                        border: '1px solid #ddd',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontSize: '13px',
                                        fontWeight: '600',
                                        background: productForm.isActive ? '#48bb78' : '#a0aec0',
                                        color: 'white',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {productForm.isActive ? 'Active' : 'Inactive'}
                                </button>
                            </div>
                        </div>

                        {/* SEO Fields */}
                        <div style={{ borderTop: '1px solid #eee', paddingTop: '20px', marginTop: '10px' }}>
                            <label style={{ display: 'block', marginBottom: '12px', fontWeight: '600', color: '#999', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>SEO (Optional)</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div className={styles.formGroup}>
                                    <label>Meta Title</label>
                                    <input
                                        type="text"
                                        value={productForm.metaTitle}
                                        onChange={e => setProductForm({ ...productForm, metaTitle: e.target.value })}
                                        placeholder="SEO title (max 60 chars)"
                                        maxLength={60}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Meta Description</label>
                                    <input
                                        type="text"
                                        value={productForm.metaDescription}
                                        onChange={e => setProductForm({ ...productForm, metaDescription: e.target.value })}
                                        placeholder="SEO description (max 160 chars)"
                                        maxLength={160}
                                    />
                                </div>
                            </div>
                        </div>

                        <button type="submit" disabled={loading} className={styles.submitBtn}>
                            {loading ? 'Processing...' : (editingProductId ? 'UPDATE PRODUCT' : 'CREATE PRODUCT')}
                        </button>
                    </form>

                    <h2>Existing Products</h2>
                    <div className={styles.productList}>
                        {products.map(p => (
                            <div key={p._id} className={styles.productRow}>
                                <img
                                    src={p.images && p.images[0] ? p.images[0] : '/placeholder.jpg'}
                                    alt={p.name}
                                    className={styles.productImage}
                                />
                                <div className={styles.productInfo}>
                                    <strong>
                                        {p.name}
                                        {p.isFeatured && <span style={{ marginLeft: '8px', background: '#c9a961', color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Featured</span>}
                                        {p.isActive === false && <span style={{ marginLeft: '8px', background: '#a0aec0', color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: '600', textTransform: 'uppercase' }}>Inactive</span>}
                                        {p.inStock === false && <span style={{ marginLeft: '8px', background: '#e53e3e', color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: '600', textTransform: 'uppercase' }}>Out of Stock</span>}
                                    </strong>
                                    <span className={styles.productMeta}>{p.collectionRef?.name || 'No Collection'}</span>
                                </div>
                                <div>
                                    <span className={styles.productType}>{p.businessType}</span>
                                </div>
                                <div className={styles.priceTag}>
                                    {p.price > 0 ? `$${p.price.toFixed(2)}` : '-'}
                                </div>
                                <div className={styles.actionButtons}>
                                    <button onClick={() => handleEditProduct(p)} className={styles.editBtn}>Edit</button>
                                    <button onClick={() => handleDeleteProduct(p._id)} className={styles.deleteBtn}>Delete</button>
                                </div>
                            </div>
                        ))}
                        {products.length === 0 && <p style={{ textAlign: 'center', color: '#666', marginTop: 20 }}>No products found. Create your first product above.</p>}
                    </div>
                </div>
            )}
        </div>
    );
}
