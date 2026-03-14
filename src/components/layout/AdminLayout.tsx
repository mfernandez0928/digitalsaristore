import React from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { useAuth } from "../../contexts/AuthContext";
import {
  LayoutDashboard,
  ShoppingBag,
  ClipboardList,
  Settings,
  LogOut,
  PlusCircle,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { notificationService } from "../../services/notificationService";

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, storeSettings } = useAuth();

  React.useEffect(() => {
    // Start listener if enabled
    notificationService.startOrderListener((order) => {
      console.log("New order notification triggered for order:", order.id);
    });

    return () => {
      notificationService.stopOrderListener();
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const navItems = [
    { path: "/admin", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/admin/pos", icon: PlusCircle, label: "POS" },
    { path: "/admin/orders", icon: ClipboardList, label: "Orders" },
    { path: "/admin/products", icon: ShoppingBag, label: "Products" },
    { path: "/admin/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
      {/* Admin Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
            <LayoutDashboard size={20} className="text-white" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-sm font-black text-slate-900 uppercase tracking-widest leading-none">
              Admin
            </h1>
            <p className="text-[10px] font-bold text-slate-400 mt-1 truncate max-w-[150px]">
              {storeSettings?.storeName || "Digital Sari-Sari"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleLogout}
            className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center hover:text-red-500 transition-colors border border-slate-100"
          >
            <LogOut size={18} />
          </motion.button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-lg mx-auto pb-32">
        <Outlet />
      </main>

      {/* Bottom Nav - Floating Style */}
      <div className="fixed bottom-6 left-0 right-0 z-50 px-6 pointer-events-none">
        <nav className="max-w-md mx-auto h-20 bg-slate-900/95 backdrop-blur-lg rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-slate-900/40 pointer-events-auto border border-white/10 overflow-hidden">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "relative flex flex-col items-center justify-center transition-all duration-300 flex-1 h-full",
                  isActive ? "text-primary" : "text-slate-500",
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute top-3 w-1 h-1 bg-primary rounded-full"
                  />
                )}
                <Icon
                  size={isActive ? 24 : 22}
                  className={cn(
                    "transition-all",
                    isActive ? "scale-110" : "scale-100",
                  )}
                />
                <span
                  className={cn(
                    "text-[8px] font-black uppercase tracking-widest transition-all absolute bottom-3",
                    isActive
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-1",
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
