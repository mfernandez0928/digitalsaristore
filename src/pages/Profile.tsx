import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, Package, Settings, ChevronRight, ShoppingBag, Heart, MapPin, Bell, ShieldCheck, Store, Phone, MessageCircle, Edit2, X, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { notificationService } from '../services/notificationService';
import { favoriteService } from '../services/favoriteService';
import { cn, formatCurrency } from '../lib/utils';

export default function Profile() {
  const { user, isAdmin, storeSettings, userData, updateUserProfile } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);
  const [editForm, setEditForm] = useState({
    displayName: userData?.displayName || '',
    phone: userData?.phone || '',
    address: userData?.address || ''
  });

  useEffect(() => {
    if (userData) {
      setEditForm({
        displayName: userData.displayName || '',
        phone: userData.phone || '',
        address: userData.address || ''
      });
    }
  }, [userData]);

  useEffect(() => {
    if (user) {
      loadFavorites();
    }
  }, [user]);

  const loadFavorites = async () => {
    if (!user) return;
    setLoadingFavorites(true);
    const favs = await favoriteService.getFavoriteProducts(user.uid);
    setFavorites(favs);
    setLoadingFavorites(false);
  };

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      navigate('/login');
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateUserProfile(editForm);
    setIsEditing(false);
  };

  if (!user) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-8 text-center gap-8">
        <div className="w-32 h-32 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
          <User size={56} strokeWidth={1.5} />
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-display font-black text-slate-900">Not Signed In</h2>
          <p className="text-slate-500 font-medium">Sign in to view your profile and track your orders.</p>
        </div>
        <button 
          onClick={() => navigate('/login')}
          className="btn-primary px-10"
        >
          Sign In Now
        </button>
      </div>
    );
  }

  const [pushEnabled, setPushEnabled] = React.useState(notificationService.isEnabled());
  const [permissionStatus, setPermissionStatus] = React.useState<NotificationPermission>(notificationService.getPermissionStatus());

  const togglePushNotifications = async () => {
    if (!pushEnabled) {
      const granted = await notificationService.requestPermission();
      setPermissionStatus(notificationService.getPermissionStatus());
      if (granted) {
        notificationService.setEnabled(true);
        setPushEnabled(true);
        new Notification('Notifications Enabled!', {
          body: 'You will now receive updates about your orders.',
          icon: '/favicon.ico'
        });
      }
    } else {
      notificationService.setEnabled(false);
      setPushEnabled(false);
    }
  };

  const menuItems = [
    { label: 'My Orders', icon: Package, color: 'bg-blue-50 text-blue-500', path: '/orders' },
    { label: 'Delivery Address', icon: MapPin, color: 'bg-amber-50 text-amber-500', path: '#' },
  ];

  return (
    <div className="flex flex-col gap-8 pt-4 pb-24">
      <header className="px-5 flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-display font-black text-slate-900">Profile</h1>
          <button 
            onClick={() => setIsEditing(true)}
            className="w-10 h-10 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center active:scale-90 transition-transform"
          >
            <Edit2 size={18} />
          </button>
        </div>
        
        <div className="flex items-center gap-5 p-2">
          <div className="w-20 h-20 rounded-[2rem] bg-primary/10 flex items-center justify-center text-primary border-4 border-white shadow-premium relative overflow-hidden">
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName || ''} className="w-full h-full object-cover" />
            ) : (
              <User size={32} strokeWidth={2.5} />
            )}
          </div>
          <div className="flex flex-col">
            <h2 className="text-xl font-display font-black text-slate-900 leading-tight">
              {userData?.displayName || user.displayName || 'Sari-Sari User'}
            </h2>
            <p className="text-slate-400 text-sm font-medium">{user.email}</p>
            {userData?.phone && (
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">{userData.phone}</p>
            )}
            <div className="flex items-center gap-1.5 mt-1">
              <div className="w-2 h-2 bg-emerald-500 rounded-full" />
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Active Account</span>
            </div>
          </div>
        </div>
      </header>

      <div className="px-5 flex flex-col gap-6">
        {/* User Info Section */}
        <section className="card-premium p-6 flex flex-col gap-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-500 rounded-xl flex items-center justify-center">
              <User size={20} />
            </div>
            <h3 className="font-display font-bold text-lg text-slate-900">Personal Info</h3>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Full Name</span>
              <span className="text-sm font-bold text-slate-700">{userData?.displayName || 'Not set'}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Phone Number</span>
              <span className="text-sm font-bold text-slate-700">{userData?.phone || 'Not set'}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Default Address</span>
              <span className="text-sm font-bold text-slate-700 leading-relaxed">{userData?.address || 'Not set'}</span>
            </div>
          </div>
        </section>

        {/* Favorites Section */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-3 px-1">
            <div className="w-10 h-10 bg-pink-50 text-pink-500 rounded-xl flex items-center justify-center">
              <Heart size={20} fill="currentColor" />
            </div>
            <h3 className="font-display font-bold text-lg text-slate-900">My Favorites</h3>
          </div>
          
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
            {favorites.map((fav) => (
              <div 
                key={fav.id}
                onClick={() => navigate('/shop')}
                className="flex-shrink-0 w-40 card-premium p-3 flex flex-col gap-2 group cursor-pointer"
              >
                <div className="aspect-square rounded-2xl bg-slate-50 overflow-hidden border border-slate-100">
                  {fav.productImageUrl ? (
                    <img src={fav.productImageUrl} alt={fav.productName} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-200">
                      <ShoppingBag size={24} />
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold text-slate-800 truncate">{fav.productName}</span>
                  <span className="text-xs font-black text-primary">{formatCurrency(fav.productPrice)}</span>
                </div>
              </div>
            ))}
            {favorites.length === 0 && !loadingFavorites && (
              <div className="w-full py-8 text-center bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                <p className="text-slate-400 text-xs font-medium italic">No favorites yet. Heart some items in the shop!</p>
              </div>
            )}
            {loadingFavorites && (
              <div className="flex gap-4">
                {[1,2].map(i => (
                  <div key={i} className="w-40 h-48 bg-slate-50 animate-pulse rounded-3xl" />
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="card-premium overflow-hidden">
          {menuItems.map((item, idx) => (
            <React.Fragment key={item.label}>
              <button 
                onClick={() => item.path !== '#' && navigate(item.path)}
                className="w-full p-5 flex items-center justify-between hover:bg-slate-50 active:bg-slate-100 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 ${item.color} rounded-2xl flex items-center justify-center shadow-sm group-active:scale-90 transition-transform`}>
                    <item.icon size={20} strokeWidth={2.5} />
                  </div>
                  <span className="font-bold text-slate-700">{item.label}</span>
                </div>
                <ChevronRight size={18} className="text-slate-300 group-hover:text-primary transition-colors" />
              </button>
              <div className="h-px bg-slate-50 mx-6" />
            </React.Fragment>
          ))}
          
          {/* Notifications Toggle */}
          <div className="w-full p-5 flex items-center justify-between hover:bg-slate-50 transition-colors group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center shadow-sm">
                <Bell size={20} strokeWidth={2.5} />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-slate-700">Notifications</span>
                <span className={cn(
                  "text-[10px] font-black uppercase tracking-widest",
                  permissionStatus === 'granted' ? "text-emerald-500" : 
                  permissionStatus === 'denied' ? "text-red-500" : "text-slate-400"
                )}>
                  Permission: {permissionStatus}
                </span>
              </div>
            </div>
            <div 
              onClick={togglePushNotifications}
              className={`w-11 h-6 rounded-full relative p-1 cursor-pointer transition-colors duration-300 ${pushEnabled ? 'bg-primary' : 'bg-slate-200'}`}
            >
              <motion.div 
                animate={{ x: pushEnabled ? 20 : 0 }}
                className="w-4 h-4 bg-white rounded-full shadow-sm"
              />
            </div>
          </div>
        </section>

        {/* Store Information */}
        {storeSettings && (storeSettings.phone || storeSettings.address || storeSettings.messengerLink) && (
          <section className="card-premium p-6 flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                <Store size={20} />
              </div>
              <h3 className="font-display font-bold text-lg text-slate-900">Store Contact</h3>
            </div>
            <div className="flex flex-col gap-4">
              {storeSettings.phone && (
                <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-slate-400 shadow-sm">
                    <Phone size={14} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Phone</span>
                    <span className="text-sm font-bold text-slate-700">{storeSettings.phone}</span>
                  </div>
                </div>
              )}
              {storeSettings.address && (
                <div className="flex items-start gap-4 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-slate-400 shadow-sm shrink-0">
                    <MapPin size={14} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Address</span>
                    <span className="text-sm font-bold text-slate-700 leading-relaxed">{storeSettings.address}</span>
                  </div>
                </div>
              )}
              {storeSettings.messengerLink && (
                <motion.a 
                  whileTap={{ scale: 0.98 }}
                  href={storeSettings.messengerLink.startsWith('http') ? storeSettings.messengerLink : `https://${storeSettings.messengerLink}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 bg-[#0084FF] text-white py-4 rounded-2xl shadow-lg shadow-blue-500/20"
                >
                  <MessageCircle size={18} fill="currentColor" />
                  <span className="text-xs font-black uppercase tracking-widest">Chat on Messenger</span>
                </motion.a>
              )}
            </div>
          </section>
        )}

        {isAdmin && (
          <section className="bg-slate-900 rounded-[2.5rem] p-8 text-white flex flex-col gap-6 relative overflow-hidden shadow-premium">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                <ShieldCheck size={20} className="text-primary" />
              </div>
              <h3 className="font-display font-bold text-lg">Admin Dashboard</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => navigate('/admin')}
                className="bg-white/5 hover:bg-white/10 p-5 rounded-3xl flex flex-col gap-3 transition-colors text-left border border-white/5"
              >
                <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
                  <Settings size={18} />
                </div>
                <span className="text-xs font-black uppercase tracking-widest">Analytics</span>
              </button>
              <button 
                onClick={() => navigate('/pos')}
                className="bg-white/5 hover:bg-white/10 p-5 rounded-3xl flex flex-col gap-3 transition-colors text-left border border-white/5"
              >
                <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                  <Package size={18} />
                </div>
                <span className="text-xs font-black uppercase tracking-widest">POS System</span>
              </button>
            </div>
          </section>
        )}

        <button 
          onClick={handleLogout}
          className="w-full bg-white border border-red-50 text-red-500 font-display font-black py-5 rounded-[2rem] flex items-center justify-center gap-3 shadow-soft active:bg-red-50 active:scale-95 transition-all mb-4"
        >
          <LogOut size={20} strokeWidth={3} />
          Sign Out
        </button>
      </div>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-white w-full max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 flex flex-col gap-6 shadow-2xl"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Edit Profile</h2>
                <button onClick={() => setIsEditing(false)} className="w-10 h-10 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleUpdateProfile} className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                  <input 
                    type="text" 
                    value={editForm.displayName}
                    onChange={(e) => setEditForm({...editForm, displayName: e.target.value})}
                    className="input-premium"
                    placeholder="Enter your name"
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                  <input 
                    type="tel" 
                    value={editForm.phone}
                    onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                    className="input-premium"
                    placeholder="e.g. 0912 345 6789"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Default Address</label>
                  <textarea 
                    value={editForm.address}
                    onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                    className="input-premium min-h-[100px] resize-none"
                    placeholder="Enter your delivery address"
                  />
                </div>

                <button 
                  type="submit"
                  className="btn-primary w-full py-5 mt-2 flex items-center justify-center gap-3"
                >
                  <Save size={20} />
                  Save Changes
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
