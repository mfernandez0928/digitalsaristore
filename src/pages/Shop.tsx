import React, { useEffect, useState } from 'react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product } from '../types';
import ProductCard from '../components/ProductCard';
import { Search, SlidersHorizontal, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCart } from '../contexts/CartContext';
import { useNavigate } from 'react-router-dom';

import { handleFirestoreError, OperationType } from '../lib/errorHandling';

export default function Shop() {
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, 'products'), orderBy('name'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const prods = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(prods);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'products');
    });
    return unsubscribe;
  }, []);

  const categories = ['All', ...new Set(products.map(p => p.category))];

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex flex-col gap-6 pt-4">
      <header className="px-5 flex flex-col gap-6">
        <div className="flex flex-col">
          <h1 className="text-3xl font-display font-black text-slate-900">Our Shop</h1>
          <p className="text-slate-500 font-medium">Fresh items delivered to you</p>
        </div>
        
        <div className="flex gap-3">
          <div className="relative flex-1 group">
            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
              <Search size={18} />
            </div>
            <input 
              type="text" 
              placeholder="Search products..."
              className="w-full bg-white border-none rounded-2xl py-4 pl-12 pr-4 shadow-soft focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-slate-600 shadow-soft active:scale-95 transition-transform">
            <SlidersHorizontal size={20} />
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-6 py-3 rounded-2xl text-xs font-bold whitespace-nowrap transition-all duration-300 ${
                selectedCategory === cat 
                  ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105' 
                  : 'bg-white text-slate-500 shadow-sm border border-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </header>

      <div className="px-5 pb-8">
        {loading ? (
          <div className="grid grid-cols-2 gap-5">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="flex flex-col gap-3">
                <div className="aspect-[4/3] bg-slate-100 animate-pulse rounded-3xl" />
                <div className="h-4 bg-slate-100 animate-pulse rounded-full w-3/4" />
                <div className="h-4 bg-slate-100 animate-pulse rounded-full w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <motion.div 
              layout
              className="grid grid-cols-2 gap-5"
            >
              {filteredProducts.map(product => (
                <motion.div 
                  layout
                  key={product.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}

        {!loading && filteredProducts.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-20 flex flex-col items-center justify-center text-center gap-4"
          >
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
              <ShoppingBag size={40} />
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="font-display font-bold text-slate-900">No products found</h3>
              <p className="text-slate-400 text-sm max-w-[200px]">Try adjusting your search or category filters.</p>
            </div>
            <button 
              onClick={() => { setSearchTerm(''); setSelectedCategory('All'); }}
              className="text-primary font-bold text-sm mt-2"
            >
              Clear all filters
            </button>
          </motion.div>
        )}
      </div>

      {/* Floating Cart Button for Mobile */}
      <AnimatePresence>
        {totalItems > 0 && (
          <motion.button
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            onClick={() => navigate('/cart')}
            className="fixed bottom-24 right-5 z-40 bg-primary text-white p-4 rounded-3xl shadow-2xl flex items-center gap-3 active:scale-95 transition-transform"
          >
            <div className="relative">
              <ShoppingBag size={24} strokeWidth={2.5} />
              <div className="absolute -top-2 -right-2 bg-white text-primary text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-primary shadow-sm">
                {totalItems}
              </div>
            </div>
            <span className="font-display font-black text-sm uppercase tracking-widest pr-2">View Cart</span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
