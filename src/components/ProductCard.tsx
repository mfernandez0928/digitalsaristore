import React, { useState, useEffect } from 'react';
import { ShoppingBag, Plus, Minus, Trash2, Star, Heart } from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { favoriteService } from '../services/favoriteService';
import { formatCurrency, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart, items, updateQuantity } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const cartItem = items.find(item => item.id === product.id);

  const [isAdding, setIsAdding] = React.useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (user && product.id) {
      const unsubscribe = favoriteService.subscribeToFavorites(user.uid, (favoriteIds) => {
        setIsFavorite(favoriteIds.includes(product.id || ''));
      });
      return unsubscribe;
    }
  }, [user, product.id]);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsAdding(true);
    addToCart(product);
    setTimeout(() => setIsAdding(false), 800);
  };

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }
    await favoriteService.toggleFavorite(user.uid, product);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.97 }}
      className="card-premium flex flex-col group relative"
    >
      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 bg-primary/10 backdrop-blur-[1px] flex items-center justify-center pointer-events-none"
          >
            <motion.div
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 1.5, opacity: 0 }}
              className="bg-white text-primary p-4 rounded-3xl shadow-premium"
            >
              <Plus size={32} strokeWidth={3} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="aspect-[4/3] relative overflow-hidden bg-slate-50">
        {product.imageUrl ? (
          <img 
            src={product.imageUrl} 
            alt={product.name} 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-200">
            <ShoppingBag size={48} strokeWidth={1.5} />
          </div>
        )}
        
        {/* Category Badge */}
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2 py-1 rounded-lg shadow-sm border border-white/20">
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{product.category}</span>
        </div>

        {/* Favorite Button */}
        <div className="absolute top-3 right-3">
          <button 
            onClick={toggleFavorite}
            className={cn(
              "w-8 h-8 rounded-xl flex items-center justify-center shadow-lg backdrop-blur-md transition-all active:scale-90",
              isFavorite 
                ? "bg-pink-500 text-white" 
                : "bg-white/80 text-slate-400 hover:text-pink-500"
            )}
          >
            <Heart size={14} fill={isFavorite ? "currentColor" : "none"} />
          </button>
        </div>

        {/* Rating Mockup */}
        <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg flex items-center gap-1">
          <Star size={10} className="text-amber-400 fill-amber-400" />
          <span className="text-[10px] font-bold text-white">4.5</span>
        </div>

        {product.stock <= 0 && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center">
            <span className="bg-white text-slate-900 text-[10px] font-black px-4 py-2 rounded-2xl shadow-xl tracking-widest uppercase">Sold Out</span>
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col gap-1 flex-1">
        <h3 className="font-display font-bold text-slate-900 leading-tight line-clamp-1">{product.name}</h3>
        <div className="flex items-baseline gap-1">
          <span className="text-primary font-black text-lg">{formatCurrency(product.price)}</span>
          <span className="text-[10px] font-bold text-slate-400">/ {product.unit}</span>
        </div>
        
        {product.description && (
          <p className="text-[10px] text-slate-400 line-clamp-2 mt-1 leading-relaxed font-medium">
            {product.description}
          </p>
        )}

        <div className="mt-auto pt-4">
          {cartItem ? (
            <div className="flex items-center justify-between bg-slate-50 rounded-2xl p-1.5 border border-slate-100">
              <motion.button 
                whileTap={{ scale: 0.8 }}
                onClick={(e) => {
                  e.preventDefault();
                  updateQuantity(product.id, cartItem.quantity - 1);
                }}
                className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-primary transition-colors"
              >
                {cartItem.quantity === 1 ? <Trash2 size={18} /> : <Minus size={18} />}
              </motion.button>
              <span className="font-display font-black text-slate-900 text-base">{cartItem.quantity}</span>
              <motion.button 
                whileTap={{ scale: 0.8 }}
                onClick={(e) => {
                  e.preventDefault();
                  updateQuantity(product.id, cartItem.quantity + 1);
                }}
                disabled={cartItem.quantity >= product.stock}
                className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-primary transition-colors disabled:opacity-30"
              >
                <Plus size={18} />
              </motion.button>
            </div>
          ) : (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleAddToCart}
              disabled={product.stock <= 0}
              className="w-full btn-primary !py-3 !rounded-2xl !text-sm"
            >
              <Plus size={18} strokeWidth={3} />
              Add to Cart
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
