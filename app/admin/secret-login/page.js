'use client';

import { useState, useEffect } from 'react';
import { getProductsAction, createProductAction } from '@/app/actions';
import styles from './admin.module.css';

export default function AdminPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [products, setProducts] = useState([]);

    // Form State
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');

    // Custom Category Logic
    const [category, setCategory] = useState('');
    const [existingCategories, setExistingCategories] = useState([
        'Shirts', 'Pants', 'Outerwear', 'Accessories', 'Shoes', 'Luxury', 'New Arrivals'
    ]);

    // New Image Logic
    const [inputMode, setInputMode] = useState('file');
    const [uploadedImages, setUploadedImages] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isAuthenticated) {
            getProductsAction().then((data) => {
                setProducts(data);
                // Extract unique categories from DB
                const dbCats = [...new Set(data.map(p => p.category))];
                setExistingCategories(prev => [...new Set([...prev, ...dbCats])]);
            });
        }
    }, [isAuthenticated]);

    const handleLogin = (e) => {
        e.preventDefault();
        if (password === '1234') setIsAuthenticated(true);
        else alert('Access Denied');
    };

    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;
        for (const file of files) {
            const formData = new FormData();
            formData.append('file', file);
            try {
                const res = await fetch('/api/upload', { method: 'POST', body: formData });
                const data = await res.json();
                if (data.success) {
                    setUploadedImages(prev => [...prev, data.url]);
                }
            } catch (err) {
                alert('Upload Error');
            }
        }
    };

    const handleUrlAdd = () => {
        const url = prompt("Enter Image URL:");
        if (url) {
            setUploadedImages(prev => [...prev, url]);
        }
    };

    // --- CLOUDINARY WIDGET ---
    const handleCloudinaryClick = () => {
        if (!window.cloudinary) {
            alert("Cloudinary script not loaded yet. Refresh page.");
            return;
        }

        const widget = window.cloudinary.createUploadWidget(
            {
                cloudName: 'dk9pid4ec',
                uploadPreset: 'my_unsigned_preset',
                sources: ['local', 'url', 'camera'],
                showAdvancedOptions: false,
                cropping: false,
                multiple: true,
                defaultSource: "local",
                styles: {
                    palette: {
                        window: "#FFFFFF",
                        windowBorder: "#90A0B3",
                        tabIcon: "#0078FF",
                        menuIcons: "#5A616A",
                        textDark: "#000000",
                        textLight: "#FFFFFF",
                        link: "#0078FF",
                        action: "#FF620C",
                        inactiveTabIcon: "#0E2F5A",
                        error: "#F44235",
                        inProgress: "#0078FF",
                        complete: "#20B832",
                        sourceBg: "#E4EBF1"
                    },
                }
            },
            (error, result) => {
                if (!error && result && result.event === "success") {
                    setUploadedImages(prev => [...prev, result.info.secure_url]);
                }
            }
        );
        widget.open();
    };

    const removeImage = (index) => {
        setUploadedImages(uploadedImages.filter((_, i) => i !== index));
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (uploadedImages.length === 0) {
            alert("Please add at least one image.");
            return;
        }
        if (!description) {
            alert("Please enter a description.");
            return;
        }
        if (!category) {
            alert("Please enter a category.");
            return;
        }

        setIsSubmitting(true);

        const formattedImages = uploadedImages.map(url => ({
            thumbnail: url,
            fullRes: url
        }));

        const p = {
            title,
            description,
            price: parseFloat(price),
            category,
            sizes: ['M', 'L'],
            images: formattedImages
        };

        await createProductAction(p);

        // Refresh Data
        const updatedProducts = await getProductsAction();
        setProducts(updatedProducts);

        // Update Categories locally
        setExistingCategories([...new Set(updatedProducts.map(p => p.category))]);

        // Reset Form
        setTitle('');
        setDescription('');
        setPrice('');
        setCategory('');
        setUploadedImages([]);
        alert("Saved Successfully!");
        setIsSubmitting(false);
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
                <button onClick={() => setIsAuthenticated(false)} className={styles.logoutBtn}>Lock</button>
            </nav>

            <div className={styles.content}>
                <section className={styles.formSection}>
                    <h3 className={styles.sectionTitle}>New Catalog Entry</h3>

                    <div className={styles.fieldGroup}>
                        <label>Product Details</label>
                        <input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} className={styles.input} />

                        {/* DESCRIPTION */}
                        <textarea
                            placeholder="Description (Required)"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            className={styles.input}
                            rows={3}
                        />

                        <div className={styles.row}>
                            <input placeholder="Price" type="number" value={price} onChange={e => setPrice(e.target.value)} className={styles.input} />

                            {/* CUSTOM CATEGORY INPUT */}
                            <div style={{ flex: 1 }}>
                                <input
                                    list="categoryOptions"
                                    placeholder="Category (Type new or select)"
                                    value={category}
                                    onChange={e => setCategory(e.target.value)}
                                    className={styles.input}
                                />
                                <datalist id="categoryOptions">
                                    {existingCategories.map(c => <option key={c} value={c} />)}
                                </datalist>
                            </div>

                        </div>
                    </div>

                    <div className={styles.fieldGroup}>
                        <label>Image Gallery</label>
                        <div className={styles.toggleRow}>
                            <button className={inputMode === 'file' ? styles.modeBtnActive : styles.modeBtn} onClick={() => setInputMode('file')}>Local File</button>
                            <button className={inputMode === 'url' ? styles.modeBtnActive : styles.modeBtn} onClick={() => setInputMode('url')}>Enter URL</button>
                            <button className={styles.cloudBtn} type="button" onClick={handleCloudinaryClick}>☁️ Cloudinary (Pro)</button>
                        </div>
                        <div className={styles.uploadArea}>
                            {inputMode === 'file' ? (
                                <label className={styles.fileLabel}><span>+ Select Photos</span><input type="file" multiple accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} /></label>
                            ) : (
                                <button onClick={handleUrlAdd} className={styles.urlBtn}>+ Paste Image Link</button>
                            )}
                        </div>
                        <div className={styles.previewGrid}>
                            {uploadedImages.map((url, i) => (
                                <div key={i} className={styles.previewCard}>
                                    <img src={url} alt="upload" />
                                    <button onClick={() => removeImage(i)} className={styles.removeX}>×</button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button onClick={handleCreate} disabled={isSubmitting} className={styles.submitBtn}>
                        {isSubmitting ? 'Saving...' : 'Publish Item'}
                    </button>
                </section>

                <section className={styles.listSection}>
                    <h3>Recent Items</h3>
                    <div className={styles.inventoryList}>
                        {products.map(p => (
                            <div key={p._id} className={styles.inventoryItem}>
                                <img src={p.images[0]?.thumbnail} className={styles.listThumb} />
                                <div className={styles.itemMeta}>
                                    <strong>{p.title}</strong>
                                    <span style={{ fontSize: '0.8rem', color: '#b08d55' }}>{p.category}</span>
                                    <span>${p.price}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}
