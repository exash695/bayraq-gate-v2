
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

import { auth } from './firebase';
import { safeStorage, safeSessionStorage } from '../lib/storage';
import { errorMonitoringService } from '../services/errorMonitoringService';

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null, shouldThrow = true) {
  if (!error) return;
  const errorMessage = error instanceof Error ? error.message : String(error);

  // Persistence Corruption Detection (ID: ca9 or "Unexpected state" or auth desync)
  if (errorMessage.includes('ca9') || errorMessage.includes('Unexpected state') || (errorMessage.includes('permission-denied') && !auth.currentUser)) {
    console.error("CRITICAL: Firestore persistence corruption or auth sync error. Triggering Protocol Purge...");
    safeStorage.setItem('s6_force_purge', 'true');
    // Only reload if we are not already in a reload loop
    const lastPurge = safeStorage.getItem('s6_last_purge');
    if (!lastPurge || Date.now() - Number(lastPurge) > 60000) {
      safeStorage.setItem('s6_last_purge', Date.now().toString());
      // window.location.reload(); // Temporarily disabled by user request
      return;
    }
  }

  // Quota Exceeded Detection
  if (errorMessage.includes('resource-exhausted') || errorMessage.includes('Quota limit exceeded')) {
    console.warn("WARNING: Firebase Free Tier Quota Exceeded (resource-exhausted). The app reached its daily limit. Consider upgrading to the Blaze plan or wait until tomorrow. Suppressing crash to keep UI active.");
    return; // Do not throw or crash
  }

  // Capture into centralized Error Monitoring Service
  errorMonitoringService.captureError({
    service: 'firestore',
    module: path ? `collection:${path}` : 'firestore',
    action: `firestore_${operationType}`,
    errorMessage: `[Firestore ${operationType.toUpperCase()}] ${path || 'global'}: ${errorMessage}`,
    stackTrace: error instanceof Error ? error.stack : undefined,
    severity: errorMessage.includes('permission-denied') ? 'critical' : 'warning',
    userId: auth.currentUser?.uid,
    schoolId: null
  });

  const errInfo: FirestoreErrorInfo = {
    error: errorMessage,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  if (shouldThrow) {
    throw new Error(JSON.stringify(errInfo));
  }
}
