import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import type { UnionSettings } from '../types';
import { DEFAULT_UNION_SETTINGS } from '../types';

interface UnionSettingsContextType {
  settings: UnionSettings;
  loading: boolean;
  updateSettings: (newSettings: Partial<UnionSettings>, updatedByName?: string) => Promise<void>;
  resetToDefault: (updatedByName?: string) => Promise<void>;
}

const LOCAL_STORAGE_KEY = 'union_settings_cache_v1';

const UnionSettingsContext = createContext<UnionSettingsContextType>({
  settings: DEFAULT_UNION_SETTINGS,
  loading: false,
  updateSettings: async () => {},
  resetToDefault: async () => {}
});

export const UnionSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<UnionSettings>(() => {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      const savedGovt = localStorage.getItem('custom_govt_logo_base64');
      const savedUnion = localStorage.getItem('custom_union_logo_base64');
      const savedWatermark = localStorage.getItem('custom_watermark_logo_base64') || localStorage.getItem('savedWatermarkLogo');

      let parsed: Partial<UnionSettings> = {};
      if (cached) {
        parsed = JSON.parse(cached);
      }
      return {
        ...DEFAULT_UNION_SETTINGS,
        ...parsed,
        govtLogoUrl: savedGovt !== null ? savedGovt : (parsed.govtLogoUrl || DEFAULT_UNION_SETTINGS.govtLogoUrl),
        unionLogoUrl: savedUnion !== null ? savedUnion : (parsed.unionLogoUrl || DEFAULT_UNION_SETTINGS.unionLogoUrl),
        watermarkLogoUrl: savedWatermark !== null ? savedWatermark : (parsed.watermarkLogoUrl || DEFAULT_UNION_SETTINGS.watermarkLogoUrl),
      };
    } catch (e) {
      console.warn('Failed to parse cached union settings', e);
    }
    return DEFAULT_UNION_SETTINGS;
  });

  const [loading, setLoading] = useState(true);

  // Subscribe to real-time updates from Firestore 'settings/unionInfo'
  useEffect(() => {
    const docRef = doc(db, 'settings', 'unionInfo');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      const savedGovt = localStorage.getItem('custom_govt_logo_base64');
      const savedUnion = localStorage.getItem('custom_union_logo_base64');
      const savedWatermark = localStorage.getItem('custom_watermark_logo_base64') || localStorage.getItem('savedWatermarkLogo');

      if (docSnap.exists()) {
        const data = docSnap.data() as Partial<UnionSettings>;
        const merged: UnionSettings = {
          ...DEFAULT_UNION_SETTINGS,
          ...data,
          govtLogoUrl: savedGovt !== null ? savedGovt : (data.govtLogoUrl || DEFAULT_UNION_SETTINGS.govtLogoUrl),
          unionLogoUrl: savedUnion !== null ? savedUnion : (data.unionLogoUrl || DEFAULT_UNION_SETTINGS.unionLogoUrl),
          watermarkLogoUrl: savedWatermark !== null ? savedWatermark : (data.watermarkLogoUrl || DEFAULT_UNION_SETTINGS.watermarkLogoUrl),
        };
        setSettings(merged);
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged));
        } catch (e) {
          // ignore localStorage errors
        }
      } else {
        // If settings doc doesn't exist yet, seed it with default union info
        setDoc(docRef, {
          ...DEFAULT_UNION_SETTINGS,
          updatedAt: new Date().toISOString()
        }, { merge: true }).catch((err) => {
          console.warn('Could not seed default settings', err);
        });
      }
      setLoading(false);
    }, (error) => {
      console.warn('Settings subscription fallback to default/cached:', error.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateSettings = async (newSettings: Partial<UnionSettings>, updatedByName?: string) => {
    // Sync logo Base64 to dedicated localStorage keys for immediate offline & refresh resilience
    try {
      if (newSettings.govtLogoUrl !== undefined) {
        if (newSettings.govtLogoUrl) {
          localStorage.setItem('custom_govt_logo_base64', newSettings.govtLogoUrl);
        } else {
          localStorage.removeItem('custom_govt_logo_base64');
        }
      }
      if (newSettings.unionLogoUrl !== undefined) {
        if (newSettings.unionLogoUrl) {
          localStorage.setItem('custom_union_logo_base64', newSettings.unionLogoUrl);
        } else {
          localStorage.removeItem('custom_union_logo_base64');
        }
      }
      if (newSettings.watermarkLogoUrl !== undefined) {
        if (newSettings.watermarkLogoUrl) {
          localStorage.setItem('custom_watermark_logo_base64', newSettings.watermarkLogoUrl);
          localStorage.setItem('savedWatermarkLogo', newSettings.watermarkLogoUrl);
        } else {
          localStorage.removeItem('custom_watermark_logo_base64');
          localStorage.removeItem('savedWatermarkLogo');
        }
      }
    } catch (e) {
      console.warn('LocalStorage error on logo sync:', e);
    }

    const updatedPayload: UnionSettings = {
      ...settings,
      ...newSettings,
      updatedAt: new Date().toISOString(),
      updatedBy: updatedByName || 'এডমিন কর্মকর্তা'
    };

    // Optimistically update React state and local cache immediately
    setSettings(updatedPayload);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedPayload));
    } catch (e) {
      // ignore
    }

    try {
      const docRef = doc(db, 'settings', 'unionInfo');
      await setDoc(docRef, updatedPayload, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'settings/unionInfo');
    }
  };

  const resetToDefault = async (updatedByName?: string) => {
    try {
      localStorage.removeItem('custom_govt_logo_base64');
      localStorage.removeItem('custom_union_logo_base64');
      localStorage.removeItem('custom_watermark_logo_base64');
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
