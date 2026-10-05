export interface AddressFields {
  holdingNo?: string;
  village: string;
  villageEn?: string;
  wardNo: string;
  postOffice: string;
  postOfficeEn?: string;
  upazila: string;
  upazilaEn?: string;
  district: string;
  districtEn?: string;
}

export interface DualAddressState {
  sameAsPresent: boolean;
  present: AddressFields;
  permanent: AddressFields;
}

/**
 * Copies all Present Address fields into Permanent Address fields
 */
export const syncPermanentFromPresent = (present: AddressFields): AddressFields => ({
  holdingNo: present.holdingNo || '',
  village: present.village || '',
  villageEn: present.villageEn || '',
  wardNo: present.wardNo || '০১',
  postOffice: present.postOffice || '',
  postOfficeEn: present.postOfficeEn || '',
  upazila: present.upazila || '',
  upazilaEn: present.upazilaEn || '',
  district: present.district || '',
  districtEn: present.districtEn || ''
});
