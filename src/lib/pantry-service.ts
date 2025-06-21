
import { doc, getDoc, setDoc, getFirestore } from 'firebase/firestore';
import { auth, app } from '@/lib/firebase';
import type { PantryItem, NewPantryItem } from '@/components/pantry/PantryItem';

const db = getFirestore(app);

const getPantryDocRef = () => {
    const user = auth.currentUser;
    if (!user) {
        // This case is handled by the UI, but as a safeguard, return null.
        return null;
    }
    // Each user's pantry is a single document in the 'pantries' collection,
    // with the document ID being the user's UID.
    return doc(db, 'pantries', user.uid);
}

/**
 * Fetches all pantry items for the currently authenticated user.
 * @returns A promise that resolves to an array of PantryItems.
 */
export const getPantryItems = async (): Promise<PantryItem[]> => {
    const docRef = getPantryDocRef();
    if (!docRef) return [];

    try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().items) {
            // Firestore timestamps need to be converted back to JS Date objects.
            return docSnap.data().items.map((item: any) => ({
                ...item,
                addedDate: item.addedDate.toDate()
            }));
        }
        // If the document or 'items' array doesn't exist, return an empty array.
        return [];
    } catch (error) {
        console.error("Error fetching pantry items from Firestore:", error);
        return []; // Return empty array on error to prevent crashes.
    }
}

/**
 * Adds a new item to the user's pantry in Firestore.
 * @param newItem The new item to add, without an ID or addedDate.
 * @returns A promise that resolves to the fully formed PantryItem that was added.
 */
export const addPantryItem = async (newItem: NewPantryItem): Promise<PantryItem> => {
    const docRef = getPantryDocRef();
    if (!docRef) throw new Error("User not authenticated.");

    const uniqueId = crypto.randomUUID ? crypto.randomUUID() : `item-${Date.now()}-${Math.random()}`;
    const itemToAdd: PantryItem = {
        ...newItem,
        id: uniqueId,
        addedDate: new Date(),
    };

    try {
        // This "read-then-write" pattern is safe for this app's scale.
        const currentItems = await getPantryItems();
        const updatedItems = [...currentItems, itemToAdd];
        // Overwrite the entire 'items' array in the user's document.
        await setDoc(docRef, { items: updatedItems });
        return itemToAdd;
    } catch (error) {
        console.error("Error adding pantry item to Firestore:", error);
        throw new Error("Failed to add item to pantry.");
    }
}

/**
 * Removes an item from the user's pantry by its ID.
 * @param itemId The ID of the item to remove.
 */
export const removePantryItem = async (itemId: string): Promise<void> => {
    const docRef = getPantryDocRef();
    if (!docRef) throw new Error("User not authenticated.");

    try {
        const currentItems = await getPantryItems();
        const updatedItems = currentItems.filter(item => item.id !== itemId);
        // Overwrite the 'items' array with the filtered list.
        await setDoc(docRef, { items: updatedItems });
    } catch (error) {
        console.error("Error removing pantry item from Firestore:", error);
        throw new Error("Failed to remove item from pantry.");
    }
}
