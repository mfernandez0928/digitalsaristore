import React, { useState } from "react";
import { useCart } from "../contexts/CartContext";
import { formatCurrency } from "../lib/utils";
import {
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShoppingBag,
  Truck,
  Store,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  MapPin,
  MessageSquare,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import {
  addDoc,
  collection,
  serverTimestamp,
  doc,
  updateDoc,
  increment,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../contexts/AuthContext";
import { motion, AnimatePresence } from "motion/react";

export default function Cart() {
  const { items, updateQuantity, removeFromCart, totalPrice, clearCart } =
    useCart();
  const { user } = useAuth();
  const [step, setStep] = useState<"cart" | "checkout" | "success">("cart");
  const [checkingOut, setCheckingOut] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState<"delivery" | "pickup">(
    "delivery",
  );
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [buyerNotes, setBuyerNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleCheckout = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (deliveryMethod === "delivery" && !deliveryAddress.trim()) {
      setError("Please provide your delivery address.");
      return;
    }

    if (!preferredDate || !preferredTime) {
      setError("Please select your preferred date and time.");
      return;
    }

    setCheckingOut(true);
    setError(null);
    try {
      const customerName = buyerNotes
        ? buyerNotes.split(" - ")[0]
        : "Online Customer";

      const orderData = {
        userId: user.uid,
        items,
        total: totalPrice,
        status: "pending",
        type: "online",
        deliveryMethod,
        deliveryAddress: deliveryMethod === "delivery" ? deliveryAddress : "",
        preferredDate,
        preferredTime,
        buyerNotes,
        customerName,
        timestamp: serverTimestamp(),
      };

      await addDoc(collection(db, "orders"), orderData);

      for (const item of items) {
        const productRef = doc(db, "products", item.id);
        await updateDoc(productRef, {
          stock: increment(-item.quantity),
        });
      }

      clearCart();
      setStep("success");
    } catch (error) {
      console.error("Checkout error:", error);
      setError("Failed to place order. Please try again.");
    } finally {
      setCheckingOut(false);
    }
  };

  if (step === "success") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center min-h-[80vh] px-8 text-center gap-8"
      >
        <div className="w-32 h-32 bg-accent/10 text-accent rounded-full flex items-center justify-center shadow-xl shadow-accent/10 relative">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              type: "spring",
              damping: 12,
              stiffness: 200,
              delay: 0.2,
            }}
          >
            <CheckCircle2 size={64} strokeWidth={2.5} />
          </motion.div>
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute inset-0 rounded-full border-4 border-accent/20"
          />
        </div>
        <div className="flex flex-col gap-3">
          <h2 className="text-3xl font-display font-black text-slate-900">
            Order Placed!
          </h2>
          <p className="text-slate-500 font-medium max-w-xs mx-auto">
            Your order has been sent to the store. We'll notify you once it's
            confirmed.
          </p>
        </div>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button
            onClick={() => navigate("/orders")}
            className="btn-primary w-full"
          >
            Track My Order
          </button>
          <button
            onClick={() => navigate("/")}
            className="btn-secondary w-full"
          >
            Back to Home
          </button>
        </div>
      </motion.div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-8 text-center gap-8">
        <div className="w-32 h-32 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 relative">
          <ShoppingBag size={56} strokeWidth={1.5} />
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 3 }}
            className="absolute -top-2 -right-2 w-10 h-10 bg-white rounded-2xl shadow-soft flex items-center justify-center text-primary"
          >
            <Plus size={20} strokeWidth={3} />
          </motion.div>
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-display font-black text-slate-900">
            Your cart is empty
          </h2>
          <p className="text-slate-500 font-medium">
            Looks like you haven't added anything to your cart yet.
          </p>
        </div>
        <Link to="/shop" className="btn-primary px-10">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pt-4">
      <header className="px-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {step !== "cart" && (
            <button
              onClick={() => setStep("cart")}
              className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-600 shadow-sm border border-slate-50"
            >
              <ChevronLeft size={20} />
            </button>
          )}
          <h1 className="text-3xl font-display font-black text-slate-900">
            {step === "cart" ? "Your Cart" : "Checkout"}
          </h1>
        </div>
        {step === "cart" && (
          <span className="bg-primary/10 text-primary px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
            {items.length} Items
          </span>
        )}
      </header>

      <AnimatePresence mode="wait">
        {step === "cart" ? (
          <motion.div
            key="cart-step"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="px-5 flex flex-col gap-6"
          >
            <div className="flex flex-col gap-4">
              {items.map((item) => (
                <motion.div
                  layout
                  key={item.id}
                  className="card-premium p-4 flex gap-4 items-center"
                >
                  <div className="w-20 h-20 bg-slate-50 rounded-2xl overflow-hidden flex-shrink-0">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-200">
                        <ShoppingBag size={24} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col gap-1">
                    <h3 className="font-bold text-slate-900 text-sm leading-tight">
                      {item.name}
                    </h3>
                    <p className="text-primary font-black text-sm">
                      {formatCurrency(item.price)}{" "}
                      <span className="text-[10px] opacity-40 font-bold">
                        / {item.unit}
                      </span>
                    </p>

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center bg-slate-50 rounded-xl p-1 border border-slate-100">
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                          className="p-1.5 text-slate-400 hover:text-primary transition-colors"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="text-xs font-black w-8 text-center text-slate-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                          className="p-1.5 text-slate-400 hover:text-primary transition-colors"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="card-premium p-6 flex flex-col gap-4 mb-4">
              <div className="flex justify-between items-center text-slate-400 text-xs font-bold uppercase tracking-wider">
                <span>Subtotal</span>
                <span className="text-slate-900">
                  {formatCurrency(totalPrice)}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-400 text-xs font-bold uppercase tracking-wider">
                <span>Delivery Fee</span>
                <span className="text-amber-500 font-black">TBC</span>
              </div>
              <div className="h-px bg-slate-50 my-1" />
              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-lg font-display font-bold text-slate-900">
                    Total
                  </span>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    Excl. delivery fee
                  </span>
                </div>
                <span className="text-2xl font-display font-black text-primary">
                  {formatCurrency(totalPrice)}
                </span>
              </div>

              <button
                onClick={() => setStep("checkout")}
                className="btn-primary w-full mt-2"
              >
                Checkout Now
                <ArrowRight size={20} strokeWidth={3} />
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="checkout-step"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="px-5 flex flex-col gap-6"
          >
            <div className="card-premium p-6 flex flex-col gap-8">
              <div className="flex flex-col gap-4">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Delivery Method
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setDeliveryMethod("delivery")}
                    className={`flex flex-col items-center gap-3 p-5 rounded-[2rem] border-2 transition-all duration-300 ${deliveryMethod === "delivery" ? "border-primary bg-primary/5 text-primary shadow-lg shadow-primary/5" : "border-slate-50 bg-slate-50 text-slate-400"}`}
                  >
                    <Truck
                      size={28}
                      strokeWidth={deliveryMethod === "delivery" ? 2.5 : 2}
                    />
                    <span className="text-xs font-black">Delivery</span>
                  </button>
                  <button
                    onClick={() => setDeliveryMethod("pickup")}
                    className={`flex flex-col items-center gap-3 p-5 rounded-[2rem] border-2 transition-all duration-300 ${deliveryMethod === "pickup" ? "border-primary bg-primary/5 text-primary shadow-lg shadow-primary/5" : "border-slate-50 bg-slate-50 text-slate-400"}`}
                  >
                    <Store
                      size={28}
                      strokeWidth={deliveryMethod === "pickup" ? 2.5 : 2}
                    />
                    <span className="text-xs font-black">Pickup</span>
                  </button>
                </div>
              </div>

              {deliveryMethod === "delivery" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="flex flex-col gap-3"
                >
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <MapPin size={14} className="text-primary" />
                    Delivery Address
                  </label>
                  <textarea
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Enter your complete delivery address..."
                    className="input-premium w-full min-h-[100px] py-4 resize-none"
                  />
                </motion.div>
              )}

              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-3">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <Calendar size={14} className="text-primary" />
                    Preferred Date
                  </label>
                  <input
                    type="date"
                    value={preferredDate}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => setPreferredDate(e.target.value)}
                    className="input-premium w-full"
                  />
                </div>

                <div className="flex flex-col gap-3">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <Clock size={14} className="text-primary" />
                    Preferred Time
                  </label>
                  <input
                    type="time"
                    value={preferredTime}
                    onChange={(e) => setPreferredTime(e.target.value)}
                    className="input-premium w-full"
                  />
                </div>

                <div className="flex flex-col gap-3">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <MessageSquare size={14} className="text-primary" />
                    Notes for Seller (Optional)
                  </label>
                  <textarea
                    value={buyerNotes}
                    onChange={(e) => setBuyerNotes(e.target.value)}
                    placeholder="e.g. Please ring the doorbell, extra spicy..."
                    className="input-premium w-full min-h-[80px] py-4 resize-none text-sm"
                  />
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 text-red-500 p-4 rounded-2xl text-xs font-bold flex items-center gap-3 border border-red-100"
                >
                  <AlertCircle size={18} />
                  {error}
                </motion.div>
              )}

              <div className="h-px bg-slate-50" />

              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                      Subtotal
                    </span>
                    <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">
                      Delivery fee to be added
                    </span>
                  </div>
                  <span className="text-2xl font-display font-black text-primary">
                    {formatCurrency(totalPrice)}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                  By confirming, you agree to our terms. The store will review
                  your order, set the delivery fee, and confirm your requested
                  schedule.
                </p>
              </div>

              <button
                onClick={handleCheckout}
                disabled={checkingOut}
                className="btn-primary w-full"
              >
                {checkingOut ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Processing...</span>
                  </div>
                ) : (
                  <>
                    Confirm Order
                    <CheckCircle2 size={20} strokeWidth={3} />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
