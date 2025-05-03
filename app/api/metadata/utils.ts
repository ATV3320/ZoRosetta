// A simple in-memory cache for metadata
// In a production app, you would use a database
const METADATA_CACHE: Record<string, any> = {};

/**
 * Store metadata in the cache
 */
export function storeMetadata(id: string, data: any): void {
  METADATA_CACHE[id] = {
    ...data,
    timestamp: Date.now()
  };
  
  // Clean up old metadata occasionally
  if (Object.keys(METADATA_CACHE).length > 100) {
    // Keep only the 50 most recent entries
    const entries = Object.entries(METADATA_CACHE)
      .sort((a, b) => b[1].timestamp - a[1].timestamp)
      .slice(0, 50);
    
    const newCache: Record<string, any> = {};
    entries.forEach(([key, value]) => {
      newCache[key] = value;
    });
    
    // Replace the old cache
    Object.keys(METADATA_CACHE).forEach(key => {
      delete METADATA_CACHE[key];
    });
    
    entries.forEach(([key, value]) => {
      METADATA_CACHE[key] = value;
    });
  }
}

/**
 * Retrieve metadata from the cache
 */
export function getMetadata(id: string): any {
  if (!METADATA_CACHE[id]) {
    return null;
  }
  
  const { timestamp, ...metadata } = METADATA_CACHE[id];
  return metadata;
}

/**
 * Generate a unique ID for metadata
 */
export function generateMetadataId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
} 