/**
 * Email Body Cache
 * In-memory session cache for email content (Gmail/Outlook-style)
 * 
 * SECURITY:
 * - Lives in memory only (no disk persistence)
 * - Cleared on logout/tab close
 * - 15-minute TTL per entry
 * - No encryption needed (never persisted)
 */

interface CachedEmail {
  body: string
  htmlBody: string
  attachments: any[]
  fetchedAt: number
}

class EmailBodyCache {
  private cache = new Map<string, CachedEmail>()
  private readonly TTL = 1000 * 60 * 15 // 15 minutes
  
  /**
   * Get email body from cache or return null if not cached/expired
   */
  get(messageId: string): CachedEmail | null {
    const cached = this.cache.get(messageId)
    
    if (!cached) {
      return null
    }
    
    // Check if expired
    const age = Date.now() - cached.fetchedAt
    if (age > this.TTL) {
      console.log(`🕐 Cache expired for ${messageId} (age: ${Math.round(age / 1000)}s)`)
      this.cache.delete(messageId)
      return null
    }
    
    console.log(`⚡ Cache HIT: ${messageId} (age: ${Math.round(age / 1000)}s)`)
    return cached
  }
  
  /**
   * Store email body in cache
   */
  set(messageId: string, body: string, htmlBody: string, attachments: any[] = []): void {
    this.cache.set(messageId, {
      body,
      htmlBody,
      attachments,
      fetchedAt: Date.now(),
    })
    
    console.log(`💾 Cached email body: ${messageId} (cache size: ${this.cache.size})`)
  }
  
  /**
   * Check if email is cached and valid
   */
  has(messageId: string): boolean {
    return this.get(messageId) !== null
  }
  
  /**
   * Invalidate specific email
   */
  invalidate(messageId: string): void {
    const deleted = this.cache.delete(messageId)
    if (deleted) {
      console.log(`🗑️ Invalidated cache: ${messageId}`)
    }
  }
  
  /**
   * Clear entire cache (call on logout)
   */
  clear(): void {
    const size = this.cache.size
    this.cache.clear()
    console.log(`🧹 Cleared email body cache (${size} entries)`)
  }
  
  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
    }
  }
  
  /**
   * Prefetch multiple emails in parallel (with throttling)
   * Returns immediately, fetches in background
   */
  async prefetch(
    messageIds: string[],
    fetchFn: (messageId: string) => Promise<{ body: string; htmlBody: string; attachments: any[] }>,
    options: {
      maxConcurrent?: number
      onProgress?: (completed: number, total: number) => void
    } = {}
  ): Promise<void> {
    const { maxConcurrent = 5, onProgress } = options
    
    // Filter out already cached emails
    const uncached = messageIds.filter((id) => !this.has(id))
    
    if (uncached.length === 0) {
      console.log(`✅ All ${messageIds.length} emails already cached`)
      return
    }
    
    console.log(`🔄 Prefetching ${uncached.length} email bodies (${maxConcurrent} concurrent)...`)
    
    // Process in chunks to avoid overwhelming the API
    const chunks: string[][] = []
    for (let i = 0; i < uncached.length; i += maxConcurrent) {
      chunks.push(uncached.slice(i, i + maxConcurrent))
    }
    
    let completed = 0
    
    for (const chunk of chunks) {
      await Promise.allSettled(
        chunk.map(async (messageId) => {
          try {
            const content = await fetchFn(messageId)
            this.set(messageId, content.body, content.htmlBody, content.attachments)
            completed++
            
            if (onProgress) {
              onProgress(completed, uncached.length)
            }
          } catch (err: any) {
            console.warn(`⚠️ Prefetch failed for ${messageId}:`, err.message)
            completed++
            
            if (onProgress) {
              onProgress(completed, uncached.length)
            }
          }
        })
      )
      
      // Small delay between chunks to respect rate limits
      if (chunk !== chunks[chunks.length - 1]) {
        await new Promise((resolve) => setTimeout(resolve, 200))
      }
    }
    
    console.log(`✅ Prefetch complete: ${this.cache.size} emails cached`)
  }
}

// Singleton instance
export const emailBodyCache = new EmailBodyCache()

// Auto-clear cache on window/tab close (cleanup)
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    emailBodyCache.clear()
  })
}
