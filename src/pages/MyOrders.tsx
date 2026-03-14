import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { Order } from '../types';
import { formatCurrency } from '../lib/utils';
import { Package, Clock, CheckCircle2, Truck, XCircle, ChevronRight, Calendar, MapPin, Store, Search, Filter, Bell, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';

const statusConfig: Record<string, { icon: any, color: string, bg: string, label: string }> = {
  pending: { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50', label: 'Pending' },
  confirmed: { icon: CheckCircle2, color: 'text-blue-500', bg: 'bg-blue-50', label: 'Confirmed' },
  preparing: { icon: Package, color: 'text-indigo-500', bg: 'bg-indigo-50', label: 'Preparing' },
  ready_for_pickup: { icon: Store, color: 'text-emerald-500', bg: 'bg-emerald-50', label: 'Ready for Pickup' },
  out_for_delivery: { icon: Truck, color: 'text-emerald-500', bg: 'bg-emerald-50', label: 'Out for Delivery' },
  completed: { icon: CheckCircle2, color: 'text-slate-400', bg: 'bg-slate-50', label: 'Completed' },
  cancelled: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50', label: 'Cancelled' },
};

export default function MyOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'orders'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      setOrders(ordersData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching orders:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-8 text-center gap-8">
        <div className="w-32 h-32 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
          <Package size={56} strokeWidth={1.5} />
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-display font-black text-slate-900">No orders yet</h2>
          <p className="text-slate-500 font-medium">When you place an order, it will appear here for you to track.</p>
        </div>
        <button 
          onClick={() => navigate('/shop')}
          className="btn-primary px-10"
        >
          Start Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pt-4">
      <header className="px-5 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-display font-black text-slate-900">My Orders</h1>
          <div className="flex items-center gap-2">
            <button className="w-10 h-10 bg-white shadow-soft rounded-xl flex items-center justify-center text-slate-400">
              <Search size={18} />
            </button>
            <button className="w-10 h-10 bg-white shadow-soft rounded-xl flex items-center justify-center text-slate-400">
              <Filter size={18} />
            </button>
          </div>
        </div>
      </header>

      <div className="px-5 flex flex-col gap-5 pb-10">
        <AnimatePresence mode="popLayout">
          {orders.map((order, index) => {
            const config = statusConfig[order.status] || statusConfig.pending;
            const StatusIcon = config.icon;
            
            return (
              <motion.div
                key={order.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="card-premium overflow-hidden group active:scale-[0.98] transition-transform"
              >
                <div className="p-6 flex flex-col gap-5">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Order #{order.id.slice(-6).toUpperCase()}</span>
                        <div className="w-1 h-1 bg-slate-200 rounded-full" />
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
                          {new Date(order.timestamp?.seconds * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest w-fit ${config.bg} ${config.color}`}>
                        <StatusIcon size={12} strokeWidth={3} />
                        {config.label}
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      {order.status === 'pending' ? (
                        <div className="flex flex-col items-end">
                          <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Awaiting Confirmation</span>
                          <span className="text-xs font-bold text-slate-400 italic">Total will be updated</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-end">
                          <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
                            {order.deliveryMethod === 'delivery' && order.deliveryFee ? 'Total to Pay' : 'Total Amount'}
                          </span>
                          <span className="text-xl font-display font-black text-slate-900">
                            {formatCurrency(order.total + (order.deliveryMethod === 'delivery' ? (order.deliveryFee || 0) : 0))}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    {order.items.slice(0, 2).map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-[10px] font-black text-slate-400">
                            {item.quantity}x
                          </div>
                          <span className="text-sm font-bold text-slate-700">{item.name}</span>
                        </div>
                        <span className="text-sm font-medium text-slate-400">{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                    ))}
                    {order.items.length > 2 && (
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex -space-x-2">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white" />
                          ))}
                        </div>
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">+ {order.items.length - 2} more items</span>
                      </div>
                    )}
                    {order.status !== 'pending' && order.deliveryMethod === 'delivery' && order.deliveryFee !== undefined && order.deliveryFee > 0 && (
                      <div className="flex justify-between items-center pt-2 border-t border-slate-50 mt-1">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500">
                            <Truck size={14} />
                          </div>
                          <span className="text-sm font-bold text-slate-700">Delivery Fee</span>
                        </div>
                        <span className="text-sm font-black text-blue-500">{formatCurrency(order.deliveryFee)}</span>
                      </div>
                    )}
                  </div>

                  <div className="h-px bg-slate-50" />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                          {order.deliveryMethod === 'delivery' ? <MapPin size={14} strokeWidth={2.5} /> : <Store size={14} strokeWidth={2.5} />}
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{order.deliveryMethod}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                          <Calendar size={14} strokeWidth={2.5} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{order.preferredTime}</span>
                      </div>
                    </div>
                    {order.deliveryMethod === 'delivery' && order.deliveryAddress && (
                      <div className="flex items-start gap-3 p-3 bg-slate-50/50 rounded-2xl border border-slate-100">
                        <MapPin size={14} className="text-primary shrink-0 mt-0.5" />
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Delivery Address</span>
                          <span className="text-[11px] font-bold text-slate-600 leading-relaxed">{order.deliveryAddress}</span>
                        </div>
                      </div>
                    )}
                    {order.buyerNotes && (
                      <div className="flex items-start gap-3 p-3 bg-slate-50/50 rounded-2xl border border-slate-100">
                        <MessageSquare size={14} className="text-blue-500 shrink-0 mt-0.5" />
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">My Instructions</span>
                          <span className="text-[11px] font-bold text-slate-600 leading-relaxed">{order.buyerNotes}</span>
                        </div>
                      </div>
                    )}
                    <ChevronRight size={18} className="text-slate-300 group-hover:text-primary transition-colors" />
                  </div>

                  {order.sellerNotes && (
                    <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-primary/10 rounded-lg flex items-center justify-center text-primary shrink-0">
                          <Bell size={12} strokeWidth={3} />
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                          <span className="font-black text-primary uppercase tracking-widest mr-1">Seller Note:</span> {order.sellerNotes}
                        </p>
                      </div>
                    </div>
                  )}

                  {(order.confirmedDate || order.confirmedTime) && (
                    <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-emerald-500 rounded-lg flex items-center justify-center text-white shrink-0">
                          <CheckCircle2 size={12} strokeWidth={3} />
                        </div>
                        <p className="text-[11px] text-emerald-700 leading-relaxed font-black uppercase tracking-widest">
                          Confirmed for {order.confirmedTime}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
