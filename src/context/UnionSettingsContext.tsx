import React, { createContext, useContext, useState, useEffect } from 'react';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, storage } from '../firebase';
import { useAuth } from './AuthContext';
import type { UnionSettings } from '../types';
import { DEFAULT_UNION_SETTINGS } from '../types';

interface UnionSettingsContextType {
  settings: UnionSettings;
  loading: boolean;
  updateSettings: (newSettings: Partial<UnionSettings>, updatedByName?: string) => Promise<void>;
  resetToDefault: (updatedByName?: string) => Promise<void>;
  uploadLogo: (
    field: 'govtLogoUrl' | 'unionLogoUrl' | 'watermarkLogoUrl',
    file: File,
    updatedByName?: string
  ) => Promise<string>;
  removeLogo: (
    field: 'govtLogoUrl' | 'unionLogoUrl' | 'watermarkLogoUrl',
    updatedByName?: string
  ) => Promise<void>;
}

const UnionSettingsContext = createContext<UnionSettingsContextType>({
  settings: DEFAULT_UNION_SETTINGS,
  loading: false,
  updateSettings: async () => {},
  resetToDefault: async () => {}
});

const MAX_UNION_LOGO_SIZE = 5 * 1024 * 1024; // 5 MB per logo file
const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];

export const UnionSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, userProfile } = useAuth();
  const isOperator = userProfile?.role === 'operator' && !!currentUser;
  const docPath = isOperator ? `union_settings/${currentUser!.uid}` : 'settings/unionInfo';
  const docRef = doc(db, ...docPath.split('/')) as any;

  const [settings, setSettings] = useState<UnionSettings>(DEFAULT_UNION_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    return onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as Partial<UnionSettings>;
          setSettings({
            ...DEFAULT_UNION_SETTINGS,
            ...data
          });
        } else {
          const seeded: UnionSettings = {
            ...DEFAULT_UNION_SETTINGS,
            updatedAt: new Date().toISOString(),
            updatedBy: isOperator
              ? (userProfile?.name || currentUser?.email || 'ইউনিয়ন উদ্যোক্তা')
              : 'এডমিন কর্মকর্তা'
          };
          setSettings(seeded);
          setDoc(docRef, seeded, { merge: true }).catch((err) => {
            console.warn('Could not seed union settings:', err);
          });
        }
        setLoading(false);
      },
      (error) => {
        console.warn('Union settings subscription error:', error.message);
        setLoading(false);
      }
    );
  }, [docPath, isOperator, currentUser?.uid, currentUser?.email, userProfile?.name]);

  const updateSettings = async (newSettings: Partial<UnionSettings>, updatedByName?: string) => {
    const updatedPayload: UnionSettings = {
      ...settings,
      ...newSettings,
      updatedAt: new Date().toISOString(),
      updatedBy: updatedByName || (isOperator ? 'ইউনিয়ন উদ্যোক্তা' : 'এডমিন কর্মকর্তা')
    };

    setSettings(updatedPayload);

    try {
      await setDoc(docRef, updatedPayload, { merge: true });
    } catch (error) {
      handleFirestoreError(
        error,
        OperationType.WRITE,
        isOperator ? `union_settings/${currentUser!.uid}` : 'settings/unionInfo'
      );
      throw error;
    }
  };

  const uploadLogo = async (
    field: 'govtLogoUrl' | 'unionLogoUrl' | 'watermarkLogoUrl',
    file: File,
    updatedByName?: string
  ) => {
    if (!currentUser) {
      throw new Error('লোগো আপলোডের জন্য লগইন করতে হবে।');
    }
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      throw new Error('শুধু PNG, JPG/JPEG, WebP বা SVG image ফাইল আপলোড করা যাবে।');
    }
    if (file.size > MAX_UNION_LOGO_SIZE) {
      throw new Error('প্রতিটি ইউনিয়ন লোগো/জলছাপ ফাইলের সর্বোচ্চ সাইজ ৫ MB।');
    }

    const objectPath = `union_settings/${currentUser.uid}/${field}`;
    const storageRef = ref(storage, objectPath);
    await uploadBytes(storageRef, file, {
      contentType: file.type,
      cacheControl: 'public,max-age=3600'
    });

    const url = await getDownloadURL(storageRef);
    await updateSettings({ [field]: url }, updatedByName);
    return url;
  };

  const removeLogo = async (
    field: 'govtLogoUrl' | 'unionLogoUrl' | 'watermarkLogoUrl',
    updatedByName?: string
  ) => {
    if (!currentUser) {
      throw new Error('লোগো রিমুভ করার জন্য লগইন করতে হবে।');
    }

    const storageRef = ref(storage, `union_settings/${currentUser.uid}/${field}`);
    await deleteObject(storageRef).catch((error: any) => {
      // If the object was already removed, still clear the Firestore URL.
      if (error?.code !== 'storage/object-not-found') {
        throw error;
      }
    });

    await updateSettings({ [field]: '' }, updatedByName);
  };

  return () => unsubscribe();
  }, [isOperator, currentUser?.uid, userProfile?.name, cacheKey, scopeId]);

  const updateSettings = async (newSettings: Partial<UnionSettings>, updatedByName?: string) => {
    try {
      for (const field of Object.keys(GLOBAL_LOGO_KEYS) as Array<keyof typeof GLOBAL_LOGO_KEYS>) {
        const value = newSettings[field];
        const key = getLogoKey(field);

        if (value !== undefined) {
          if (value) {
            localStorage.setItem(key, value);
          } else {
            localStorage.removeItem(key);
          }
        }
      }

      if (scopeId === 'global' && newSettings.watermarkLogoUrl === undefined) {
        // Preserve legacy global watermark cache compatibility.
        const watermark = localStorage.getItem(getLogoKey('watermarkLogoUrl'));
        if (watermark) localStorage.setItem('savedWatermarkLogo', watermark);
      }
    } catch (e) {
      console.warn('LocalStorage error on union settings sync:', e);
    }

    const updatedPayload: UnionSettings = {
      ...settings,
      ...newSettings,
      updatedAt: new Date().toISOString(),
      updatedBy: updatedByName || (isOperator ? 'ইউনিয়ন উদ্যোক্তা' : 'এডমিন কর্মকর্তা')
    };

    setSettings(updatedPayload);

    try {
      localStorage.setItem(cacheKey, JSON.stringify(updatedPayload));
    } catch (e) {
      // ignore
    }

    try {
      const docRef = isOperator
        ? doc(db, 'union_settings', currentUser!.uid)
        : doc(db, 'settings', 'unionInfo');

      // Keep large logo/base64 payloads out of Firestore. Firestore documents are limited
      // to 1 MiB; logos are cached locally and served from the operator's local workspace.
      // Remove any legacy oversized logo fields from existing documents.
      const firestorePayload = {
        ...updatedPayload,
        govtLogoUrl: deleteField(),
        unionLogoUrl: deleteField(),
        watermarkLogoUrl: deleteField()
      };

      await setDoc(docRef, firestorePayload, { merge: true });
    } catch (error) {
      handleFirestoreError(
        error,
        OperationType.WRITE,
        isOperator ? `union_settings/${currentUser!.uid}` : 'settings/unionInfo'
      );
      throw error;
    }
  };

  const resetToDefault = async (updatedByName?: string) => {
    try {
      for (const field of Object.keys(GLOBAL_LOGO_KEYS) as Array<keyof typeof GLOBAL_LOGO_KEYS>) {
        localStorage.removeItem(getLogoKey(field));
      }
      if (scopeId === 'global') {
        localStorage.removeItem('savedWatermarkLogo');
      }
    } catch (e) {
      // ignore
    }

    await updateSettings(DEFAULT_UNION_SETTINGS, updatedByName);
  };

  return (
    <UnionSettingsContext.Provider value={{ settings, loading, updateSettings, resetToDefault }}>
      {children}
    </UnionSettingsContext.Provider>
  );
};

export const useUnionSettings = () => useContext(UnionSettingsContext);
