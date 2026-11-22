export type SupportedLanguage = 'en' | 'ta';

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
}

export const translations: Record<SupportedLanguage, TranslationDictionary> = {
  en: {
    brand: 'HUNGERLINK',
    tagline: 'Connecting Every Meal to Someone in Need.',
    nav: {
      dashboard: 'Dashboard',
      donations: 'Donations',
      requests: 'Meal Requests',
      matching: 'Smart Matching',
      safety: 'Food Safety',
      routes: 'RescueRoute',
      mealtrace: 'MealTrace QR',
      fieldIntake: 'Field Intake',
      impact: 'ImpactLedger',
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
      disclaimerTitle: 'Physical Inspection Required',
      disclaimerBody:
        'A digital declaration does not replace physical food-safety inspection. Only authorised inspectors may record final inspection outcomes. Records align with FSSAI surplus food documentation fields and do not represent automatic regulatory certification.',
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
      subtitle: 'Deterministic eligibility gates and weighted scoring for split-batch allocation.',
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
      onlineStatus: 'Online — Direct Supabase submission enabled',
      offlineStatus: 'Offline — Requests will queue locally with UUID idempotency keys',
      saveToOfflineQueue: 'Queue Draft Offline',
      syncNow: 'Synchronise Pending Queue',
      pendingQueue: 'Pending Offline Sync Queue',
      noSmartphoneNotice:
        'Recipients do not need smartphones or app accounts. Field workers log verified requests via phone, walk-in, or outreach visits.',
    },
  },
  ta: {
    brand: 'HUNGERLINK',
    tagline: 'ஒவ்வொரு உணவையும் தேவையுள்ளவரிடம் சேர்க்கும் பாலம்.',
    nav: {
      dashboard: 'முகப்புப் பலகை',
      donations: 'உணவு தானங்கள்',
      requests: 'உணவு கோரிக்கைகள்',
      matching: 'திறன் பொருத்தம்',
      safety: 'உணவுப் பாதுகாப்பு',
      routes: 'விநியோக வழித்தடம்',
      mealtrace: 'MealTrace QR தடம்',
      fieldIntake: 'களப் பதிவு',
      impact: 'தாக்க அறிக்கை',
      admin: 'நிர்வாக மையம்',
      notifications: 'அறிவிப்புகள்',
      onboarding: 'நிறுவன விவரம்',
      setup: 'Supabase அமைப்பு',
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
      disclaimerTitle: 'நேரடி உடல் பரிசோதனை கட்டாயம்',
      disclaimerBody:
        'டிஜிட்டல் அறிவிப்பு ஒருபோதும் நேரடி உணவுப் பாதுகாப்பு பரிசோதனைக்கு மாற்றாகாது. அங்கீகரிக்கப்பட்ட ஆய்வாளர்கள் மட்டுமே இறுதி முடிவைப் பதிவு செய்ய முடியும். இந்தப் பதிவுகள் FSSAI உபரி உணவு வழிகாட்டுதல்களுக்கு ஏற்ப பராமரிக்கப்படுகின்றன; இது தானியங்கி அரசு சான்றிதழ் அல்ல.',
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
      subtitle: 'கண்டிப்பான தகுதி நிபந்தனைகள் மற்றும் எடையிடப்பட்ட மதிப்பெண் அடிப்படையில் பகுதி ஒதுக்கீடு.',
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
      onlineStatus: 'இணைய இணைப்பில் உள்ளது — நேரடி Supabase பதிவு செயல்பாட்டில் உள்ளது',
      offlineStatus: 'இணைய இணைப்பு இல்லை — கோரிக்கைகள் UUID அடையாளத்துடன் உள்ளூரில் சேமிக்கப்படும்',
      saveToOfflineQueue: 'இணையமில்லா வரிசையில் சேமிக்கவும்',
      syncNow: 'நிலுவை வரிசையை ஒத்திசைக்கவும்',
      pendingQueue: 'ஒத்திசைவுக்காகக் காத்திருக்கும் பதிவுகள்',
      noSmartphoneNotice:
        'பயனாளிகள் திறன்பேசி அல்லது செயலி கணக்கு வைத்திருக்கத் தேவையில்லை. களப் பணியாளர்கள் தொலைபேசி அல்லது நேரடிச் சந்திப்பு மூலம் கோரிக்கைகளைப் பதிவு செய்யலாம்.',
    },
  },
};
