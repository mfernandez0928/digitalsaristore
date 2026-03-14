import { 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  where, 
  onSnapshot
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product } from '../types';
import { handleFirestoreError, OperationType } from '../lib/errorHandling';

const COLLECTION_NAME = 'favorites';

export const favoriteService = {
  async toggleFavorite(userId: string, product: Product): Promise<boolean> {
    if (!db) return false;
    try {
      const q = query(
        collection(db, COLLECTION_NAME), 
        where('userId', '==', userId),
        where('productId', '==', product.id)
      );
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        // Remove from favorites
        await deleteDoc(doc(db, COLLECTION_NAME, snapshot.docs[0].id));
        return false;
      } else {
        // Add to favorites
        await addDoc(collection(db, COLLECTION_NAME), {
          userId,
          productId: product.id,
          productName: product.name,
          productPrice: product.price,
          productImageUrl: product.imageUrl || '',
          timestamp: new Date()
        });
        return true;
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, COLLECTION_NAME);
      return false;
    }
  },

  async isFavorite(userId: string, productId: string): Promise<boolean> {
    if (!db) return false;
    try {
      const q = query(
        collection(db, COLLECTION_NAME), 
        where('userId', '==', userId),
        where('productId', '==', productId)
      );
      const snapshot = await getDocs(q);
      return !snapshot.empty;
    } catch (error) {
      return false;
    }
  },

  subscribeToFavorites(userId: string, callback: (favorites: string[]) => void) {
    if (!db) return () => {};
    const q = query(collection(db, COLLECTION_NAME), where('userId', '==', userId));
    return onSnapshot(q, (snapshot) => {
      const productIds = snapshot.docs.map(doc => doc.data().productId);
      callback(productIds);
    });
  },

  async getFavoriteProducts(userId: string): Promise<any[]> {
    if (!db) return [];
    try {
      const q = query(collection(db, COLLECTION_NAME), where('userId', '==', userId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, COLLECTION_NAME);
      return [];
    }
  }
};
