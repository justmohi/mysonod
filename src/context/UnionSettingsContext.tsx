import React, { createContext, useContext, useEffect, useState } from 'react';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, storage } from '../firebase';
import { useAuth } from './AuthContext';
import type { UnionSettings } from '../types';
import { DEFAULT_UNION_SETTINGS } from '../types';

type LogoField = 'govtLogoUrl' | 'unionLogoUrl' | 'watermarkLogoUrl';

interface UnionSettingsContextType {
  settings: UnionSettings;
  loading: boolean;
  updateSettings: (newSettings: Partial<UnionSettings>, updatedByName?: string) => Promise<void>;
  resetToDefault: (updatedByName?: string) => Promise<void>;
  uploadLogo: (field: LogoField, file: File, updatedByName?: string) => Promise<string>;
  removeLogo: (field: LogoField, updatedByName?: string) => Promise<void>;
}

const UnionSettingsContext = createContext<UnionSettingsContextType>({
  settings: DEFAULT_UNION_SETTINGS,
  loading: false,
  updateSettings: async () => {},
  resetToDefault: async () => {},
  uploadLogo: async () => '',
  removeLogo: async () => {}
});

const MAX_UNION_LOGO_SIZE = 5 * 1024 * 1024; // 5 MB per logo file
const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];

export const UnionSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, userProfile } = useAuth();

  const isOperator = !!currentUser && userProfile?.role === 'operator';
  const currentSettingsRef = isOperator
    ? doc(db, 'union_settings', currentUser!.uid)
    : doc(db, 'settings', 'unionInfo');

  const storageOwnerId = isOperator && currentUser ? currentUser.uid : 'global';

  const [settings, setSettings] = useState<UnionSettings>(DEFAULT_UNION_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    const unsubscribe = onSnapshot(
      currentSettingsRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as Partial<UnionSettings>;
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

          setDoc(currentSettingsRef, seeded, { merge: true }).catch((error) => {
            console.warn('Could not seed union settings:', error);
          });
        }

        setLoading(false);
      },
      (error) => {
        console.warn('Union settings subscription error:', error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [
    isOperator,
    currentUser?.uid,
    currentUser?.email,
    userProfile?.name,
    currentSettingsRef
  ]);

  const updateSettings = async (
    newSettings: Partial<UnionSettings>,
    updatedByName?: string
  ) => {
    const updatedPayload: UnionSettings = {
      ...settings,
      ...newSettings,
      updatedAt: new Date().toISOString(),
      updatedBy:
        updatedByName ||
        (isOperator ? 'ইউনিয়ন উদ্যোক্তা' : 'এডমিন কর্মকর্তা')
    };

    setSettings(updatedPayload);

    try {
      await setDoc(currentSettingsRef, updatedPayload, { merge: true });
    } catch (error) {
      handleFirestoreError(
        error,
        OperationType.WRITE,
        isOperator
          ? `union_settings/${currentUser!.uid}`
          : 'settings/unionInfo'
      );
      throw error;
    }
  };

  const uploadLogo = async (
    field: LogoField,
    file: File,
    updatedByName?: string
  ) => {
    if (!currentUser) {
      throw new Error('লোগো আপলোডের জন্য লগইন করতে হবে।');
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      throw new Error(
        'শুধু PNG, JPG/JPEG, WebP বা SVG image ফাইল আপলোড করা যাবে।'
      );
    }

    if (file.size > MAX_UNION_LOGO_SIZE) {
      throw new Error(
        'প্রতিটি ইউনিয়ন লোগো/জলছাপ ফাইলের সর্বোচ্চ সাইজ ৫ MB।'
      );
    }

    const objectPath = `union_settings/${storageOwnerId}/${field}`;
    const storageRef = ref(storage, objectPath);

    await uploadBytes(storageRef, file, {
      contentType: file.type,
      cacheControl: 'public,max-age=3600'
    });

    const downloadUrl = await getDownloadURL(storageRef);

    await updateSettings(
      { [field]: downloadUrl } as Partial<UnionSettings>,
      updatedByName
    );

    return downloadUrl;
  };

  const removeLogo = async (
    field: LogoField,
    updatedByName?: string
  ) => {
    if (!currentUser) {
      throw new Error('লোগো রিমুভ করার জন্য লগইন করতে হবে।');
    }

    const storageRef = ref(
      storage,
      `union_settings/${storageOwnerId}/${field}`
    );

    await deleteObject(storageRef).catch((error: any) => {
      if (error?.code !== 'storage/object-not-found') {
        throw error;
      }
    });

    await updateSettings(
      { [field]: '' } as Partial<UnionSettings>,
      updatedByName
    );
  };

  const resetToDefault = async (updatedByName?: string) => {
    await Promise.allSettled([
      removeLogo('govtLogoUrl', updatedByName),
      removeLogo('unionLogoUrl', updatedByName),
      removeLogo('watermarkLogoUrl', updatedByName)
    ]);

    await updateSettings(
      {
        ...DEFAULT_UNION_SETTINGS,
        govtLogoUrl: '',
        unionLogoUrl: '',
        watermarkLogoUrl: ''
      },
      updatedByName
    );
  };

  return (
    <UnionSettingsContext.Provider
      value={{
        settings,
        loading,
        updateSettings,
        resetToDefault,
        uploadLogo,
        removeLogo
      }}
    >
      {children}
    </UnionSettingsContext.Provider>
  );
};

export const useUnionSettings = () => useContext(UnionSettingsContext);
