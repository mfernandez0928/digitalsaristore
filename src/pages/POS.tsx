import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, addDoc, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product, CartItem } from '../types';
import { Search, ShoppingCart, Trash2, Plus, Minus, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

import { handleFirestoreError, OperationType } from '../lib/errorHandling';

export default function POS() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);

  const [showCart, setShowCart] = useState(false);

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, 'products'), orderBy('name'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'products');
    });
    return unsubscribe;
  }, []);

  const addToCart = (product: Product) => {
    if (product.stock <= 0) return;
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, q: number) => {
    if (q <= 0) {
      setCart(prev => prev.filter(item => item.id !== id));
      return;
    }
    setCart(prev => prev.map(item => item.id === id ? { ...item, quantity: q } : item));
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCompleteSale = async () => {
    if (cart.length === 0 || !db) return;
    try {
      await addDoc(collection(db, 'orders'), {
        items: cart,
        total,
        status: 'completed',
        type: 'pos',
        timestamp: serverTimestamp(),
      });

      for (const item of cart) {
        await updateDoc(doc(db, 'products', item.id), {
          stock: increment(-item.quantity)
        });
      }

      setCart([]);
      setShowCart(false);
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'orders/products');
    }
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="h-full flex flex-col overflow-hidden relative">
      {/* Product Selection */}
      <div className="flex-1 flex flex-col p-4 gap-4 overflow-hidden">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-black text-slate-900">Point of Sale</h1>
          <button 
            onClick={() => setShowCart(true)}
            className="lg:hidden relative bg-slate-900 text-white p-3 rounded-2xl"
          >
            <ShoppingCart size={20} />
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                {cart.length}
              </span>
            )}
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search products..."
            className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-4 focus:outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 pr-2 no-scrollbar">
          {filteredProducts.map(product => (
            <button
              key={product.id}
              onClick={() => addToCart(product)}
              disabled={product.stock <= 0}
              className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-2 text-left transition-all active:scale-95 disabled:opacity-50"
            >
              <div className="aspect-square bg-slate-50 rounded-xl overflow-hidden">
                {product.imageUrl && <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-slate-800 truncate">{product.name}</span>
                <span className="text-primary font-bold text-xs">{formatCurrency(product.price)} <span className="opacity-60">/ {product.unit}</span></span>
                <span className="text-[10px] text-slate-400">Stock: {product.stock} {product.unit}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Cart Drawer / Sidebar */}
      <AnimatePresence>
        {(showCart || window.innerWidth >= 1024) && (
          <>
            {/* Backdrop for mobile */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCart(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden"
            />
            
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-full max-w-sm bg-slate-900 text-white z-[70] flex flex-col p-6 gap-6 lg:relative lg:inset-auto lg:w-96 lg:translate-x-0 lg:z-0"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <ShoppingCart size={24} />
                  Current Sale
                </h2>
                <button onClick={() => setShowCart(false)} className="lg:hidden w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">✕</button>
              </div>

              <div className="flex-1 overflow-y-auto flex flex-col gap-4 no-scrollbar">
                {cart.map(item => (
                  <motion.div 
                    layout
                    key={item.id} 
                    className="flex items-center gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-bold truncate">{item.name}</p>
                      <p className="text-xs text-slate-400">{formatCurrency(item.price)} x {item.quantity}</p>
                    </div>
                    <div className="flex items-center bg-white/10 rounded-lg">
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1.5"><Minus size={14} /></button>
                      <span className="text-sm font-bold w-6 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1.5"><Plus size={14} /></button>
                    </div>
                    <span className="font-bold min-w-[60px] text-right">{formatCurrency(item.price * item.quantity)}</span>
                  </motion.div>
                ))}
                {cart.length === 0 && (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-2 opacity-50">
                    <ShoppingCart size={48} />
                    <p>No items in current sale</p>
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-white/10 flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-medium">Total Amount</span>
                  <span className="text-3xl font-black text-primary">{formatCurrency(total)}</span>
                </div>
                <button 
                  onClick={handleCompleteSale}
                  disabled={cart.length === 0}
                  className="w-full bg-primary hover:bg-primary-dark text-white font-black py-5 rounded-2xl transition-all active:scale-95 disabled:opacity-30 disabled:grayscale"
                >
                  COMPLETE SALE
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Success Overlay */}
      <AnimatePresence>
        {isSuccess && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-emerald-500 flex flex-col items-center justify-center text-white gap-4"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 12 }}
            >
              <CheckCircle2 size={120} />
            </motion.div>
            <h2 className="text-3xl font-black">SALE COMPLETED!</h2>
            <p className="font-medium opacity-80">Inventory updated successfully.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
