/**
 * IndexedDB Storage Layer
 * Persistent client-side storage for emails and AI enrichment data
 */

import { openDB, DBSchema, IDBPDatabase } from "idb";
import type { RawEmail, EmailAIEnrichment } from "@/lib/types/email-raw";

interface RoxyAIDB extends DBSchema {
  emails: {
    key: string;
    value: RawEmail;
    indexes: { "by-date": string };
  };
  enrichment: {
    key: string;
    value: EmailAIEnrichment;
    indexes: { "by-analyzed-date": string };
  };
}

const DB_NAME = "roxy-ai-db";
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<RoxyAIDB> | null = null;

/**
 * Initialize and open the IndexedDB database
 */
async function getDB(): Promise<IDBPDatabase<RoxyAIDB>> {
  // Guard against SSR - IndexedDB only exists in browser
  if (typeof window === "undefined") {
    throw new Error(
      "IndexedDB is not available on the server. This function must be called client-side only."
    );
  }

  if (dbInstance) return dbInstance;

  dbInstance = await openDB<RoxyAIDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Create emails store
      if (!db.objectStoreNames.contains("emails")) {
        const emailStore = db.createObjectStore("emails", { keyPath: "id" });
        emailStore.createIndex("by-date", "receivedDateTime");
      }

      // Create AI enrichment store
      if (!db.objectStoreNames.contains("enrichment")) {
        const enrichmentStore = db.createObjectStore("enrichment", {
          keyPath: "emailId",
        });
        enrichmentStore.createIndex("by-analyzed-date", "analyzedAt");
      }
    },
  });

  return dbInstance;
}

/**
 * Email Store Operations
 */
export const EmailDB = {
  async getAll(): Promise<RawEmail[]> {
    const db = await getDB();
    return db.getAll("emails");
  },

  async getById(id: string): Promise<RawEmail | undefined> {
    const db = await getDB();
    return db.get("emails", id);
  },

  async save(email: RawEmail): Promise<void> {
    const db = await getDB();
    await db.put("emails", email);
  },

  async saveMany(emails: RawEmail[]): Promise<void> {
    const db = await getDB();
    const tx = db.transaction("emails", "readwrite");
    await Promise.all([...emails.map((email) => tx.store.put(email)), tx.done]);
  },

  async clear(): Promise<void> {
    const db = await getDB();
    await db.clear("emails");
  },

  async count(): Promise<number> {
    const db = await getDB();
    return db.count("emails");
  },
};

/**
 * AI Enrichment Store Operations
 */
export const EnrichmentDB = {
  async getAll(): Promise<Map<string, EmailAIEnrichment>> {
    const db = await getDB();
    const enrichments = await db.getAll("enrichment");
    const map = new Map<string, EmailAIEnrichment>();
    enrichments.forEach((e) => map.set(e.emailId, e));
    return map;
  },

  async getByEmailId(emailId: string): Promise<EmailAIEnrichment | undefined> {
    const db = await getDB();
    return db.get("enrichment", emailId);
  },

  async save(enrichment: EmailAIEnrichment): Promise<void> {
    const db = await getDB();
    await db.put("enrichment", enrichment);
  },

  async saveMany(enrichments: EmailAIEnrichment[]): Promise<void> {
    const db = await getDB();
    const tx = db.transaction("enrichment", "readwrite");
    await Promise.all([...enrichments.map((e) => tx.store.put(e)), tx.done]);
  },

  async needsAnalysis(
    emailId: string,
    maxAge: number = 7 * 24 * 60 * 60 * 1000
  ): Promise<boolean> {
    const enrichment = await this.getByEmailId(emailId);

    if (!enrichment) return true;

    const analyzedAt = new Date(enrichment.analyzedAt).getTime();
    const now = Date.now();

    return now - analyzedAt > maxAge;
  },

  async clear(): Promise<void> {
    const db = await getDB();
    await db.clear("enrichment");
  },

  async count(): Promise<number> {
    const db = await getDB();
    return db.count("enrichment");
  },
};

/**
 * Database utility functions
 */
export const DBUtils = {
  async clearAll(): Promise<void> {
    await EmailDB.clear();
    await EnrichmentDB.clear();
    console.log("🗑️  All IndexedDB data cleared");
  },

  async getStats() {
    const emailCount = await EmailDB.count();
    const enrichmentCount = await EnrichmentDB.count();

    return {
      totalEmails: emailCount,
      enrichedEmails: enrichmentCount,
      unenrichedEmails: emailCount - enrichmentCount,
    };
  },
};
