import {
  doc,
  runTransaction,
  type Transaction as FirestoreTransaction
} from 'firebase/firestore';
import { db } from '../firebase';
import type { CertificateApplication, Transaction, UserProfile } from '../types';

export const FIRST_MONTH_FREE_LIMIT = 100;
export const FIRST_MONTH_OVERAGE_PRICE = 1;
export const MONTHLY_CERTIFICATE_PRICE = 2;
export const LATE_PRINT_PRICE = 2;

const pad2 = (value: number) => String(value).padStart(2, '0');

export const getBillingMonthKey = (date = new Date()): string =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}`;

export const addCalendarMonths = (date: Date, months: number): Date => {
  const result = new Date(date.getTime());
  const day = result.getDate();
  result.setDate(1);
  result.setMonth(result.getMonth() + months);
  const lastDay = new Date(
    result.getFullYear(),
    result.getMonth() + 1,
    0
  ).getDate();
  result.setDate(Math.min(day, lastDay));
  return result;
};

export const isAtLeastThreeMonthsOld = (
  completedAt: string,
  now = new Date()
): boolean => {
  const completedDate = new Date(completedAt);
  if (Number.isNaN(completedDate.getTime())) return false;
  return now.getTime() >= addCalendarMonths(completedDate, 3).getTime();
};

export const getOperatorCompletionCharge = (
  operator: UserProfile,
  now = new Date()
): {
  charge: number;
  monthKey: string;
  completedCount: number;
  billingStartAt: string;
  chargeType: 'free' | 'month1_overage' | 'monthly';
} => {
  const currentMonthKey = getBillingMonthKey(now);
  const billingStartAt = operator.billingStartAt || now.toISOString();
  const billingStartDate = new Date(billingStartAt);
  const startMonthKey = getBillingMonthKey(
    Number.isNaN(billingStartDate.getTime()) ? now : billingStartDate
  );

  const isFirstBillingMonth = currentMonthKey === startMonthKey;
  const previousCount =
    operator.billingMonthKey === currentMonthKey
      ? Number(operator.billingMonthCompletedCount || 0)
      : 0;
  const completedCount = previousCount + 1;

  if (isFirstBillingMonth) {
    return {
      charge: completedCount <= FIRST_MONTH_FREE_LIMIT
        ? 0
        : FIRST_MONTH_OVERAGE_PRICE,
      monthKey: currentMonthKey,
      completedCount,
      billingStartAt,
      chargeType: completedCount <= FIRST_MONTH_FREE_LIMIT
        ? 'free'
        : 'month1_overage'
    };
  }

  return {
    charge: MONTHLY_CERTIFICATE_PRICE,
    monthKey: currentMonthKey,
    completedCount,
    billingStartAt,
    chargeType: 'monthly'
  };
};

export interface OperatorChargeResult {
  charge: number;
  monthKey: string;
  completedCount: number;
  chargeType: 'free' | 'month1_overage' | 'monthly';
  newBalance: number;
};

export const applyOperatorCompletionChargeInTransaction = async (
  transaction: FirestoreTransaction,
  operatorUid: string,
  applicationId: string,
  applicationTitle: string,
  now = new Date()
): Promise<OperatorChargeResult> => {
  const userDocRef = doc(db, 'users', operatorUid);
  const userSnap = await transaction.get(userDocRef);

  if (!userSnap.exists()) {
    throw new Error('উদ্যোক্তার প্রোফাইল পাওয়া যায়নি।');
  }

  const operator = userSnap.data() as UserProfile;
  if (operator.role !== 'operator') {
    throw new Error('এই billing rule শুধু ইউনিয়ন উদ্যোক্তার জন্য প্রযোজ্য।');
  }

  const pricing = getOperatorCompletionCharge(operator, now);
  const currentBalance = Number(operator.balance || 0);

  if (currentBalance < pricing.charge) {
    throw new Error(
      `উদ্যোক্তার ব্যালেন্সে পর্যাপ্ত টাকা নেই। এই সনদের usage charge ৳${pricing.charge}।`
    );
  }

  const newBalance = Number(
    (currentBalance - pricing.charge).toFixed(2)
  );

  transaction.update(userDocRef, {
    balance: newBalance,
    billingStartAt: pricing.billingStartAt,
    billingMonthKey: pricing.monthKey,
    billingMonthCompletedCount: pricing.completedCount,
    billingTotalCompleted:
      Number(operator.billingTotalCompleted || 0) + 1,
    updatedAt: now.toISOString()
  });

  const txId = `tx_certificate_usage_${applicationId}`;
  const txDocRef = doc(db, 'transactions', txId);
  const billingTx: Transaction = {
    id: txId,
    userId: operatorUid,
    type: 'certificate_usage_fee',
    amount: pricing.charge,
    balanceAfter: newBalance,
    description:
      pricing.chargeType === 'free'
        ? `সনদ সম্পন্ন #${pricing.completedCount} — প্রথম ১০০টি ফ্রি`
        : pricing.chargeType === 'month1_overage'
          ? `প্রথম মাসের ১০০টি ফ্রি সীমার পর সনদ #${pricing.completedCount} — ৳১ usage charge`
          : `মাসিক সনদ usage charge — ${applicationTitle}`,
    referenceId: applicationId,
    createdAt: now.toISOString()
  };

  transaction.set(txDocRef, billingTx);

  return {
    charge: pricing.charge,
    monthKey: pricing.monthKey,
    completedCount: pricing.completedCount,
    chargeType: pricing.chargeType,
    newBalance
  };
};

