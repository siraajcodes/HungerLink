export type SupportedLanguage = 'en' | 'ta' | 'hi' | 'te';

export const LANGUAGE_OPTIONS: Array<{ code: SupportedLanguage; label: string; nativeName: string }> = [
  { code: 'en', label: 'EN', nativeName: 'English' },
  { code: 'ta', label: 'தமிழ்', nativeName: 'தமிழ்' },
  { code: 'hi', label: 'हिन्दी', nativeName: 'हिन्दी' },
  { code: 'te', label: 'తెలుగు', nativeName: 'తెలుగు' },
];

export function isSupportedLanguage(value: string | null | undefined): value is SupportedLanguage {
  return value === 'en' || value === 'ta' || value === 'hi' || value === 'te';
}

export interface TranslationDictionary {
  brand: string;
  tagline: string;
  nav: {
    dashboard: string;
    donations: string;
    requests: string;
    matching: string;
    safety: string;
    routes: string;
    mealtrace: string;
    fieldIntake: string;
    impact: string;
    nutriloop: string;
    admin: string;
    notifications: string;
    onboarding: string;
    setup: string;
  };
  roles: {
    FOOD_DONOR: string;
    VERIFIED_NGO: string;
    COMMUNITY_KITCHEN: string;
    DELIVERY_PARTNER: string;
    ADMINISTRATOR: string;
    FIELD_WORKER: string;
  };
  auth: {
    signIn: string;
    register: string;
    signOut: string;
    email: string;
    password: string;
    fullName: string;
    phone: string;
    role: string;
    forgotPassword: string;
    resetPassword: string;
    sendResetLink: string;
    verifyEmailNotice: string;
    enterDemoMode: string;
    exitDemoMode: string;
  };
  common: {
    save: string;
    cancel: string;
    confirm: string;
    submit: string;
    exportCsv: string;
    refresh: string;
    loading: string;
    noRecords: string;
    portions: string;
    verified: string;
    pending: string;
    rejected: string;
    suspended: string;
    demoBanner: string;
    liveMode: string;
    demoMode: string;
    languageLabel: string;
    searchPlaceholder: string;
    reasonRequired: string;
  };
  safety: {
    disclaimerTitle: string;
    disclaimerBody: string;
    recordInspection: string;
    physicalConfirmed: string;
    temperatureC: string;
    packagingCondition: string;
    outcome: string;
    rejectionReason: string;
    passed: string;
    rejected: string;
    pendingReview: string;
  };
  matching: {
    title: string;
    subtitle: string;
    runEngine: string;
    proposeAllocations: string;
    approveDispatch: string;
    formulaLabel: string;
    unallocatedRemaining: string;
    hardGateBlocked: string;
  };
  impact: {
    title: string;
    offered: string;
    allocated: string;
    delivered: string;
    rejected: string;
    unallocated: string;
    completionRate: string;
    avgPickupTime: string;
    repeatDonors: string;
    orgsServed: string;
    shiftsCompleted: string;
    distinctionNotice: string;
  };
  field: {
    title: string;
    subtitle: string;
    onlineStatus: string;
    offlineStatus: string;
    saveToOfflineQueue: string;
    syncNow: string;
    pendingQueue: string;
    noSmartphoneNotice: string;
  };
  nutriloop: {
    title: string;
    subtitle: string;
    sdgMessage: string;
    gapFormula: string;
    matchingFormula: string;
    generateRequests: string;
    approveAndPublish: string;
    inventoryNotice: string;
    disclaimer: string;
    tabOverview: string;
    tabTargeted: string;
    tabInventory: string;
    tabImpact: string;
    tabReference: string;
  };
}

