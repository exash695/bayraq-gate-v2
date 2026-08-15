/**
 * Bairaq Portal - Independent Services Layer
 * Central export for all backend & gateway communications:
 * - cacheService: Smart caching system (TTL, LRU, memory/localStorage)
 * - cdnService: Cloudflare R2 Media & CDN URL resolver
 * - aiWorkerService: Cloudflare Workers AI Gateway proxy
 * - firebaseService: Scoped Firebase (Auth, Firestore, Realtime DB, FCM)
 */

export { cacheService } from './cacheService';
export { cdnService } from './cdnService';
export { aiWorkerService } from './aiWorkerService';
export { firebaseService } from './firebaseService';
