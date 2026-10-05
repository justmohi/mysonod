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

const MAX_UNION_LOGO_SIZE = 5 * 1024 * 1024; // hard safety limit
const TARGET_UNION_LOGO_SIZE = 700 * 1024; // target for faster upload
const MAX_LOGO_DIMENSION = 1200;
const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];

async function optimizeLogoFile(file: File): Promise<File> {
  if (
    file.size <= TARGET_UNION_LOGO_SIZE ||
    file.type === 'image/svg+xml'
  ) {
    return file;
  }

  const objectUrl = URL.createObjectURL(file);

  try {
    const image = new Image();

    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('ইমেজটি পড়া যায়নি।'));
      image.src = objectUrl;
    });

    const scale = Math.min(
      1,
      MAX_LOGO_DIMENSION / Math.max(image.naturalWidth || image.width, image.naturalHeight || image.height)
    );

    const width = Math.max(1, Math.round((image.naturalWidth || image.width) * scale));
    const height = Math.max(1, Math.round((image.naturalHeight || image.height) * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    if (!context) {
      return file;
    }

    context.clearRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);

    const qualities = [0.86, 0.78, 0.70, 0.62];
    for (const quality of qualities) {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/webp', quality)
      );

      if (blob && blob.size <= TARGET_UNION_LOGO_SIZE) {
        const baseName = file.name.replace(/\.[^.]+$/, '') || 'union-logo';
        return new File([blob], `${baseName}.webp`, {
          type: 'image/webp',
          lastModified: Date.now()
        });
      }
    }

    const finalBlob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/webp', 0.55)
    );

    if (finalBlob && finalBlob.size < file.size) {
      const baseName = file.name.replace(/\.[^.]+$/, '') || 'union-logo';
      return new File([finalBlob], `${baseName}.webp`, {
        type: 'image/webp',
        lastModified: Date.now()
      });
    }

    return file;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

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
        'ইমেজ ফাইলটি ৫ MB-এর বেশি। ছোট সাইজের ফাইল আপলোড করুন।'
      );
    }

    // Compress large raster images locally first so the Firebase upload is much faster.
    const optimizedFile = await optimizeLogoFile(file);

    if (optimizedFile.size > MAX_UNION_LOGO_SIZE) {
      throw new Error(
        'কমপ্রেস করার পরও ইমেজটি ৫ MB-এর বেশি। আরও ছোট ছবি ব্যবহার করুন।'
      );
    }

    const objectPath = `union_settings/${storageOwnerId}/${field}`;
    const storageRef = ref(storage, objectPath);

    await uploadBytes(storageRef, optimizedFile, {
      contentType: optimizedFile.type,
      cacheControl: 'public,max-age=31536000,immutable'
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
