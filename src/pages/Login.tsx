import React, { useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { auth } from "../lib/firebase";
import { useNavigate } from "react-router-dom";
import {
  LogIn,
  UserPlus,
  Store,
  Chrome,
  AlertCircle,
  ArrowRight,
  Mail,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    if (!auth) return;
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      navigate("/");
    } catch (err: any) {
      console.error("Google Auth error:", err);
      setError(err.message || "Google Sign-In failed");
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!auth) {
      setError("Firebase is not properly configured. Please check your setup.");
      return;
    }

    setLoading(true);
    try {
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigate("/");
    } catch (err: any) {
      console.error("Auth error:", err);
      let message = "An unexpected error occurred";

      const errorCode = err.code || "";
      const errorMessage = err.message || "";

      if (
        errorCode === "auth/invalid-credential" ||
        errorMessage.includes("invalid-credential")
      ) {
        message =
          "Invalid email or password. If you haven't created an account yet, please register first.";
      } else if (
        errorCode === "auth/user-not-found" ||
        errorMessage.includes("user-not-found")
      ) {
        message = "No account found with this email. Please register first.";
      } else if (
        errorCode === "auth/wrong-password" ||
        errorMessage.includes("wrong-password")
      ) {
        message = "Incorrect password. Please try again.";
      } else if (
        errorCode === "auth/email-already-in-use" ||
        errorMessage.includes("email-already-in-use")
      ) {
        message = "This email is already registered. Please sign in instead.";
      } else if (
        errorCode === "auth/weak-password" ||
        errorMessage.includes("weak-password")
      ) {
        message = "Password should be at least 6 characters.";
      } else {
        message = errorMessage || "Authentication failed. Please try again.";
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col pt-12 px-6 pb-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md mx-auto flex flex-col gap-10"
      >
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="w-24 h-24 bg-primary rounded-[2.5rem] flex items-center justify-center shadow-premium relative overflow-hidden group">
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
            <Store
              size={48}
              className="text-white relative z-10"
              strokeWidth={2.5}
            />
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-display font-black text-slate-900 tracking-tight">
              {isRegister ? "Join Us" : "Welcome Back"}
            </h1>
            <p className="text-slate-400 font-medium px-4">
              {isRegister
                ? "Create an account to start your digital sari-sari shopping experience."
                : "Sign in to access your local sari-sari store digital experience."}
            </p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-red-50 p-5 rounded-[2rem] border border-red-100 flex flex-col gap-4 shadow-soft"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-red-500 rounded-xl flex items-center justify-center text-white shrink-0">
                  <AlertCircle size={18} strokeWidth={3} />
                </div>
                <p className="text-sm text-red-700 font-bold leading-relaxed">
                  {error}
                </p>
              </div>
              {(error.includes("register") ||
                error.includes("account found")) &&
                !isRegister && (
                  <button
                    onClick={() => {
                      setIsRegister(true);
                      setError(null);
                    }}
                    className="bg-red-500 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest self-start hover:bg-red-600 transition-all active:scale-95 shadow-lg shadow-red-500/20"
                  >
                    Create Account Instead
                  </button>
                )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col gap-6">
          {/* EMAIL / PASSWORD FIRST */}
          <form onSubmit={handleAuth} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">
                Email Address
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300"
                  size={20}
                />
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-premium pl-14 pr-40"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">
                Password
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300"
                  size={20}
                />
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-premium pl-14 pr-40"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-primary transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              disabled={loading}
              className="btn-primary py-6 mt-4 flex items-center justify-center gap-3 group"
            >
              {loading ? (
                <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span className="text-lg">
                    {isRegister ? "Create Account" : "Sign In"}
                  </span>
                  <ArrowRight
                    size={20}
                    className="group-hover:translate-x-1 transition-transform"
                    strokeWidth={3}
                  />
                </>
              )}
            </button>
          </form>

          {/* SEPARATOR */}
          <div className="flex items-center gap-6 py-2">
            <div className="h-px bg-slate-100 flex-1" />
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">
              or continue with
            </span>
            <div className="h-px bg-slate-100 flex-1" />
          </div>

          {/* SMALLER GOOGLE BUTTON */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-white border border-slate-100 text-slate-700 font-display font-black py-3 rounded-[1.5rem] flex items-center justify-center gap-3 shadow-soft hover:bg-slate-50 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            <div className="w-7 h-7 bg-white shadow-soft rounded-lg flex items-center justify-center">
              <Chrome size={18} className="text-blue-500" />
            </div>
            Continue with Google
          </button>

          <div className="text-center mt-4">
            <button
              onClick={() => setIsRegister(!isRegister)}
              className="text-sm font-bold text-slate-400 hover:text-primary transition-colors px-6 py-2 rounded-full active:bg-primary/5"
            >
              {isRegister ? (
                <>
                  Already have an account?{" "}
                  <span className="text-primary">Sign In</span>
                </>
              ) : (
                <>
                  New here?{" "}
                  <span className="text-primary">Create an account</span>
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
