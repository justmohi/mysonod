import type { CertificateApplication, CitizenProfile } from '../types';
import { cleanNidNumber } from './bengali';

export const MIN_CITIZEN_ID_LENGTH = 10;

/**
 * Normalizes a Bangladesh NID / birth-registration value for identity matching.
 * The plaintext identifier is never stored in the shared profile document.
 */
export const normalizeCitizenId = (value?: string | null): string =>
  cleanNidNumber(value);

export const createCitizenProfileId = async (value?: string | null): Promise<string | null> => {
  const normalized = normalizeCitizenId(value);
  if (normalized.length < MIN_CITIZEN_ID_LENGTH) return null;

  if (!globalThis.crypto?.subtle) {
    throw new Error('এই ব্রাউজারে নিরাপদ NID profile hashing সমর্থিত নয়। HTTPS/localhost ব্যবহার করুন।');
  }

  const encoded = new TextEncoder().encode(normalized);
  const digest = await globalThis.crypto.subtle.digest('SHA-256', encoded);

  return Array.from(new Uint8Array(digest))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
};

/**
 * Only reusable citizen identity/address fields are stored.
 * Certificate-specific fields, tracking IDs, operator IDs, emails and
 * union/operator metadata are deliberately excluded.
 */
export const buildCitizenProfile = (
  data: Partial<CertificateApplication>,
  profileId: string,
  updatedAt: string
): CitizenProfile => ({
  profileId,
  applicantNameBn: data.applicantNameBn || '',
  applicantNameEn: data.applicantNameEn || '',
  fatherName: data.fatherName || '',
  fatherNameEn: data.fatherNameEn || '',
  motherName: data.motherName || '',
  motherNameEn: data.motherNameEn || '',
  spouseName: data.spouseName || '',
  spouseNameEn: data.spouseNameEn || '',
  gender: data.gender || 'male',
  maritalStatus: data.maritalStatus || '',
  mobile: data.mobile || '',
  dob: data.dob || '',
  occupation: data.occupation || '',
  holdingNo: data.holdingNo || '',
  presentVillage: data.presentVillage || data.village || '',
  presentVillageEn: data.presentVillageEn || data.villageEn || '',
  presentWard: data.presentWard || data.wardNo || '',
  presentPost: data.presentPost || data.postOffice || '',
  presentPostEn: data.presentPostEn || data.postOfficeEn || '',
  presentUpazila: data.presentUpazila || '',
  presentUpazilaEn: data.presentUpazilaEn || '',
  presentDistrict: data.presentDistrict || '',
  presentDistrictEn: data.presentDistrictEn || '',
  permanentVillage: data.permanentVillage || data.village || '',
  permanentVillageEn: data.permanentVillageEn || data.villageEn || '',
  permanentWard: data.permanentWard || data.wardNo || '',
  permanentPost: data.permanentPost || data.postOffice || '',
  permanentPostEn: data.permanentPostEn || data.postOfficeEn || '',
  permanentUpazila: data.permanentUpazila || '',
  permanentUpazilaEn: data.permanentUpazilaEn || '',
  permanentDistrict: data.permanentDistrict || '',
  permanentDistrictEn: data.permanentDistrictEn || '',
  village: data.village || data.presentVillage || '',
  villageEn: data.villageEn || data.presentVillageEn || '',
  wardNo: data.wardNo || data.presentWard || '',
  postOffice: data.postOffice || data.presentPost || '',
  postOfficeEn: data.postOfficeEn || data.presentPostEn || '',
  guardianType: data.guardianType,
  familyGuardianType: data.familyGuardianType,
  updatedAt
});

