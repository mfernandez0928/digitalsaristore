import { collection, query, orderBy, limit, onSnapshot, Timestamp, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Order } from '../types';

class NotificationService {
  private unsubscribe: (() => void) | null = null;
  private lastOrderTimestamp: Timestamp | null = null;

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support desktop notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  getPermissionStatus(): NotificationPermission {
    if (!('Notification' in window)) return 'denied';
    return Notification.permission;
  }

  isEnabled(): boolean {
    if (!('Notification' in window)) return false;
    return localStorage.getItem('push_notifications_enabled') === 'true' && Notification.permission === 'granted';
  }

  setEnabled(enabled: boolean) {
    localStorage.setItem('push_notifications_enabled', enabled ? 'true' : 'false');
  }

  startOrderListener(onNewOrder: (order: Order) => void) {
    if (this.unsubscribe) return;
    if (!db) return;

    let isInitialLoad = true;

    const q = query(
      collection(db, 'orders'),
      orderBy('timestamp', 'desc'),
      limit(1)
    );

    this.unsubscribe = onSnapshot(q, (snapshot) => {
      if (isInitialLoad) {
        // Just record the latest order timestamp on initial load
        if (!snapshot.empty) {
          const latestOrder = snapshot.docs[0].data() as Order;
          if (latestOrder.timestamp) {
            this.lastOrderTimestamp = latestOrder.timestamp;
          }
        } else {
          // If no orders yet, set to now
          this.lastOrderTimestamp = Timestamp.now();
        }
        isInitialLoad = false;
        return;
      }

      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          const order = { id: change.doc.id, ...data } as Order;
          
          const orderTime = order.timestamp?.toMillis?.() || Date.now();
          const lastTime = this.lastOrderTimestamp?.toMillis?.() || 0;

          if (orderTime > lastTime) {
            if (order.timestamp?.toMillis) {
              this.lastOrderTimestamp = order.timestamp;
            }

            if (this.isEnabled()) {
              this.showNotification('New Order Received! 🛍️', {
                body: `Order #${order.id.slice(-6)} - Total: ₱${order.total.toFixed(2)}`,
                tag: 'new-order'
              });
              onNewOrder(order);
            }
          }
        }
      });
    }, (error) => {
      console.error('Notification listener error:', error);
    });
  }

  stopOrderListener() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  startBuyerListener(userId: string, onUpdate?: (order: Order) => void) {
    if (!db || !userId) return;

    let isInitialLoad = true;

    const q = query(
      collection(db, 'orders'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(5) // Watch recent orders
    );

    return onSnapshot(q, (snapshot) => {
      if (isInitialLoad) {
        isInitialLoad = false;
        return;
      }

      snapshot.docChanges().forEach((change) => {
        if (change.type === 'modified') {
          const order = { id: change.doc.id, ...change.doc.data() } as Order;
          
          if (this.isEnabled()) {
            this.showNotification('Order Update! 📦', {
              body: `Order #${order.id.slice(-6)} is now ${order.status.replace(/_/g, ' ')}`,
              tag: `order-update-${order.id}`
            });
          }

          if (onUpdate) {
            onUpdate(order);
          }
        }
      });
    });
  }

  private showNotification(title: string, options: Partial<NotificationOptions>) {
    if (!this.isEnabled()) return;
    if (!('Notification' in window)) return;

    const fullOptions: NotificationOptions = {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      ...options
    };

    try {
      new Notification(title, fullOptions);
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }
}

export const notificationService = new NotificationService();
