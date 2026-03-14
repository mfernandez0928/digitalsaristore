import React from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  Home,
  ShoppingBag,
  User,
  ClipboardList,
  LogIn,
  ShoppingCart,
  MessageCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { notificationService } from "../../services/notificationService";
import { useCart } from "../../contexts/CartContext";

export default function PublicLayout() {
  const { user, storeSettings } = useAuth();
  const { totalItems, lastAddedItem } = useCart();
  const location = useLocation();

  const [orderUpdate, setOrderUpdate] = React.useState<{
    id: string;
    status: string;
  } | null>(null);

  React.useEffect(() => {
    if (user) {
      const unsubscribe = notificationService.startBuyerListener(
        user.uid,
        (order) => {
          setOrderUpdate({ id: order.id, status: order.status });
          // Auto hide after 5 seconds
          setTimeout(() => setOrderUpdate(null), 5000);
        },
      );
      return () => unsubscribe?.();
    }
  }, [user]);

  const navItems = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/shop", icon: ShoppingBag, label: "Shop" },
    { path: "/cart", icon: ShoppingCart, label: "Cart", badge: totalItems },
    { path: "/orders", icon: ClipboardList, label: "Orders", protected: true },
    { path: "/profile", icon: User, label: "Profile", protected: true },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      {/* Toast Notification */}
      <AnimatePresence>
        {lastAddedItem && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[60] w-[calc(100%-40px)] max-w-sm"
          >
            <div className="bg-slate-900 text-white px-6 py-4 rounded-3xl shadow-2xl flex items-center justify-between gap-4 border border-white/10 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center">
                  <ShoppingCart size={14} strokeWidth={3} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Added to Cart
                  </span>
                  <span className="text-sm font-bold truncate max-w-[180px]">
                    {lastAddedItem}
                  </span>
                </div>
              </div>
              <Link
                to="/cart"
                className="text-xs font-black uppercase tracking-widest text-primary hover:text-primary/80 transition-colors"
              >
                View
              </Link>
            </div>
          </motion.div>
        )}

        {orderUpdate && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[60] w-[calc(100%-40px)] max-w-sm"
          >
            <div className="bg-white text-slate-900 px-6 py-4 rounded-3xl shadow-2xl flex items-center justify-between gap-4 border border-slate-100 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center text-white">
                  <ClipboardList size={14} strokeWidth={3} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Order Update
                  </span>
                  <span className="text-sm font-bold">
                    Order #{orderUpdate.id.slice(-6).toUpperCase()} is now{" "}
                    {orderUpdate.status.replace(/_/g, " ")}
                  </span>
                </div>
              </div>
              <Link
                to="/orders"
                className="text-xs font-black uppercase tracking-widest text-primary hover:text-primary/80 transition-colors"
              >
                Track
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Mobile Header - Minimalist */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-5 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
            <ShoppingBag size={20} strokeWidth={2.5} />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 leading-none mb-1">
              Welcome to
            </span>
            <span className="text-base font-display font-black text-slate-900 leading-none">
              {storeSettings?.storeName || "Digital Sari-Sari"}
            </span>
          </div>
        </Link>

        {!user && (
          <Link
            to="/login"
            className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-600 active:scale-95 transition-transform"
          >
            <LogIn size={20} />
          </Link>
        )}
      </header>

      <main className="flex-1 w-full max-w-md mx-auto pb-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Floating Messenger Button */}
      {storeSettings?.messengerLink && (
        <motion.a
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          href={
            storeSettings.messengerLink.startsWith("http")
              ? storeSettings.messengerLink
              : `https://${storeSettings.messengerLink}`
          }
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-24 right-6 z-[45] w-14 h-14 bg-[#0084FF] text-white rounded-full flex items-center justify-center shadow-2xl shadow-blue-500/40 border-2 border-white/20"
        >
          <MessageCircle size={28} fill="currentColor" />
        </motion.a>
      )}

      {/* Premium Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 glass-panel safe-bottom px-6 flex items-center justify-between h-20">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          if (item.protected && !user) return null;

          return (
            <Link
              key={item.path}
              to={item.path}
              className="relative flex flex-col items-center justify-center py-2 px-4 group"
            >
              <div
                className={`
                transition-all duration-300 flex items-center justify-center relative
                ${isActive ? "text-primary scale-110" : "text-slate-400 group-active:scale-90"}
              `}
              >
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                {item.badge !== undefined && item.badge > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 bg-primary text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm"
                  >
                    {item.badge > 9 ? "9+" : item.badge}
                  </motion.div>
                )}
              </div>
              <span
                className={`
                text-[10px] font-bold mt-1 transition-all duration-300
                ${isActive ? "text-primary opacity-100" : "text-slate-400 opacity-0 group-hover:opacity-100"}
              `}
              >
                {item.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute -top-1 w-1 h-1 bg-primary rounded-full shadow-[0_0_8px_rgba(255,107,0,0.6)]"
                />
              )}
            </Link>
          );
        })}

        {!user && (
          <Link
            to="/login"
            className={`flex flex-col items-center justify-center py-2 px-4 ${location.pathname === "/login" ? "text-primary" : "text-slate-400"}`}
          >
            <LogIn size={24} />
            <span className="text-[10px] font-bold mt-1">Login</span>
          </Link>
        )}
      </nav>
    </div>
  );
}
