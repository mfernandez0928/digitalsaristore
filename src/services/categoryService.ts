import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Category } from '../types';
import { handleFirestoreError, OperationType } from '../lib/errorHandling';

const COLLECTION_NAME = 'categories';

export const categoryService = {
  async getAll(): Promise<Category[]> {
    if (!db) return [];
    try {
      const q = query(collection(db, COLLECTION_NAME), orderBy('name'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Category));
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, COLLECTION_NAME);
      return [];
    }
  },

  async create(name: string): Promise<void> {
    if (!db) return;
    try {
      // Check for duplicates (case-insensitive)
      const categories = await this.getAll();
      const exists = categories.some(c => c.name.toLowerCase() === name.toLowerCase());
      if (exists) {
        throw new Error('A category with this name already exists.');
      }

      await addDoc(collection(db, COLLECTION_NAME), {
        name,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('already exists')) {
        throw error;
      }
      handleFirestoreError(error, OperationType.CREATE, COLLECTION_NAME);
    }
  },

  async update(id: string, name: string): Promise<void> {
    if (!db) return;
    try {
      // Check for duplicates (case-insensitive)
      const categories = await this.getAll();
      const exists = categories.some(c => c.id !== id && c.name.toLowerCase() === name.toLowerCase());
      if (exists) {
        throw new Error('A category with this name already exists.');
      }

      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, {
        name,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('already exists')) {
        throw error;
      }
      handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION_NAME}/${id}`);
    }
  },

  async delete(id: string): Promise<void> {
    if (!db) return;
    try {
      // Check if category is used by any products
      const productsQuery = query(collection(db, 'products'), where('category', '==', id));
      // Wait, products might store category NAME or ID. 
      // Looking at AdminProducts.tsx, it seems it stores the NAME (e.g. 'Snacks').
      // But for a robust system, it should probably store the ID or we check by name.
      // Let's check by name for now as the current code uses names.
      const categoryDoc = doc(db, COLLECTION_NAME, id);
      // We need the name to check products
      const categories = await this.getAll();
      const category = categories.find(c => c.id === id);
      
      if (category) {
        const pQuery = query(collection(db, 'products'), where('category', '==', category.name));
        const pSnapshot = await getDocs(pQuery);
        if (!pSnapshot.empty) {
          throw new Error('Cannot delete category because it is currently used by products.');
        }
      }

      await deleteDoc(doc(db, COLLECTION_NAME, id));
    } catch (error) {
      if (error instanceof Error && error.message.includes('currently used')) {
        throw error;
      }
      handleFirestoreError(error, OperationType.DELETE, `${COLLECTION_NAME}/${id}`);
    }
  }
};
