import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useAuth, AuthProvider } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";

// Layouts
import PublicLayout from "./components/layout/PublicLayout";
import AdminLayout from "./components/layout/AdminLayout";

// Auth
import ProtectedRoute from "./components/auth/ProtectedRoute";

// Pages
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import Cart from "./pages/Cart";
import AdminDashboard from "./pages/AdminDashboard";
import AdminProducts from "./pages/AdminProducts";
import AdminOrders from "./pages/AdminOrders";
import AdminSettings from "./pages/AdminSettings";
import POS from "./pages/POS";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import MyOrders from "./pages/MyOrders";

import { isFirebaseConfigured } from "./lib/firebase";
import { AlertCircle, Terminal, ExternalLink } from "lucide-react";

const ConfigurationGuide = () => (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
    <div className="max-w-2xl w-full bg-white rounded-[2rem] shadow-xl border border-slate-100 p-8 md:p-12 flex flex-col gap-8">
      <div className="flex flex-col gap-4 text-center items-center">
        <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-3xl flex items-center justify-center mb-2">
          <AlertCircle size={40} />
        </div>
        <h1 className="text-3xl font-black text-slate-900">
          Firebase Setup Required
        </h1>
        <p className="text-slate-500 text-lg">
          To start using Digital Sari-Sari, you need to connect your Firebase
          project.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <span className="w-6 h-6 bg-slate-900 text-white rounded-full flex items-center justify-center text-xs">
              1
            </span>
            Create a Firebase Project
          </h2>
          <p className="text-sm text-slate-500 ml-8">
            Go to the{" "}
            <a
              href="https://console.firebase.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary font-bold inline-flex items-center gap-1"
            >
              Firebase Console <ExternalLink size={12} />
            </a>{" "}
            and create a new project.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <span className="w-6 h-6 bg-slate-900 text-white rounded-full flex items-center justify-center text-xs">
              2
            </span>
            Enable Authentication & Firestore
          </h2>
          <p className="text-sm text-slate-500 ml-8">
            Enable <b>Email/Password</b> auth and create a{" "}
            <b>Cloud Firestore</b> database in test mode.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <span className="w-6 h-6 bg-slate-900 text-white rounded-full flex items-center justify-center text-xs">
              3
            </span>
            Add Environment Variables
          </h2>
          <div className="ml-8 bg-slate-900 rounded-2xl p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-mono">
              <Terminal size={12} />
              <span>Add these to your AI Studio Secrets:</span>
            </div>
            <code className="text-xs text-emerald-400 font-mono break-all">
              VITE_FIREBASE_API_KEY
              <br />
              VITE_FIREBASE_AUTH_DOMAIN
              <br />
              VITE_FIREBASE_PROJECT_ID
              <br />
              VITE_FIREBASE_STORAGE_BUCKET
              <br />
              VITE_FIREBASE_MESSAGING_SENDER_ID
              <br />
              VITE_FIREBASE_APP_ID
            </code>
          </div>
        </div>
      </div>

      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
        <p className="text-xs text-slate-400 leading-relaxed">
          <b>Note:</b> After adding the secrets, the application will
          automatically restart and connect to your database.
        </p>
      </div>
    </div>
  </div>
);

const AppContent = () => {
  const { isAdmin, user } = useAuth();

  if (!isFirebaseConfigured) {
    return <ConfigurationGuide />;
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<PublicLayout />}>
        <Route
          path="/"
          element={isAdmin ? <Navigate to="/admin" replace /> : <Home />}
        />
        <Route path="/shop" element={<Shop />} />
        <Route path="/cart" element={<Cart />} />
        <Route
          path="/login"
          element={
            user ? (
              isAdmin ? (
                <Navigate to="/admin" replace />
              ) : (
                <Navigate to="/" replace />
              )
            ) : (
              <Login />
            )
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <MyOrders />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute requireAdmin>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="pos" element={<POS />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

import { ErrorBoundary } from "./components/ErrorBoundary";

export default function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <CartProvider>
            <AppContent />
          </CartProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}
