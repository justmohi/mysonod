import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from './AuthContext';
import type { UnionSettings } from '../types';
import { DEFAULT_UNION_SETTINGS } from '../types';

interface UnionSettingsContextType {
  settings: UnionSettings;
  loading: boolean;
  updateSettings: (newSettings: Partial<UnionSettings>, updatedByName?: string) => Promise<void>;
  resetToDefault: (updatedByName?: string) => Promise<void>;
}

const UnionSettingsContext = createContext<UnionSettingsContextType>({
  settings: DEFAULT_UNION_SETTINGS,
  loading: false,
  updateSettings: async () => {},
  resetToDefault: async () => {}
});

const GLOBAL_CACHE_KEY = 'union_settings_cache_v1';
const GLOBAL_LOGO_KEYS = {
  govtLogoUrl: 'custom_govt_logo_base64',
  unionLogoUrl: 'custom_union_logo_base64',
  watermarkLogoUrl: 'custom_watermark_logo_base64'
} as const;

const getScopedKey = (base: string, scopeId: string) =>
  scopeId === 'global' ? base : `${base}__union_${scopeId}`;

export const UnionSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, userProfile } = useAuth();

  const isOperator = userProfile?.role === 'operator' && !!currentUser;
  const scopeId = isOperator ? currentUser!.uid : 'global';

  const cacheKey = useMemo(
    () => getScopedKey(GLOBAL_CACHE_KEY, scopeId),
    [scopeId]
  );

  const getLogoKey = (field: keyof typeof GLOBAL_LOGO_KEYS) =>
    getScopedKey(GLOBAL_LOGO_KEYS[field], scopeId);

  const readLocalSettings = (): UnionSettings => {
    try {
      const cached = localStorage.getItem(cacheKey);
      const savedGovt = localStorage.getItem(getLogoKey('govtLogoUrl'));
      const savedUnion = localStorage.getItem(getLogoKey('unionLogoUrl'));
      const savedWatermark =
        localStorage.getItem(getLogoKey('watermarkLogoUrl')) ||
        (scopeId === 'global' ? localStorage.getItem('savedWatermarkLogo') : null);

      let parsed: Partial<UnionSettings> = {};
      if (cached) {
        parsed = JSON.parse(cached);
      }

      return {
        ...DEFAULT_UNION_SETTINGS,
        ...parsed,
        govtLogoUrl:
          savedGovt !== null ? savedGovt : (parsed.govtLogoUrl || DEFAULT_UNION_SETTINGS.govtLogoUrl),
        unionLogoUrl:
          savedUnion !== null ? savedUnion : (parsed.unionLogoUrl || DEFAULT_UNION_SETTINGS.unionLogoUrl),
        watermarkLogoUrl:
          savedWatermark !== null ? savedWatermark : (parsed.watermarkLogoUrl || DEFAULT_UNION_SETTINGS.watermarkLogoUrl)
      };
    } catch (e) {
      console.warn('Failed to parse cached union settings', e);
      return DEFAULT_UNION_SETTINGS;
    }
  };

  const [settings, setSettings] = useState<UnionSettings>(readLocalSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSettings(readLocalSettings());
    setLoading(true);

    const docRef = isOperator
      ? doc(db, 'union_settings', currentUser!.uid)
      : doc(db, 'settings', 'unionInfo');

    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as Partial<UnionSettings>;
          const savedGovt = localStorage.getItem(getLogoKey('govtLogoUrl'));
          const savedUnion = localStorage.getItem(getLogoKey('unionLogoUrl'));
          const savedWatermark =
            localStorage.getItem(getLogoKey('watermarkLogoUrl')) ||
            (scopeId === 'global' ? localStorage.getItem('savedWatermarkLogo') : null);

          const merged: UnionSettings = {
            ...DEFAULT_UNION_SETTINGS,
            ...data,
            govtLogoUrl:
              savedGovt !== null ? savedGovt : (data.govtLogoUrl || DEFAULT_UNION_SETTINGS.govtLogoUrl),
            unionLogoUrl:
              savedUnion !== null ? savedUnion : (data.unionLogoUrl || DEFAULT_UNION_SETTINGS.unionLogoUrl),
            watermarkLogoUrl:
              savedWatermark !== null ? savedWatermark : (data.watermarkLogoUrl || DEFAULT_UNION_SETTINGS.watermarkLogoUrl)
          };

          setSettings(merged);
          try {
            localStorage.setItem(cacheKey, JSON.stringify(merged));
          } catch (e) {
            // ignore localStorage errors
          }
        } else {
          setDoc(
            docRef,
            {
              ...DEFAULT_UNION_SETTINGS,
              updatedAt: new Date().toISOString(),
              updatedBy: isOperator
                ? (userProfile?.name || currentUser?.email || 'ইউনিয়ন উদ্যোক্তা')
                : 'এডমিন কর্মকর্তা'
            },
            { merge: true }
          ).catch((err) => {
            console.warn('Could not seed union settings:', err);
          });
        }

        setLoading(false);
      },
      (error) => {
        console.warn('Union settings subscription fallback to cached/default:', error.message);
        setLoading(false);
      }
    );

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
