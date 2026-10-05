import { useState, useEffect } from 'react';
import type { CertificateApplication, HeirItem } from '../types';

export const CURRENT_APPLICATION_STORAGE_KEY = 'currentApplicationData';

/**
 * Retrieve the active application data from localStorage.
 */
export const getCurrentApplicationData = (): CertificateApplication | null => {
  try {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(CURRENT_APPLICATION_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse currentApplicationData from localStorage', err);
    return null;
  }
};

/**
 * Completely wipe previous stored application data to prevent stale state bleed.
 */
export const clearCurrentApplicationData = (): void => {
  try {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(CURRENT_APPLICATION_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('currentApplicationCleared'));
  } catch (err) {
    console.error('Failed to clear currentApplicationData', err);
  }
};

/**
 * Reset and update the single unified application data in localStorage and broadcast update.
 * All optional blank fields are sanitized to "-" or clean fallbacks so neither
 * the Main Certificate nor the Application Form ever displays outdated values or undefined.
 */
export const setCurrentApplicationData = (app: CertificateApplication): CertificateApplication => {
  try {
    if (typeof window === 'undefined') return app;

    // 1. Clear previous stale data completely before writing fresh data
    localStorage.removeItem(CURRENT_APPLICATION_STORAGE_KEY);

    // 2. Sanitize and override with new submitted values
    const applicantNameBn = app.applicantNameBn?.trim() ? app.applicantNameBn.trim() : '-';
    const applicantNameEn = app.applicantNameEn?.trim() ? app.applicantNameEn.trim() : (applicantNameBn !== '-' ? applicantNameBn : '-');
    const fatherName = app.fatherName?.trim() ? app.fatherName.trim() : '-';
    const motherName = app.motherName?.trim() ? app.motherName.trim() : '-';
    const mobile = app.mobile?.trim() ? app.mobile.trim() : '-';
    const nidOrBirthReg = app.nidOrBirthReg?.trim() ? app.nidOrBirthReg.trim() : app.trackingId;
    const applicantRelation = app.applicantRelation?.trim() ? app.applicantRelation.trim() : '-';

    // Address Sanitization
    const village = app.village?.trim() || app.presentVillage?.trim() || '-';
    const wardNo = app.wardNo?.trim() || app.presentWard?.trim() || '০১';
    const postOffice = app.postOffice?.trim() || app.presentPost?.trim() || '-';
    const presentVillage = app.presentVillage?.trim() || village;
    const presentWard = app.presentWard?.trim() || wardNo;
    const presentPost = app.presentPost?.trim() || postOffice;
    const presentUpazila = app.presentUpazila?.trim() || 'মিরপুর';
    const presentDistrict = app.presentDistrict?.trim() || 'কুষ্টিয়া';

    const permanentVillage = app.permanentVillage?.trim() || presentVillage;
    const permanentWard = app.permanentWard?.trim() || presentWard;
    const permanentPost = app.permanentPost?.trim() || presentPost;
    const permanentUpazila = app.permanentUpazila?.trim() || presentUpazila;
    const permanentDistrict = app.permanentDistrict?.trim() || presentDistrict;

    // Deceased info
    const deceasedPersonName = app.deceasedPersonName?.trim() 
      ? app.deceasedPersonName.trim() 
      : (applicantNameBn !== '-' ? applicantNameBn : '-');
    const deceasedDate = app.deceasedDate?.trim() ? app.deceasedDate.trim() : '-';
    const deceasedIdType = app.deceasedIdType?.trim() ? app.deceasedIdType.trim() : '-';
    const deceasedIdNumber = app.deceasedIdNumber?.trim() ? app.deceasedIdNumber.trim() : '-';
    const deceasedFatherOrHusbandType = app.deceasedFatherOrHusbandType || 'father';
    const deceasedFatherOrHusbandName = app.deceasedFatherOrHusbandName?.trim() 
      ? app.deceasedFatherOrHusbandName.trim() 
      : (fatherName !== '-' ? fatherName : '-');

    // Heirs List Sanitization
    const heirs: HeirItem[] = (app.heirs || []).map((h, idx) => ({
      name: h.name?.trim() || '-',
      relation: h.relation?.trim() || 'ওয়ারিশ',
      nidOrBirth: h.nidOrBirth?.trim() || '-',
      dob: h.dob?.trim() || '',
      age: h.age?.trim() || '',
      remarks: h.remarks?.trim() || 'আইনগত ওয়ারিশ'
    }));

    const sanitized: CertificateApplication = {
      ...app,
      applicantNameBn,
      applicantNameEn,
      fatherName,
      motherName,
      mobile,
      nidOrBirthReg,
      applicantRelation,
      village,
      wardNo,
      postOffice,
      presentVillage,
      presentWard,
      presentPost,
      presentUpazila,
      presentDistrict,
      permanentVillage,
      permanentWard,
      permanentPost,
      permanentUpazila,
      permanentDistrict,
      deceasedPersonName,
      deceasedDate,
      deceasedIdType,
      deceasedIdNumber,
      deceasedFatherOrHusbandType,
      deceasedFatherOrHusbandName,
      heirs
    };

    localStorage.setItem(CURRENT_APPLICATION_STORAGE_KEY, JSON.stringify(sanitized));

    // 3. Broadcast custom event to notify all listening components (Print modals, forms, etc.)
    window.dispatchEvent(new CustomEvent('currentApplicationUpdated', { detail: sanitized }));

    return sanitized;
  } catch (err) {
    console.error('Failed to store currentApplicationData in localStorage', err);
    return app;
  }
};

/**
 * Custom React hook to bind to the single unified currentApplicationData state.
 * Both the Main Certificate (মূল সনদ) and Application Form (আবেদনপত্র) can use
 * this hook to ensure 100% data synchronization without stale state.
 */
export const useCurrentApplication = (initialApp?: CertificateApplication | null) => {
  const [currentApp, setCurrentApp] = useState<CertificateApplication | null>(() => {
    if (initialApp) {
      return setCurrentApplicationData(initialApp);
    }
    return getCurrentApplicationData();
  });

  useEffect(() => {
    if (initialApp) {
      const unified = setCurrentApplicationData(initialApp);
      setCurrentApp(unified);
    }
  }, [initialApp]);

  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<CertificateApplication>;
      if (customEvent.detail) {
        setCurrentApp(customEvent.detail);
      }
    };
    const handleClear = () => {
      setCurrentApp(null);
    };

    window.addEventListener('currentApplicationUpdated', handleUpdate);
    window.addEventListener('currentApplicationCleared', handleClear);

    return () => {
      window.removeEventListener('currentApplicationUpdated', handleUpdate);
      window.removeEventListener('currentApplicationCleared', handleClear);
    };
  }, []);

  const updateApp = (app: CertificateApplication) => {
    const unified = setCurrentApplicationData(app);
    setCurrentApp(unified);
    return unified;
  };

  const clearApp = () => {
    clearCurrentApplicationData();
    setCurrentApp(null);
  };

  return { currentApp, updateApp, clearApp };
};