export const chargeOperatorForCompletion = async (
  operatorUid: string,
  applicationId: string,
  applicationTitle: string,
  now = new Date()
): Promise<OperatorChargeResult> => {
  let result: OperatorChargeResult | null = null;

  await runTransaction(db, async (transaction) => {
    result = await applyOperatorCompletionChargeInTransaction(
      transaction,
      operatorUid,
      applicationId,
      applicationTitle,
      now
    );
  });

  if (!result) {
    throw new Error('সনদ billing সম্পন্ন করা যায়নি।');
  }

  return result;
};

export const chargeLatePrintFee = async (
  operatorUid: string,
  application: CertificateApplication,
  now = new Date()
): Promise<{
  charged: boolean;
  printDate: string;
  fee: number;
  newBalance: number;
}> => {
  const applicationRef = doc(db, 'applications', application.id);
  const userRef = doc(db, 'users', operatorUid);
  const txId = `tx_late_print_${application.id}`;
  const txRef = doc(db, 'transactions', txId);

  let result: {
    charged: boolean;
    printDate: string;
    fee: number;
    newBalance: number;
  } | null = null;

  await runTransaction(db, async (transaction) => {
    const [applicationSnap, userSnap] = await Promise.all([
      transaction.get(applicationRef),
      transaction.get(userRef)
    ]);

    if (!applicationSnap.exists()) {
      throw new Error('সনদের আবেদন পাওয়া যায়নি।');
    }
    if (!userSnap.exists()) {
      throw new Error('উদ্যোক্তার প্রোফাইল পাওয়া যায়নি।');
    }

    const liveApp = applicationSnap.data() as CertificateApplication;
    const operator = userSnap.data() as UserProfile;

    if (liveApp.printDate || liveApp.latePrintFeeChargedAt) {
      result = {
        charged: false,
        printDate: liveApp.printDate || '',
        fee: Number(liveApp.latePrintFee || 0),
        newBalance: Number(operator.balance || 0)
      };
      return;
    }

    if (!liveApp.completedAt || !isAtLeastThreeMonthsOld(liveApp.completedAt, now)) {
      result = {
        charged: false,
        printDate: '',
        fee: 0,
        newBalance: Number(operator.balance || 0)
      };
      return;
    }

    if (operator.role !== 'operator') {
      result = {
        charged: false,
        printDate: liveApp.printDate || '',
        fee: 0,
        newBalance: Number(operator.balance || 0)
      };
      return;
    }

    const currentBalance = Number(operator.balance || 0);
    if (currentBalance < LATE_PRINT_PRICE) {
      throw new Error(
        `৩ মাস পর পুনঃপ্রিন্টের জন্য ব্যালেন্সে ৳${LATE_PRINT_PRICE} থাকা প্রয়োজন।`
      );
    }

    const newBalance = Number(
      (currentBalance - LATE_PRINT_PRICE).toFixed(2)
    );
    const nowIso = now.toISOString();

    transaction.update(userRef, {
      balance: newBalance,
      updatedAt: nowIso
    });

    transaction.update(applicationRef, {
      printDate: nowIso,
      latePrintFeeChargedAt: nowIso,
      latePrintFee: LATE_PRINT_PRICE
    });

    const lateTx: Transaction = {
      id: txId,
      userId: operatorUid,
      type: 'late_print_fee',
      amount: LATE_PRINT_PRICE,
      balanceAfter: newBalance,
      description: '৩ মাস পর সনদ পুনঃপ্রিন্ট fee',
      referenceId: application.id,
      createdAt: nowIso
    };

    transaction.set(txRef, lateTx);

    result = {
      charged: true,
      printDate: nowIso,
      fee: LATE_PRINT_PRICE,
      newBalance
    };
  });

  if (!result) {
    throw new Error('পুনঃপ্রিন্ট billing সম্পন্ন করা যায়নি।');
  }

  return result;
};
