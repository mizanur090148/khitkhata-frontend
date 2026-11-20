import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { KnittedHeroCanvas } from '@/components/common/KnittedHeroCanvas';

const Q_DATA = [
  {
    k: 'fac',
    c: 'var(--c-fac)',
    a: 'অন্যের সুতা নিয়ে আমার মেশিনে কাপড় বুনি',
    t: 'আপনি ফ্যাক্টরি',
    p: [
      'অ্যাকাউন্ট খুলে আপনার মেশিনগুলো যোগ করুন',
      'যেসব ভেন্ডর কাজ দেয় তাদের পার্টি হিসেবে যোগ করুন',
      'প্রথম অর্ডারটা New Order Entry দিয়ে তুলুন',
    ],
    b: 'ফ্যাক্টরি পোর্টাল খুলুন',
  },
  {
    k: 'ven',
    c: 'var(--c-ven)',
    a: 'বিভিন্ন নিটিং ফ্যাক্টরিতে কাজ দিই (কম্পোজিট / বায়িং হাউস)',
    t: 'আপনি ভেন্ডর',
    p: [
      'অ্যাকাউন্ট খুলুন, আপনার প্রতিষ্ঠানের নাম দিন',
      'যেসব ফ্যাক্টরিতে কাজ দেন তাদের মোবাইল নম্বরে আমন্ত্রণ পাঠান',
      'ড্যাশবোর্ডে সব অর্ডার, প্রোডাকশন আর QC একসাথে দেখুন',
    ],
    b: 'ভেন্ডর পোর্টাল খুলুন',
  },
  {
    k: 'sup',
    c: 'var(--c-sup)',
    a: 'নিটিং মেশিন, নিডল, অয়েল বা পার্টস বিক্রি করি',
    t: 'আপনি সাপ্লায়ার',
    p: [
      'সাপ্লায়ার পেজে আবেদন করুন, কোন পণ্য দেন জানান',
      'যাচাইয়ের পর অনুমোদিত তালিকায় নাম উঠবে',
      'ফ্যাক্টরির কোটেশন অনুরোধ আসা শুরু হবে',
    ],
    b: 'সাপ্লায়ার পেজে যান',
  },
  {
    k: 'jobs',
    c: 'var(--yarn)',
    a: 'নিটিংয়ে চাকরি খুঁজছি',
    t: 'চাকরির খোঁজ',
    p: [
      'চাকরির তালিকা দেখুন: অপারেটর, সুপারভাইজার, QC',
      'পছন্দের পদে মোবাইল নম্বর দিয়ে আবেদন করুন',
      'ফ্যাক্টরি সরাসরি যোগাযোগ করবে',
    ],
    b: 'চাকরির তালিকা দেখুন',
  },
];

const STEPS_DATA = {
  fac: {
    n: 'ফ্যাক্টরি',
    c: 'var(--c-fac)',
    s: [
      ['অ্যাকাউন্ট খুলুন', 'মোবাইল নম্বর দিয়ে খুলুন, মেশিনের তালিকা দিন। প্রথম মাস ফ্রি।'],
      ['ভেন্ডর যোগ করুন', 'যেসব কম্পোজিট কাজ দেয়, তাদের পার্টি হিসেবে যোগ করুন। ভেন্ডরের লোককে লগইনও দিতে পারেন।'],
      ['অর্ডার তুলুন', 'New Order Entry-তে অংশ ধরে ফেব্রিক, সুতা আর মেশিন বসান।'],
      ['শিফটে এন্ট্রি, মাস শেষে বিল', 'প্রতি শিফটে প্রোডাকশন লিখুন। কাজ শেষে এক ক্লিকে বিল আর ভাউচার।'],
    ],
    b: 'ফ্যাক্টরি পোর্টাল দেখুন',
  },
  ven: {
    n: 'ভেন্ডর',
    c: 'var(--c-ven)',
    s: [
      ['অ্যাকাউন্ট খুলুন', 'প্রতিষ্ঠানের নাম আর আপনার পদবি দিয়ে খুলুন।'],
      ['ফ্যাক্টরিগুলো যুক্ত করুন', 'যেসব ফ্যাক্টরিতে কাজ দেন, তাদের নম্বরে আমন্ত্রণ পাঠান। তারা রাজি হলেই যুক্ত।'],
      ['এক ড্যাশবোর্ডে সব', 'কোন ফ্যাক্টরিতে কত মেশিন চলছে, কোন অর্ডার দেরি করবে, এক নজরে।'],
      ['QC সাইন আর রিপোর্ট', 'রোল ধরে নিজের মত দিন, যেকোনো রিপোর্ট Excel-এ নিন।'],
    ],
    b: 'ভেন্ডর পোর্টাল দেখুন',
  },
  sup: {
    n: 'সাপ্লায়ার',
    c: 'var(--c-sup)',
    s: [
      ['আবেদন করুন', 'কোন পণ্য দেন, কোন ব্র্যান্ডের ডিলার, জানান।'],
      ['যাচাই', 'আমরা কাগজপত্র আর ঠিকানা যাচাই করি।'],
      ['তালিকায় নাম', 'অনুমোদিত সাপ্লায়ার তালিকায় আপনার নাম ওঠে, মেশিন সাপ্লায়ার সবার আগে।'],
      ['অনুরোধ পান', 'ফ্যাক্টরি কোটেশন চাইলে সরাসরি আপনার কাছে আসে।'],
    ],
    b: 'সাপ্লায়ার পেজে যান',
  },
};

const PLANS_DATA = [
  {
    k: 's',
    n: 'স্টার্টার',
    mc: '১ – ১০টা মেশিন',
    price: 1000,
    d: 'ছোট ফ্যাক্টরি, যারা খাতা থেকে প্রথমবার সফটওয়্যারে আসছেন।',
    h: 'যা যা পাবেন',
    f: [
      ['১০টা', 'পর্যন্ত মেশিন'],
      ['যত খুশি', 'স্টাফ লগইন'],
      ['অর্ডার,', 'প্রোডাকশন এন্ট্রি ও জব কার্ড'],
      ['রোল ধরে', 'QC — ফ্যাক্টরি ও ভেন্ডর দুই পক্ষের সাইন'],
      ['ডেলিভারি চালান', 'ও বিল, PDF আর WhatsApp-এ'],
      ['পার্টি লেজার', '— কার কাছে কত বাকি'],
      ['সুতা', 'ট্র্যাকার ও ব্যালেন্স'],
      ['ভেন্ডরকে', 'দৈনিক রিপোর্ট নিজে থেকে'],
      ['QR রোল স্টিকার,', 'স্টোর ও পার্টস'],
      ['WhatsApp', 'সাপোর্ট'],
    ],
    note: 'হাজিরা, বেতন, PI বা ব্যাংক-LC দরকার হলে গ্রোথ প্যাকেজ নিন — মেশিন ১০টার কম হলেও নেওয়া যায়।',
  },
  {
    k: 'g',
    n: 'গ্রোথ',
    mc: '১১ – ২৫টা মেশিন',
    price: 1500,
    d: 'নিটখাতার সব ফিচার, পুরো অফিসের হিসাবসহ।',
    h: 'স্টার্টারের সবকিছু, সাথে',
    f: [
      ['২৫টা', 'পর্যন্ত মেশিন'],
      ['হাজিরা', 'ও বেতন'],
      ['প্রোফর্মা ইনভয়েস', '(PI) তৈরি'],
      ['ব্যাংক ও LC', '-র হিসাব'],
      ['খরচ', 'ও ক্যাশ বুক'],
      ['আপনার লোগো', 'দিয়ে চালান, বিল ও PI'],
      ['Excel এক্সপোর্ট', 'ও মাসিক রিপোর্ট'],
      ['পদ অনুযায়ী', 'অনুমতি — কে কী দেখবে, কী বদলাবে'],
      ['একাধিক ইউনিট', 'এক অ্যাকাউন্টে'],
      ['ভেরিফায়েড ব্যাজ', '— ভেন্ডরের সার্চে আগে দেখাবে'],
    ],
  },
  {
    k: 'p',
    n: 'প্রো',
    mc: '২৬ – ৫০টা মেশিন',
    price: 2000,
    gift: 1,
    d: 'নিটখাতার সব ফিচার, সাথে বিশেষ সাপোর্ট।',
    h: 'গ্রোথের সব ফিচার, সাথে',
    f: [
      ['৫০টা', 'পর্যন্ত মেশিন'],
      ['অগ্রাধিকার', 'সাপোর্ট — আপনার প্রশ্নের উত্তর আগে'],
      ['ফোনে', 'সরাসরি সাপোর্ট'],
      ['ভিডিও কলে', 'নতুন স্টাফদের ট্রেনিং'],
    ],
  },
  {
    k: 'e',
    n: 'এন্টারপ্রাইজ',
    mc: '৫০টার বেশি মেশিন',
    price: 2500,
    gift: 1,
    d: 'নিটখাতার সব ফিচার, সাথে সবচেয়ে বেশি যত্ন।',
    h: 'প্রো-র সবকিছু, সাথে',
    f: [
      ['যত খুশি', 'মেশিন'],
      ['নিজস্ব', 'সাপোর্ট নম্বর — সবার আগে উত্তর'],
      ['যখন দরকার', 'ভিডিও কলে স্টাফ ট্রেনিং'],
      ['নতুন ফিচার', 'সবার আগে আপনার কাছে'],
    ],
  },
];

