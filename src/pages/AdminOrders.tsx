import React, { useEffect, useState } from "react";
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  updateDoc,
  doc,
  deleteDoc,
  getDoc,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { Order } from "../types";
import { formatCurrency, cn } from "../lib/utils";
import {
  Clock,
  CheckCircle2,
  XCircle,
  ShoppingBag,
  User,
  Trash2,
  AlertCircle,
  Truck,
  Store,
  Calendar,
  MapPin,
  MessageSquare,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { handleFirestoreError, OperationType } from "../lib/errorHandling";

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [confirmingOrder, setConfirmingOrder] = useState<Order | null>(null);
  const [confirmedDate, setConfirmedDate] = useState("");
  const [confirmedTime, setConfirmedTime] = useState("");
  const [sellerNotes, setSellerNotes] = useState("");
  const [deliveryFee, setDeliveryFee] = useState<string>("0");

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, "orders"), orderBy("timestamp", "desc"));

    // Updated listener to fetch User Names
    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        const rawOrders = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as Order,
        );

        const ordersWithUserNames = await Promise.all(
          rawOrders.map(async (order) => {
            // If customerName is already set and is not the generic "Online Customer", use it
            if (
              order.customerName &&
              order.customerName !== "Online Customer"
            ) {
              return order;
            }

            // If there is a userId, fetch the real name from the 'users' collection
            if (order.userId) {
              try {
                const userRef = doc(db, "users", order.userId);
                const userSnap = await getDoc(userRef);

                if (userSnap.exists()) {
                  const userData = userSnap.data();
                  return {
                    ...order,
                    customerName:
                      userData.displayName ||
                      userData.name ||
                      userData.fullName ||
                      "Online Customer",
                  };
                }
              } catch (err) {
                console.error("Error fetching user for order:", order.id, err);
              }
            }
            return order;
          }),
        );

        setOrders(ordersWithUserNames);
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, "orders");
        setLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  const updateStatus = async (
    orderId: string,
    status: Order["status"],
    extraData: any = {},
  ) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, "orders", orderId), {
        status,
        ...extraData,
      });
      setConfirmingOrder(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const handleConfirmOrder = (order: Order) => {
    setConfirmingOrder(order);
    setConfirmedDate(order.preferredDate || "");
    setConfirmedTime(order.preferredTime || "");
    setSellerNotes(order.sellerNotes || "");
    setDeliveryFee(order.deliveryFee?.toString() || "0");
  };

  const submitConfirmation = async () => {
    if (!confirmingOrder) return;
    await updateStatus(confirmingOrder.id, "confirmed", {
      confirmedDate,
      confirmedTime,
      sellerNotes,
      deliveryFee:
        confirmingOrder.deliveryMethod === "delivery"
          ? parseFloat(deliveryFee) || 0
          : 0,
    });
  };

  const handleDelete = async (orderId: string) => {
    if (!db) return;
    try {
      await deleteDoc(doc(db, "orders", orderId));
      setIsDeleting(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `orders/${orderId}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-emerald-50 text-emerald-600 border-emerald-100";
      case "cancelled":
        return "bg-red-50 text-red-600 border-red-100";
      case "pending":
        return "bg-amber-50 text-amber-600 border-amber-100";
      case "confirmed":
        return "bg-blue-50 text-blue-600 border-blue-100";
      case "preparing":
        return "bg-indigo-50 text-indigo-600 border-indigo-100";
      case "ready_for_pickup":
      case "out_for_delivery":
        return "bg-emerald-50 text-emerald-600 border-emerald-100";
      default:
        return "bg-slate-50 text-slate-600 border-slate-100";
    }
  };

  return (
    <div className="pb-24 pt-6 px-5 flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          Orders
        </h1>
        <p className="text-slate-500 text-sm font-medium">
          Review and process customer orders.
        </p>
      </header>

      {loading ? (
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-48 bg-slate-100 animate-pulse rounded-[2rem]"
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <AnimatePresence mode="popLayout">
            {orders.map((order, index) => (
              <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
                key={order.id}
                className="card-premium p-6 flex flex-col gap-5 group hover:border-primary/20 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border",
                          order.type === "pos"
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                            : "bg-blue-50 text-blue-600 border-blue-100",
                        )}
                      >
                        {order.type}
                      </span>
                      <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                        {order.timestamp?.toDate
                          ? order.timestamp.toDate().toLocaleString([], {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })
                          : "Just now"}
                      </span>
                    </div>
                    <h3 className="font-black text-slate-900 text-lg">
                      Order #{order.id.slice(-6).toUpperCase()}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "badge-status border",
                        getStatusColor(order.status),
                      )}
                    >
                      {order.status.replace(/_/g, " ")}
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setIsDeleting(order.id)}
                      className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={18} />
                    </motion.button>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  {order.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center bg-slate-50/50 p-3 rounded-2xl border border-slate-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-slate-400 font-black text-[10px] border border-slate-100">
                          {item.quantity}x
                        </div>
                        <span className="text-sm font-bold text-slate-700">
                          {item.name}
                        </span>
                      </div>
                      <span className="text-sm font-black text-slate-900">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4 items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 border border-slate-100">
                      <User size={20} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        Customer
                      </span>
                      {/* This will now show the fetched name */}
                      <span className="text-sm font-black text-slate-800 truncate max-w-[120px]">
                        {order.customerName || "Guest Buyer"}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      {order.deliveryMethod === "delivery" && order.deliveryFee
                        ? "Subtotal"
                        : "Total Amount"}
                    </span>
                    <span
                      className={cn(
                        "font-black tracking-tight",
                        order.deliveryMethod === "delivery" && order.deliveryFee
                          ? "text-lg text-slate-600"
                          : "text-2xl text-primary",
                      )}
                    >
                      {formatCurrency(order.total)}
                    </span>
                    {order.deliveryMethod === "delivery" &&
                      order.deliveryFee !== undefined &&
                      order.deliveryFee > 0 && (
                        <div className="flex flex-col items-end mt-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                              Delivery Fee
                            </span>
                            <span className="text-sm font-black text-slate-600">
                              {formatCurrency(order.deliveryFee)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1 pt-1 border-t border-slate-100">
                            <span className="text-[9px] font-black text-primary uppercase tracking-widest">
                              Total
                            </span>
                            <span className="text-2xl font-black text-primary">
                              {formatCurrency(order.total + order.deliveryFee)}
                            </span>
                          </div>
                        </div>
                      )}
                  </div>
                </div>

                {order.type === "online" && (
                  <div className="bg-slate-50/80 p-4 rounded-3xl flex flex-col gap-3 border border-slate-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[11px] font-black text-slate-600 uppercase tracking-wider">
                        {order.deliveryMethod === "delivery" ? (
                          <Truck size={14} className="text-primary" />
                        ) : (
                          <Store size={14} className="text-primary" />
                        )}
                        <span>{order.deliveryMethod}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] font-black text-slate-600 uppercase tracking-wider">
                        <Calendar size={14} className="text-primary" />
                        <span>
                          {order.preferredDate} • {order.preferredTime}
                        </span>
                      </div>
                    </div>
                    {order.deliveryMethod === "delivery" &&
                      order.deliveryAddress && (
                        <div className="flex items-start gap-2 p-3 bg-white rounded-2xl border border-slate-100">
                          <MapPin
                            size={14}
                            className="text-primary shrink-0 mt-0.5"
                          />
                          <div className="flex flex-col">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                              Delivery Address
                            </span>
                            <span className="text-xs font-bold text-slate-700 leading-relaxed">
                              {order.deliveryAddress}
                            </span>
                          </div>
                        </div>
                      )}
                    {order.buyerNotes && (
                      <div className="flex items-start gap-2 p-3 bg-white rounded-2xl border border-slate-100">
                        <MessageSquare
                          size={14}
                          className="text-blue-500 shrink-0 mt-0.5"
                        />
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            Buyer Instructions
                          </span>
                          <span className="text-xs font-bold text-slate-700 leading-relaxed">
                            {order.buyerNotes}
                          </span>
                        </div>
                      </div>
                    )}
                    {order.confirmedDate && (
                      <div className="text-[11px] text-emerald-600 font-black flex items-center gap-1.5 bg-emerald-50/50 p-2 rounded-xl border border-emerald-100/50">
                        <CheckCircle2 size={14} />
                        Confirmed for: {order.confirmedDate} at{" "}
                        {order.confirmedTime}
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 pt-2">
                  {order.status === "pending" && (
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleConfirmOrder(order)}
                      className="flex-1 btn-primary bg-blue-500 shadow-blue-100"
                    >
                      Confirm Order
                    </motion.button>
                  )}
                  {order.status === "confirmed" && (
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={() => updateStatus(order.id, "preparing")}
                      className="flex-1 btn-primary bg-indigo-500 shadow-indigo-100"
                    >
                      Start Preparing
                    </motion.button>
                  )}
                  {order.status === "preparing" && (
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={() =>
                        updateStatus(
                          order.id,
                          order.deliveryMethod === "delivery"
                            ? "out_for_delivery"
                            : "ready_for_pickup",
                        )
                      }
                      className="flex-1 btn-primary bg-emerald-500 shadow-emerald-100"
                    >
                      {order.deliveryMethod === "delivery"
                        ? "Out for Delivery"
                        : "Ready for Pickup"}
                    </motion.button>
                  )}
                  {(order.status === "out_for_delivery" ||
                    order.status === "ready_for_pickup") && (
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={() => updateStatus(order.id, "completed")}
                      className="flex-1 btn-primary bg-slate-900 shadow-slate-200"
                    >
                      Mark Completed
                    </motion.button>
                  )}
                  {["pending", "confirmed", "preparing"].includes(
                    order.status,
                  ) && (
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={() => updateStatus(order.id, "cancelled")}
                      className="px-6 btn-secondary text-red-500 border-red-50 hover:bg-red-50"
                    >
                      Cancel
                    </motion.button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {orders.length === 0 && (
            <div className="py-24 text-center flex flex-col items-center gap-6">
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center">
                <ShoppingBag size={48} className="text-slate-200" />
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-slate-900 font-black text-lg">
                  No orders yet
                </p>
                <p className="text-slate-400 font-medium text-sm">
                  When customers buy, they'll appear here.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmingOrder && (
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-white w-full max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 flex flex-col gap-6 shadow-2xl"
            >
              <div className="flex flex-col gap-2">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                  Confirm Order
                </h3>
                <p className="text-slate-500 text-sm font-medium">
                  Set the final schedule and add notes for the buyer.
                </p>
              </div>

              <div className="flex flex-col gap-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      Confirmed Date
                    </label>
                    <input
                      type="date"
                      value={confirmedDate}
                      onChange={(e) => setConfirmedDate(e.target.value)}
                      className="input-premium py-3 text-sm font-bold"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      Confirmed Time
                    </label>
                    <input
                      type="time"
                      value={confirmedTime}
                      onChange={(e) => setConfirmedTime(e.target.value)}
                      className="input-premium py-3 text-sm font-bold"
                    />
                  </div>
                </div>

                {confirmingOrder.deliveryMethod === "delivery" && (
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      Delivery Fee (₱)
                    </label>
                    <input
                      type="number"
                      value={deliveryFee}
                      onChange={(e) => setDeliveryFee(e.target.value)}
                      placeholder="0.00"
                      className="input-premium py-3 text-sm font-bold"
                    />
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Seller Notes (Optional)
                  </label>
                  <textarea
                    value={sellerNotes}
                    onChange={(e) => setSellerNotes(e.target.value)}
                    placeholder="e.g. Please bring exact amount..."
                    className="input-premium min-h-[120px] resize-none text-sm font-medium"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={submitConfirmation}
                  className="btn-primary w-full bg-blue-500 shadow-blue-100"
                >
                  Confirm & Notify Buyer
                </button>
                <button
                  onClick={() => setConfirmingOrder(null)}
                  className="btn-secondary w-full"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleting && (
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
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                  Delete Order?
                </h3>
                <p className="text-slate-500 text-sm font-medium">
                  This will permanently remove this order record.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => handleDelete(isDeleting)}
                  className="w-full bg-red-500 text-white font-black py-5 rounded-2xl shadow-lg shadow-red-500/20 active:scale-95 transition-transform"
                >
                  Yes, Delete it
                </button>
                <button
                  onClick={() => setIsDeleting(null)}
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