export const translations: Record<SupportedLanguage, TranslationDictionary> = {
  en: {
    brand: 'HUNGERLINK',
    tagline: 'Connecting Every Meal to Someone in Need.',
    nav: {
      dashboard: 'Home',
      donations: 'Donate Food',
      requests: 'Request Meals',
      matching: 'Auto Matching',
      safety: 'Food Safety',
      routes: 'Deliveries',
      mealtrace: 'Scan QR',
      fieldIntake: 'Field Intake',
      impact: 'ImpactLedger',
      nutriloop: 'Nutrition (NutriLoop)',
      admin: 'Administration',
      notifications: 'Notifications',
      onboarding: 'Organisation Profile',
      setup: 'Supabase Setup',
    },
    roles: {
      FOOD_DONOR: 'Food Donor',
      VERIFIED_NGO: 'Verified NGO',
      COMMUNITY_KITCHEN: 'Community Kitchen',
      DELIVERY_PARTNER: 'Delivery Partner',
      ADMINISTRATOR: 'Administrator',
      FIELD_WORKER: 'Field Worker',
    },
    auth: {
      signIn: 'Sign In',
      register: 'Create Account',
      signOut: 'Sign Out',
      email: 'Email Address',
      password: 'Password',
      fullName: 'Full Name',
      phone: 'Phone Number',
      role: 'Operational Role',
      forgotPassword: 'Forgot password?',
      resetPassword: 'Reset Password',
      sendResetLink: 'Send Recovery Email',
      verifyEmailNotice: 'Please verify your email address before activating organisational workflows.',
      enterDemoMode: 'Launch Isolated Demo Environment',
      exitDemoMode: 'Exit Demo Mode',
    },
    common: {
      save: 'Save Changes',
      cancel: 'Cancel',
      confirm: 'Confirm Action',
      submit: 'Submit',
      exportCsv: 'Export CSV',
      refresh: 'Refresh',
      loading: 'Loading verified records...',
      noRecords: 'No records match your current filter.',
      portions: 'portions',
      verified: 'Verified',
      pending: 'Pending Verification',
      rejected: 'Rejected',
      suspended: 'Suspended',
      demoBanner:
        'DEMONSTRATION MODE — Isolated sample scenario (Wedding Hall A: 100 portions). Demo records never mix with live operational Supabase analytics.',
      liveMode: 'Live Supabase Mode',
      demoMode: 'Demo Mode',
      languageLabel: 'Language',
      searchPlaceholder: 'Search batches, organisations, or codes...',
      reasonRequired: 'An audit reason is required for this action.',
    },
    safety: {
      disclaimerTitle: 'Automated Safety Check & Manual Override',
      disclaimerBody:
        'Routine temperature and expiry checks run automatically when food is shared. Authorised coordinators can also record physical on-site inspection outcomes or override flags here.',
      recordInspection: 'Record Inspection Outcome',
      physicalConfirmed: 'I confirm physical sensory, packaging, and thermal inspection was completed on site.',
      temperatureC: 'Recorded Temperature (°C)',
      packagingCondition: 'Packaging Condition',
      outcome: 'Inspection Outcome',
      rejectionReason: 'Rejection Reason (Mandatory if Rejected)',
      passed: 'Passed',
      rejected: 'Rejected',
      pendingReview: 'Pending Review',
    },
    matching: {
      title: 'Smart Surplus Matching Engine',
      subtitle: 'Runs automatically on every donation and request. Coordinators can inspect or override here.',
      runEngine: 'Run Matching Engine',
      proposeAllocations: 'Propose Split Allocations',
      approveDispatch: 'Approve Allocation',
      formulaLabel: 'S = 0.35L + 0.30U + 0.20Q + 0.15T',
      unallocatedRemaining: 'Remaining Unallocated',
      hardGateBlocked: 'Rejected by Hard Eligibility Gate',
    },
    impact: {
      title: 'ImpactLedger Analytics',
      offered: 'Meals Offered',
      allocated: 'Meals Allocated',
      delivered: 'Confirmed Delivered',
      rejected: 'Meals Rejected',
      unallocated: 'Unallocated Portions',
      completionRate: 'Delivery Completion Rate',
      avgPickupTime: 'Average Pickup Time',
      repeatDonors: 'Repeat Donors',
      orgsServed: 'Recipient Organisations Served',
      shiftsCompleted: 'Delivery Shifts Completed',
      distinctionNotice:
        'ImpactLedger strictly separates Offered, Allocated, and Confirmed Delivered quantities. Allocations are never counted as completed deliveries until receiving handover is confirmed.',
    },
    field: {
      title: 'Assisted Field Intake & Offline Sync',
      subtitle: 'Register meal requests on behalf of verified organisations without requiring recipient smartphones.',
      onlineStatus: 'Online — Direct submission & auto-matching enabled',
      offlineStatus: 'Offline — Requests will queue locally with UUID idempotency keys',
      saveToOfflineQueue: 'Queue Draft Offline',
      syncNow: 'Synchronise Pending Queue',
      pendingQueue: 'Pending Offline Sync Queue',
      noSmartphoneNotice:
        'Recipients do not need smartphones or app accounts. Field workers log verified requests via phone, walk-in, or outreach visits.',
    },
    nutriloop: {
      title: 'NutriLoop — Nutritional Gap Detection & Correction',
      subtitle: 'UN SDG 2 (Zero Hunger): Identify community nutritional shortages, generate targeted requests, and prioritize high-impact surplus rescues.',
      sdgMessage: "HungerLink doesn't just rescue surplus food. It identifies what communities are missing and helps deliver food that addresses their nutritional needs.",
      gapFormula: 'G(j) = max(0, R(j) - A(j))',
      matchingFormula: 'S = 0.25L + 0.20U + 0.15Q + 0.15T + 0.25N (Safety Gate First)',
      generateRequests: 'Generate Targeted Requests',
      approveAndPublish: 'Approve & Publish to Donors',
      inventoryNotice: 'Community food inventory indicates estimated nutritional availability — not proof that every individual consumed those nutrients.',
      disclaimer: 'Inventory availability estimates community-level supply, not verified individual consumption.',
      tabOverview: 'Gap Overview',
      tabTargeted: 'Targeted Requests',
      tabInventory: 'Profiles & Inventory',
      tabImpact: 'Impact Measurement',
      tabReference: 'Reference & Config',
    },
  },
  ta: {
    brand: 'ஹங்கர்லிங்க்',
    tagline: 'ஒவ்வொரு உணவையும் தேவையுள்ளவரிடம் சேர்க்கும் பாலம்.',
    nav: {
      dashboard: 'முகப்பு',
      donations: 'உணவு தானம்',
      requests: 'உணவு கோரிக்கை',
      matching: 'தானியங்கி பொருத்தம்',
      safety: 'உணவுப் பாதுகாப்பு',
      routes: 'விநியோகங்கள்',
      mealtrace: 'QR ஸ்கேன்',
      fieldIntake: 'களப் பதிவு',
      impact: 'தாக்க அறிக்கை',
      nutriloop: 'ஊட்டச்சத்து',
      admin: 'நிர்வாக மையம்',
      notifications: 'அறிவிப்புகள்',
      onboarding: 'நிறுவன விவரம்',
      setup: 'தரவுத்தள அமைப்பு',
    },
    roles: {
      FOOD_DONOR: 'உணவு தானதாரர்',
      VERIFIED_NGO: 'சரிபார்க்கப்பட்ட தன்னார்வ தொண்டு நிறுவனம்',
      COMMUNITY_KITCHEN: 'சமூக சமையலறை',
      DELIVERY_PARTNER: 'விநியோகப் பங்குதாரர்',
      ADMINISTRATOR: 'நிர்வாகி',
      FIELD_WORKER: 'களப் பணியாளர்',
    },
    auth: {
      signIn: 'உள்நுழைக',
      register: 'கணக்கு உருவாக்குக',
      signOut: 'வெளியேறுக',
      email: 'மின்னஞ்சல் முகவரி',
      password: 'கடவுச்சொல்',
      fullName: 'முழுப் பெயர்',
      phone: 'தொலைபேசி எண்',
      role: 'செயல்பாட்டுப் பொறுப்பு',
      forgotPassword: 'கடவுச்சொல் மறந்துவிட்டதா?',
      resetPassword: 'கடவுச்சொல் மீட்டமைப்பு',
      sendResetLink: 'மீட்டமைப்பு இணைப்பை அனுப்புக',
      verifyEmailNotice: 'நிறுவன செயல்பாடுகளைத் தொடங்குவதற்கு முன் உங்கள் மின்னஞ்சலைச் சரிபார்க்கவும்.',
      enterDemoMode: 'மாதிரி சூழலைத் திறக்கவும்',
      exitDemoMode: 'மாதிரி சூழலிலிருந்து வெளியேறுக',
    },
    common: {
      save: 'மாற்றங்களைச் சேமிக்கவும்',
      cancel: 'ரத்து செய்',
      confirm: 'உறுதிப்படுத்துக',
      submit: 'சமர்ப்பிக்கவும்',
      exportCsv: 'CSV பதிவிறக்கம்',
      refresh: 'புதுப்பிக்கவும்',
      loading: 'சரிபார்க்கப்பட்ட தரவுகள் ஏற்றப்படுகின்றன...',
      noRecords: 'தற்போதைய வடிகட்டிக்குப் பொருந்தும் பதிவுகள் இல்லை.',
      portions: 'பங்குகள்',
      verified: 'சரிபார்க்கப்பட்டது',
      pending: 'சரிபார்ப்பு நிலுவையில்',
      rejected: 'நிராகரிக்கப்பட்டது',
      suspended: 'இடைநிறுத்தப்பட்டது',
      demoBanner:
        'மாதிரி செயல்பாட்டு சூழல் — தனிமைப்படுத்தப்பட்ட மாதிரித் தரவு (திருமண மண்டபம் A: 100 பங்குகள்). மாதிரித் தரவுகள் ஒருபோதும் நேரடி செயல்பாட்டுப் பகுப்பாய்வுடன் கலக்காது.',
      liveMode: 'நேரடி Supabase முறை',
      demoMode: 'மாதிரி முறை',
      languageLabel: 'மொழி',
      searchPlaceholder: 'தொகுதி எண் அல்லது நிறுவனத்தைத் தேடுங்கள்...',
      reasonRequired: 'இந்த நடவடிக்கைக்குத் தணிக்கைக் காரணம் கட்டாயம்.',
    },
    safety: {
      disclaimerTitle: 'தானியங்கி பாதுகாப்பு ஆய்வு & நேரடி மேலாண்மை',
      disclaimerBody:
        'உணவு பகிரப்படும்போது வெப்பநிலை மற்றும் காலாவதி ஆய்வுகள் தானாக நடைபெறும். அங்கீகரிக்கப்பட்ட ஒருங்கிணைப்பாளர்கள் நேரடி ஆய்வு முடிவுகளையும் இங்கே பதிவு செய்யலாம்.',
      recordInspection: 'ஆய்வு முடிவைப் பதிவு செய்க',
      physicalConfirmed: 'நேரடி வாசனை, பேக்கேஜிங் மற்றும் வெப்பநிலை ஆய்வு தளத்தில் மேற்கொள்ளப்பட்டதை உறுதிப்படுத்துகிறேன்.',
      temperatureC: 'பதிவு செய்யப்பட்ட வெப்பநிலை (°C)',
      packagingCondition: 'பேக்கேஜிங் நிலை',
      outcome: 'ஆய்வு முடிவு',
      rejectionReason: 'நிராகரிப்புக் காரணம் (நிராகரிக்கப்பட்டால் கட்டாயம்)',
      passed: 'தேர்ச்சி பெற்றது',
      rejected: 'நிராகரிக்கப்பட்டது',
      pendingReview: 'மறுஆய்வு நிலுவையில்',
    },
    matching: {
      title: 'திறன் உபரி உணவுப் பொருத்த அமைப்பு',
      subtitle: 'ஒவ்வொரு தானம் மற்றும் கோரிக்கையிலும் தானாக இயங்கும். ஒருங்கிணைப்பாளர்கள் இங்கே சரிபார்க்கலாம்.',
      runEngine: 'பொருத்த அமைப்பை இயக்குக',
      proposeAllocations: 'பகுதி ஒதுக்கீட்டை முன்மொழிக',
      approveDispatch: 'ஒதுக்கீட்டை அங்கீகரிக்கவும்',
      formulaLabel: 'S = 0.35L + 0.30U + 0.20Q + 0.15T',
      unallocatedRemaining: 'ஒதுக்கப்படாத மீதம்',
      hardGateBlocked: 'தகுதி நிபந்தனையால் நிராகரிக்கப்பட்டது',
    },
    impact: {
      title: 'தாக்கப் பதிவேடு (ImpactLedger)',
      offered: 'வழங்கப்பட்ட உணவுப் பங்குகள்',
      allocated: 'ஒதுக்கப்பட்ட பங்குகள்',
      delivered: 'உறுதிப்படுத்தப்பட்ட விநியோகம்',
      rejected: 'நிராகரிக்கப்பட்ட பங்குகள்',
      unallocated: 'ஒதுக்கப்படாத பங்குகள்',
      completionRate: 'விநியோக நிறைவு விகிதம்',
      avgPickupTime: 'சராசரி சேகரிப்பு நேரம்',
      repeatDonors: 'தொடர் தானதாரர்கள்',
      orgsServed: 'பயனடைந்த நிறுவனங்கள்',
      shiftsCompleted: 'நிறைவுற்ற விநியோகப் பணிகள்',
      distinctionNotice:
        'வழங்கப்பட்டவை, ஒதுக்கப்பட்டவை மற்றும் உறுதிப்படுத்தப்பட்ட விநியோகம் ஆகியவை தனித்தனியாகக் கணக்கிடப்படுகின்றன. பெறுநர் உறுதிப்படுத்தும் வரை ஒதுக்கீடு விநியோகமாகக் கருதப்படாது.',
    },
    field: {
      title: 'களப் பணியாளர் உதவிப் பதிவு மற்றும் இணையமில்லா ஒத்திசைவு',
      subtitle: 'பயனாளிகளுக்குத் திறன்பேசி தேவையின்றி சரிபார்க்கப்பட்ட நிறுவனங்களுக்காகக் கோரிக்கைகளைப் பதிவு செய்க.',
      onlineStatus: 'இணைய இணைப்பில் உள்ளது — நேரடி பதிவு & தானியங்கி பொருத்தம் செயல்பாட்டில் உள்ளது',
      offlineStatus: 'இணைய இணைப்பு இல்லை — கோரிக்கைகள் UUID அடையாளத்துடன் உள்ளூரில் சேமிக்கப்படும்',
      saveToOfflineQueue: 'இணையமில்லா வரிசையில் சேமிக்கவும்',
      syncNow: 'நிலுவை வரிசையை ஒத்திசைக்கவும்',
      pendingQueue: 'ஒத்திசைவுக்காகக் காத்திருக்கும் பதிவுகள்',
      noSmartphoneNotice:
        'பயனாளிகள் திறன்பேசி அல்லது செயலி கணக்கு வைத்திருக்கத் தேவையில்லை. களப் பணியாளர்கள் தொலைபேசி அல்லது நேரடிச் சந்திப்பு மூலம் கோரிக்கைகளைப் பதிவு செய்யலாம்.',
    },
    nutriloop: {
      title: 'NutriLoop — ஊட்டச்சத்து இடைவெளி கண்டறிதல் & திருத்த அமைப்பு',
      subtitle: 'ஐ.நா. SDG 2 (பசியற்ற உலகம்): சமூகத்தின் ஊட்டச்சத்து குறைபாடுகளைக் கண்டறிந்து இலக்கு உணவு கோரிக்கைகளை உருவாக்குதல்.',
      sdgMessage: 'HungerLink உபரி உணவை மீட்பதோடு மட்டுமல்லாமல், சமூகங்களுக்கு என்ன ஊட்டச்சத்து குறைவாக உள்ளது என்பதைக் கண்டறிந்து சரியான உணவைச் சேர்க்கிறது.',
      gapFormula: 'G(j) = max(0, R(j) - A(j))',
      matchingFormula: 'S = 0.25L + 0.20U + 0.15Q + 0.15T + 0.25N (பாதுகாப்பு முதலில்)',
      generateRequests: 'இலக்கு கோரிக்கைகளை உருவாக்குக',
      approveAndPublish: 'அங்கீகரித்து தானதாரர்களுக்கு வெளியிடுக',
      inventoryNotice: 'சமூக உணவு இருப்பு என்பது மதிப்பிடப்பட்ட ஊட்டச்சத்து கிடைப்பை மட்டுமே குறிக்கும்; ஒவ்வொரு நபரும் அதை உட்கொண்டதற்கான ஆதாரம் அல்ல.',
      disclaimer: 'உணவு இருப்பு என்பது மதிப்பிடப்பட்ட ஊட்டச்சத்து கிடைப்பையே குறிக்கும்; தனிநபர் உட்கொள்ளலுக்குச் சான்றல்ல.',
      tabOverview: 'இடைவெளி பகுப்பாய்வு',
      tabTargeted: 'இலக்கு கோரிக்கைகள்',
      tabInventory: 'சுயவிவரம் & இருப்பு',
      tabImpact: 'தாக்க அளவீடு',
      tabReference: 'ஆதார தரவு & அமைப்பு',
    },
  },
  hi: {
    brand: 'हंगरलिंक',
    tagline: 'हर भोजन को ज़रूरतमंद तक पहुँचाने का सेतु।',
    nav: {
      dashboard: 'होम',
      donations: 'भोजन दान करें',
      requests: 'भोजन का अनुरोध',
      matching: 'स्वतः मिलान',
      safety: 'खाद्य सुरक्षा',
      routes: 'डिलीवरी',
      mealtrace: 'QR स्कैन',
      fieldIntake: 'फील्ड पंजीकरण',
      impact: 'प्रभाव रिपोर्ट',
      nutriloop: 'पोषण (NutriLoop)',
      admin: 'प्रशासन',
      notifications: 'सूचनाएं',
      onboarding: 'संगठन प्रोफ़ाइल',
      setup: 'डेटाबेस सेटअप',
    },
    roles: {
      FOOD_DONOR: 'भोजन दाता',
      VERIFIED_NGO: 'सत्यापित एनजीओ',
      COMMUNITY_KITCHEN: 'सामुदायिक रसोई',
      DELIVERY_PARTNER: 'डिलीवरी पार्टनर',
      ADMINISTRATOR: 'प्रशासक',
      FIELD_WORKER: 'फील्ड वर्कर',
    },
    auth: {
      signIn: 'साइन इन करें',
      register: 'खाता बनाएं',
      signOut: 'साइन आउट',
      email: 'ईमेल पता',
      password: 'पासवर्ड',
      fullName: 'पूरा नाम',
      phone: 'फ़ोन नंबर',
      role: 'आपकी भूमिका',
      forgotPassword: 'पासवर्ड भूल गए?',
      resetPassword: 'पासवर्ड रीसेट करें',
      sendResetLink: 'रीसेट लिंक भेजें',
      verifyEmailNotice: 'संगठन के कार्य शुरू करने से पहले कृपया अपना ईमेल सत्यापित करें।',
      enterDemoMode: 'डेमो मोड शुरू करें',
      exitDemoMode: 'डेमो मोड से बाहर निकलें',
    },
    common: {
      save: 'बदलाव सहेजें',
      cancel: 'रद्द करें',
      confirm: 'पुष्टि करें',
      submit: 'जमा करें',
      exportCsv: 'CSV डाउनलोड',
      refresh: 'रीफ़्रेश करें',
      loading: 'सत्यापित डेटा लोड हो रहा है...',
      noRecords: 'वर्तमान फ़िल्टर से कोई रिकॉर्ड मेल नहीं खाता।',
      portions: 'थालियाँ',
      verified: 'सत्यापित',
      pending: 'सत्यापन लंबित',
      rejected: 'अस्वीकृत',
      suspended: 'निलंबित',
      demoBanner:
        'डेमो मोड — अलग नमूना डेटा (वेडिंग हॉल A: 100 थालियाँ)। डेमो रिकॉर्ड कभी भी लाइव डेटा में नहीं मिलते।',
      liveMode: 'लाइव Supabase मोड',
      demoMode: 'डेमो मोड',
      languageLabel: 'भाषा',
      searchPlaceholder: 'बैच कोड या संगठन खोजें...',
      reasonRequired: 'इस कार्रवाई के लिए ऑडिट कारण अनिवार्य है।',
    },
    safety: {
      disclaimerTitle: 'स्वतः खाद्य सुरक्षा जाँच व मैनुअल निरीक्षण',
      disclaimerBody:
        'भोजन साझा करते ही तापमान और समाप्ति समय की जाँच स्वतः हो जाती है। अधिकृत समन्वयक यहाँ भौतिक निरीक्षण परिणाम भी दर्ज कर सकते हैं।',
      recordInspection: 'निरीक्षण परिणाम दर्ज करें',
      physicalConfirmed: 'मैं पुष्टि करता/करती हूँ कि स्थल पर गंध, पैकेजिंग और तापमान की भौतिक जाँच पूरी हो चुकी है।',
      temperatureC: 'दर्ज तापमान (°C)',
      packagingCondition: 'पैकेजिंग की स्थिति',
      outcome: 'निरीक्षण परिणाम',
      rejectionReason: 'अस्वीकृति कारण (अस्वीकृत होने पर अनिवार्य)',
      passed: 'उत्तीर्ण',
      rejected: 'अस्वीकृत',
      pendingReview: 'समीक्षा लंबित',
    },
    matching: {
      title: 'स्मार्ट भोजन मिलान इंजन',
      subtitle: 'हर दान और अनुरोध पर स्वतः चलता है। समन्वयक यहाँ देख या बदल सकते हैं।',
      runEngine: 'मिलान इंजन चलाएं',
      proposeAllocations: 'आवंटन प्रस्तावित करें',
      approveDispatch: 'आवंटन स्वीकृत करें',
      formulaLabel: 'S = 0.35L + 0.30U + 0.20Q + 0.15T',
      unallocatedRemaining: 'शेष अनाबंटित',
      hardGateBlocked: 'पात्रता नियम द्वारा अवरुद्ध',
    },
    impact: {
      title: 'प्रभाव रिपोर्ट (ImpactLedger)',
      offered: 'दान किए गए भोजन',
      allocated: 'आवंटित भोजन',
      delivered: 'सत्यापित वितरित भोजन',
      rejected: 'अस्वीकृत भोजन',
      unallocated: 'अनाबंटित हिस्से',
      completionRate: 'डिलीवरी पूर्णता दर',
      avgPickupTime: 'औसत पिकअप समय',
      repeatDonors: 'नियमित दाता',
      orgsServed: 'लाभान्वित संगठन',
      shiftsCompleted: 'पूर्ण डिलीवरी शिफ्ट',
      distinctionNotice:
        'ImpactLedger दान, आवंटित और सत्यापित वितरित मात्रा को अलग रखता है। प्राप्तकर्ता की पुष्टि तक आवंटन को वितरण नहीं माना जाता।',
    },
    field: {
      title: 'फील्ड सहायता पंजीकरण व ऑफ़लाइन सिंक',
      subtitle: 'बिना स्मार्टफ़ोन के भी सत्यापित संगठनों की ओर से भोजन अनुरोध दर्ज करें।',
      onlineStatus: 'ऑनलाइन — सीधा पंजीकरण व स्वतः मिलान सक्रिय',
      offlineStatus: 'ऑफ़लाइन — अनुरोध स्थानीय रूप से सुरक्षित रहेंगे',
      saveToOfflineQueue: 'ऑफ़लाइन कतार में सहेजें',
      syncNow: 'लंबित कतार सिंक करें',
      pendingQueue: 'लंबित ऑफ़लाइन कतार',
      noSmartphoneNotice:
        'लाभार्थियों को स्मार्टफ़ोन या ऐप खाते की आवश्यकता नहीं है। फील्ड वर्कर फ़ोन या प्रत्यक्ष भेंट से अनुरोध दर्ज कर सकते हैं।',
    },
    nutriloop: {
      title: 'NutriLoop — पोषण अंतर पहचान और सुधार',
      subtitle: 'UN SDG 2 (शून्य भुखमरी): सामुदायिक पोषण कमी की पहचान करें और लक्षित भोजन अनुरोध बनाएं।',
      sdgMessage: 'हंगरलिंक केवल अतिरिक्त भोजन नहीं बचाता, बल्कि यह पहचानता है कि समुदायों में किस पोषण की कमी है और सही भोजन पहुँचाता है।',
      gapFormula: 'G(j) = max(0, R(j) - A(j))',
      matchingFormula: 'S = 0.25L + 0.20U + 0.15Q + 0.15T + 0.25N (सुरक्षा पहले)',
      generateRequests: 'लक्षित अनुरोध बनाएं',
      approveAndPublish: 'स्वीकृत करें और दाताओं को साझा करें',
      inventoryNotice: 'सामुदायिक भोजन स्टॉक अनुमानित उपलब्धता दर्शाता है — व्यक्तिगत उपभोग का प्रमाण नहीं।',
      disclaimer: 'स्टॉक उपलब्धता सामुदायिक आपूर्ति का अनुमान है, व्यक्तिगत उपभोग का प्रमाण नहीं।',
      tabOverview: 'अंतर अवलोकन',
      tabTargeted: 'लक्षित अनुरोध',
      tabInventory: 'प्रोफ़ाइल व स्टॉक',
      tabImpact: 'प्रभाव मापन',
      tabReference: 'संदर्भ व सेटिंग्स',
    },
  },
  te: {
    brand: 'హంగర్‌లింక్',
    tagline: 'ప్రతి భోజనాన్ని అవసరమైన వారికి చేర్చే వారధి.',
    nav: {
      dashboard: 'హోమ్',
      donations: 'ఆహార దానం',
      requests: 'భోజన అభ్యర్థన',
      matching: 'ఆటో మ్యాచింగ్',
      safety: 'ఆహార భద్రత',
      routes: 'డెలివరీలు',
      mealtrace: 'QR స్కాన్',
      fieldIntake: 'ఫీల్డ్ నమోదు',
      impact: 'ప్రభావ నివేదిక',
      nutriloop: 'పోషకాహారం (NutriLoop)',
      admin: 'పరిపాలన',
      notifications: 'నోటిఫికేషన్లు',
      onboarding: 'సంస్థ ప్రొఫైల్',
      setup: 'డేటాబేస్ సెటప్',
    },
    roles: {
      FOOD_DONOR: 'ఆహార దాత',
      VERIFIED_NGO: 'ధృవీకరించబడిన NGO',
      COMMUNITY_KITCHEN: 'కమ్యూనిటీ కిచెన్',
      DELIVERY_PARTNER: 'డెలివరీ పార్టనర్',
      ADMINISTRATOR: 'అడ్మినిస్ట్రేటర్',
      FIELD_WORKER: 'ఫీల్డ్ వర్కర్',
    },
    auth: {
      signIn: 'సైన్ ఇన్',
      register: 'ఖాతా సృష్టించండి',
      signOut: 'సైన్ అవుట్',
      email: 'ఇమెయిల్ చిరునామా',
      password: 'పాస్‌వర్డ్',
      fullName: 'పూర్తి పేరు',
      phone: 'ఫోన్ నంబర్',
      role: 'మీ పాత్ర',
      forgotPassword: 'పాస్‌వర్డ్ మర్చిపోయారా?',
      resetPassword: 'పాస్‌వర్డ్ రీసెట్',
      sendResetLink: 'రీసెట్ లింక్ పంపండి',
      verifyEmailNotice: 'సంస్థ కార్యకలాపాలు ప్రారంభించే ముందు దయచేసి మీ ఇమెయిల్‌ను ధృవీకరించండి.',
      enterDemoMode: 'డెమో మోడ్ ప్రారంభించండి',
      exitDemoMode: 'డెమో మోడ్ నుండి నిష్క్రమించండి',
    },
    common: {
      save: 'మార్పులను సేవ్ చేయండి',
      cancel: 'రద్దు చేయి',
      confirm: 'నిర్ధారించండి',
      submit: 'సమర్పించండి',
      exportCsv: 'CSV డౌన్‌లోడ్',
      refresh: 'రిఫ్రెష్',
      loading: 'ధృవీకరించబడిన రికార్డులు లోడ్ అవుతున్నాయి...',
      noRecords: 'ప్రస్తుత ఫిల్టర్‌కు సరిపోలే రికార్డులు లేవు.',
      portions: 'భోజనాలు',
      verified: 'ధృవీకరించబడింది',
      pending: 'ధృవీకరణ పెండింగ్',
      rejected: 'తిరస్కరించబడింది',
      suspended: 'సస్పెండ్ చేయబడింది',
      demoBanner:
        'డెమో మోడ్ — వేరు చేయబడిన నమూనా డేటా (వెడ్డింగ్ హాల్ A: 100 భోజనాలు). డెమో డేటా ఎప్పటికీ లైవ్ డేటాతో కలవదు.',
      liveMode: 'లైవ్ Supabase మోడ్',
      demoMode: 'డెమో మోడ్',
      languageLabel: 'భాష',
      searchPlaceholder: 'బ్యాచ్ కోడ్ లేదా సంస్థను వెతకండి...',
      reasonRequired: 'ఈ చర్యకు ఆడిట్ కారణం తప్పనిసరి.',
    },
    safety: {
      disclaimerTitle: 'ఆటోమేటిక్ ఆహార భద్రత & మాన్యువల్ తనిఖీ',
      disclaimerBody:
        'ఆహారం పంచుకున్న వెంటనే ఉష్ణోగ్రత మరియు గడువు తనిఖీలు స్వయంచాలకంగా జరుగుతాయి. అధికారులైన కోఆర్డినేటర్లు భౌతిక తనిఖీ ఫలితాలను కూడా ఇక్కడ నమోదు చేయవచ్చు.',
      recordInspection: 'తనిఖీ ఫలితాన్ని నమోదు చేయండి',
      physicalConfirmed: 'ప్రదేశంలోనే వాసన, ప్యాకేజింగ్ మరియు ఉష్ణోగ్రత భౌతిక తనిఖీ పూర్తయిందని నిర్ధారిస్తున్నాను.',
      temperatureC: 'నమోదైన ఉష్ణోగ్రత (°C)',
      packagingCondition: 'ప్యాకేజింగ్ స్థితి',
      outcome: 'తనిఖీ ఫలితం',
      rejectionReason: 'తిరస్కరణ కారణం (తిరస్కరిస్తే తప్పనిసరి)',
      passed: 'ఉత్తీర్ణం',
      rejected: 'తిరస్కరించబడింది',
      pendingReview: 'సమీక్ష పెండింగ్',
    },
    matching: {
      title: 'స్మార్ట్ ఆహార మ్యాచింగ్ ఇంజిన్',
      subtitle: 'ప్రతి దానం మరియు అభ్యర్థనపై స్వయంచాలకంగా నడుస్తుంది. కోఆర్డినేటర్లు ఇక్కడ సమీక్షించవచ్చు.',
      runEngine: 'మ్యాచింగ్ ఇంజిన్ నడపండి',
      proposeAllocations: 'కేటాయింపులను ప్రతిపాదించండి',
      approveDispatch: 'కేటాయింపును ఆమోదించండి',
      formulaLabel: 'S = 0.35L + 0.30U + 0.20Q + 0.15T',
      unallocatedRemaining: 'మిగిలిన కేటాయించనివి',
      hardGateBlocked: 'అర్హత నియమం ద్వారా నిరోధించబడింది',
    },
    impact: {
      title: 'ప్రభావ నివేదిక (ImpactLedger)',
      offered: 'అందించిన భోజనాలు',
      allocated: 'కేటాయించిన భోజనాలు',
      delivered: 'ధృవీకరించబడిన డెలివరీ',
      rejected: 'తిరస్కరించబడిన భోజనాలు',
      unallocated: 'కేటాయించని భాగాలు',
      completionRate: 'డెలివరీ పూర్తి రేటు',
      avgPickupTime: 'సగటు పికప్ సమయం',
      repeatDonors: 'పునరావృత దాతలు',
      orgsServed: 'సేవ పొందిన సంస్థలు',
      shiftsCompleted: 'పూర్తయిన డెలివరీ షిఫ్ట్‌లు',
      distinctionNotice:
        'ImpactLedger అందించినవి, కేటాయించినవి మరియు ధృవీకరించబడిన డెలివరీలను వేరుగా చూపుతుంది. స్వీకర్త నిర్ధారించే వరకు కేటాయింపును డెలివరీగా లెక్కించదు.',
    },
    field: {
      title: 'ఫీల్డ్ సహాయ నమోదు & ఆఫ్‌లైన్ సింక్',
      subtitle: 'స్మార్ట్‌ఫోన్ లేకపోయినా ధృవీకరించబడిన సంస్థల తరపున భోజన అభ్యర్థనలను నమోదు చేయండి.',
      onlineStatus: 'ఆన్‌లైన్ — నేరుగా నమోదు & ఆటో-మ్యాచింగ్ సక్రియం',
      offlineStatus: 'ఆఫ్‌లైన్ — అభ్యర్థనలు స్థానికంగా సేవ్ చేయబడతాయి',
      saveToOfflineQueue: 'ఆఫ్‌లైన్ క్యూలో సేవ్ చేయి',
      syncNow: 'పెండింగ్ క్యూను సింక్ చేయి',
      pendingQueue: 'పెండింగ్ ఆఫ్‌లైన్ క్యూ',
      noSmartphoneNotice:
        'లబ్ధిదారులకు స్మార్ట్‌ఫోన్ లేదా యాప్ ఖాతా అవసరం లేదు. ఫీల్డ్ వర్కర్లు ఫోన్ లేదా ప్రత్యక్ష సందర్శన ద్వారా అభ్యర్థనలను నమోదు చేయవచ్చు.',
    },
    nutriloop: {
      title: 'NutriLoop — పోషకాహార లోపం గుర్తింపు & సవరణ',
      subtitle: 'UN SDG 2 (జీరో హంగర్): కమ్యూనిటీ పోషకాహార లోపాలను గుర్తించి లక్ష్యిత ఆహార అభ్యర్థనలను రూపొందించండి.',
      sdgMessage: 'హంగర్‌లింక్ మిగులు ఆహారాన్ని రక్షించడమే కాకుండా, కమ్యూనిటీలకు ఏ పోషకాలు తక్కువగా ఉన్నాయో గుర్తించి సరైన ఆహారాన్ని అందిస్తుంది.',
      gapFormula: 'G(j) = max(0, R(j) - A(j))',
      matchingFormula: 'S = 0.25L + 0.20U + 0.15Q + 0.15T + 0.25N (భద్రత మొదట)',
      generateRequests: 'లक्षित అభ్యర్థనలను రూపొందించండి',
      approveAndPublish: 'ఆమోదించి దాతలకు పంచుకోండి',
      inventoryNotice: 'కమ్యూనిటీ ఆహార నిల్వ అంచనా లభ్యతను మాత్రమే సూచిస్తుంది — వ్యక్తిగత వినియోగ రుజువు కాదు.',
      disclaimer: 'నిల్వ లభ్యత కమ్యూనిటీ స్థాయి సరఫరా అంచనా మాత్రమే, వ్యక్తిగత వినియోగ రుజువు కాదు.',
      tabOverview: 'లోపాల అవలోకనం',
      tabTargeted: 'లక్ష్యిత అభ్యర్థనలు',
      tabInventory: 'ప్రొఫైల్ & నిల్వ',
      tabImpact: 'ప్రభావ కొలత',
      tabReference: 'సూచన & సెట్టింగ్స్',
    },
  },
};
