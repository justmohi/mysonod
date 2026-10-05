/**
 * Utility to sanitize data before passing to Firestore setDoc/updateDoc/transaction.set
 * Firestore strictly forbids `undefined` values and throws:
 * "Function Transaction.set() called with invalid data. Unsupported field value: undefined"
 */
export function cleanDataForFirestore<T extends Record<string, any>>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  
  if (Array.isArray(obj)) {
    return obj
      .filter(item => item !== undefined)
      .map(item => (typeof item === 'object' && item !== null ? cleanDataForFirestore(item) : item)) as unknown as T;
  }
  
  if (typeof obj === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        if (value !== null && typeof value === 'object') {
          cleaned[key] = cleanDataForFirestore(value);
        } else {
          cleaned[key] = value;
        }
      }
    }
    return cleaned as T;
  }
  
  return obj;
}