const SERVICES_LIST = [
  {
    g: 'অর্ডারের পথে',
    id: 'truck',
    c: 'var(--c-fac)',
    t: 'নিটখাতা ট্রান্সপোর্ট',
    o: 'সুতা আনা আর কাপড় ফেরত দেওয়ার গাড়ি, অ্যাপ থেকেই',
    b: [
      'পিকআপ বা কাভার্ড ভ্যান বুকিং, ভাড়া আগে থেকে জানা',
      'গাড়ি কোথায় আছে ম্যাপে দেখা',
      'কত ব্যাগ সুতা উঠল-নামল, চালান নিজে থেকে মিলবে',
    ],
    f: ['ফ্যাক্টরি', 'ভেন্ডর'],
  },
  {
    g: 'অর্ডারের পথে',
    id: 'chat',
    c: 'var(--c-ven)',
    t: 'নিটখাতা মেসেজ',
    o: 'প্রতিটা অর্ডারের আলাদা আলোচনা, এক জায়গায়',
    b: [
      'অর্ডার ধরে গ্রুপ: ফ্যাক্টরি, মার্চেন্ডাইজার, দুই পক্ষের QC',
      'কাপড়ের সমস্যার ছবি আর ভয়েস মেসেজ',
      'পুরনো কথা খুঁজতে WhatsApp ঘাঁটতে হবে না',
    ],
    f: ['ফ্যাক্টরি', 'ভেন্ডর', 'সাপ্লায়ার'],
  },
  {
    g: 'অর্ডারের পথে',
    id: 'search',
    c: 'var(--c-par)',
    t: 'খালি মেশিন খুঁজুন',
    o: 'কোথায় কোন মেশিন খালি, ডায়া-গেজ দিয়ে খুঁজুন',
    b: [
      'ফ্যাক্টরি জানাবে কোন মেশিন কবে থেকে খালি',
      'ভেন্ডর ডায়া, গেজ, এলাকা দিয়ে খুঁজে সরাসরি কাজ দেবে',
      'মেশিন বসে থাকবে না, দশ জায়গায় ফোনও লাগবে না',
    ],
    f: ['ফ্যাক্টরি', 'ভেন্ডর'],
  },
  {
    g: 'কেনাবেচা',
    id: 'yarn',
    c: 'var(--c-sup)',
    t: 'সুতার বাজারদর ও কেনাবেচা',
    o: 'কাউন্ট ধরে প্রতিদিনের সুতার দাম, আর বেঁচে যাওয়া সুতা বিক্রি',
    b: [
      '30/1, 26/1, CVC, পলিয়েস্টার: কাউন্ট ধরে দামের ওঠানামা',
      'অর্ডার শেষে বেঁচে যাওয়া সুতা বা স্টক লট বিক্রি',
      'কেনার আগে লট আর ব্র্যান্ড দেখে নেওয়া',
    ],
    f: ['ফ্যাক্টরি', 'ভেন্ডর', 'সাপ্লায়ার'],
  },
  {
    g: 'কেনাবেচা',
    id: 'machine',
    c: 'var(--c-sup)',
    t: 'পুরাতন মেশিন কেনাবেচা',
    o: 'ব্যবহৃত সার্কুলার মেশিন কেনা আর বিক্রি',
    b: [
      'ব্র্যান্ড, ডায়া, গেজ, বছর আর দাম দিয়ে বিজ্ঞাপন',
      'অনুমোদিত সাপ্লায়ারের যাচাই করা মেশিন আলাদা চিহ্নে',
      'মেশিন দেখতে যাওয়ার সময় ঠিক করা',
    ],
    f: ['ফ্যাক্টরি', 'সাপ্লায়ার'],
  },
  {
    g: 'ফ্যাক্টরি চালাতে',
    id: 'wrench',
    c: 'var(--c-fac)',
    t: 'মেকানিক ডাকুন',
    o: 'মেশিন বন্ধ হলে কাছের মেকানিক বা সার্ভিস টিম',
    b: [
      'মেশিন আর সমস্যা লিখে কাছের মেকানিক বুক',
      'দরকারি স্পেয়ার পার্টস সাথে সাথে অর্ডার',
      'মেশিন কতক্ষণ বন্ধ ছিল, তার হিসাব থাকবে',
    ],
    f: ['ফ্যাক্টরি', 'সাপ্লায়ার'],
  },
  {
    g: 'ফ্যাক্টরি চালাতে',
    id: 'cap',
    c: 'var(--c-ven)',
    t: 'নিটখাতা শিক্ষা',
    o: 'অপারেটর, মেকানিক আর QC-র জন্য বাংলায় কোর্স',
    b: [
      'ছোট ভিডিওতে মেশিন চালানো, গেজ বদলানো, ফল্ট চেনা',
      'কোর্স শেষে সার্টিফিকেট',
      'চাকরির আবেদনে সার্টিফিকেটের আলাদা চিহ্ন',
    ],
    f: ['শ্রমিক', 'ফ্যাক্টরি'],
  },
  {
    g: 'ফ্যাক্টরি চালাতে',
    id: 'wallet',
    c: 'var(--c-par)',
    t: 'শ্রমিকের বেতন মোবাইলে',
    o: 'হাজিরা থেকে হিসাব করে বেতন সরাসরি মোবাইল ওয়ালেটে',
    b: [
      'হাজিরা আর ওভারটাইম থেকে বেতন নিজে থেকে হিসাব',
      'এক ক্লিকে সবার বেতন পাঠানো',
      'প্রত্যেক শ্রমিক মোবাইলে বেতনের স্লিপ পাবেন',
    ],
    f: ['ফ্যাক্টরি'],
  },
  {
    g: 'ফ্যাক্টরি চালাতে',
    id: 'bell',
    c: 'var(--c-sup)',
    t: 'লাইসেন্স রিমাইন্ডার',
    o: 'কাগজপত্রের মেয়াদ শেষের আগেই মনে করিয়ে দেবে',
    b: [
      'ট্রেড লাইসেন্স, ফায়ার লাইসেন্স, বয়লার সার্টিফিকেট',
      'মেয়াদ শেষের ৩০ দিন আগে SMS আর অ্যাপে নোটিশ',
      'সব কাগজের স্ক্যান কপি এক জায়গায়',
    ],
    f: ['ফ্যাক্টরি'],
  },
];

const G_DESC: Record<string, string> = {
  'অর্ডারের পথে': 'সুতা আসা থেকে কাপড় ফেরত যাওয়া পর্যন্ত যা যা লাগে',
  'কেনাবেচা': 'সুতা আর মেশিনের বাজার, নিটিংয়ের মানুষদের মধ্যেই',
  'ফ্যাক্টরি চালাতে': 'মেশিন, মানুষ আর কাগজপত্র সামলানো সহজ করতে',
};

