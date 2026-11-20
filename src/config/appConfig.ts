import { RoleDefinition, UserRoleKey } from '@/types/domain.types';

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const ROLES_MAP: Record<UserRoleKey, RoleDefinition> = {
  owner: {
    key: 'owner',
    bn: 'মালিক / এমডি',
    en: 'Owner / MD',
    desc: 'সব মডিউল, লাভ-ক্ষতি, ব্যাংক ও ইউজার কন্ট্রোল',
    color: '#0d6e4f',
    views: 'all',
  },
  manager: {
    key: 'manager',
    bn: 'ফ্যাক্টরি ম্যানেজার',
    en: 'Factory Manager',
    desc: 'অর্ডার, ফ্লোর, QC, চালান ও পার্টি (ব্যাংক ছাড়া)',
    color: '#2364aa',
    views: [
      'dash',
      'orders',
      'detail',
      'neworder',
      'jobcard',
      'entry',
      'fmsg',
      'freem',
      'qc',
      'fready',
      'challan',
      'yarn',
      'store',
      'party',
      'att',
      'profile',
      'wa',
      'subcontract',
    ],
  },
  prod: {
    key: 'prod',
    bn: 'প্রোডাকশন / ফ্লোর ইনচার্জ',
    en: 'Production Supervisor',
    desc: 'শিফট এন্ট্রি, রোল ট্যাগ, জব কার্ড ও মেশিন স্ট্যাটাস',
    color: '#c85a14',
    views: ['dash', 'orders', 'detail', 'jobcard', 'entry', 'fmsg', 'freem', 'fready', 'subcontract'],
  },
  qc: {
    key: 'qc',
    bn: 'QC ইন্সপেক্টর',
    en: 'QC Inspector',
    desc: '৪-পয়েন্ট ফ্যাব্রিক চেক, GSM/Dia টেস্ট ও রেডি গুডস রিলিজ',
    color: '#b8860b',
    views: ['qc', 'fready', 'entry', 'detail', 'jobcard'],
  },
  store: {
    key: 'store',
    bn: 'ইয়ার্ন ও স্টোর কিপার',
    en: 'Store & Gate Keeper',
    desc: 'সুতা রিসিভ/ইস্যু, নিডেল-অয়েল স্টোর ও গেট পাস চালান',
    color: '#6b4c9a',
    views: ['yarn', 'store', 'challan', 'fready', 'orders'],
  },
  acc: {
    key: 'acc',
    bn: 'হিসাবরক্ষক (Accounts)',
    en: 'Accountant',
    desc: 'বিল-ইনভয়েস, পার্টি খতিয়ান, জমা-খরচ ও বেতন শিট',
    color: '#1b4332',
    views: ['dash', 'bill', 'billdoc', 'ledger', 'acc', 'party', 'att', 'orders', 'pdash'],
  },
  vendor: {
    key: 'vendor',
    bn: 'বায়ার / ভেন্ডর পোর্টাল',
    en: 'Buyer / Party Client',
    desc: 'শুধু নিজের অর্ডার, সুতা, রেডি মাল, চালান ও বিল ট্র্যাকিং',
    color: '#c85a14',
    views: ['vendor'],
  },
  supplier: {
    key: 'supplier',
    bn: 'সাপ্লায়ার পোর্টাল',
    en: 'Supplier Portal',
    desc: 'সুতা, নিডেল, অয়েল ও অ্যাক্সেসরিজ সাপ্লায়ার ড্যাশবোর্ড, ক্যাটালগ ও RFQ',
    color: '#2364aa',
    views: ['supplier'],
  },
};

export const PACKAGE_TIERS = [
  {
    id: 'starter',
    name: 'স্টার্টার মিল (১–৬ মেশিন)',
    monthlyTk: 999,
    annualTk: 799,
    desc: 'ছোট সাব-কন্ট্রাক্ট নিটিং ফ্যাক্টরির জন্য',
  },
  {
    id: 'pro',
    name: 'প্রো নিটিং মিল (৭–২০ মেশিন)',
    monthlyTk: 2499,
    annualTk: 1999,
    desc: 'মাঝারি ফ্যাক্টরি — ফ্লোর + অ্যাকাউন্টস + ভেন্ডর পোর্টাল',
  },
  {
    id: 'enterprise',
    name: 'কম্পোজিট ও মাল্টি-ইউনিট (২১+ মেশিন)',
    monthlyTk: 4999,
    annualTk: 3999,
    desc: 'বড় নিটিং ইউনিট ও গ্রুপ অব কোম্পানিজের জন্য',
  },
];

