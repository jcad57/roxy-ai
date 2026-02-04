/**
 * Custom Categories Service
 * Manages user-created email categories stored in IndexedDB
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface CustomCategory {
  id: string; // Unique identifier
  label: string; // Display name
  color: string; // Hex color
  tagIds: string[]; // Context tag IDs to filter by
  createdAt: string; // ISO timestamp
  emailCount?: number; // Cached count of matching emails
}

interface CustomCategoriesDB extends DBSchema {
  categories: {
    key: string;
    value: CustomCategory;
    indexes: { 'by-created': string };
  };
}

const DB_NAME = 'roxy-ai-categories';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<CustomCategoriesDB> | null = null;

/**
 * Initialize and open the categories database
 */
async function getDB(): Promise<IDBPDatabase<CustomCategoriesDB>> {
  // Guard against SSR
  if (typeof window === 'undefined') {
    throw new Error('CustomCategoriesDB is not available on the server.');
  }

  if (dbInstance) return dbInstance;

  dbInstance = await openDB<CustomCategoriesDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('categories')) {
        const store = db.createObjectStore('categories', { keyPath: 'id' });
        store.createIndex('by-created', 'createdAt');
      }
    },
  });

  return dbInstance;
}

/**
 * Category Store Operations
 */
export const CustomCategoriesDB = {
  /**
   * Get all custom categories
   */
  async getAll(): Promise<CustomCategory[]> {
    const db = await getDB();
    return db.getAll('categories');
  },

  /**
   * Get category by ID
   */
  async getById(id: string): Promise<CustomCategory | undefined> {
    const db = await getDB();
    return db.get('categories', id);
  },

  /**
   * Save or update a category
   */
  async save(category: CustomCategory): Promise<void> {
    const db = await getDB();
    await db.put('categories', category);
  },

  /**
   * Delete a category
   */
  async delete(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('categories', id);
  },

  /**
   * Clear all categories
   */
  async clear(): Promise<void> {
    const db = await getDB();
    await db.clear('categories');
  },

  /**
   * Count total categories
   */
  async count(): Promise<number> {
    const db = await getDB();
    return db.count('categories');
  },
};

/**
 * Create a new custom category
 */
export async function createCustomCategory(
  label: string,
  color: string,
  tagIds: string[]
): Promise<CustomCategory> {
  const category: CustomCategory = {
    id: generateCategoryId(label),
    label,
    color,
    tagIds,
    createdAt: new Date().toISOString(),
  };

  await CustomCategoriesDB.save(category);
  console.log('✅ Created custom category:', category);
  
  return category;
}

/**
 * Update an existing category
 */
export async function updateCustomCategory(
  id: string,
  updates: Partial<Omit<CustomCategory, 'id' | 'createdAt'>>
): Promise<CustomCategory | null> {
  const existing = await CustomCategoriesDB.getById(id);
  if (!existing) return null;

  const updated: CustomCategory = {
    ...existing,
    ...updates,
  };

  await CustomCategoriesDB.save(updated);
  return updated;
}

/**
 * Delete a custom category
 */
export async function deleteCustomCategory(id: string): Promise<void> {
  await CustomCategoriesDB.delete(id);
  console.log('🗑️  Deleted custom category:', id);
}

/**
 * Generate a unique category ID from label
 */
function generateCategoryId(label: string): string {
  const base = label.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const timestamp = Date.now().toString(36);
  return `${base}-${timestamp}`;
}

/**
 * Check if email matches category criteria
 * Works with email.tags array
 */
export function emailMatchesCategory(
  emailTags: string[],
  category: CustomCategory
): boolean {
  if (!emailTags || emailTags.length === 0) return false;
  if (!category.tagIds || category.tagIds.length === 0) return false;

  // Email matches if it has ANY of the category's tags
  const normalizedEmailTags = emailTags.map((t) =>
    t.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-")
  );

  return category.tagIds.some(
    (tagId) =>
      normalizedEmailTags.includes(tagId) ||
      normalizedEmailTags.includes(tagId.toLowerCase())
  );
}