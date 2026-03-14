import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Settings, Store, LogOut, Shield, Bell, Smartphone, Tag, Plus, Trash2, Edit2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { categoryService } from '../services/categoryService';
import { Category } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { notificationService } from '../services/notificationService';
import { cn } from '../lib/utils';

export default function AdminSettings() {
  const { storeSettings, updateSettings, logout, user } = useAuth();
  const [newStoreName, setNewStoreName] = useState(storeSettings?.storeName || '');
  const [phone, setPhone] = useState(storeSettings?.phone || '');
  const [address, setAddress] = useState(storeSettings?.address || '');
  const [messengerLink, setMessengerLink] = useState(storeSettings?.messengerLink || '');
  const [isHoliday, setIsHoliday] = useState(storeSettings?.isHoliday || false);
  const [holidayMessage, setHolidayMessage] = useState(storeSettings?.holidayMessage || '');
  const [businessHours, setBusinessHours] = useState(storeSettings?.businessHours || {
    Monday: { open: '08:00', close: '17:00', closed: false },
    Tuesday: { open: '08:00', close: '17:00', closed: false },
    Wednesday: { open: '08:00', close: '17:00', closed: false },
    Thursday: { open: '08:00', close: '17:00', closed: false },
    Friday: { open: '08:00', close: '17:00', closed: false },
    Saturday: { open: '08:00', close: '17:00', closed: false },
    Sunday: { open: '08:00', close: '17:00', closed: true },
  });
  const [isSaving, setIsSaving] = useState(false);
  
  // Category Management State
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [isCategoryLoading, setIsCategoryLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const navigate = useNavigate();

  const [pushEnabled, setPushEnabled] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');

  useEffect(() => {
    loadCategories();
    setPushEnabled(notificationService.isEnabled());
    setPermissionStatus(notificationService.getPermissionStatus());
  }, []);

  const togglePushNotifications = async () => {
    if (!pushEnabled) {
      const granted = await notificationService.requestPermission();
      setPermissionStatus(notificationService.getPermissionStatus());
      if (granted) {
        notificationService.setEnabled(true);
        setPushEnabled(true);
        // Test notification
        new Notification('Notifications Enabled!', {
          body: 'You will now receive alerts for new orders.',
          icon: '/favicon.ico'
        });
      } else {
        alert('Please enable notification permissions in your browser settings.');
      }
    } else {
      notificationService.setEnabled(false);
      setPushEnabled(false);
    }
  };

  const loadCategories = async () => {
    const data = await categoryService.getAll();
    setCategories(data);
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    
    setIsCategoryLoading(true);
    setCategoryError(null);
    try {
      await categoryService.create(newCategoryName.trim());
      setNewCategoryName('');
      await loadCategories();
    } catch (err: any) {
      setCategoryError(err.message);
    } finally {
      setIsCategoryLoading(false);
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editingCategory.name.trim()) return;

    setIsCategoryLoading(true);
    setCategoryError(null);
    try {
      await categoryService.update(editingCategory.id, editingCategory.name.trim());
      setEditingCategory(null);
      await loadCategories();
    } catch (err: any) {
      setCategoryError(err.message);
    } finally {
      setIsCategoryLoading(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    setIsCategoryLoading(true);
    setCategoryError(null);
    try {
      await categoryService.delete(id);
      setConfirmDelete(null);
      await loadCategories();
    } catch (err: any) {
      setCategoryError(err.message);
    } finally {
      setIsCategoryLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateSettings({ 
        storeName: newStoreName,
        phone,
        address,
        messengerLink,
        isHoliday,
        holidayMessage,
        businessHours
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="pb-24 pt-6 px-5 flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Settings</h1>
        <p className="text-slate-500 text-sm font-medium">Configure your store and account preferences.</p>
      </header>

      <div className="flex flex-col gap-6">
        {/* Store Configuration */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-premium p-6 flex flex-col gap-6"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
              <Store size={20} />
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Store Profile</h2>
          </div>
          
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Store Name</label>
              <input 
                type="text" 
                value={newStoreName}
                onChange={(e) => setNewStoreName(e.target.value)}
                className="input-premium py-3.5"
                placeholder="Enter store name"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contact Number</label>
              <input 
                type="tel" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="input-premium py-3.5"
                placeholder="e.g. 0912 345 6789"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Physical Address</label>
              <textarea 
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="input-premium py-3.5 min-h-[80px] resize-none"
                placeholder="Enter store address"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Messenger Link (Optional)</label>
              <input 
                type="url" 
                value={messengerLink}
                onChange={(e) => setMessengerLink(e.target.value)}
                className="input-premium py-3.5"
                placeholder="e.g. m.me/yourstore"
              />
            </div>

            {/* Holiday Mode */}
            <div className="flex flex-col gap-4 p-5 bg-slate-50/50 rounded-3xl border border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-700">Holiday Mode</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Temporarily close the store</span>
                </div>
                <div 
                  onClick={() => setIsHoliday(!isHoliday)}
                  className={cn(
                    "w-11 h-6 rounded-full relative p-1 cursor-pointer transition-colors duration-300",
                    isHoliday ? "bg-red-500" : "bg-slate-200"
                  )}
                >
                  <motion.div 
                    animate={{ x: isHoliday ? 20 : 0 }}
                    className="w-4 h-4 bg-white rounded-full shadow-sm"
                  />
                </div>
              </div>
              {isHoliday && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="flex flex-col gap-2"
                >
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Holiday Message</label>
                  <input 
                    type="text" 
                    value={holidayMessage}
                    onChange={(e) => setHolidayMessage(e.target.value)}
                    className="input-premium py-3"
                    placeholder="e.g. We are closed for the town fiesta!"
                  />
                </motion.div>
              )}
            </div>

            {/* Business Hours */}
            <div className="flex flex-col gap-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Business Hours</label>
              <div className="flex flex-col gap-3">
                {Object.entries(businessHours).map(([day, h]) => {
                  const hours = h as { open: string; close: string; closed: boolean };
                  return (
                    <div key={day} className="flex items-center justify-between p-3 bg-white rounded-2xl border border-slate-100">
                      <span className="text-xs font-bold text-slate-600 w-20">{day}</span>
                      <div className="flex items-center gap-2">
                        {!hours.closed ? (
                          <>
                            <input 
                              type="time" 
                              value={hours.open}
                              onChange={(e) => setBusinessHours({...businessHours, [day]: {...hours, open: e.target.value}})}
                              className="text-[10px] font-bold bg-slate-50 px-2 py-1 rounded-lg border border-slate-100"
                            />
                            <span className="text-slate-300">-</span>
                            <input 
                              type="time" 
                              value={hours.close}
                              onChange={(e) => setBusinessHours({...businessHours, [day]: {...hours, close: e.target.value}})}
                              className="text-[10px] font-bold bg-slate-50 px-2 py-1 rounded-lg border border-slate-100"
                            />
                          </>
                        ) : (
                          <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">Closed</span>
                        )}
                        <button 
                          onClick={() => setBusinessHours({...businessHours, [day]: {...hours, closed: !hours.closed}})}
                          className={cn(
                            "ml-2 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border transition-colors",
                            hours.closed ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-red-50 text-red-600 border-red-100"
                          )}
                        >
                          {hours.closed ? 'Open' : 'Close'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <motion.button 
              whileTap={{ scale: 0.95 }}
              onClick={handleSave}
              disabled={isSaving}
              className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-slate-200 disabled:opacity-50 mt-2"
            >
              {isSaving ? 'Saving Changes...' : 'Save Store Profile'}
            </motion.button>
          </div>
        </motion.section>

        {/* Category Management */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-premium p-6 flex flex-col gap-6"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center">
              <Tag size={20} />
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Manage Categories</h2>
          </div>

          {categoryError && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-50 border border-red-100 text-red-600 px-4 py-3.5 rounded-2xl text-xs font-bold flex items-center gap-2"
            >
              <AlertCircle size={14} />
              {categoryError}
            </motion.div>
          )}

          {/* Add Category Form */}
          <form onSubmit={handleAddCategory} className="flex gap-3">
            <input 
              type="text" 
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="flex-1 input-premium py-3.5"
              placeholder="New category name"
            />
            <motion.button 
              whileTap={{ scale: 0.9 }}
              type="submit"
              disabled={isCategoryLoading || !newCategoryName.trim()}
              className="bg-primary text-white w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 disabled:opacity-50 transition-transform"
            >
              <Plus size={24} />
            </motion.button>
          </form>

          {/* Category List */}
          <div className="flex flex-col gap-3">
            <AnimatePresence mode="popLayout">
              {categories.map((category) => (
                <motion.div 
                  key={category.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between group hover:bg-white hover:border-primary/20 transition-all"
                >
                  {editingCategory?.id === category.id ? (
                    <form onSubmit={handleUpdateCategory} className="flex-1 flex gap-2">
                      <input 
                        autoFocus
                        type="text" 
                        value={editingCategory.name}
                        onChange={(e) => setEditingCategory({...editingCategory, name: e.target.value})}
                        className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 font-bold text-sm"
                      />
                      <button 
                        type="submit"
                        className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest"
                      >
                        Save
                      </button>
                      <button 
                        type="button"
                        onClick={() => setEditingCategory(null)}
                        className="bg-slate-200 text-slate-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest"
                      >
                        Cancel
                      </button>
                    </form>
                  ) : (
                    <>
                      <span className="font-bold text-slate-700">{category.name}</span>
                      <div className="flex items-center gap-1">
                        <motion.button 
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setEditingCategory(category)}
                          className="p-2 text-slate-300 hover:text-primary transition-colors"
                        >
                          <Edit2 size={18} />
                        </motion.button>
                        <motion.button 
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setConfirmDelete(category.id)}
                          className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={18} />
                        </motion.button>
                      </div>
                    </>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            
            {categories.length === 0 && (
              <p className="text-center py-6 text-slate-400 text-xs font-bold italic opacity-60">No categories added yet.</p>
            )}
          </div>
        </motion.section>

        {/* Account Info */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card-premium p-6 flex flex-col gap-6"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center">
              <Shield size={20} />
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Account Security</h2>
          </div>
          <div className="p-5 bg-slate-50/80 rounded-3xl border border-slate-100 flex flex-col gap-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Logged in as</span>
            <span className="text-sm font-black text-slate-800">{user?.email}</span>
            <div className="mt-3 pt-3 border-t border-slate-100">
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                Your account has full administrative privileges. Keep your credentials secure.
              </p>
            </div>
          </div>
        </motion.section>

        {/* Preferences */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card-premium p-6 flex flex-col gap-6"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center">
              <Bell size={20} />
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Notifications</h2>
          </div>
          <div className="flex flex-col gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone size={18} className="text-slate-400" />
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-700">Push Notifications</span>
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-widest",
                    permissionStatus === 'granted' ? "text-emerald-500" : 
                    permissionStatus === 'denied' ? "text-red-500" : "text-slate-400"
                  )}>
                    Permission: {permissionStatus}
                  </span>
                </div>
              </div>
              <motion.div 
                whileTap={{ scale: 0.9 }}
                onClick={togglePushNotifications}
                className={cn(
                  "w-11 h-6 rounded-full relative p-1 cursor-pointer transition-colors duration-300",
                  pushEnabled ? "bg-primary" : "bg-slate-200"
                )}
              >
                <motion.div 
                  animate={{ x: pushEnabled ? 20 : 0 }}
                  className="w-4 h-4 bg-white rounded-full shadow-sm"
                />
              </motion.div>
            </div>
            
            {pushEnabled && (
              <motion.button
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                onClick={() => {
                  new Notification('Test Notification', {
                    body: 'This is a test notification from Sari-Sari Digital.',
                    icon: '/favicon.ico'
                  });
                }}
                className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary/80 transition-colors text-left ml-7"
              >
                Send Test Notification
              </motion.button>
            )}

            <div className="mt-2 p-3 bg-blue-50/50 rounded-xl border border-blue-100/50">
              <p className="text-[10px] text-blue-600 font-medium leading-relaxed">
                <b>Note:</b> For notifications to work, ensure you are using a modern browser and have allowed permissions. If you are in a preview window, try opening the app in a <b>new tab</b>.
              </p>
            </div>
          </div>
        </motion.section>

        {/* Danger Zone */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-4"
        >
          <motion.button 
            whileTap={{ scale: 0.98 }}
            onClick={handleLogout}
            className="w-full bg-red-50 text-red-500 font-black py-5 rounded-[2rem] flex items-center justify-center gap-3 border border-red-100 transition-all hover:bg-red-100 shadow-lg shadow-red-100/20"
          >
            <LogOut size={20} />
            Sign Out of Admin Portal
          </motion.button>
        </motion.section>
      </div>

      <footer className="text-center py-12">
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Sari-Sari Digital v1.0.0</p>
      </footer>

      {/* Delete Confirmation Overlay */}
      <AnimatePresence>
        {confirmDelete && (
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
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Delete Category?</h3>
                <p className="text-slate-500 text-sm font-medium">Are you sure you want to remove this category? This cannot be undone.</p>
              </div>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => handleDeleteCategory(confirmDelete)}
                  disabled={isCategoryLoading}
                  className="w-full bg-red-500 text-white font-black py-5 rounded-2xl shadow-lg shadow-red-500/20 disabled:opacity-50 active:scale-95 transition-transform"
                >
                  {isCategoryLoading ? 'Deleting...' : 'Yes, Delete'}
                </button>
                <button 
                  onClick={() => setConfirmDelete(null)}
                  className="btn-secondary w-full"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );

}
