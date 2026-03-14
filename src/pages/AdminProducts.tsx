import React, { useState, useEffect, useRef } from 'react';
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product, Category } from '../types';
import { Plus, Edit2, Trash2, Search, Filter, ShoppingBag, Upload, X, Image as ImageIcon, Loader2, AlertCircle } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import * as supabaseService from '../services/supabaseService';
import { categoryService } from '../services/categoryService';
import { motion, AnimatePresence } from 'motion/react';
import { handleFirestoreError, OperationType } from '../lib/errorHandling';

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showRLSModal, setShowRLSModal] = useState(false);
  const [supabaseStatus, setSupabaseStatus] = useState<'checking' | 'connected' | 'error' | 'not-configured'>('checking');
  const [supabaseError, setSupabaseError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    price: 0,
    stock: 0,
    category: '',
    unit: 'pcs' as 'pcs' | 'pack',
    description: '',
    imageUrl: '',
    imagePath: '',
  });

  useEffect(() => {
    if (!db) return;
    
    // Check Supabase connection
    const checkSupabase = async () => {
      try {
        const isConnected = await supabaseService.testSupabaseConnection();
        setSupabaseStatus(isConnected ? 'connected' : 'error');
        if (!isConnected) setSupabaseError('Could not connect to Supabase storage. Check your credentials.');
      } catch (err: any) {
        setSupabaseStatus('error');
        setSupabaseError(err.message);
      }
    };
    checkSupabase();

    // Fetch products
    const q = query(collection(db, 'products'), orderBy('name'));
    const unsubscribeProducts = onSnapshot(q, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'products');
    });

    // Fetch categories
    const catQuery = query(collection(db, 'categories'), orderBy('name'));
    const unsubscribeCategories = onSnapshot(catQuery, (snapshot) => {
      const cats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
      setCategories(cats);
      if (cats.length > 0 && !formData.category) {
        setFormData(prev => ({ ...prev, category: cats[0].name }));
      }
    });

    return () => {
      unsubscribeProducts();
      unsubscribeCategories();
    };
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    try {
      // Basic validation before preview
      if (file.size > 5 * 1024 * 1024) throw new Error('File too large (max 5MB)');
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Invalid file type');

      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setUploadError(err.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    
    setIsUploading(true);
    try {
      let finalImageUrl = formData.imageUrl;
      let finalImagePath = formData.imagePath;

      // If a new file is selected, upload it
      if (selectedFile) {
        const uploadResult = await supabaseService.uploadProductImage(selectedFile);
        
        // Delete old image if it exists and we are updating
        if (editingId && formData.imagePath) {
          await supabaseService.deleteProductImage(formData.imagePath);
        }
        
        finalImageUrl = uploadResult.url;
        finalImagePath = uploadResult.path;
      }

      const productData = {
        ...formData,
        imageUrl: finalImageUrl,
        imagePath: finalImagePath,
      };

      if (editingId) {
        await updateDoc(doc(db, 'products', editingId), productData);
        setEditingId(null);
      } else {
        await addDoc(collection(db, 'products'), productData);
        setIsAdding(false);
      }
      resetForm();
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to save product';
      setUploadError(errorMessage);
      
      if (errorMessage.includes('Supabase RLS Error')) {
        setShowRLSModal(true);
      }
      
      handleFirestoreError(error, editingId ? OperationType.UPDATE : OperationType.CREATE, `products/${editingId || ''}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveWithoutImage = async () => {
    if (!db) return;
    setIsUploading(true);
    try {
      const productData = {
        ...formData,
        // Keep existing image if editing, or empty if new
      };

      if (editingId) {
        await updateDoc(doc(db, 'products', editingId), productData);
        setEditingId(null);
      } else {
        await addDoc(collection(db, 'products'), productData);
        setIsAdding(false);
      }
      resetForm();
      setShowRLSModal(false);
    } catch (error: any) {
      setUploadError(error.message || 'Failed to save product');
      handleFirestoreError(error, editingId ? OperationType.UPDATE : OperationType.CREATE, `products/${editingId || ''}`);
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setFormData({ 
      name: '', 
      price: 0, 
      stock: 0, 
      category: categories.length > 0 ? categories[0].name : '', 
      unit: 'pcs',
      description: '',
      imageUrl: '',
      imagePath: '',
    });
    setSelectedFile(null);
    setImagePreview(null);
    setUploadError(null);
  };

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setFormData({
      name: product.name,
      price: product.price,
      stock: product.stock,
      category: product.category,
      unit: product.unit || 'pcs',
      description: product.description || '',
      imageUrl: product.imageUrl || '',
      imagePath: product.imagePath || '',
    });
    setImagePreview(product.imageUrl || null);
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    if (!db) return;
    try {
      const product = products.find(p => p.id === id);
      if (product?.imagePath) {
        await supabaseService.deleteProductImage(product.imagePath);
      }
      await deleteDoc(doc(db, 'products', id));
      setIsDeleting(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `products/${id}`);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categoriesList = ['All', ...categories.map(c => c.name)];

  return (
    <div className="flex flex-col gap-8 pb-24 pt-6 px-5">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Products</h1>
          <p className="text-slate-500 text-sm font-medium">Manage your store inventory</p>
        </div>
        <motion.button 
          whileTap={{ scale: 0.95 }}
          onClick={() => { setIsAdding(true); setEditingId(null); resetForm(); }}
          className="btn-primary h-14 w-14 sm:w-auto sm:px-6 rounded-2xl"
        >
          <Plus size={24} />
          <span className="hidden sm:inline">Add Product</span>
        </motion.button>
      </header>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card-premium p-5 flex flex-col gap-1">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Products</span>
          <span className="text-2xl font-black text-slate-900">{products.length}</span>
        </div>
        <div className="card-premium p-5 flex flex-col gap-1">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Low Stock</span>
          <span className={cn("text-2xl font-black", products.filter(p => p.stock < 5).length > 0 ? "text-red-500" : "text-slate-900")}>
            {products.filter(p => p.stock < 5).length}
          </span>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col gap-4">
        {supabaseStatus === 'error' && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-100 p-5 rounded-[2rem] flex flex-col gap-4 text-red-600 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <AlertCircle size={24} className="flex-shrink-0 mt-1" />
              <div className="flex-1">
                <p className="text-base font-black">Supabase Configuration Issue</p>
                <p className="text-sm opacity-90 leading-relaxed mt-1">{supabaseError || 'The app cannot reach Supabase storage. Please check your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in the Secrets panel.'}</p>
              </div>
              <button 
                onClick={async () => {
                  setSupabaseStatus('checking');
                  setSupabaseError(null);
                  try {
                    const isConnected = await supabaseService.testSupabaseConnection();
                    setSupabaseStatus(isConnected ? 'connected' : 'error');
                    if (!isConnected) setSupabaseError('Connection test failed. Check your Supabase project status.');
                  } catch (err: any) {
                    setSupabaseStatus('error');
                    setSupabaseError(err.message);
                  }
                }}
                className="px-4 py-2 bg-red-100 hover:bg-red-200 rounded-xl text-xs font-black transition-colors whitespace-nowrap"
              >
                Retry Connection
              </button>
            </div>
            
            <div className="bg-white/50 p-4 rounded-2xl border border-red-100/50">
              <p className="text-xs font-black uppercase tracking-widest mb-2 opacity-60">Troubleshooting Steps:</p>
              <ul className="text-xs space-y-2 list-disc pl-4 opacity-80 font-medium">
                <li>Open <b>Settings</b> (gear icon) → <b>Secrets</b>.</li>
                <li>Ensure <b>VITE_SUPABASE_URL</b> starts with <code className="bg-red-100 px-1 rounded">https://</code>.</li>
                <li>Ensure <b>VITE_SUPABASE_ANON_KEY</b> starts with <code className="bg-red-100 px-1 rounded">eyJ</code> (JWT format).</li>
                <li>In Supabase: Go to <b>Project Settings</b> → <b>API</b> → Copy the <b>anon public</b> key.</li>
                <li className="mt-4 pt-4 border-t border-red-200/50">
                  <p className="font-black text-red-700 mb-1">Fixing "Row-Level Security" (RLS) Error:</p>
                  <p className="mb-2">Run this in your Supabase <b>SQL Editor</b> to allow public uploads:</p>
                  <pre className="bg-red-100 p-2 rounded-lg text-[10px] overflow-x-auto font-mono text-red-800">
                    {`CREATE POLICY "Public Access" ON storage.objects FOR ALL USING ( bucket_id = 'product-images' );`}
                  </pre>
                </li>
              </ul>
            </div>
          </motion.div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-premium w-full pl-11"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input-premium appearance-none pl-11 pr-10 font-bold text-slate-700 min-w-[140px]"
            >
              {categoriesList.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Product List */}
      <div className="flex flex-col gap-4">
        <AnimatePresence mode="popLayout">
          {filteredProducts.map((product, index) => (
            <motion.div 
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: index * 0.05 }}
              key={product.id} 
              className="card-premium p-4 flex items-center gap-4 group hover:border-primary/20 transition-colors"
            >
              <div className="w-20 h-20 bg-slate-50 rounded-2xl overflow-hidden flex-shrink-0 border border-slate-100">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-200">
                    <ShoppingBag size={32} />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-black text-slate-900 truncate text-base">{product.name}</h3>
                  <span className="text-[9px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full font-black uppercase tracking-wider">{product.category}</span>
                </div>
                {product.description && (
                  <p className="text-[11px] text-slate-400 line-clamp-1 mb-2 font-medium">{product.description}</p>
                )}
                <div className="flex items-center gap-4">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Price</span>
                    <span className="font-black text-primary text-sm">{formatCurrency(product.price)} <span className="text-[10px] font-bold opacity-60">/ {product.unit}</span></span>
                  </div>
                  <div className="w-px h-6 bg-slate-100" />
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Stock</span>
                    <span className={cn("font-black text-sm", product.stock < 5 ? "text-red-500" : "text-slate-700")}>
                      {product.stock} {product.unit}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <motion.button 
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleEdit(product)} 
                  className="p-2.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-colors"
                >
                  <Edit2 size={20} />
                </motion.button>
                <motion.button 
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsDeleting(product.id)} 
                  className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                >
                  <Trash2 size={20} />
                </motion.button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {filteredProducts.length === 0 && (
          <div className="py-24 text-center flex flex-col items-center gap-6">
            <div className="w-24 h-24 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center">
              <Search size={48} />
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-slate-900 font-black text-lg">No products found</p>
              <p className="text-slate-400 font-medium text-sm">Try adjusting your search or category filter.</p>
            </div>
          </div>
        )}
      </div>

      {/* RLS Error Modal */}
      <AnimatePresence>
        {showRLSModal && (
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-5">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-[2.5rem] p-8 flex flex-col gap-6 shadow-2xl border border-red-100"
            >
              <div className="flex flex-col gap-2 text-center">
                <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <AlertCircle size={40} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Supabase RLS Error</h3>
                <p className="text-slate-500 text-sm leading-relaxed font-medium">
                  Your Supabase storage bucket is locked. You need to run a SQL command in your Supabase dashboard to allow image uploads.
                </p>
              </div>

              <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Run this SQL in Supabase Editor:</p>
                <pre className="bg-slate-900 text-emerald-400 p-4 rounded-2xl text-[10px] font-mono overflow-x-auto leading-relaxed">
                  {`CREATE POLICY "Public Access" ON storage.objects FOR ALL USING ( bucket_id = 'product-images' );`}
                </pre>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(`CREATE POLICY "Public Access" ON storage.objects FOR ALL USING ( bucket_id = 'product-images' );`);
                    alert('SQL copied to clipboard!');
                  }}
                  className="w-full mt-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-black text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Copy SQL Command
                </button>
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={handleSaveWithoutImage}
                  className="btn-primary w-full"
                >
                  Save Without Image
                </button>
                <button 
                  onClick={() => setShowRLSModal(false)}
                  className="btn-secondary w-full"
                >
                  I'll Fix it First
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleting && (
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-xs rounded-[2.5rem] p-8 flex flex-col gap-6 text-center shadow-2xl"
            >
              <div className="flex flex-col gap-2">
                <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <AlertCircle size={40} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Delete?</h3>
                <p className="text-slate-500 text-sm font-medium">This action cannot be undone and will remove the item from your store.</p>
              </div>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => handleDelete(isDeleting)}
                  className="w-full bg-red-500 text-white font-black py-5 rounded-2xl shadow-lg shadow-red-500/20 active:scale-95 transition-transform"
                >
                  Yes, Delete it
                </button>
                <button 
                  onClick={() => setIsDeleting(null)}
                  className="btn-secondary w-full"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-white w-full max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 flex flex-col gap-6 shadow-2xl"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">{editingId ? 'Edit Product' : 'New Product'}</h2>
                <button onClick={() => setIsAdding(false)} className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center active:scale-90 transition-transform">✕</button>
              </div>
              
              <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                {/* Image Upload Section */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Product Photo</label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="relative aspect-video w-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center gap-3 cursor-pointer overflow-hidden group hover:border-primary/30 transition-colors"
                  >
                    {imagePreview ? (
                      <>
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="bg-white/20 backdrop-blur-md p-4 rounded-full text-white">
                            <Upload size={28} />
                          </div>
                        </div>
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFile(null);
                            setImagePreview(null);
                            setFormData(prev => ({ ...prev, imageUrl: '', imagePath: '' }));
                          }}
                          className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-md text-slate-900 rounded-full flex items-center justify-center shadow-lg active:scale-90"
                        >
                          <X size={20} />
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-slate-300 group-hover:text-primary transition-colors">
                          <ImageIcon size={36} />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-black text-slate-700">Tap to upload photo</p>
                          <p className="text-[10px] text-slate-400 font-bold">JPG, PNG or WebP (Max 5MB)</p>
                        </div>
                      </>
                    )}
                    {isUploading && (
                      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                        <Loader2 size={40} className="text-primary animate-spin" />
                        <p className="text-sm font-black text-primary">Uploading...</p>
                      </div>
                    )}
                  </div>
                  <input 
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*"
                    className="hidden"
                  />
                  {uploadError && <p className="text-[10px] font-black text-red-500 ml-1">{uploadError}</p>}
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Product Name</label>
                  <input 
                    required
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="input-premium"
                    placeholder="e.g. Coca-Cola 1.5L"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Price (₱)</label>
                    <input 
                      required
                      type="number" 
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
                      className="input-premium"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Stock</label>
                    <input 
                      required
                      type="number" 
                      value={formData.stock}
                      onChange={(e) => setFormData({...formData, stock: Number(e.target.value)})}
                      className="input-premium"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Unit</label>
                  <div className="flex gap-2">
                    {(['pcs', 'pack'] as const).map((u) => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => setFormData({ ...formData, unit: u })}
                        className={cn(
                          "flex-1 py-4 rounded-2xl font-black text-sm transition-all border-2",
                          formData.unit === u 
                            ? "bg-primary/5 border-primary text-primary" 
                            : "bg-slate-50 border-transparent text-slate-400"
                        )}
                      >
                        per {u}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Description</label>
                  <textarea 
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="input-premium min-h-[120px] resize-none"
                    placeholder="Add product details, size, flavor, etc."
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
                  <select 
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="input-premium font-bold text-slate-700"
                  >
                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    {categories.length === 0 && <option value="">No categories</option>}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Or Image URL (Optional)</label>
                  <input 
                    type="url" 
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                    className="input-premium"
                    placeholder="https://..."
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={isUploading}
                  className="btn-primary w-full py-5 mt-4"
                >
                  {isUploading ? 'Saving...' : (editingId ? 'Save Changes' : 'Create Product')}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );

}
