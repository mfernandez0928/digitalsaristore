import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product, Order } from '../types';
import { Link, useNavigate } from 'react-router-dom';
import { Package, DollarSign, BarChart3, TrendingUp, ShoppingCart, Clock, PlusCircle, ChevronRight, Bell, Calendar, X } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { handleFirestoreError, OperationType } from '../lib/errorHandling';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!db) return;
    
    const productsQuery = query(collection(db, 'products'), orderBy('name'));
    const ordersQuery = query(collection(db, 'orders'), orderBy('timestamp', 'desc'));

    const unsubProducts = onSnapshot(productsQuery, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'products'));

    const unsubOrders = onSnapshot(ordersQuery, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'orders'));

    return () => {
      unsubProducts();
      unsubOrders();
    };
  }, []);

  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const lowStockItems = products.filter(p => p.stock < 5);
  const recentOrders = orders.slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pt-4 pb-10">
      <header className="px-5 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-display font-black text-slate-900 tracking-tight">Dashboard</h1>
            <p className="text-slate-400 font-medium text-sm">Welcome back, Store Admin</p>
          </div>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className={cn(
              "w-12 h-12 shadow-soft rounded-2xl flex items-center justify-center transition-all active:scale-95 relative",
              showNotifications ? "bg-primary text-white" : "bg-white text-slate-400"
            )}
          >
            <Bell size={20} />
            {orders.filter(o => o.status === 'pending').length > 0 && (
              <div className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
            )}
          </button>
        </div>

        <AnimatePresence>
          {showNotifications && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-24 right-5 left-5 z-50 card-premium p-6 shadow-2xl border-primary/10 flex flex-col gap-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Recent Activity</h3>
                <button onClick={() => setShowNotifications(false)} className="text-[10px] font-black text-slate-400 uppercase">Close</button>
              </div>
              <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1">
                {orders.slice(0, 5).map(order => (
                  <div key={order.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      order.status === 'pending' ? "bg-amber-500" : "bg-emerald-500"
                    )} />
                    <div className="flex flex-col flex-1">
                      <span className="text-[11px] font-bold text-slate-700">Order #{order.id.slice(-4).toUpperCase()}</span>
                      <span className="text-[9px] text-slate-400 font-medium">{order.status.replace(/_/g, ' ')}</span>
                    </div>
                    <span className="text-[10px] font-black text-slate-900">{formatCurrency(order.total)}</span>
                  </div>
                ))}
                {orders.length === 0 && (
                  <p className="text-center py-4 text-slate-400 text-xs font-medium">No recent activity</p>
                )}
              </div>
              <button 
                onClick={() => {
                  setShowNotifications(false);
                  navigate('/admin/orders');
                }}
                className="w-full py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
              >
                View All Orders
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white flex flex-col gap-6 relative overflow-hidden shadow-premium">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50">Total Revenue</span>
            <h2 className="text-4xl font-display font-black tracking-tight">{formatCurrency(totalRevenue)}</h2>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/pos')}
              className="flex-1 bg-primary hover:bg-primary-dark text-white font-display font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all active:scale-95"
            >
              <PlusCircle size={20} strokeWidth={3} />
              New Sale
            </button>
            <button 
              onClick={() => navigate('/admin/orders')}
              className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/10 hover:bg-white/20 transition-all active:scale-95"
            >
              <BarChart3 size={24} className="text-primary" />
            </button>
          </div>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="px-5 grid grid-cols-2 gap-4">
        <div className="card-premium p-6 flex flex-col gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center shadow-sm">
            <ShoppingCart size={22} strokeWidth={2.5} />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Total Orders</span>
            <span className="text-2xl font-display font-black text-slate-900">{orders.length}</span>
          </div>
        </div>

        <div className="card-premium p-6 flex flex-col gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center shadow-sm">
            <Package size={22} strokeWidth={2.5} />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Total Items</span>
            <span className="text-2xl font-display font-black text-slate-900">{products.length}</span>
          </div>
        </div>
      </div>

      <div className="px-5 flex flex-col gap-8">
        {/* Recent Orders */}
        <section className="flex flex-col gap-5">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xl font-display font-black text-slate-900">Recent Orders</h2>
            <Link to="/admin/orders" className="text-xs font-black text-primary uppercase tracking-widest">View All</Link>
          </div>
          <div className="flex flex-col gap-4">
            {recentOrders.length > 0 ? (
              recentOrders.map(order => (
                <div 
                  key={order.id} 
                  onClick={() => navigate('/admin/orders')}
                  className="card-premium p-5 flex items-center justify-between group active:scale-[0.98] transition-all cursor-pointer hover:border-primary/30"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
                      <Clock size={20} strokeWidth={2.5} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-slate-800">Order #{order.id.slice(-4).toUpperCase()}</span>
                      <div className="flex items-center gap-1.5">
                        <Calendar size={10} className="text-slate-300" />
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                          {order.timestamp?.toDate ? order.timestamp.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Just now'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end gap-1.5">
                      <span className="text-sm font-black text-slate-900">{formatCurrency(order.total)}</span>
                      <span className={`text-[9px] px-2.5 py-1 rounded-full font-black uppercase tracking-widest ${
                        order.status === 'completed' ? 'bg-emerald-50 text-emerald-500' : 
                        order.status === 'cancelled' ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-500'
                      }`}>
                        {order.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <ChevronRight size={18} className="text-slate-300 group-hover:text-primary transition-colors" />
                  </div>
                </div>
              ))
            ) : (
              <div className="p-10 text-center card-premium text-slate-400 font-medium">No orders yet</div>
            )}
          </div>
        </section>

        {/* Low Stock Alerts */}
        <section className="flex flex-col gap-5">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xl font-display font-black text-slate-900">Inventory Alerts</h2>
            <Link to="/admin/products" className="text-xs font-black text-primary uppercase tracking-widest">Manage</Link>
          </div>
          <div className="flex flex-col gap-4">
            {lowStockItems.length > 0 ? (
              lowStockItems.map(product => (
                <div key={product.id} className="card-premium p-4 flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 p-1">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover rounded-xl" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-200">
                          <Package size={24} />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-black text-slate-800 leading-tight">{product.name}</span>
                      <span className="text-[10px] text-slate-300 font-black uppercase tracking-widest">{product.category}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="bg-red-50 text-red-500 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-red-100">
                      {product.stock} left
                    </div>
                    <TrendingUp size={14} className="text-red-300" />
                  </div>
                </div>
              ))
            ) : (
              <div className="p-10 text-center card-premium text-slate-400 font-medium">All items well stocked</div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
