'use client';

import { useState, useEffect } from 'react';
import {
    getProductsAction, createProductAction, deleteProductAction,
    getCollectionsAction, createCollectionAction, deleteCollectionAction,
    addProductToCollectionAction, removeProductFromCollectionAction,
    getCategoryTreeAction, createCategoryAction, deleteCategoryAction, updateCategoryAction
} from '@/app/actions';
import styles from './admin.module.css';

export default function AdminPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [activeTab, setActiveTab] = useState('products'); // 'products' | 'collections' | 'categories'

    // --- PRODUCT STATE ---
    const [products, setProducts] = useState([]);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [category, setCategory] = useState('');
    const [existingCategories, setExistingCategories] = useState([]);
    const [uploadedImages, setUploadedImages] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- COLLECTION STATE ---
    const [collections, setCollections] = useState([]);
    const [colTitle, setColTitle] = useState('');
    const [colDesc, setColDesc] = useState('');
    const [colImage, setColImage] = useState('');
    const [managingCollection, setManagingCollection] = useState(null);

    // --- CATEGORY STATE ---
    const [categoryTree, setCategoryTree] = useState([]);
    const [newCatName, setNewCatName] = useState('');
    const [newCatParent, setNewCatParent] = useState(null); // ID or null
    const [newCatType, setNewCatType] = useState('general');

    useEffect(() => {
        if (isAuthenticated) {
            refreshData();
        }
    }, [isAuthenticated]);

    const refreshData = async () => {
        await Promise.all([refreshProducts(), refreshCollections(), refreshCategories()]);
    };

    const refreshProducts = async () => {
        const data = await getProductsAction();
        setProducts(data);
        // Fallback for old string categories if needed, but we should eventually use the tree
        const dbCats = [...new Set(data.map(p => p.category))];
        setExistingCategories(prev => [...new Set([...prev, ...dbCats])]);
    };

    const refreshCollections = async () => {
        const data = await getCollectionsAction();
        setCollections(data);
        if (managingCollection) {
            const updated = data.find(c => c._id === managingCollection._id);
            if (updated) setManagingCollection(updated);
        }
    };

    const refreshCategories = async () => {
        const tree = await getCategoryTreeAction();
        setCategoryTree(tree);
    };

    const handleLogin = (e) => {
        e.preventDefault();
        if (password === '1234') setIsAuthenticated(true);
        else alert('Access Denied');
    };

    // --- CLOUDINARY WIDGET ---
    const openCloudinaryWidget = (onSuccess) => {
        if (typeof window === 'undefined' || !window.cloudinary) {
            alert("Cloudinary script is loading... please wait a moment and try again.");
            return;
        }
        const widget = window.cloudinary.createUploadWidget(
            {
                cloudName: 'dk9pid4ec',
                uploadPreset: 'my_unsigned_preset',
                sources: ['local', 'url', 'camera'],
                multiple: false,
                styles: {
                    palette: { window: "#FFFFFF", sourceBg: "#E4EBF1", windowBorder: "#90A0B3", tabIcon: "#0078FF", inactiveTabIcon: "#0E2F5A", menuIcons: "#5A616A", link: "#0078FF", action: "#FF620C", inProgress: "#0078FF", complete: "#20B832", error: "#F44235", textDark: "#000000", textLight: "#FFFFFF" }
                }
            },
            (error, result) => {
                if (!error && result && result.event === "success") {
                    onSuccess(result.info.secure_url);
                }
            }
        );
        widget.open();
    };

    // --- PRODUCT HANDLERS ---
    const handleProductImageUpload = () => {
        openCloudinaryWidget((url) => setUploadedImages(prev => [...prev, url]));
    };

    const handleCreateProduct = async (e) => {
        e.preventDefault();
        if (uploadedImages.length === 0 || !description || !category) {
            alert("Please fill in all required fields and add at least one image.");
            return;
        }
        setIsSubmitting(true);
        const p = {
            title, description, price: parseFloat(price), category,
            sizes: ['M', 'L'],
            images: uploadedImages.map(url => ({ thumbnail: url, fullRes: url }))
        };

        try {
            const res = await createProductAction(p);
            if (!res.success) throw new Error(res.error);
            await refreshProducts();
            setTitle(''); setDescription(''); setPrice(''); setCategory(''); setUploadedImages([]);
            alert("Product Saved!");
        } catch (err) {
            alert("Error: " + err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteProduct = async (id) => {
        if (confirm("Delete this product?")) {
            await deleteProductAction(id);
            refreshProducts();
        }
    };

    // --- COLLECTION HANDLERS ---
    const handleCollectionImageUpload = () => {
        openCloudinaryWidget((url) => setColImage(url));
    };

    const handleCreateCollection = async () => {
        if (!colTitle || !colDesc || !colImage) {
            alert("Fill all collection fields.");
            return;
        }
        setIsSubmitting(true);
        try {
            const res = await createCollectionAction({ title: colTitle, description: colDesc, image: colImage });
            if (!res.success) throw new Error(res.error);
            await refreshCollections();
            setColTitle(''); setColDesc(''); setColImage('');
            alert("Collection Created!");
        } catch (e) {
            alert("Error: " + e.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteCollection = async (id) => {
        if (confirm("Delete collection?")) {
            await deleteCollectionAction(id);
            if (managingCollection?._id === id) setManagingCollection(null);
            refreshCollections();
        }
    };

    const handleAddToCollection = async (productId) => {
        if (!managingCollection) return;
        const res = await addProductToCollectionAction(managingCollection._id, productId);
        if (res.success) refreshCollections();
    };

    const handleRemoveFromCollection = async (productId) => {
        if (!managingCollection) return;
        const res = await removeProductFromCollectionAction(managingCollection._id, productId);
        if (res.success) refreshCollections();
    };

    // --- CATEGORY HANDLERS ---
    const handleCreateCategory = async (e) => {
        e.preventDefault();
        if (!newCatName) return;

        setIsSubmitting(true);
        try {
            const res = await createCategoryAction({
                name: newCatName,
                parent: newCatParent,
                type: newCatType
            });
            if (!res.success) throw new Error(res.error);
            await refreshCategories();
            setNewCatName('');
            setNewCatParent(null); // Reset to top level after create
        } catch (e) {
            alert("Error: " + e.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteCategory = async (id) => {
        if (confirm("Delete category and ALL subcategories?")) {
            await deleteCategoryAction(id);
            refreshCategories();
        }
    };

    const [editingCategory, setEditingCategory] = useState(null); // { _id, name, parent, type }

    const handleUpdateCategory = async () => {
        if (!editingCategory || !editingCategory.name) return;
        setIsSubmitting(true);
        try {
            const res = await updateCategoryAction(editingCategory._id, {
                name: editingCategory.name,
                parent: editingCategory.parent || null, // Ensure null if empty
                type: editingCategory.type
            });
            if (!res.success) throw new Error(res.error);
            await refreshCategories();
            setEditingCategory(null);
        } catch (e) {
            alert("Error: " + e.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Recursive Tree Renderer
    const renderTree = (nodes, depth = 0) => {
        return nodes.map(node => (
            <div key={node._id} style={{ marginLeft: depth * 20, marginTop: 5 }}>
                <div className={styles.treeNode}>
                    <span style={{ fontWeight: depth === 0 ? 'bold' : 'normal' }}>
                        {depth > 0 && '└─ '} {node.name} <span className={styles.badge}>{node.type}</span>
                    </span>
                    <div className={styles.nodeActions}>
                        <button className={styles.tinyBtn} onClick={() => setNewCatParent(node._id)}>+ Sub</button>
                        <button className={styles.tinyBtn} onClick={() => setEditingCategory({ ...node, parent: node.parent || '' })}>Edit</button>
                        <button className={styles.tinyBtnDanger} onClick={() => handleDeleteCategory(node._id)}>×</button>
                    </div>
                </div>
                {/* Inline Edit Form */}
                {editingCategory && editingCategory._id === node._id && (
                    <div style={{ marginLeft: depth * 20 + 20, padding: 10, background: '#f0f0f0', border: '1px solid #ccc', margin: '5px 0' }}>
                        <div style={{ display: 'flex', gap: 5, marginBottom: 5 }}>
                            <input
                                value={editingCategory.name}
                                onChange={e => setEditingCategory({ ...editingCategory, name: e.target.value })}
                                placeholder="Name"
                            />
                            <select
                                value={editingCategory.type}
                                onChange={e => setEditingCategory({ ...editingCategory, type: e.target.value })}
                            >
                                <option value="general">General</option>
                                <option value="retail">Retail</option>
                                <option value="custom">Custom</option>
                            </select>
                        </div>
                        <div style={{ display: 'flex', gap: 5 }}>
                            <input
                                placeholder="New Parent ID (Optional)"
                                value={editingCategory.parent || ''}
                                onChange={e => setEditingCategory({ ...editingCategory, parent: e.target.value })}
                                style={{ width: '100%' }}
                            />
                            <button onClick={handleUpdateCategory} disabled={isSubmitting}>Save</button>
                            <button onClick={() => setEditingCategory(null)}>Cancel</button>
                        </div>
                    </div>
                )}
                {node.children && node.children.length > 0 && renderTree(node.children, depth + 1)}
            </div>
        ));
    };

    if (!isAuthenticated) return (
        <div className={styles.loginWrapper}>
            <div className={styles.loginCard}>
                <div className={styles.brandLogo}>LUXE.</div>
                <h2 className={styles.loginTitle}>Concierge Login</h2>
                <form onSubmit={handleLogin}>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} className={styles.loginInput} placeholder="PIN" />
                    <button className={styles.loginBtn}>Unlock</button>
                </form>
            </div>
        </div>
    );

    return (
        <div className={styles.dashboard}>
            <nav className={styles.nav}>
                <span className={styles.navBrand}>LUXE. Admin</span>
                <div className={styles.navTabs}>
                    <button className={`${styles.tabBtn} ${activeTab === 'products' ? styles.activeTab : ''}`} onClick={() => setActiveTab('products')}>Products</button>
                    <button className={`${styles.tabBtn} ${activeTab === 'collections' ? styles.activeTab : ''}`} onClick={() => setActiveTab('collections')}>Collections</button>
                    <button className={`${styles.tabBtn} ${activeTab === 'categories' ? styles.activeTab : ''}`} onClick={() => setActiveTab('categories')}>Hierarchy</button>
                </div>
                <button onClick={() => setIsAuthenticated(false)} className={styles.logoutBtn}>Lock</button>
            </nav>

            <div className={styles.content}>
                {activeTab === 'products' && (
                    <>
                        <section className={styles.formSection}>
                            <h3 className={styles.sectionTitle}>New Product</h3>
                            {/* Existing Product Form ... */}
                            {/* Keeping it simple for brevity, assuming standard form */}
                            <div className={styles.fieldGroup}>
                                <input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} className={styles.input} />
                                <div className={styles.row}>
                                    <input placeholder="Price" type="number" value={price} onChange={e => setPrice(e.target.value)} className={styles.input} />
                                    {/* Category Tree Selector */}
                                    <select
                                        value={category}
                                        onChange={e => setCategory(e.target.value)}
                                        className={styles.input}
                                        style={{ fontFamily: 'monospace' }} // To align hierarchy dashes
                                    >
                                        <option value="">-- Select Category --</option>
                                        {/* Flatten tree for dropdown options */}
                                        {function flattenForSelect(nodes, depth = 0) {
                                            return nodes.map(node => [
                                                <option key={node._id} value={node.name}>
                                                    {'\u00A0'.repeat(depth * 4) + (depth > 0 ? '└ ' : '') + node.name}
                                                </option>,
                                                ...flattenForSelect(node.children || [], depth + 1)
                                            ]);
                                        }(categoryTree)}
                                    </select>
                                </div>

                                {/* Image Upload Section */}
                                <div className={styles.row} style={{ marginTop: '1rem', alignItems: 'center' }}>
                                    <button type="button" onClick={handleProductImageUpload} className={styles.modeBtn}>
                                        + Upload Images
                                    </button>
                                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                        {uploadedImages.map((img, idx) => (
                                            <div key={idx} style={{ position: 'relative', width: 50, height: 50 }}>
                                                <img src={img} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 4 }} />
                                                <button
                                                    onClick={() => setUploadedImages(uploadedImages.filter((_, i) => i !== idx))}
                                                    style={{ position: 'absolute', top: -5, right: -5, background: 'red', color: 'white', borderRadius: '50%', width: 15, height: 15, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                {uploadedImages.length === 0 && <small style={{ color: '#888', display: 'block', marginTop: 5 }}>At least 1 image required.</small>}

                                <button onClick={handleCreateProduct} disabled={isSubmitting} className={styles.submitBtn} style={{ marginTop: '1rem' }}>Save Product</button>
                            </div>
                        </section>
                        <section className={styles.listSection}>
                            <h3>Inventory</h3>
                            <div className={styles.inventoryList}>
                                {products.map(p => (
                                    <div key={p._id} className={styles.inventoryItem}>
                                        <strong>{p.title}</strong>
                                        <button className={styles.deleteBtn} onClick={() => handleDeleteProduct(p._id)}>Delete</button>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </>
                )}

                {activeTab === 'collections' && (
                    <>
                        {/* Collections Logic (Same as before) */}
                        {!managingCollection ? (
                            <section className={styles.listSection}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <h3>Collections</h3>
                                    <button className={styles.modeBtn} onClick={() => {
                                        // Quick toggle to show create form if needed, or just standard UI
                                        // implementing minimal here to fit context
                                    }}>+ New</button>
                                </div>
                                {/* Simple Create Form */}
                                <div className={styles.fieldGroup} style={{ marginTop: '1rem' }}>
                                    <input placeholder="New Collection Title" value={colTitle} onChange={e => setColTitle(e.target.value)} className={styles.input} />
                                    <button onClick={handleCreateCollection} className={styles.submitBtn}>Create</button>
                                </div>
                                <div className={styles.inventoryList}>
                                    {collections.map(c => (
                                        <div key={c._id} className={styles.inventoryItem}>
                                            <strong>{c.title}</strong>
                                            <button className={styles.modeBtn} onClick={() => setManagingCollection(c)}>Manage</button>
                                            <button className={styles.deleteBtn} onClick={() => handleDeleteCollection(c._id)}>Delete</button>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        ) : (
                            <div className={styles.manageView}>
                                <button onClick={() => setManagingCollection(null)} className={styles.backBtn}>Back</button>
                                <h3>Manage: {managingCollection.title}</h3>
                                <div className={styles.dualGrid}>
                                    <div className={styles.column}>
                                        <h4>Available</h4>
                                        <div className={styles.scrollList}>
                                            {products.filter(p => !managingCollection.products?.some(cp => cp._id === p._id)).map(p => (
                                                <div key={p._id} className={styles.miniItem} onClick={() => handleAddToCollection(p._id)}>
                                                    {p.title} <span className={styles.addIcon}>+</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className={styles.column}>
                                        <h4>Included</h4>
                                        <div className={styles.scrollList}>
                                            {managingCollection.products?.map(p => (
                                                <div key={p._id} className={styles.miniItem} onClick={() => handleRemoveFromCollection(p._id)}>
                                                    {p.title} <span className={styles.removeIcon}>-</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {activeTab === 'categories' && (
                    <div className={styles.singleCol}>
                        <section className={styles.formSection}>
                            <h3 className={styles.sectionTitle}>Hierarchy Manager</h3>

                            <div className={styles.fieldGroup}>
                                <label className={styles.label}>
                                    {newCatParent
                                        ? `Adding Subcategory to: ${categoryTree.find(findNode(newCatParent))?.name || 'Unknown'}`
                                        : "Adding Top-Level Section"
                                    }
                                    {newCatParent && <button className={styles.tinyBtn} onClick={() => setNewCatParent(null)} style={{ marginLeft: 10 }}>Cancel (Set to Top)</button>}
                                </label>

                                <div className={styles.row}>
                                    <input
                                        placeholder="Section Name (e.g., Bridal)"
                                        value={newCatName}
                                        onChange={e => setNewCatName(e.target.value)}
                                        className={styles.input}
                                    />
                                    <select
                                        value={newCatType}
                                        onChange={e => setNewCatType(e.target.value)}
                                        className={styles.select}
                                    >
                                        <option value="general">General</option>
                                        <option value="retail">Retail</option>
                                        <option value="custom">Custom</option>
                                    </select>
                                </div>
                                <button onClick={handleCreateCategory} disabled={isSubmitting} className={styles.submitBtn}>
                                    {newCatParent ? "Add Sub-Category" : "Add Top-Level Section"}
                                </button>
                            </div>

                            <div className={styles.treeContainer}>
                                {renderTree(categoryTree)}
                                {categoryTree.length === 0 && <p style={{ color: '#999' }}>No sections yet. Create one above.</p>}
                            </div>
                        </section>
                    </div>
                )}
            </div>
        </div>
    );
}

// Helper to find node in tree for label display
function findNode(id) {
    return (node) => {
        if (node._id === id) return true;
        if (node.children) return node.children.some(findNode(id));
        return false;
    };
}