const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
const toBn = (n: number | string) => String(n).replace(/\d/g, (d) => BN_DIGITS[Number(d)]);
const toTkBn = (n: number) => '৳' + Math.round(n).toLocaleString('en-IN').replace(/\d/g, (d) => BN_DIGITS[Number(d)]);

export const MarketingPortal: React.FC = () => {
  const { setScreen, setRole, jobs, applyForJob, addToast } = useApp();

  // Route: top | jobs | services
  const [activeTab, setActiveTab] = useState<'top' | 'jobs' | 'services'>('top');

  // Quiz State
  const [qSel, setQSel] = useState<number | null>(null);

  // Steps State
  const [sTab, setSTab] = useState<'fac' | 'ven' | 'sup'>('fac');

  // Pricing State
  const [prYr, setPrYr] = useState<boolean>(false);

  // Services View State
  const [svOpen, setSvOpen] = useState<number | null>(null);
  const [svDone, setSvDone] = useState<Set<number>>(new Set());
  const [svPhone, setSvPhone] = useState<string>('');

  // Jobs Filter State
  const [jCat, setJCat] = useState<string>('সব');
  const [jArea, setJArea] = useState<string>('সব');
  const [jSearch, setJSearch] = useState<string>('');
  const [jApplyIdx, setJApplyIdx] = useState<number | null>(null);
  const [applierName, setApplierName] = useState('');
  const [applierPhone, setApplierPhone] = useState('');
  const [applierExp, setApplierExp] = useState('');

  // Sync hash change
  useEffect(() => {
    const handleHash = () => {
      const h = window.location.hash;
      if (h === '#jobs') setActiveTab('jobs');
      else if (h === '#services') setActiveTab('services');
      else setActiveTab('top');
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const goTo = (screenName: 'auth' | 'factory' | 'vendor' | 'supplier', roleKey?: 'owner' | 'vendor' | 'supplier') => {
    if (roleKey) setRole(roleKey);
    setScreen(screenName);
  };

  const currentQ = qSel !== null ? Q_DATA[qSel] : null;
  const currentStepData = STEPS_DATA[sTab];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Strip */}
      <div className="strip">
        <div className="wrap">
          <span>বাংলাদেশের নিটিং ফ্যাক্টরির জন্য বানানো প্রথম প্ল্যাটফর্ম</span>
          <span>ফ্যাক্টরির জন্য <b>প্রথম মাস ফ্রি</b></span>
        </div>
      </div>

      {/* Main Sticky Header */}
      <header className="site-header">
        <div className="wrap">
          <a
            className="brand"
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              window.location.hash = '#top';
              setActiveTab('top');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <span className="logo">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                <path d="M4 8c4 0 4 8 8 8s4-8 8-8" />
                <path d="M4 14c4 0 4 6 8 6s4-6 8-6" opacity=".6" />
                <path d="M4 3c4 0 4 7 8 7s4-7 8-7" opacity=".35" />
              </svg>
            </span>
            <b>নিটখাতা</b>
          </a>

          <nav className="main" aria-label="প্রধান মেনু">
            <a
              href="#roles"
              onClick={() => {
                setActiveTab('top');
                const el = document.getElementById('roles');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              ফ্যাক্টরি
            </a>
            <a
              href="#roles"
              onClick={() => {
                setActiveTab('top');
                const el = document.getElementById('roles');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              ভেন্ডর
            </a>
            <a
              href="#roles"
              onClick={() => {
                setActiveTab('top');
                const el = document.getElementById('roles');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              সাপ্লায়ার
            </a>
            <a
              id="nJobs"
              className={activeTab === 'jobs' ? 'on' : ''}
              href="#jobs"
              onClick={(e) => {
                e.preventDefault();
                window.location.hash = '#jobs';
                setActiveTab('jobs');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              চাকরি
            </a>
            <a
              id="nSvc"
              className={activeTab === 'services' ? 'on' : ''}
              href="#services"
              onClick={(e) => {
                e.preventDefault();
                window.location.hash = '#services';
                setActiveTab('services');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              নিটখাতা সার্ভিস
            </a>
            <a
              href="#pricing"
              onClick={() => {
                setActiveTab('top');
                const el = document.getElementById('pricing');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              দাম
            </a>
          </nav>

          <div className="hbtn">
            <button className="btn" type="button" onClick={() => goTo('auth')}>
              লগইন
            </button>
            <a
              className="btn pri"
              href="#guide"
              onClick={() => {
                setActiveTab('top');
                const el = document.getElementById('guide');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              শুরু করুন
            </a>
          </div>
        </div>
      </header>

      {/* ===================== VIEW 1: HOME PAGE (#top) ===================== */}
      {activeTab === 'top' && (
        <main id="top">
          {/* Hero Section */}
          <section className="hero">
            <div className="wrap">
              <div>
                <h1>
                  নিটিংয়ের পুরো কাজ,<br />
                  <em>এক খাতায়।</em>
                </h1>
                <p className="lead">
                  ভেন্ডর অর্ডার দেয়, ফ্যাক্টরি কাপড় বোনে, সাপ্লায়ার মেশিন চালু রাখে। এতদিন এই তিন পক্ষের হিসাব ছিল
                  খাতায়, এক্সেলে আর ফোনে। নিটখাতায় সবাই একই তথ্য দেখে, যার যতটুকু দরকার।
                </p>
                <div className="cta">
                  <a
                    className="btn lt"
                    href="#guide"
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById('guide')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    আমি কোনটা, বুঝিয়ে দিন
                  </a>
                  <button className="btn gh" type="button" onClick={() => goTo('auth')}>
                    লগইন করুন
                  </button>
                </div>
                <div className="hfacts">
                  <div>
                    <b>৩ পক্ষ</b>
                    <span>ফ্যাক্টরি, ভেন্ডর, সাপ্লায়ার</span>
                  </div>
                  <div>
                    <b>১ মাস</b>
                    <span>ফ্যাক্টরির জন্য ফ্রি ট্রায়াল</span>
                  </div>
                  <div>
                    <b>২ সাইন</b>
                    <span>প্রতিটা রোলে দুই পক্ষের QC</span>
                  </div>
                  <div>
                    <b>বাংলায়</b>
                    <span>মোবাইল থেকেই চলে</span>
                  </div>
                </div>
              </div>

              {/* Knitted Canvas Stage with Animated Thread and Chips */}
              <div className="stage" aria-hidden="true">
                <KnittedHeroCanvas />
                <div className="chip c1">
                  <i style={{ background: '#2F5BEA' }}></i>M-07 চলছে · <b>186 kg</b>
                </div>
                <div className="chip c2">
                  <i style={{ background: '#16A34A' }}></i>QC · দুই পক্ষ একমত
                </div>
                <div className="chip c3">
                  <i style={{ background: '#D97706' }}></i>সুতা লট <b>SQ-88419</b>
                </div>
              </div>
            </div>
          </section>

          {/* Section: Who are you (#roles) */}
          <section id="roles">
            <div className="wrap">
              <div className="sh">
                <span className="eyebrow">আপনি কে?</span>
                <h2>নিটখাতা তিন ধরনের মানুষের জন্য</h2>
                <p>প্রত্যেকে নিজের পোর্টালে ঢোকে, নিজের কাজের জিনিসটুকু দেখে। আপনার কোনটা মেলে, বেছে নিন।</p>
              </div>

              <div className="roles">
                {/* 1. Factory */}
                <article className="role" style={{ ['--rc' as any]: 'var(--c-fac)' }}>
                  <span className="ic">
                    <svg viewBox="0 0 24 24">
                      <path d="M3 21V9l6 4V9l6 4V5h6v16z" />
                      <path d="M7 17h2M12 17h2M17 17h2" />
                    </svg>
                  </span>
                  <h3>ফ্যাক্টরি</h3>
                  <p className="who">যাদের সার্কুলার নিটিং মেশিন আছে, অন্যের সুতা নিয়ে কাপড় বোনেন</p>
                  <ul>
                    <li>সার্কুলার আর ফ্ল্যাট নিট (কলার-কাফ), গ্রে আর Y/D</li>
                    <li>অংশ ধরে অর্ডার, মেশিন আর সুতা</li>
                    <li>প্রতি শিফটে মোবাইলে প্রোডাকশন</li>
                    <li>ভেন্ডর-অনুযায়ী বিল, ভাউচার, লেজার</li>
                  </ul>
                  <button
                    className="btn pri"
                    style={{ marginTop: 4 }}
                    type="button"
                    onClick={() => goTo('factory', 'owner')}
                  >
                    ফ্যাক্টরি পোর্টাল
                  </button>
                </article>

                {/* 2. Vendor */}
                <article className="role" style={{ ['--rc' as any]: 'var(--c-ven)' }}>
                  <span className="ic">
                    <svg viewBox="0 0 24 24">
                      <path d="M4 7h16v13H4z" />
                      <path d="M8 7V4h8v3" />
                      <path d="M4 12h16" />
                    </svg>
                  </span>
                  <h3>ভেন্ডর</h3>
                  <p className="who">কম্পোজিট বা বায়িং হাউস, যারা বিভিন্ন ফ্যাক্টরিতে নিটিংয়ের কাজ দেন</p>
                  <ul>
                    <li>দশ ফ্যাক্টরির কাজ এক ড্যাশবোর্ডে</li>
                    <li>দেরির ঝুঁকি আগেই চোখে পড়ে</li>
                    <li>QC-তে নিজের সাইন, রিপোর্ট Excel-এ</li>
                  </ul>
                  <button
                    className="btn pri"
                    style={{ background: 'var(--c-ven)', boxShadow: 'none', marginTop: 4 }}
                    type="button"
                    onClick={() => goTo('vendor', 'vendor')}
                  >
                    ভেন্ডর পোর্টাল
                  </button>
                </article>

                {/* 3. Supplier */}
                <article className="role" style={{ ['--rc' as any]: 'var(--c-sup)' }}>
                  <span className="ic">
                    <svg viewBox="0 0 24 24">
                      <path d="M3 7l9-4 9 4-9 4z" />
                      <path d="M3 7v10l9 4 9-4V7" />
                      <path d="M12 11v10" />
                    </svg>
                  </span>
                  <h3>সাপ্লায়ার</h3>
                  <p className="who">নিটিং মেশিন, সিংকার-নিডল, অয়েল, স্পেয়ার পার্টস বা ইলেকট্রিক গুডস বিক্রি করেন</p>
                  <ul>
                    <li>অনুমোদিত সাপ্লায়ার তালিকায় নাম</li>
                    <li>ফ্যাক্টরির কোটেশন অনুরোধ সরাসরি</li>
                    <li>বিজ্ঞাপন আর স্পনসরশিপ</li>
                  </ul>
                  <button
                    className="btn pri"
                    style={{ background: 'var(--c-sup)', boxShadow: 'none', marginTop: 4 }}
                    type="button"
                    onClick={() => goTo('supplier', 'supplier')}
                  >
                    সাপ্লায়ার হোন
                  </button>
                </article>
              </div>
            </div>
          </section>

          {/* Section: One-Question Guide (#guide) */}
          <section className="guide" id="guide">
            <div className="wrap">
              <div className="sh">
                <span className="eyebrow">নতুন? এখান থেকে শুরু করুন</span>
                <h2>একটা প্রশ্নের উত্তর দিন, আমরা পথ দেখিয়ে দিচ্ছি</h2>
                <p>নিটখাতা নতুন ধরনের প্ল্যাটফর্ম, তাই কোথা থেকে শুরু করবেন বুঝতে না পারা স্বাভাবিক।</p>
              </div>

              <div className="quiz">
                <div>
                  <p style={{ margin: '0 0 12px', fontWeight: 600, fontSize: '1.08rem' }}>
                    আপনি মূলত কী কাজ করেন?
                  </p>
                  <div className="qopts" role="radiogroup">
                    {Q_DATA.map((q, idx) => {
                      const on = qSel === idx;
                      return (
                        <button
                          key={q.k}
                          type="button"
                          className={`qo ${on ? 'on' : ''}`}
                          role="radio"
                          aria-checked={on}
                          style={{ ['--qc' as any]: q.c }}
                          onClick={() => {
                            setQSel(idx);
                            if (q.k === 'fac' || q.k === 'ven' || q.k === 'sup') {
                              setSTab(q.k);
                            }
                          }}
                        >
                          <span className="r"></span>
                          <span>{q.a}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div
                  className={`qres ${currentQ ? 'on' : ''}`}
                  style={{ ['--qc' as any]: currentQ ? currentQ.c : undefined }}
                  aria-live="polite"
                >
                  {!currentQ ? (
                    <span className="muted" style={{ color: 'var(--muted)' }}>
                      বাঁ পাশ থেকে একটা উত্তর বাছুন। আপনার জন্য কোন পোর্টাল আর প্রথম তিনটা কাজ কী, এখানে দেখাবে।
                    </span>
                  ) : (
                    <>
                      <span className="tag">আপনার জন্য</span>
                      <h3>{currentQ.t}</h3>
                      <p style={{ margin: 0, color: 'var(--muted)' }}>শুরুতে এই তিনটা কাজ করুন:</p>
                      <ol>
                        {currentQ.p.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ol>
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 6 }}>
                        <button
                          type="button"
                          className="btn pri"
                          style={{ background: currentQ.c, boxShadow: 'none' }}
                          onClick={() => {
                            if (currentQ.k === 'fac') goTo('factory', 'owner');
                            else if (currentQ.k === 'ven') goTo('vendor', 'vendor');
                            else if (currentQ.k === 'sup') goTo('supplier', 'supplier');
                            else {
                              setActiveTab('jobs');
                              window.location.hash = '#jobs';
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }
                          }}
                        >
                          {currentQ.b}
                        </button>
                        {STEPS_DATA[currentQ.k as keyof typeof STEPS_DATA] && (
                          <a
                            className="btn"
                            href="#steps"
                            onClick={(e) => {
                              e.preventDefault();
                              document.getElementById('steps')?.scrollIntoView({ behavior: 'smooth' });
                            }}
                          >
                            পুরো ধাপগুলো দেখুন
                          </a>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Section: Steps (#steps) */}
          <section id="steps">
            <div className="wrap">
              <div className="sh">
                <span className="eyebrow">ধাপে ধাপে</span>
                <h2>কীভাবে কাজ শুরু হয়</h2>
                <p>আপনার ধরন বাছুন, চারটা ধাপেই পুরো ব্যাপারটা চালু।</p>
              </div>

              <div className="tabs" role="tablist">
                {Object.entries(STEPS_DATA).map(([key, data]) => (
                  <button
                    key={key}
                    role="tab"
                    aria-selected={sTab === key}
                    className={sTab === key ? 'on' : ''}
                    style={{ ['--tc' as any]: data.c }}
                    onClick={() => setSTab(key as any)}
                  >
                    {data.n}
                  </button>
                ))}
              </div>

              <div className="steps" style={{ ['--tc' as any]: currentStepData.c }}>
                {currentStepData.s.map(([title, desc], idx) => (
                  <div key={idx} className="step">
                    <b>{title}</b>
                    <p>{desc}</p>
                  </div>
                ))}
              </div>

              <div className="steps-cta">
                <button
                  type="button"
                  className="btn pri"
                  style={{ background: currentStepData.c, boxShadow: 'none' }}
                  onClick={() => {
                    if (sTab === 'fac') goTo('factory', 'owner');
                    else if (sTab === 'ven') goTo('vendor', 'vendor');
                    else goTo('supplier', 'supplier');
                  }}
                >
                  {currentStepData.b}
                </button>
                <span className="muted" style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>
                  প্রোটোটাইপে নমুনা ডেটা দিয়ে ঘুরে দেখা যায়
                </span>
              </div>
            </div>
          </section>

          {/* Section: Live Flow Diagram */}
          <section style={{ background: 'var(--surface)', borderBlock: '1px solid var(--line)' }}>
            <div className="wrap">
              <div className="sh center">
                <span className="eyebrow">সবাই কীভাবে যুক্ত</span>
                <h2>একজন লিখলে, যার দরকার সে সাথে সাথে দেখে</h2>
                <p>
                  ফ্যাক্টরি শিফট শেষে এন্ট্রি দিলেই ভেন্ডরের ড্যাশবোর্ড বদলে যায়। আলাদা করে ফোন বা এক্সেল পাঠাতে হয় না।
                </p>
              </div>

              <div className="flow">
                <div className="node">
                  <span className="dot" style={{ ['--nc' as any]: 'var(--c-ven)' }}></span>
                  <b>ভেন্ডর</b>
                  <span>কম্পোজিট / বায়িং হাউস</span>
                </div>
                <div className="arr">
                  <div>অর্ডার, সুতা</div>
                  <div className="back">প্রোডাকশন, QC</div>
                </div>
                <div className="node hub">
                  <b>নিটখাতা</b>
                  <span>এক ডেটা, যার যতটুকু অনুমতি</span>
                </div>
                <div className="arr">
                  <div>অর্ডার, সুতা</div>
                  <div className="back">কাপড়, বিল</div>
                </div>
                <div className="node">
                  <span className="dot" style={{ ['--nc' as any]: 'var(--c-fac)' }}></span>
                  <b>নিটিং ফ্যাক্টরি</b>
                  <span>মেশিন, অপারেটর, শিফট</span>
                </div>
              </div>

              <div className="flow2">
                <div className="node">
                  <span className="dot" style={{ ['--nc' as any]: 'var(--c-sup)' }}></span>
                  <b>সাপ্লায়ার</b>
                  <span>ফ্যাক্টরির কোটেশন অনুরোধ পায়, মেশিন ও পার্টস দেয়</span>
                </div>
              </div>
            </div>
          </section>

          {/* Section: Features (#features) */}
          <section id="features">
            <div className="wrap">
              <div className="sh">
                <span className="eyebrow">ভেতরে যা আছে</span>
                <h2>ফ্লোরের কাজের ক্রমে সাজানো</h2>
                <p>
                  আগে অর্ডার, তারপর অংশ, মেশিন, সুতা। ফ্যাক্টরির মানুষ যেভাবে ভাবে, সফটওয়্যারও সেভাবে চলে।
                </p>
              </div>

              <div className="feat">
                <div className="ft" style={{ ['--fc' as any]: 'var(--c-fac)' }}>
                  <span className="who">ফ্যাক্টরি</span>
                  <b>অংশ ধরে New Order Entry</b>
                  <p>Body, Neck Rib, Cuff, Tipping আলাদা লাইনে। প্রতিটার সুতা, মেশিন ডায়া-গেজ আর মেশিন বরাদ্দ।</p>
                </div>
                <div className="ft" style={{ ['--fc' as any]: 'var(--c-fac)' }}>
                  <span className="who">ফ্যাক্টরি</span>
                  <b>শিফটের প্রোডাকশন এন্ট্রি</b>
                  <p>ভেন্ডর আর অর্ডার বাছলেই সব অংশ চলে আসে। মেশিন ধরে kg, রোল আর অপারেটর লিখলেই হলো।</p>
                </div>
                <div className="ft" style={{ ['--fc' as any]: 'var(--c-ven)' }}>
                  <span className="who">ফ্যাক্টরি + ভেন্ডর</span>
                  <b>দুই পক্ষের QC</b>
                  <p>প্রতিটা রোলে ফ্যাক্টরি QC আর ভেন্ডর QC দুজনেই সাইন করে। দ্বিমত হলে সাথে সাথে চোখে পড়ে।</p>
                </div>
                <div className="ft" style={{ ['--fc' as any]: 'var(--c-ven)' }}>
                  <span className="who">ভেন্ডর</span>
                  <b>সব ফ্যাক্টরি এক ড্যাশবোর্ডে</b>
                  <p>কোন অর্ডার দেরি করবে, কোন ফ্যাক্টরি আজ এন্ট্রি দেয়নি, কোথায় কত মেশিন চলছে।</p>
                </div>
                <div className="ft" style={{ ['--fc' as any]: 'var(--c-fac)' }}>
                  <span className="who">ফ্যাক্টরি</span>
                  <b>বিল, ভাউচার, পার্টি লেজার</b>
                  <p>প্রতিটা ভেন্ডরকে আলাদা বিল, প্রতিটা বিলের ভাউচার, আর তারিখ ধরে পার্টি লেজার।</p>
                </div>
                <div className="ft" style={{ ['--fc' as any]: 'var(--c-sup)' }}>
                  <span className="who">সবার জন্য</span>
                  <b>WhatsApp-এ দৈনিক Excel</b>
                  <p>প্রতিদিন নির্দিষ্ট সময়ে দিনের রিপোর্ট Excel ফাইল হয়ে WhatsApp-এ চলে আসে।</p>
                </div>
              </div>
            </div>
          </section>

          {/* Section: Teaser (Upcoming Services) */}
          <section style={{ paddingTop: 0 }}>
            <div className="wrap">
              <div className="teaser">
                <div>
                  <span className="eyebrow">আসছে নিটখাতায়</span>
                  <h2>ট্রান্সপোর্ট, মেসেজ, খালি মেশিন খোঁজা, আরও অনেক কিছু</h2>
                  <p>নিটিংয়ের কাজের আশেপাশে যা যা লাগে, সব ধাপে ধাপে এক প্ল্যাটফর্মে আনছি।</p>
                  <div className="ticons">
                    <span style={{ ['--sc' as any]: 'var(--c-fac)' }}>
                      <i></i>নিটখাতা ট্রান্সপোর্ট
                    </span>
                    <span style={{ ['--sc' as any]: 'var(--c-ven)' }}>
                      <i></i>নিটখাতা মেসেজ
                    </span>
                    <span style={{ ['--sc' as any]: 'var(--c-par)' }}>
                      <i></i>খালি মেশিন খুঁজুন
                    </span>
                    <span style={{ ['--sc' as any]: 'var(--c-sup)' }}>
                      <i></i>সুতার বাজারদর ও কেনাবেচা
                    </span>
                    <span style={{ ['--sc' as any]: 'var(--c-sup)' }}>
                      <i></i>পুরাতন মেশিন কেনাবেচা
                    </span>
                    <span style={{ ['--sc' as any]: 'var(--c-fac)' }}>
                      <i></i>মেকানিক ডাকুন
                    </span>
                    <span>আরও ৩টা</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn pri"
                  onClick={() => {
                    setActiveTab('services');
                    window.location.hash = '#services';
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  সব সার্ভিস দেখুন
                </button>
              </div>
            </div>
          </section>

          {/* Section: Pricing (#pricing) */}
          <section id="pricing">
            <div className="wrap">
              <div className="sh center">
                <span className="eyebrow">দাম</span>
                <h2>দাম শুধু মেশিনের সংখ্যা অনুযায়ী</h2>
                <p>
                  গ্রোথ থেকে সব প্যাকেজে একই ফিচার, পার্থক্য শুধু মেশিনের সংখ্যা আর সাপোর্টে। প্রথম ১ মাস সব প্যাকেজে
                  ফ্রি, কার্ড বা অগ্রিম টাকা লাগে না। প্রো আর এন্টারপ্রাইজে এক বছরের ফি একবারে দিলে কোম্পানির ওয়েবসাইট আর
                  ইমেইল ফ্রি।
                </p>
              </div>

              {/* Billing Cycle Switch */}
              <div className="bill">
                <span className={prYr ? '' : 'on'}>মাসিক পেমেন্ট</span>
                <button
                  type="button"
                  className={`bill-sw ${prYr ? 'on' : ''}`}
                  id="billSw"
                  role="switch"
                  aria-checked={prYr}
                  aria-label="বার্ষিক পেমেন্ট"
                  onClick={() => setPrYr(!prYr)}
                >
                  <i></i>
                </button>
                <span className={prYr ? 'on' : ''}>বার্ষিক পেমেন্ট</span>
                <em className="bill-off">১০% সাশ্রয়!</em>
                <span className="bill-gift">প্রো আর এন্টারপ্রাইজে সাথে ফ্রি ওয়েবসাইট ও ইমেইল</span>
              </div>

              {/* Plans Grid */}
              <div className="plans" style={{ marginTop: 22 }}>
                {PLANS_DATA.map((p) => {
                  const rawPrice = prYr ? Math.round(p.price * 0.9) : p.price;
                  const priceStr = toTkBn(rawPrice);
                  const isRec = p.k === 'g';

                  return (
                    <div key={p.k} className="pl">
                      {isRec && <span className="pl-rib">সবচেয়ে জনপ্রিয়</span>}
                      <div className="pl-l">
                        <b className="pl-n">{p.n}</b>
                        <span className="pl-mc">{p.mc}</span>
                        <p className="pl-d">{p.d}</p>
                        <div className="pl-pr">
                          {prYr && <s>{toTkBn(p.price)}</s>}
                          <b>{priceStr}</b>
                          <small>/মাস</small>
                        </div>
                        <div className="pl-sub">
                          {prYr
                            ? `বছরে ${toTkBn(p.price * 12 * 0.9)} একবারে · ${toTkBn(p.price * 12 * 0.1)} সাশ্রয়`
                            : 'প্রতি মাসে · যেকোনো মাসে বন্ধ করা যায়'}
                        </div>
                        {p.gift && (
                          <div className={`pl-gift ${prYr ? 'on' : ''}`}>
                            <svg
                              viewBox="0 0 24 24"
                              width="22"
                              height="22"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              aria-hidden="true"
                            >
                              <path d="M20 12v9H4v-9" />
                              <path d="M2 7h20v5H2z" />
                              <path d="M12 21V7" />
                              <path d="M12 7H7.5a2.5 2.5 0 1 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 1 0 0-5C13 2 12 7 12 7z" />
                            </svg>
                            <div>
                              <b>{prYr ? 'উপহার পাচ্ছেন:' : 'বার্ষিক পেমেন্টে উপহার:'} ফ্রি কোম্পানি ওয়েবসাইট</b>
                              <small>সাথে কোম্পানির নামে ইমেইল — যেমন info@আপনারকোম্পানি.com</small>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="pl-r">
                        <hr />
                        <div className="pl-h">{p.h}</div>
                        <ul className="pl-f">
                          {p.f.map(([a, b], idx) => (
                            <li key={idx}>
                              <svg
                                viewBox="0 0 24 24"
                                width="16"
                                height="16"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.6"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                              >
                                <path d="M5 12l5 5L20 7" />
                              </svg>
                              <span>
                                <b>{a}</b> {b}
                              </span>
                            </li>
                          ))}
                        </ul>
                        {p.note && <p className="pl-note">{p.note}</p>}
                        <button type="button" className="pl-btn" onClick={() => goTo('auth')}>
                          ১ মাস ফ্রি শুরু করুন
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pr-free">
                <b>ভেন্ডর, সাপ্লায়ার আর পার্টনারদের জন্য নিটখাতা সবসময় ফ্রি।</b> শুধু ফ্যাক্টরি সাবস্ক্রিপশন নেয়।
              </div>
            </div>
          </section>

          {/* Section: FAQ */}
          <section style={{ paddingTop: 0 }}>
            <div className="wrap">
              <div className="sh center">
                <h2>প্রায়ই যা জিজ্ঞেস করা হয়</h2>
              </div>
              <div className="faq">
                <details>
                  <summary>ভেন্ডর কি আমার রেট বা অন্য ভেন্ডরের তথ্য দেখতে পাবে?</summary>
                  <p>
                    না। ভেন্ডর শুধু নিজের অর্ডারের অগ্রগতি, প্রোডাকশন আর QC দেখে। রেট, অপারেটরের নাম আর অন্য ভেন্ডরের
                    তথ্য তার কাছে যায় না।
                  </p>
                </details>
                <details>
                  <summary>আমার ফ্যাক্টরিতে কম্পিউটার নেই, চলবে?</summary>
                  <p>
                    চলবে। ফ্লোর সুপারভাইজার মোবাইল থেকেই প্রতি শিফটে এন্ট্রি দিতে পারেন। পরে অ্যান্ড্রয়েড অ্যাপও আসবে।
                  </p>
                </details>
                <details>
                  <summary>ভেন্ডর হিসেবে আমার ফ্যাক্টরিগুলো নিটখাতায় না থাকলে কী হবে?</summary>
                  <p>
                    আপনি ফ্যাক্টরির মোবাইল নম্বর দিলে তাদের কাছে যোগ হওয়ার আমন্ত্রণ যাবে। ফ্যাক্টরি প্রথম মাস ফ্রি
                    ব্যবহার করতে পারবে।
                  </p>
                </details>
                <details>
                  <summary>সাপ্লায়ার হিসেবে কীভাবে তালিকায় আসব?</summary>
                  <p>
                    সাপ্লায়ার পেজে আবেদন করুন। যাচাইয়ের পর আপনার নাম অনুমোদিত সাপ্লায়ার তালিকায় উঠবে, আর ফ্যাক্টরির
                    কোটেশন অনুরোধ আপনার কাছে আসবে।
                  </p>
                </details>
              </div>
            </div>
          </section>

          {/* Section: Bottom Band CTA */}
          <section style={{ paddingTop: 0 }}>
            <div className="wrap">
              <div className="band">
                <div>
                  <h2>আজই শুরু করুন</h2>
                  <p>ফ্যাক্টরির জন্য প্রথম মাস ফ্রি। কার্ড বা অগ্রিম টাকা লাগে না।</p>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <a
                    className="btn pri"
                    href="#guide"
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById('guide')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    আমি কোনটা, বুঝিয়ে দিন
                  </a>
                  <button className="btn gh" type="button" onClick={() => goTo('auth')}>
                    লগইন
                  </button>
                </div>
              </div>
            </div>
          </section>
        </main>
      )}

      {/* ===================== VIEW 2: SERVICES PAGE (#services) ===================== */}
      {activeTab === 'services' && (
        <main id="services">
          <section className="svhero" style={{ background: 'var(--navy)', color: '#FFFFFF', padding: '52px 0' }}>
            <div className="wrap">
              <span className="eyebrow" style={{ color: '#FDE68A' }}>
                নিটখাতা সার্ভিস
              </span>
              <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.7rem)', marginTop: 6 }}>
                নিটিংয়ের আশেপাশের সব কাজ, একদিন এক জায়গায়
              </h1>
              <p style={{ color: '#CBD5E1', maxWidth: 640, margin: '12px 0 0' }}>
                অর্ডার, প্রোডাকশন, QC আর বিলের পাশাপাশি ধাপে ধাপে আরও সার্ভিস যোগ হচ্ছে। "নিটখাতা মেসেজ" আর "খালি মেশিন
                খুঁজুন" এখনই প্রোটোটাইপে চালু। বাকিগুলো কীভাবে কাজ করবে, প্রতিটা কার্ডে দেখুন।
              </p>
            </div>
          </section>

          <section style={{ paddingBlock: '40px 72px' }}>
            <div className="wrap">
              {['অর্ডারের পথে', 'কেনাবেচা', 'ফ্যাক্টরি চালাতে'].map((grpName) => {
                const groupItems = SERVICES_LIST.filter((s) => s.g === grpName);
                return (
                  <div key={grpName} style={{ marginBottom: 40 }}>
                    <h2 style={{ fontSize: '1.4rem' }}>{grpName}</h2>
                    <p style={{ margin: '-4px 0 16px', color: 'var(--muted)' }}>{G_DESC[grpName]}</p>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: groupItems.length % 3 === 0 ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)',
                        gap: 16,
                      }}
                    >
                      {groupItems.map((sv, idx) => {
                        const globalIdx = SERVICES_LIST.findIndex((x) => x.id === sv.id);
                        const isLive = sv.id === 'chat' || sv.id === 'search';
                        const isDone = svDone.has(globalIdx);
                        const isOpen = svOpen === globalIdx;

                        return (
                          <article
                            key={sv.id}
                            className="role"
                            style={{ ['--rc' as any]: sv.c, background: 'var(--surface)' }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <span className="ic">
                                <svg viewBox="0 0 24 24">
                                  <path d="M4 8c4 0 4 8 8 8s4-8 8-8" />
                                </svg>
                              </span>
                              {isLive ? (
                                <span
                                  style={{
                                    fontSize: '0.74rem',
                                    fontWeight: 600,
                                    padding: '2px 9px',
                                    borderRadius: 999,
                                    background: 'color-mix(in srgb, var(--ok) 16%, transparent)',
                                    color: 'var(--ok)',
                                  }}
                                >
                                  প্রোটোটাইপে চালু
                                </span>
                              ) : (
                                <span
                                  style={{
                                    fontSize: '0.74rem',
                                    fontWeight: 600,
                                    padding: '2px 9px',
                                    borderRadius: 999,
                                    background: 'var(--yarn-soft)',
                                    color: 'var(--yarn)',
                                  }}
                                >
                                  আসছে
                                </span>
                              )}
                            </div>

                            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--f-body)' }}>
                              {sv.t}
                            </h3>
                            <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.93rem' }}>{sv.o}</p>

                            <ul>
                              {sv.b.map((bullet, bIdx) => (
                                <li key={bIdx} style={{ fontSize: '0.9rem' }}>
                                  {bullet}
                                </li>
                              ))}
                            </ul>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                              {sv.f.map((fItem, fIdx) => (
                                <span
                                  key={fIdx}
                                  style={{
                                    fontSize: '0.74rem',
                                    padding: '1px 8px',
                                    borderRadius: 999,
                                    background: 'var(--surface2)',
                                    color: 'var(--muted)',
                                  }}
                                >
                                  {fItem}
                                </span>
                              ))}
                            </div>

                            {isOpen && (
                              <form
                                onSubmit={(e) => {
                                  e.preventDefault();
                                  if (!svPhone || svPhone.length < 11) {
                                    addToast({
                                      type: 'error',
                                      title: 'ভুল নম্বর',
                                      message: '১১ সংখ্যার সঠিক মোবাইল নম্বর লিখুন।',
                                    });
                                    return;
                                  }
                                  setSvDone((prev) => new Set(prev).add(globalIdx));
                                  setSvOpen(null);
                                  addToast({
                                    type: 'success',
                                    title: 'আগ্রহ জমা হয়েছে',
                                    message: `${sv.t} চালু হলে আপনার নম্বরে SMS যাবে।`,
                                  });
                                }}
                                style={{
                                  display: 'grid',
                                  gridTemplateColumns: '1fr auto',
                                  gap: 8,
                                  background: 'var(--surface2)',
                                  borderRadius: 10,
                                  padding: 10,
                                }}
                              >
                                <input
                                  type="tel"
                                  placeholder="মোবাইল নম্বর (০১XXXXXXXXX)"
                                  className="input"
                                  value={svPhone}
                                  onChange={(e) => setSvPhone(e.target.value)}
                                  style={{
                                    border: '1px solid var(--line)',
                                    background: 'var(--surface)',
                                    padding: '8px 10px',
                                    borderRadius: 8,
                                    fontSize: '0.9rem',
                                  }}
                                />
                                <button className="btn pri" type="submit" style={{ padding: '8px 14px' }}>
                                  জানান
                                </button>
                              </form>
                            )}

                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                              {isLive ? (
                                <button
                                  type="button"
                                  className="btn pri"
                                  style={{ background: sv.c, boxShadow: 'none' }}
                                  onClick={() => goTo('factory')}
                                >
                                  চালু দেখুন
                                </button>
                              ) : isDone ? (
                                <span style={{ color: 'var(--ok)', fontWeight: 600, fontSize: '0.88rem' }}>
                                  ✓ জানাব
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  className="btn pri"
                                  style={{ background: sv.c, boxShadow: 'none' }}
                                  onClick={() => setSvOpen(globalIdx)}
                                >
                                  আগ্রহী
                                </button>
                              )}
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </main>
      )}

      {/* ===================== VIEW 3: JOBS PAGE (#jobs) ===================== */}
      {activeTab === 'jobs' && (
        <main id="jobs">
          <section className="jhero" style={{ background: 'var(--grad)', color: '#FFFFFF', padding: '48px 0' }}>
            <div className="wrap">
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 28, alignItems: 'center' }}>
                <div>
                  <span className="eyebrow" style={{ color: '#FDE68A' }}>
                    নিটিংয়ের চাকরি
                  </span>
                  <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.7rem)', marginTop: 6 }}>
                    নিটিং ফ্যাক্টরিতে কাজ খুঁজছেন?
                  </h1>
                  <p style={{ color: '#DBE4FF', margin: '12px 0 0', maxWidth: 560 }}>
                    অপারেটর থেকে প্রোডাকশন ম্যানেজার পর্যন্ত, নিটখাতায় থাকা ফ্যাক্টরিগুলোর সব খালি পদ এক জায়গায়।
                  </p>
                </div>
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.12)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: 16,
                    padding: 20,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  <b style={{ fontSize: '1.1rem' }}>চাকরির বিজ্ঞাপন দিতে চান?</b>
                  <span style={{ color: '#DBE4FF', fontSize: '0.92rem' }}>
                    নিটখাতায় নিবন্ধিত ফ্যাক্টরি, ভেন্ডর বা সাপ্লায়ার বিজ্ঞাপন দিতে পারেন।
                  </span>
                  <button
                    className="btn lt"
                    type="button"
                    onClick={() => {
                      addToast({
                        type: 'info',
                        title: 'বিজ্ঞাপন ফরম',
                        message: 'ফ্যাক্টরি ড্যাশবোর্ড থেকে সহজেই নতুন জব সার্কুলার পোস্ট করা যায়।',
                      });
                      goTo('factory');
                    }}
                  >
                    + চাকরির বিজ্ঞাপন দিন
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section style={{ paddingBlock: '28px 72px' }}>
            <div className="wrap">
              {/* Filter Tools */}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'end', marginBottom: 14 }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 5, flex: 1, minWidth: 220 }}>
                  <span style={{ fontSize: '0.84rem', fontWeight: 600 }}>খুঁজুন</span>
                  <input
                    type="search"
                    placeholder="পদ, ফ্যাক্টরি বা এলাকা..."
                    className="input"
                    value={jSearch}
                    onChange={(e) => setJSearch(e.target.value)}
                  />
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: 5, width: 200 }}>
                  <span style={{ fontSize: '0.84rem', fontWeight: 600 }}>এলাকা</span>
                  <select className="select" value={jArea} onChange={(e) => setJArea(e.target.value)}>
                    <option value="সব">সব এলাকা</option>
                    <option value="নারায়ণগঞ্জ">নারায়ণগঞ্জ</option>
                    <option value="গাজীপুর">গাজীপুর</option>
                    <option value="সাভার-আশুলিয়া">সাভার-আশুলিয়া</option>
                    <option value="চট্টগ্রাম">চট্টগ্রাম</option>
                  </select>
                </label>
              </div>

              {/* Category Pills */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                {['সব', 'অপারেটর', 'টেকনিশিয়ান', 'QC / সুপারভাইজার', 'হিসাব / স্টোর'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className={`btn sm ${jCat === cat ? 'pri' : ''}`}
                    onClick={() => setJCat(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Job Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {jobs
                  .filter((j) => {
                    const matchQ =
                      j.title.toLowerCase().includes(jSearch.toLowerCase()) ||
                      j.factory.toLowerCase().includes(jSearch.toLowerCase());
                    const matchArea = jArea === 'সব' || j.loc.includes(jArea);
                    const matchCat = jCat === 'সব' || j.role === jCat;
                    return matchQ && matchArea && matchCat;
                  })
                  .map((j, idx) => {
                    const isApplying = jApplyIdx === idx;

                    return (
                      <article
                        key={j.id}
                        style={{
                          background: 'var(--surface)',
                          border: '1px solid var(--line)',
                          borderRadius: 14,
                          padding: '18px 20px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 10,
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            flexWrap: 'wrap',
                            gap: 12,
                          }}
                        >
                          <div>
                            <h3 style={{ fontSize: '1.12rem', fontWeight: 700, fontFamily: 'var(--f-body)' }}>
                              {j.title}
                            </h3>
                            <div
                              style={{
                                color: 'var(--muted)',
                                fontSize: '0.92rem',
                                display: 'flex',
                                gap: 8,
                                alignItems: 'center',
                                marginTop: 4,
                              }}
                            >
                              <span>{j.factory}</span>
                              <span
                                style={{
                                  fontSize: '0.74rem',
                                  fontWeight: 600,
                                  color: 'var(--ok)',
                                  background: 'color-mix(in srgb, var(--ok) 14%, transparent)',
                                  padding: '1px 8px',
                                  borderRadius: 999,
                                }}
                              >
                                ✓ নিটখাতায় নিবন্ধিত
                              </span>
                            </div>
                          </div>
                          <div style={{ fontFamily: 'var(--f-mono)', fontWeight: 500, fontSize: '1.1rem' }}>
                            {j.salary}
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {j.urgent && (
                            <span
                              style={{
                                fontSize: '0.82rem',
                                padding: '3px 10px',
                                borderRadius: 999,
                                background: 'var(--yarn-soft)',
                                color: 'var(--yarn)',
                                fontWeight: 600,
                              }}
                            >
                              জরুরি নিয়োগ
                            </span>
                          )}
                          <span
                            style={{
                              fontSize: '0.82rem',
                              padding: '3px 10px',
                              borderRadius: 999,
                              background: 'var(--surface2)',
                              color: 'var(--muted)',
                            }}
                          >
                            {j.loc}
                          </span>
                          <span
                            style={{
                              fontSize: '0.82rem',
                              padding: '3px 10px',
                              borderRadius: 999,
                              background: 'var(--surface2)',
                              color: 'var(--muted)',
                            }}
                          >
                            {toBn(j.vacancies)} জন
                          </span>
                          <span
                            style={{
                              fontSize: '0.82rem',
                              padding: '3px 10px',
                              borderRadius: 999,
                              background: 'var(--surface2)',
                              color: 'var(--muted)',
                            }}
                          >
                            {j.shift}
                          </span>
                          <span
                            style={{
                              fontSize: '0.82rem',
                              padding: '3px 10px',
                              borderRadius: 999,
                              background: 'var(--surface2)',
                              color: 'var(--muted)',
                            }}
                          >
                            অভিজ্ঞতা {j.exp}
                          </span>
                        </div>

                        <p style={{ margin: 0, fontSize: '0.93rem', color: 'var(--muted)' }}>{j.desc}</p>

                        {isApplying ? (
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              if (!applierName || !applierPhone) {
                                addToast({ type: 'error', title: 'তথ্য দিন', message: 'নাম ও মোবাইল নম্বর দিন।' });
                                return;
                              }
                              applyForJob(j.id, {
                                name: applierName,
                                phone: applierPhone,
                                exp: applierExp,
                                note: '',
                              });
                              setJApplyIdx(null);
                              setApplierName('');
                              setApplierPhone('');
                              setApplierExp('');
                            }}
                            style={{
                              background: 'var(--surface2)',
                              borderRadius: 12,
                              padding: 14,
                              display: 'grid',
                              gridTemplateColumns: 'repeat(4, 1fr)',
                              gap: 10,
                              alignItems: 'end',
                              marginTop: 8,
                            }}
                          >
                            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>আপনার নাম</span>
                              <input
                                type="text"
                                required
                                placeholder="নাম লিখুন"
                                className="input"
                                value={applierName}
                                onChange={(e) => setApplierName(e.target.value)}
                              />
                            </label>
                            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>মোবাইল নম্বর</span>
                              <input
                                type="tel"
                                required
                                placeholder="01XXXXXXXXX"
                                className="input"
                                value={applierPhone}
                                onChange={(e) => setApplierPhone(e.target.value)}
                              />
                            </label>
                            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>অভিজ্ঞতা</span>
                              <input
                                type="text"
                                placeholder="যেমন: ২ বছর"
                                className="input"
                                value={applierExp}
                                onChange={(e) => setApplierExp(e.target.value)}
                              />
                            </label>
                            <button className="btn pri" type="submit">
                              আবেদন নিশ্চিত করুন
                            </button>
                          </form>
                        ) : (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.84rem', color: 'var(--muted)' }}>{j.posted}</span>
                            <button
                              type="button"
                              className="btn pri sm"
                              onClick={() => setJApplyIdx(idx)}
                            >
                              আবেদন করুন
                            </button>
                          </div>
                        )}
                      </article>
                    );
                  })}
              </div>
            </div>
          </section>
        </main>
      )}

      {/* Global Footer (Exact KnitKhata.html 4-column footer) */}
      <footer>
        <div className="wrap">
          <div className="fgrid">
            <div>
              <a
                className="brand"
                href="#top"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab('top');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                style={{ marginBottom: 10, padding: 0 }}
              >
                <span className="logo">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                    <path d="M4 8c4 0 4 8 8 8s4-8 8-8" />
                    <path d="M4 14c4 0 4 6 8 6s4-6 8-6" opacity=".6" />
                    <path d="M4 3c4 0 4 7 8 7s4-7 8-7" opacity=".35" />
                  </svg>
                </span>
                <b style={{ color: 'var(--ink)' }}>নিটখাতা</b>
              </a>
              <p className="muted" style={{ margin: 0, maxWidth: 300, color: 'var(--muted)' }}>
                বাংলাদেশের নিটিং ফ্যাক্টরি, ভেন্ডর আর সাপ্লায়ারদের জন্য।
              </p>
            </div>

            <div>
              <h4>পোর্টাল</h4>
              <a onClick={() => goTo('factory', 'owner')} style={{ cursor: 'pointer' }}>ফ্যাক্টরি</a>
              <a onClick={() => goTo('vendor', 'vendor')} style={{ cursor: 'pointer' }}>ভেন্ডর</a>
              <a onClick={() => goTo('supplier', 'supplier')} style={{ cursor: 'pointer' }}>সাপ্লায়ার</a>
            </div>

            <div>
              <h4>সাপ্লায়ার</h4>
              <a onClick={() => goTo('supplier', 'supplier')} style={{ cursor: 'pointer' }}>সাপ্লায়ার তালিকা ও আবেদন</a>
              <a onClick={() => goTo('supplier', 'supplier')} style={{ cursor: 'pointer' }}>বিজ্ঞাপন দিন</a>
            </div>

            <div>
              <h4>আরও</h4>
              <a
                href="#jobs"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab('jobs');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                নিটিংয়ের চাকরি
              </a>
              <a
                href="#services"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab('services');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                নিটখাতা সার্ভিস
              </a>
              <a
                href="#guide"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab('top');
                  document.getElementById('guide')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                কোথা থেকে শুরু করবেন
              </a>
              <a
                href="#steps"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab('top');
                  document.getElementById('steps')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                কীভাবে কাজ করে
              </a>
            </div>
          </div>

          <p className="small muted fpar" style={{ color: 'var(--muted)' }}>
            নিটিং ফ্যাক্টরির মালিকদের চেনেন? নিটখাতার পার্টনার হয়ে তাদের পরিচয় করিয়ে দিতে পারেন।{' '}
            <a onClick={() => goTo('factory')} style={{ cursor: 'pointer', color: 'var(--accent)' }}>
              বিস্তারিত
            </a>
          </p>

          <div className="copy">
            <span>© ২০২৬ নিটখাতা · প্রোটোটাইপ</span>
            <span>ঢাকা, বাংলাদেশ</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export const HomePage = MarketingPortal;

