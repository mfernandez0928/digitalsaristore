import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShoppingBag,
  Search,
  Star,
  Clock,
  MapPin,
  ChevronRight,
  Flame,
  Sparkles,
  Zap,
  AlertCircle,
  Heart,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { motion } from "motion/react";
import { Category, Product } from "../types";
import { categoryService } from "../services/categoryService";
import { favoriteService } from "../services/favoriteService";
import { collection, query, limit, getDocs, orderBy } from "firebase/firestore";
import { db } from "../lib/firebase";
import { formatCurrency, cn } from "../lib/utils";

export default function Home() {
  const navigate = useNavigate();
  const { storeSettings, user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [popularProducts, setPopularProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  useEffect(() => {
    const loadData = async () => {
      if (!db) return;
      try {
        const [cats, productsSnapshot] = await Promise.all([
          categoryService.getAll(),
          getDocs(query(collection(db, "products"), limit(6))),
        ]);
        setCategories(cats);
        setPopularProducts(
          productsSnapshot.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() }) as Product,
          ),
        );
      } catch (error) {
        console.error("Error loading home data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (user) {
      const unsubscribe = favoriteService.subscribeToFavorites(
        user.uid,
        setFavoriteIds,
      );
      return unsubscribe;
    } else {
      setFavoriteIds([]);
    }
  }, [user]);

  const toggleFavorite = async (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      navigate("/login");
      return;
    }
    await favoriteService.toggleFavorite(user.uid, product);
  };

  const getTodayHours = () => {
    if (!storeSettings?.businessHours) return null;
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const today = days[new Date().getDay()];
    return storeSettings.businessHours[today];
  };

  const todayHours = getTodayHours();

  const categoryIcons: Record<string, string> = {
    Snacks: "🍿",
    Drinks: "🥤",
    Canned: "🥫",
    Care: "🧼",
    Sweets: "🍬",
    Essentials: "📦",
    Frozen: "❄️",
    Bakery: "🥐",
  };

  const categoryColors: Record<string, string> = {
    Snacks: "bg-orange-50 text-orange-500",
    Drinks: "bg-blue-50 text-blue-500",
    Canned: "bg-red-50 text-red-500",
    Care: "bg-emerald-50 text-emerald-500",
    Sweets: "bg-pink-50 text-pink-500",
  };

  return (
    <div className="flex flex-col gap-8 pt-4">
      {/* Holiday Alert */}
      {storeSettings?.isHoliday && (
        <section className="px-5">
          <div className="bg-red-50 border border-red-100 p-4 rounded-3xl flex items-start gap-3 text-red-600">
            <AlertCircle size={20} className="shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1">
              <span className="text-xs font-black uppercase tracking-widest">
                Store on Holiday
              </span>
              <p className="text-sm font-medium leading-relaxed">
                {storeSettings.holidayMessage ||
                  "We are currently closed for the holidays. You can still browse our items!"}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Greeting & Search */}
      <section className="px-5 flex flex-col gap-6">
        <div className="flex flex-col">
          <motion.h1
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-3xl font-display font-black text-slate-900"
          >
            Hi, {user?.displayName?.split(" ")[0] || "Kabayan"}! 👋
          </motion.h1>
          <p className="text-slate-500 font-medium">
            What are you looking for today?
          </p>
        </div>

        <div className="relative group">
          <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
            <Search size={20} />
          </div>
          <input
            type="text"
            placeholder="Search snacks, drinks, essentials..."
            className="w-full bg-white border-none rounded-3xl py-5 pl-14 pr-6 shadow-soft focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium"
          />
        </div>
      </section>

      {/* Categories Chips */}
      <section className="flex flex-col gap-4">
        <div className="px-5 flex justify-between items-center">
          <h2 className="text-lg font-display font-bold text-slate-900">
            Categories
          </h2>
          <Link
            to="/shop"
            className="text-primary font-bold text-xs flex items-center gap-1"
          >
            See All <ChevronRight size={14} />
          </Link>
        </div>

        <div className="flex gap-3 overflow-x-auto px-5 pb-2 no-scrollbar">
          {categories.map((cat, idx) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Link
                to={`/shop?category=${cat.name}`}
                className="flex flex-col items-center gap-2 group"
              >
                <div
                  className={cn(
                    "w-16 h-16 rounded-2xl flex items-center justify-center text-2xl shadow-sm group-active:scale-90 transition-transform",
                    categoryColors[cat.name] || "bg-slate-50 text-slate-500",
                  )}
                >
                  {categoryIcons[cat.name] || "📦"}
                </div>
                <span className="text-[11px] font-bold text-slate-600 whitespace-nowrap">
                  {cat.name}
                </span>
              </Link>
            </motion.div>
          ))}
          {categories.length === 0 && !loading && (
            <p className="text-slate-400 text-xs font-medium italic px-2">
              No categories found.
            </p>
          )}
        </div>
      </section>

      {/* Promo Banner */}
      <section className="px-5">
        <div className="relative h-44 bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-premium group">
          <div className="absolute inset-0 opacity-50">
            <img
              src="https://picsum.photos/seed/promo/800/400"
              alt="Promo"
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/40 to-transparent" />

          <div className="relative h-full flex flex-col justify-center px-8 gap-2">
            <div className="flex items-center gap-2 bg-primary/20 backdrop-blur-md border border-primary/30 px-3 py-1 rounded-full w-fit">
              <Flame size={12} className="text-primary fill-primary" />
              <span className="text-primary text-[10px] font-bold uppercase tracking-widest">
                Hot Deal
              </span>
            </div>
            <h3 className="text-2xl font-display font-black text-white leading-tight">
              Free Delivery <br /> on your first order!
            </h3>
            <Link
              to="/shop"
              className="text-white font-bold text-xs underline underline-offset-4 mt-1"
            >
              Shop Now
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Sections */}
      <section className="flex flex-col gap-6">
        <div className="px-5 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-amber-100 text-amber-500 rounded-xl flex items-center justify-center">
              <Sparkles size={18} />
            </div>
            <h2 className="text-lg font-display font-bold text-slate-900">
              Popular Now
            </h2>
          </div>
          <Link to="/shop" className="text-primary font-bold text-xs">
            View All
          </Link>
        </div>

        <div className="flex gap-5 overflow-x-auto px-5 pb-6 no-scrollbar">
          {popularProducts.map((product, index) => (
            <div
              key={product.id}
              onClick={() => navigate(`/product/${product.id}`)}
              className="flex-shrink-0 w-64 card-premium group cursor-pointer"
            >
              <div className="h-40 overflow-hidden relative">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-200">
                    <ShoppingBag size={48} />
                  </div>
                )}
                <div className="absolute top-3 left-3">
                  <button
                    onClick={(e) => toggleFavorite(e, product)}
                    className={cn(
                      "w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg backdrop-blur-md transition-all active:scale-90",
                      favoriteIds.includes(product.id || "")
                        ? "bg-pink-500 text-white"
                        : "bg-white/80 text-slate-400 hover:text-pink-500",
                    )}
                  >
                    <Heart
                      size={18}
                      fill={
                        favoriteIds.includes(product.id || "")
                          ? "currentColor"
                          : "none"
                      }
                    />
                  </button>
                </div>
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm">
                  <Star size={10} className="text-amber-500 fill-amber-500" />
                  <span className="text-[10px] font-bold text-slate-900">
                    4.8
                  </span>
                </div>
              </div>
              <div className="p-4 flex flex-col gap-1">
                <h4 className="font-bold text-slate-800 truncate">
                  {product.name}
                </h4>
                <div className="flex items-center gap-3 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                    <Clock size={10} />
                    <span>15 min</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Zap size={10} className="text-primary" />
                    <span>Free Delivery</span>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-primary font-black text-lg">
                    {formatCurrency(product.price)}
                  </span>
                  <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20 group-active:scale-90 transition-transform">
                    <ShoppingBag size={16} />
                  </div>
                </div>
              </div>
            </div>
          ))}
          {popularProducts.length === 0 && !loading && (
            <div className="w-full py-12 text-center text-slate-400 font-medium italic">
              No products available yet.
            </div>
          )}
        </div>
      </section>

      {/* Store Info Card */}
      <section className="px-5 mb-4">
        <div className="bg-white rounded-[2.5rem] p-8 shadow-soft border border-slate-50 flex flex-col gap-6 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl" />
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-slate-50 text-primary rounded-2xl flex items-center justify-center shadow-sm">
              <MapPin size={24} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Our Location
              </span>
              <span className="font-display font-bold text-slate-900">
                {storeSettings?.address ||
                  "Phinma Maayo Banay-banay 2nd San Jose Batangas"}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-xl font-display font-black text-slate-900 leading-tight">
              Always here for you.
            </h3>
            <div className="flex flex-col gap-1">
              {todayHours ? (
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-primary" />
                  <span className="text-sm font-bold text-slate-700">
                    Today:{" "}
                    {todayHours.closed
                      ? "Closed"
                      : `${todayHours.open} - ${todayHours.close}`}
                  </span>
                </div>
              ) : (
                <p className="text-slate-500 text-sm leading-relaxed">
                  Open daily from 6:00 AM to 10:00 PM. We're your neighborhood
                  digital sari-sari store.
                </p>
              )}
              <p className="text-slate-500 text-[11px] font-medium italic">
                We're your neighborhood digital sari-sari store.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 pt-2">
            <div className="flex -space-x-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 overflow-hidden"
                >
                  <img src={`https://i.pravatar.cc/100?u=${i}`} alt="user" />
                </div>
              ))}
            </div>
            <span className="text-[11px] font-bold text-slate-400 underline underline-offset-2">
              100+ happy neighbors
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
