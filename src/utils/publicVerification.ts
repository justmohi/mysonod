import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import type { CertificateApplication, UnionSettings, PublicVerificationRecord } from '../types';

function sanitizeApplication(application: CertificateApplication): Partial<CertificateApplication> {
  const {
    userId,
    userEmail,
    mobile,
    email,
    attachmentUrls,
    ownerPhotoUrl,
    deceasedPhotoUrl,
    completionCharge,
    completionChargeType,
    completedByUid,
    completedByEmail,
    billingMonthKey,
    latePrintFee,
    latePrintFeeChargedAt,
    fee,
    notes,
    ...safeApplication
  } = application as CertificateApplication & Record<string, unknown>;

  return safeApplication;
}

function sanitizeUnionSettings(settings: UnionSettings): UnionSettings {
  return {
    unionName: settings.unionName || '',
    unionNameEn: settings.unionNameEn || '',
    postOffice: settings.postOffice || '',
    postOfficeEn: settings.postOfficeEn || '',
    upazila: settings.upazila || '',
    upazilaEn: settings.upazilaEn || '',
    district: settings.district || '',
    districtEn: settings.districtEn || '',
    chairmanName: settings.chairmanName || '',
    chairmanNameEn: settings.chairmanNameEn || '',
    mobileNumber: '',
    officialEmail: '',
    govtLogoUrl: settings.govtLogoUrl || '',
    unionLogoUrl: settings.unionLogoUrl || '',
    watermarkLogoUrl: settings.watermarkLogoUrl || ''
  };
}

export async function ensurePublicVerification(
  application: CertificateApplication,
  settings: UnionSettings
): Promise<void> {
  if (application.status !== 'Approved' || !application.trackingId) {
    return;
  }

  const now = new Date().toISOString();

  const record: PublicVerificationRecord = {
    trackingId: application.trackingId,
    status: 'Verified',
    certificateType: application.certificateType,
    certificateTitleBn: application.certificateTitleBn,
    certificateTitleEn: application.certificateTitleEn,
    application: sanitizeApplication(application),
    unionSettings: sanitizeUnionSettings(settings),
    issuedAt: application.printDate || application.approvedAt || application.createdAt,
    verifiedAt: now,
    updatedAt: now
  };

  await setDoc(
    doc(db, 'public_verifications', application.trackingId),
    record,
    { merge: true }
  );
}
