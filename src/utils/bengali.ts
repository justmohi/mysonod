export const toBengaliNumber = (num: number | string | undefined | null): string => {
  if (num === undefined || num === null) return '০';
  const banglaDigits: Record<string, string> = {
    '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
    '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯',
    '.': '.'
  };
  return String(num).replace(/[0-9.]/g, (w) => banglaDigits[w] || w);
};

export const toEnglishNumber = (str: string | undefined | null): string => {
  if (!str) return '';
  const engDigits: Record<string, string> = {
    '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
    '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
  };
  return String(str).replace(/[০-৯]/g, (w) => engDigits[w] || w);
};

export const cleanNidNumber = (str: string | undefined | null): string => {
  if (!str) return '';
  const converted = toEnglishNumber(str);
  return converted.replace(/[^0-9]/g, '').trim();
};

export const formatCurrencyBn = (amount: number | undefined | null): string => {
  if (amount === undefined || amount === null) return '৳ ০.০০';
  const formatted = amount.toFixed(2);
  return `৳ ${toBengaliNumber(formatted)}`;
};

export const generateTrackingId = (prefix: string = 'AMB'): string => {
  const year = new Date().getFullYear();
  const random5 = Math.floor(10000 + Math.random() * 90000);
  return `EP-${year}-${prefix}-${random5}`;
};

export const formatBengaliDate = (isoString?: string): string => {
  const d = isoString ? new Date(isoString) : new Date();
  const monthsBn = [
    'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
    'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
  ];
  const day = toBengaliNumber(d.getDate());
  const month = monthsBn[d.getMonth()];
  const year = toBengaliNumber(d.getFullYear());
  return `${day} ${month}, ${year}`;
};

export const numberToWordsEn = (amount: number): string => {
  const rounded = Math.floor(amount);
  if (rounded === 0) return 'Zero Taka Only';

  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convertLessThanOneThousand = (n: number): string => {
    let result = '';
    if (n >= 100) {
      result += ones[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      result += tens[Math.floor(n / 10)] + ' ';
      n %= 10;
    }
    if (n > 0) {
      result += ones[n] + ' ';
    }
    return result.trim();
  };

  let num = rounded;
  let word = '';

  const crore = Math.floor(num / 10000000);
  num %= 10000000;
  if (crore > 0) {
    word += convertLessThanOneThousand(crore) + ' Crore ';
  }

  const lakh = Math.floor(num / 100000);
  num %= 100000;
  if (lakh > 0) {
    word += convertLessThanOneThousand(lakh) + ' Lakh ';
  }

  const thousand = Math.floor(num / 1000);
  num %= 1000;
  if (thousand > 0) {
    word += convertLessThanOneThousand(thousand) + ' Thousand ';
  }

  if (num > 0) {
    word += convertLessThanOneThousand(num) + ' ';
  }

  return word.trim() + ' Taka Only';
};

export const numberToWordsBn = (amount: number): string => {
  const rounded = Math.floor(amount);
  if (rounded === 0) return 'শূন্য টাকা মাত্র';

  const units: Record<number, string> = {
    1: 'এক', 2: 'দুই', 3: 'তিন', 4: 'চার', 5: 'পাঁচ', 6: 'ছয়', 7: 'সাত', 8: 'আট', 9: 'নয়', 10: 'দশ',
    11: 'এগারো', 12: 'বারো', 13: 'তেরো', 14: 'চৌদ্দ', 15: 'পনেরো', 16: 'ষোল', 17: 'সতেরো', 18: 'আঠারো', 19: 'উনিশ', 20: 'বিশ',
    21: 'একুশ', 22: 'বাইশ', 23: 'তেইশ', 24: 'চব্বিশ', 25: 'পঁচিশ', 26: 'ছাব্বিশ', 27: 'সাতাশ', 28: 'আঠাশ', 29: 'উনত্রিশ', 30: 'ত্রিশ',
    31: 'একত্রিশ', 32: 'বত্রিশ', 33: 'তেত্রিশ', 34: 'চৌত্রিশ', 35: 'পঁয়ত্রিশ', 36: 'ছত্রিশ', 37: 'সাঁইত্রিশ', 38: 'আটত্রিশ', 39: 'উনচল্লিশ', 40: 'চল্লিশ',
    41: 'একচল্লিশ', 42: 'বিয়াল্লিশ', 43: 'তেতাল্লিশ', 44: 'চুয়াল্লিশ', 45: 'পঁয়তাল্লিশ', 46: 'ছেচল্লিশ', 47: 'সাতচল্লিশ', 48: 'আটচল্লিশ', 49: 'উনপঞ্চাশ', 50: 'পঞ্চাশ',
    51: 'একান্ন', 52: 'বায়ান্ন', 53: 'তিপ্পান্ন', 54: 'চুয়ান্ন', 55: 'পঞ্চান্ন', 56: 'ছাপ্পান্ন', 57: 'সাতান্ন', 58: 'আটান্ন', 59: 'উনষাট', 60: 'ষাট',
    61: 'একষট্টি', 62: 'বাষট্টি', 63: 'তেষট্টি', 64: 'চৌষট্টি', 65: 'পঁয়ষট্টি', 66: 'ছেষট্টি', 67: 'সাতষট্টি', 68: 'আটষট্টি', 69: 'উনসত্তর', 70: 'সত্তর',
    71: 'একাত্তর', 72: 'বাহাত্তর', 73: 'তিয়াত্তর', 74: 'চুয়াত্তর', 75: 'পঁচাত্তর', 76: 'ছিয়াত্তর', 77: 'সাতাত্তর', 78: 'আটাত্তর', 79: 'উনআশি', 80: 'আশি',
    81: 'একাশি', 82: 'বিরাশি', 83: 'তিরাশি', 84: 'চুরাশি', 85: 'পঁচাশি', 86: 'ছিয়াশি', 87: 'সাতাশি', 88: 'আটাশি', 89: 'উননব্বই', 90: 'নব্বই',
    91: 'একানব্বই', 92: 'বিয়ানব্বই', 93: 'তিরানব্বই', 94: 'চুরানব্বই', 95: 'পঁচানব্বই', 96: 'ছিয়ানব্বই', 97: 'সাতানব্বই', 98: 'আটানব্বই', 99: 'নিরানব্বই'
  };

  const convertTwoDigits = (n: number): string => {
    if (n === 0) return '';
    return units[n] || String(n);
  };

  let num = rounded;
  let word = '';

  const crore = Math.floor(num / 10000000);
  num %= 10000000;
  if (crore > 0) {
    word += (crore > 99 ? convertTwoDigits(Math.floor(crore / 100)) + ' শত ' + convertTwoDigits(crore % 100) : convertTwoDigits(crore)) + ' কোটি ';
  }

  const lakh = Math.floor(num / 100000);
  num %= 100000;
  if (lakh > 0) {
    word += convertTwoDigits(lakh) + ' লক্ষ ';
  }

  const thousand = Math.floor(num / 1000);
  num %= 1000;
  if (thousand > 0) {
    word += convertTwoDigits(thousand) + ' হাজার ';
  }

  const hundred = Math.floor(num / 100);
  num %= 100;
  if (hundred > 0) {
    word += convertTwoDigits(hundred) + ' শত ';
  }

  if (num > 0) {
    word += convertTwoDigits(num) + ' ';
  }

  return word.trim() + ' টাকা মাত্র';
};

