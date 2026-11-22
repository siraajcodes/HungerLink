import type { SupportedLanguage } from './translations';
import { translatePhraseHiTe } from './phrasesHiTe';
import type { FoodCompositionCategory } from '../types/nutriloop';

type QuadText = Record<SupportedLanguage, string>;

/**
 * Concise inline multilingual text selector.
 * Supports English ('en'), Tamil ('ta'), Hindi ('hi'), and Telugu ('te').
 * When hi/te are omitted inline, resolves automatically from PHRASES_HI_TE.
 */
export function tx(
  language: SupportedLanguage,
  en: string,
  ta: string,
  hi?: string,
  te?: string
): string {
  if (language === 'en') return en;
  if (language === 'ta') return ta;
  if (language === 'hi') return hi ?? translatePhraseHiTe(en, 'hi');
  return te ?? translatePhraseHiTe(en, 'te');
}

const BATCH_STATUS_LABELS: Record<string, QuadText> = {
  SUBMITTED: { en: 'Submitted', ta: 'சமர்ப்பிக்கப்பட்டது', hi: 'जमा किया गया', te: 'సమర్పించబడింది' },
  PENDING_INSPECTION: {
    en: 'Waiting for safety check',
    ta: 'பாதுகாப்பு ஆய்வுக்குக் காத்திருக்கிறது',
    hi: 'सुरक्षा जाँच की प्रतीक्षा',
    te: 'భద్రతా తనిఖీ కోసం వేచి ఉంది',
  },
  INSPECTION_PASSED: {
    en: 'Safe & ready',
    ta: 'பாதுகாப்பானது & தயார்',
    hi: 'सुरक्षित व तैयार',
    te: 'సురక్షితం & సిద్ధం',
  },
  INSPECTION_REJECTED: {
    en: 'Not approved',
    ta: 'அங்கீகரிக்கப்படவில்லை',
    hi: 'अस्वीकृत',
    te: 'ఆమోదించబడలేదు',
  },
  ALLOCATION_PROPOSED: {
    en: 'Match proposed',
    ta: 'பொருத்தம் முன்மொழியப்பட்டது',
    hi: 'मिलान प्रस्तावित',
    te: 'మ్యాచ్ ప్రతిపాదించబడింది',
  },
  ALLOCATED: {
    en: 'Matched to shelter',
    ta: 'காப்பகத்திற்கு ஒதுக்கப்பட்டது',
    hi: 'आश्रय को आवंटित',
    te: 'ఆశ్రయానికి కేటాయించబడింది',
  },
  DISPATCHED: {
    en: 'Driver assigned',
    ta: 'ஓட்டுநர் நியமிக்கப்பட்டார்',
    hi: 'ड्राइवर नियुक्त',
    te: 'డ్రైవర్ నియమించబడ్డారు',
  },
  PICKED_UP: { en: 'On the way', ta: 'வழியில் உள்ளது', hi: 'रास्ते में है', te: 'మార్గంలో ఉంది' },
  DELIVERED: { en: 'Delivered', ta: 'வழங்கப்பட்டது', hi: 'वितरित', te: 'డెలివరీ అయింది' },
  CANCELLED: { en: 'Cancelled', ta: 'ரத்து செய்யப்பட்டது', hi: 'रद्द', te: 'రద్దు చేయబడింది' },
  EXPIRED: { en: 'Expired', ta: 'காலாவதியானது', hi: 'समय समाप्त', te: 'గడువు ముగిసింది' },
};

export function formatBatchStatus(status: string, language: SupportedLanguage): string {
  const entry = BATCH_STATUS_LABELS[status];
  if (entry) return entry[language];
  return status.replace(/_/g, ' ').toLowerCase();
}

const DIETARY_LABELS: Record<string, QuadText> = {
  ANY: { en: 'Any', ta: 'எதுவும்', hi: 'कोई भी', te: 'ఏదైనా' },
  VEGETARIAN: { en: 'Vegetarian', ta: 'சைவம்', hi: 'शाकाहारी', te: 'శాకాహారం' },
  VEGAN: { en: 'Vegan', ta: 'முழு சைவம் (வீகன்)', hi: 'वीगन (पूर्ण शाकाहारी)', te: 'వీగన్ (పూర్తి శాకాహారం)' },
  JAIN: { en: 'Jain', ta: 'ஜெயின் சைவம்', hi: 'जैन शाकाहारी', te: 'జైన్ శాకాహారం' },
  EGGETARIAN: { en: 'Eggetarian', ta: 'முட்டை சைவம்', hi: 'अंडाहारी', te: 'గుడ్డు శాకాహారం' },
  HALAL: { en: 'Halal', ta: 'ஹலால்', hi: 'हलाल', te: 'హలాల్' },
  NON_VEGETARIAN: { en: 'Non-Vegetarian', ta: 'அசைவம்', hi: 'मांसाहारी', te: 'మాంసాహారం' },
};

export function formatDietary(diet: string, language: SupportedLanguage): string {
  const entry = DIETARY_LABELS[diet];
  if (entry) return entry[language];
  return diet.replace(/_/g, ' ').toLowerCase();
}

const FOOD_CATEGORY_LABELS: Record<string, QuadText> = {
  COOKED_MEALS: {
    en: 'Cooked Hot Meals',
    ta: 'சமைத்த சூடான உணவுகள்',
    hi: 'पका हुआ गर्म भोजन',
    te: 'వండిన వేడి భోజనాలు',
  },
  CHILLED_MEALS: {
    en: 'Chilled Prepared Food',
    ta: 'குளிரூட்டப்பட்ட உணவுகள்',
    hi: 'ठंडा तैयार भोजन',
    te: 'చల్లని తయారైన ఆహారం',
  },
  BAKERY_DRY: {
    en: 'Bakery & Dry Packaged',
    ta: 'பேக்கரி & உலர் உணவுகள்',
    hi: 'बेकरी व सूखा पैक्ड भोजन',
    te: 'బేకరీ & డ్రై ప్యాక్డ్ ఆహారం',
  },
  FRESH_PRODUCE: {
    en: 'Fresh Produce',
    ta: 'புதிய காய்கறிகள் & பழங்கள்',
    hi: 'ताज़ी सब्ज़ियाँ व फल',
    te: 'తాజా కూరగాయలు & పండ్లు',
  },
};

export function formatFoodCategory(cat: string, language: SupportedLanguage): string {
  const entry = FOOD_CATEGORY_LABELS[cat];
  if (entry) return entry[language];
  return cat.replace(/_/g, ' ');
}

const NUTRILOOP_CATEGORY_LABELS: Record<FoodCompositionCategory, QuadText> = {
  CEREALS_GRAINS: { en: 'Grains & Rice', ta: 'தானியங்கள் & அரிசி', hi: 'अनाज व चावल', te: 'ధాన్యాలు & బియ్యం' },
  PULSES_LEGUMES: { en: 'Dal & Pulses', ta: 'பருப்பு & பயறு வகைகள்', hi: 'दाल व दलहन', te: 'పప్పులు & కాయధాన్యాలు' },
  DAIRY_PROTEIN: { en: 'Milk & Paneer', ta: 'பால் & பன்னீர்', hi: 'दूध व पनीर', te: 'పాలు & పన్నీర్' },
  EGG_MEAT_FISH: { en: 'Eggs & Fish', ta: 'முட்டை & மீன்', hi: 'अंडे व मछली', te: 'గుడ్లు & చేపలు' },
  LEAFY_VEGETABLES: { en: 'Leafy Greens', ta: 'கீரை வகைகள்', hi: 'हरी पत्तेदार सब्ज़ियाँ', te: 'ఆకుకూరలు' },
  FRUITS_VEGETABLES: { en: 'Fruits & Veg', ta: 'பழங்கள் & காய்கறிகள்', hi: 'फल व सब्ज़ियाँ', te: 'పండ్లు & కూరగాయలు' },
  NUTS_SEEDS: { en: 'Nuts & Seeds', ta: 'கொட்டைகள் & விதைகள்', hi: 'मेवे व बीज', te: 'గింజలు & విత్తనాలు' },
  MIXED_COOKED_MEAL: { en: 'Cooked Meals', ta: 'சமைத்த உணவுகள்', hi: 'पका हुआ भोजन', te: 'వండిన భోజనాలు' },
};

export function formatNutriCategory(cat: FoodCompositionCategory, language: SupportedLanguage): string {
  return NUTRILOOP_CATEGORY_LABELS[cat]?.[language] ?? cat;
}

const REQUEST_STATUS_LABELS: Record<string, QuadText> = {
  OPEN: { en: 'Open', ta: 'திறந்துள்ளது', hi: 'खुला', te: 'తెరిచి ఉంది' },
  PARTIALLY_ALLOCATED: { en: 'Partially Allocated', ta: 'பகுதி ஒதுக்கப்பட்டது', hi: 'आंशिक आवंटित', te: 'పాక్షికంగా కేటాయించబడింది' },
  FULFILLED: { en: 'Fulfilled', ta: 'நிறைவேற்றப்பட்டது', hi: 'पूर्ण', te: 'పూర్తయింది' },
  CANCELLED: { en: 'Cancelled', ta: 'ரத்து செய்யப்பட்டது', hi: 'रद्द', te: 'రద్దు చేయబడింది' },
  EXPIRED: { en: 'Expired', ta: 'காலாவதியானது', hi: 'समय समाप्त', te: 'గడువు ముగిసింది' },
};

export function formatRequestStatus(status: string, language: SupportedLanguage): string {
  return REQUEST_STATUS_LABELS[status]?.[language] ?? status.replace(/_/g, ' ');
}

const ALLOCATION_STATUS_LABELS: Record<string, QuadText> = {
  PROPOSED: { en: 'Proposed', ta: 'முன்மொழியப்பட்டது', hi: 'प्रस्तावित', te: 'ప్రతిపాదించబడింది' },
  APPROVED: { en: 'Approved', ta: 'அங்கீகரிக்கப்பட்டது', hi: 'स्वीकृत', te: 'ఆమోదించబడింది' },
  ACCEPTED: { en: 'Accepted', ta: 'ஏற்கப்பட்டது', hi: 'स्वीकार किया', te: 'అంగీకరించబడింది' },
  DECLINED: { en: 'Declined', ta: 'மறுக்கப்பட்டது', hi: 'अस्वीकार किया', te: 'తిరస్కరించబడింది' },
  DISPATCHED: { en: 'Dispatched', ta: 'அனுப்பப்பட்டது', hi: 'ड्राइवर नियुक्त', te: 'డ్రైవర్ కేటాయించబడింది' },
  PICKED_UP: { en: 'Picked Up', ta: 'சேகரிக்கப்பட்டது', hi: 'पिकअप हो गया', te: 'పికప్ అయింది' },
  DELIVERED: { en: 'Delivered', ta: 'வழங்கப்பட்டது', hi: 'वितरित', te: 'డెలివరీ అయింది' },
  CANCELLED: { en: 'Cancelled', ta: 'ரத்து செய்யப்பட்டது', hi: 'रद्द', te: 'రద్దు చేయబడింది' },
};

export function formatAllocationStatus(status: string, language: SupportedLanguage): string {
  return ALLOCATION_STATUS_LABELS[status]?.[language] ?? status.replace(/_/g, ' ');
}

const TARGETED_STATUS_LABELS: Record<string, QuadText> = {
  DRAFT_GENERATED: { en: 'Draft', ta: 'வரைவு', hi: 'ड्राफ़्ट', te: 'డ్రాఫ్ట్' },
  APPROVED_PUBLISHED: { en: 'Published', ta: 'வெளியிடப்பட்டது', hi: 'प्रकाशित', te: 'ప్రచురించబడింది' },
  MATCHED: { en: 'Matched', ta: 'பொருத்தப்பட்டது', hi: 'मिलान हो गया', te: 'మ్యాచ్ అయింది' },
  FULFILLED: { en: 'Fulfilled', ta: 'நிறைவேற்றப்பட்டது', hi: 'पूर्ण', te: 'పూర్తయింది' },
  DISMISSED: { en: 'Dismissed', ta: 'தள்ளுபடி செய்யப்பட்டது', hi: 'खारिज', te: 'తొలగించబడింది' },
};

export function formatTargetedStatus(status: string, language: SupportedLanguage): string {
  return TARGETED_STATUS_LABELS[status]?.[language] ?? status.replace(/_/g, ' ').toLowerCase();
}

const INTAKE_CHANNEL_LABELS: Record<string, QuadText> = {
  WEB_PORTAL: { en: 'Web Portal', ta: 'இணையதளம்', hi: 'वेब पोर्टल', te: 'వెబ్ పోర్టల్' },
  FIELD_ASSISTED_PHONE: { en: 'Phone Helpline', ta: 'தொலைபேசி உதவி', hi: 'फ़ोन हेल्पलाइन', te: 'ఫోన్ హెల్ప్‌లైన్' },
  FIELD_ASSISTED_WALKIN: { en: 'Walk-In Desk', ta: 'நேரடி மையம்', hi: 'प्रत्यक्ष डेस्क', te: 'నేరుగా నమోదు' },
  FIELD_ASSISTED_OUTREACH: { en: 'Outreach Visit', ta: 'களப் பார்வை', hi: 'क्षेत्रीय दौरा', te: 'ఫీల్డ్ సందర్శన' },
};

export function formatIntakeChannel(channel: string, language: SupportedLanguage): string {
  return INTAKE_CHANNEL_LABELS[channel]?.[language] ?? channel.replace(/_/g, ' ');
}

const ROUTE_STATUS_LABELS: Record<string, QuadText> = {
  ASSIGNED: { en: 'Assigned', ta: 'ஒதுக்கப்பட்டது', hi: 'नियुक्त', te: 'కేటాయించబడింది' },
  ACCEPTED: { en: 'Accepted', ta: 'ஏற்கப்பட்டது', hi: 'स्वीकृत', te: 'అంగీకరించబడింది' },
  EN_ROUTE_PICKUP: { en: 'En Route to Pickup', ta: 'சேகரிப்புக்குச் செல்கிறது', hi: 'पिकअप के लिए रवाना', te: 'పికప్‌కు బయలుదేరారు' },
  PICKED_UP: { en: 'Picked Up', ta: 'சேகரிக்கப்பட்டது', hi: 'पिकअप हो गया', te: 'పికప్ అయింది' },
  EN_ROUTE_DROPOFF: { en: 'En Route to Drop-off', ta: 'விநியோகத்திற்குச் செல்கிறது', hi: 'डिलीवरी के लिए रवाना', te: 'డెలివరీకి బయలుదేరారు' },
  COMPLETED: { en: 'Completed', ta: 'நிறைவடைந்தது', hi: 'पूर्ण', te: 'పూర్తయింది' },
  CANCELLED: { en: 'Cancelled', ta: 'ரத்து செய்யப்பட்டது', hi: 'रद्द', te: 'రద్దు చేయబడింది' },
  PENDING: { en: 'Pending', ta: 'நிலுவையில்', hi: 'लंबित', te: 'పెండింగ్' },
  ARRIVED: { en: 'Arrived', ta: 'வந்துவிட்டது', hi: 'पहुँच गया', te: 'చేరుకున్నారు' },
};

export function formatRouteStatus(status: string, language: SupportedLanguage): string {
  return ROUTE_STATUS_LABELS[status]?.[language] ?? status.replace(/_/g, ' ');
}

const STOP_TYPE_LABELS: Record<string, QuadText> = {
  PICKUP: { en: 'Pickup', ta: 'சேகரிப்பு', hi: 'पिकअप', te: 'పికప్' },
  DROPOFF: { en: 'Drop-off', ta: 'விநியோகம்', hi: 'डिलीवरी', te: 'డెలివరీ' },
};

export function formatStopType(stopType: string, language: SupportedLanguage): string {
  return STOP_TYPE_LABELS[stopType]?.[language] ?? stopType;
}

const INSPECTION_STATUS_LABELS: Record<string, QuadText> = {
  PASSED: { en: 'Passed', ta: 'தேர்ச்சி', hi: 'उत्तीर्ण', te: 'ఉత్తీర్ణం' },
  REJECTED: { en: 'Rejected', ta: 'நிராகரிக்கப்பட்டது', hi: 'अस्वीकृत', te: 'తిరస్కరించబడింది' },
  PENDING_REVIEW: { en: 'Pending Review', ta: 'மறுஆய்வு நிலுவையில்', hi: 'समीक्षा लंबित', te: 'సమీక్ష పెండింగ్' },
};

export function formatInspectionStatus(status: string, language: SupportedLanguage): string {
  return INSPECTION_STATUS_LABELS[status]?.[language] ?? status;
}

const PACKAGING_LABELS: Record<string, QuadText> = {
  INTACT_SEALED: {
    en: 'Intact & Tamper-Sealed',
    ta: 'உடையாமல் முத்திரையிடப்பட்டது',
    hi: 'सुरक्षित व सीलबंद',
    te: 'సురక్షితం & సీల్ చేయబడింది',
  },
  INSULATED_CLEAN: {
    en: 'Insulated Food-Grade Clean',
    ta: 'வெப்பப் பாதுகாப்பு சுத்தமான பாத்திரம்',
    hi: 'स्वच्छ इंसुलेटेड फूड-ग्रेड कंटेनर',
    te: 'శుభ్రమైన ఇన్సులేటెడ్ ఫుడ్-గ్రేడ్ పాత్ర',
  },
  MINOR_WEAR_ACCEPTABLE: {
    en: 'Minor Exterior Wear (Safe)',
    ta: 'சிறிய வெளிப்புற உராய்வு (பாதுகாப்பானது)',
    hi: 'हल्का बाहरी निशान (सुरक्षित)',
    te: 'స్వల్ప బాహ్య మార్పు (సురక్షితం)',
  },
  COMPROMISED_REJECT: {
    en: 'Compromised / Unsealed (Reject)',
    ta: 'சேதமடைந்தது / திறந்துள்ளது (நிராகரி)',
    hi: 'क्षतिग्रस्त / खुला हुआ (अस्वीकृत)',
    te: 'దెబ్బతిన్నది / తెరిచి ఉంది (తిరస్కరించు)',
  },
  TEMP_DANGER_ZONE: {
    en: 'Temperature Danger Zone',
    ta: 'அபாயகரமான வெப்பநிலை',
    hi: 'असुरक्षित तापमान स्तर',
    te: 'ప్రమాదకర ఉష్ణోగ్రత స్థాయి',
  },
  EXPIRED_WINDOW: {
    en: 'Consume-By Window Expired',
    ta: 'உட்கொள்ளும் நேரம் முடிந்தது',
    hi: 'सेवन समय-सीमा समाप्त',
    te: 'తినవలసిన గడువు ముగిసింది',
  },
};

export function formatPackagingCondition(cond: string, language: SupportedLanguage): string {
  return PACKAGING_LABELS[cond]?.[language] ?? cond.replace(/_/g, ' ');
}

const MEALTRACE_EVENT_LABELS: Record<string, QuadText> = {
  DONATION_SUBMITTED: { en: 'Donation Submitted', ta: 'உணவு தானம் சமர்ப்பிக்கப்பட்டது', hi: 'भोजन दान जमा हुआ', te: 'ఆహార దానం సమర్పించబడింది' },
  BATCH_SUBMITTED: { en: 'Batch Submitted', ta: 'உணவுத் தொகுதி சமர்ப்பிக்கப்பட்டது', hi: 'बैच जमा हुआ', te: 'బ్యాచ్ సమర్పించబడింది' },
  INSPECTION_PASSED: { en: 'Safety Check Passed', ta: 'பாதுகாப்பு ஆய்வு தேர்ச்சி', hi: 'सुरक्षा जाँच उत्तीर्ण', te: 'భద్రతా తనిఖీ ఉత్తీర్ణం' },
  INSPECTION_REJECTED: { en: 'Safety Check Rejected', ta: 'பாதுகாப்பு ஆய்வு நிராகரிப்பு', hi: 'सुरक्षा जाँच अस्वीकृत', te: 'భద్రతా తనిఖీ తిరస్కరణ' },
  QR_GENERATED: { en: 'QR Code Generated', ta: 'QR குறியீடு உருவாக்கப்பட்டது', hi: 'QR कोड बनाया गया', te: 'QR కోడ్ రూపొందించబడింది' },
  SAFETY_PASSED: { en: 'Safety Check Passed', ta: 'பாதுகாப்பு ஆய்வு தேர்ச்சி', hi: 'सुरक्षा जाँच उत्तीर्ण', te: 'భద్రతా తనిఖీ ఉత్తీర్ణం' },
  SAFETY_REJECTED: { en: 'Safety Check Rejected', ta: 'பாதுகாப்பு ஆய்வு நிராகரிப்பு', hi: 'सुरक्षा जाँच अस्वीकृत', te: 'భద్రతా తనిఖీ తిరస్కరణ' },
  ALLOCATION_APPROVED: { en: 'Matched & Driver Assigned', ta: 'பொருத்தம் & ஓட்டுநர் நியமனம்', hi: 'मिलान व ड्राइवर नियुक्त', te: 'మ్యాచ్ & డ్రైవర్ నియామకం' },
  PICKUP_SCANNED: { en: 'Pickup Scanned', ta: 'சேகரிப்பு ஸ்கேன் செய்யப்பட்டது', hi: 'पिकअप स्कैन हुआ', te: 'పికప్ స్కాన్ అయింది' },
  HANDOVER_SCANNED: { en: 'Handover Scanned', ta: 'ஒப்படைப்பு ஸ்கேன் செய்யப்பட்டது', hi: 'सुपुर्दगी स्कैन हुई', te: 'అప్పగింత స్కాన్ అయింది' },
  PORTIONS_CONFIRMED: { en: 'Portions Confirmed', ta: 'பங்குகள் உறுதிப்படுத்தப்பட்டன', hi: 'भोजन संख्या की पुष्टि', te: 'భోజనాల సంఖ్య నిర్ధారించబడింది' },
  CANCELLED: { en: 'Cancelled', ta: 'ரத்து செய்யப்பட்டது', hi: 'रद्द किया गया', te: 'రద్దు చేయబడింది' },
};

export function formatMealTraceEvent(eventType: string, language: SupportedLanguage): string {
  return MEALTRACE_EVENT_LABELS[eventType]?.[language] ?? eventType.replace(/_/g, ' ');
}

const INVENTORY_STAGE_LABELS: Record<string, QuadText> = {
  AVAILABLE: { en: 'In Kitchen (Available)', ta: 'சமையலறையில் இருப்பு', hi: 'रसोई में उपलब्ध', te: 'వంటగదిలో అందుబాటు' },
  DISTRIBUTED: { en: 'Handed Out (Distributed)', ta: 'விநியோகிக்கப்பட்டது', hi: 'वितरित किया गया', te: 'పంపిణీ చేయబడింది' },
  REPORTED_CONSUMED: { en: 'Reported Eaten', ta: 'உட்கொள்ளப்பட்டதாகப் பதிவு', hi: 'उपभोग दर्ज', te: 'తిన్నట్లు నమోదు' },
};

export function formatInventoryStage(stage: string, language: SupportedLanguage): string {
  return INVENTORY_STAGE_LABELS[stage]?.[language] ?? stage.replace(/_/g, ' ').toLowerCase();
}

const VERIFICATION_STATUS_LABELS: Record<string, QuadText> = {
  verified: { en: 'Verified', ta: 'சரிபார்க்கப்பட்டது', hi: 'सत्यापित', te: 'ధృవీకరించబడింది' },
  pending: { en: 'Pending', ta: 'நிலுவையில்', hi: 'लंबित', te: 'పెండింగ్' },
  rejected: { en: 'Rejected', ta: 'நிராகரிக்கப்பட்டது', hi: 'अस्वीकृत', te: 'తిరస్కరించబడింది' },
  suspended: { en: 'Suspended', ta: 'இடைநிறுத்தப்பட்டது', hi: 'निलंबित', te: 'సస్పెండ్ చేయబడింది' },
};

export function formatVerificationStatus(status: string, language: SupportedLanguage): string {
  return VERIFICATION_STATUS_LABELS[status]?.[language] ?? status;
}

const INCIDENT_TYPE_LABELS: Record<string, QuadText> = {
  TEMP_DEVIATION: { en: 'Temperature Deviation', ta: 'வெப்பநிலை மாற்றம்', hi: 'तापमान विचलन', te: 'ఉష్ణోగ్రత తేడా' },
  PACKAGING_DAMAGE: { en: 'Packaging Damage', ta: 'பேக்கேஜிங் சேதம்', hi: 'पैकेजिंग क्षति', te: 'ప్యాకేజింగ్ నష్టం' },
  DELIVERY_DELAY: { en: 'Delivery Delay', ta: 'விநியோக தாமதம்', hi: 'डिलीवरी में देरी', te: 'డెలివరీ ఆలస్యం' },
  QUANTITY_DISCREPANCY: { en: 'Quantity Discrepancy', ta: 'அளவு வேறுபாடு', hi: 'मात्रा में अंतर', te: 'పరిమాణంలో తేడా' },
  SAFETY_CONCERN: { en: 'Food Safety Concern', ta: 'உணவுப் பாதுகாப்பு சிக்கல்', hi: 'खाद्य सुरक्षा चिंता', te: 'ఆహార భద్రతా సమస్య' },
  OTHER: { en: 'Other', ta: 'மற்றவை', hi: 'अन्य', te: 'ఇతర' },
};

export function formatIncidentType(type: string, language: SupportedLanguage): string {
  return INCIDENT_TYPE_LABELS[type]?.[language] ?? type.replace(/_/g, ' ');
}

const INCIDENT_STATUS_LABELS: Record<string, QuadText> = {
  OPEN: { en: 'Open', ta: 'திறந்துள்ளது', hi: 'खुला', te: 'తెరిచి ఉంది' },
  INVESTIGATING: { en: 'Investigating', ta: 'ஆய்வில் உள்ளது', hi: 'जाँच जारी', te: 'దర్యాప్తులో ఉంది' },
  RESOLVED: { en: 'Resolved', ta: 'தீர்க்கப்பட்டது', hi: 'सुलझाया गया', te: 'పరిష్కరించబడింది' },
  CLOSED: { en: 'Closed', ta: 'மூடப்பட்டது', hi: 'बंद', te: 'మూసివేయబడింది' },
};

export function formatIncidentStatus(status: string, language: SupportedLanguage): string {
  return INCIDENT_STATUS_LABELS[status]?.[language] ?? status;
}

const ORG_TYPE_LABELS: Record<string, QuadText> = {
  FOOD_DONOR: { en: 'Food Donor', ta: 'உணவு தானதாரர்', hi: 'भोजन दाता', te: 'ఆహార దాత' },
  VERIFIED_NGO: { en: 'Verified NGO', ta: 'தன்னார்வ நிறுவனம்', hi: 'सत्यापित एनजीओ', te: 'ధృవీకరించబడిన NGO' },
  COMMUNITY_KITCHEN: { en: 'Community Kitchen', ta: 'சமூக சமையலறை', hi: 'सामुदायिक रसोई', te: 'కమ్యూనిటీ కిచెన్' },
  DELIVERY_PARTNER: { en: 'Delivery Partner', ta: 'விநியோகப் பங்குதாரர்', hi: 'डिलीवरी पार्टनर', te: 'డెలివరీ పార్టనర్' },
};

export function formatOrgType(orgType: string, language: SupportedLanguage): string {
  return ORG_TYPE_LABELS[orgType]?.[language] ?? orgType.replace(/_/g, ' ');
}

const NUTRIENT_LABELS: Record<string, { ta: string; hi: string; te: string }> = {
  'Calories (Energy)': { ta: 'கலோரிகள் (ஆற்றல்)', hi: 'कैलोरी (ऊर्जा)', te: 'కేలరీలు (శక్తి)' },
  Calories: { ta: 'கலோரிகள்', hi: 'कैलोरी', te: 'కేలరీలు' },
  Protein: { ta: 'புரதம்', hi: 'प्रोटीन', te: 'ప్రోటీన్' },
  Iron: { ta: 'இரும்புச்சத்து', hi: 'आयरन (लौह)', te: 'ఐరన్ (ఇనుము)' },
  Calcium: { ta: 'கால்சியம்', hi: 'कैल्शियम', te: 'కాల్షియం' },
  'Vitamin A (RAE)': { ta: 'வைட்டமின் A', hi: 'विटामिन A', te: 'విటమిన్ A' },
  'Vitamin A': { ta: 'வைட்டமின் A', hi: 'विटामिन A', te: 'విటమిన్ A' },
  'Dietary Fibre': { ta: 'நார்ச்சத்து', hi: 'फ़ाइबर (रेशा)', te: 'ఫైబర్ (పీచు)' },
  'Vitamin C': { ta: 'வைட்டமின் C', hi: 'विटामिन C', te: 'విటమిన్ C' },
};

export function formatNutrientName(name: string, language: SupportedLanguage, short = false): string {
  if (language === 'en') {
    return short ? name.replace(' (Energy)', '').replace(' (RAE)', '') : name;
  }
  const clean = name.replace(' (Energy)', '').replace(' (RAE)', '');
  const entry = NUTRIENT_LABELS[name] ?? NUTRIENT_LABELS[clean];
  return entry ? entry[language] : name;
}

const FOOD_NAME_MAP: Record<string, { ta: string; hi: string; te: string }> = {
  'Steamed Parboiled White Rice (Cooked)': {
    ta: 'வேகவைத்த புழுங்கல் அரிசி சாதம்',
    hi: 'उबला हुआ चावल (पका हुआ)',
    te: 'ఉడికించిన అన్నం',
  },
  'Sambar Sadam & Vegetable Poriyal (Prepared)': {
    ta: 'சாம்பார் சாதம் & காய்கறி பொரியல்',
    hi: 'सांभर चावल और सब्ज़ी पोरियल',
    te: 'సాంబార్ అన్నం & కూరగాయల వేపుడు',
  },
  'Red Gram (Toor) Dal Tadka (Cooked)': {
    ta: 'துவரம் பருப்பு கடைசல்',
    hi: 'अरहर (तूर) दाल तड़का',
    te: 'కందిపప్పు తాలింపు',
  },
  'Bengal Gram / Chickpea (Chana) Curry': {
    ta: 'கொண்டைக்கடலை (சன்னா) குழம்பு',
    hi: 'काबुली चना करी',
    te: 'శనగల కూర',
  },
  'Soya Chunks Protein Curry (Cooked)': {
    ta: 'சோயா உருண்டை புரதக் குழம்பு',
    hi: 'सोया चंक्स प्रोटीन करी',
    te: 'సోయా చంక్స్ ప్రోటీన్ కూర',
  },
  'Paneer & Green Peas Masala': {
    ta: 'பன்னீர் & பச்சை பட்டாணி மசாலா',
    hi: 'पनीर और मटर मसाला',
    te: 'పన్నీర్ & పచ్చి బఠానీ మసాలా',
  },
  'Amaranth & Drumstick Leaves (Keerai) Stir-Fry': {
    ta: 'முருங்கை & அரைக்கீரை பொரியல்',
    hi: 'चौलाई और सहजन पत्ती सब्ज़ी',
    te: 'తోటకూర & మునగాకు వేపుడు',
  },
  'Finger Millet (Ragi) Porridge / Mudde': {
    ta: 'கேழ்வரகு (ராகி) கூழ் / களி',
    hi: 'रागी दलिया / मुड्डे',
    te: 'రాగి జావ / సంగటి',
  },
  'Toned Milk / Plain Curd (Dahi)': {
    ta: 'பால் / தயிர்',
    hi: 'टोन्ड दूध / सादा दही',
    te: 'పాలు / పెరుగు',
  },
  'Boiled Hen Eggs (2 Eggs Portion)': {
    ta: 'அவித்த முட்டை (2 முட்டைகள்)',
    hi: 'उबले अंडे (2 अंडे)',
    te: 'ఉడికించిన గుడ్లు (2 గుడ్లు)',
  },
  'Carrot, Pumpkin & Sweet Potato Stew': {
    ta: 'கேரட், பூசணி & சர்க்கரைவள்ளி கூட்டு',
    hi: 'गाजर, कद्दू और शकरकंद स्टू',
    te: 'క్యారెట్, గుమ్మడికాయ & చిలగడదుంప కూర',
  },
  'Boiled Groundnut & Green Gram Sundal': {
    ta: 'வேர்க்கடலை & பாசிப்பயறு சுண்டல்',
    hi: 'उबली मूंगफली और मूंग सुंडल',
    te: 'ఉడికించిన వేరుశనగ & పెసర గుగ్గిళ్ళు',
  },
  'Sambar Sadam, Curd Rice & Vegetable Poriyal': {
    ta: 'சாம்பார் சாதம், தயிர் சாதம் & காய்கறி பொரியல்',
    hi: 'सांभर चावल, दही चावल और सब्ज़ी',
    te: 'సాంబార్ అన్నం, పెరుగు అన్నం & కూరగాయల వేపుడు',
  },
  'Soya Chunks Protein Curry & Toor Dal (Awaiting Physical Inspection)': {
    ta: 'சோயா புரதக் குழம்பு & துவரம் பருப்பு',
    hi: 'सोया प्रोटीन करी और अरहर दाल',
    te: 'సోయా ప్రోటీన్ కూర & కందిపప్పు',
  },
};

export function formatFoodName(name: string, language: SupportedLanguage): string {
  if (language === 'en') return name;
  return FOOD_NAME_MAP[name]?.[language] ?? name;
}

const DEMO_ORG_MAP: Record<string, { ta: string; hi: string; te: string }> = {
  'Wedding Hall A [Demo]': {
    ta: 'திருமண மண்டபம் A [மாதிரி]',
    hi: 'वेडिंग हॉल A [डेमो]',
    te: 'వెడ్డింగ్ హాల్ A [డెమో]',
  },
  'Shelter A — Adyar Care Home [Demo]': {
    ta: 'காப்பகம் A — அடையாறு பராமரிப்பு இல்லம் [மாதிரி]',
    hi: 'आश्रय A — अडयार केयर होम [डेमो]',
    te: 'ఆశ్రయం A — అడయార్ కేర్ హోమ్ [డెమో]',
  },
  'Community Kitchen B — Velachery [Demo]': {
    ta: 'சமூக சமையலறை B — வேளச்சேரி [மாதிரி]',
    hi: 'सामुदायिक रसोई B — वेलाचेरी [डेमो]',
    te: 'కమ్యూనిటీ కిచెన్ B — వేలచ్చేరి [డెమో]',
  },
  'T. Nagar Youth Hostel [Demo Pending]': {
    ta: 'தி. நகர் இளைஞர் விடுதி [சரிபார்ப்பு நிலுவை]',
    hi: 'टी. नगर यूथ हॉस्टल [सत्यापन लंबित]',
    te: 'టి. నగర్ యూత్ హాస్టల్ [ధృవీకరణ పెండింగ్]',
  },
};

export function formatOrgName(name: string | undefined, language: SupportedLanguage): string {
  if (!name) return '';
  if (language === 'en') return name;
  return DEMO_ORG_MAP[name]?.[language] ?? name;
}

const DEMO_TEXT_MAP: Record<string, { ta: string; hi: string; te: string }> = {
  'Batch HL-DEMO-2026-001 Passed Inspection': {
    ta: 'தொகுதி HL-DEMO-2026-001 பாதுகாப்பு ஆய்வில் தேர்ச்சி பெற்றது',
    hi: 'बैच HL-DEMO-2026-001 सुरक्षा जाँच में उत्तीर्ण',
    te: 'బ్యాచ్ HL-DEMO-2026-001 భద్రతా తనిఖీలో ఉత్తీర్ణమైంది',
  },
  'Wedding Hall A (100 vegetarian portions) passed physical safety inspection and is ready for Smart Matching.': {
    ta: 'திருமண மண்டபம் A (100 சைவ பங்குகள்) பாதுகாப்பு ஆய்வில் தேர்ச்சி பெற்று பொருத்தத்திற்குத் தயாராக உள்ளது.',
    hi: 'वेडिंग हॉल A (100 शाकाहारी भोजन) सुरक्षा जाँच में उत्तीर्ण हो गया है और मिलान के लिए तैयार है।',
    te: 'వెడ్డింగ్ హాల్ A (100 శాకాహార భోజనాలు) భద్రతా తనిఖీలో ఉత్తీర్ణమై మ్యాచింగ్‌కు సిద్ధంగా ఉంది.',
  },
  'New Organisation Awaiting Verification': {
    ta: 'புதிய நிறுவனம் சரிபார்ப்புக்காகக் காத்திருக்கிறது',
    hi: 'नया संगठन सत्यापन की प्रतीक्षा में',
    te: 'కొత్త సంస్థ ధృవీకరణ కోసం వేచి ఉంది',
  },
  'T. Nagar Youth Hostel submitted registration credentials for administrator verification.': {
    ta: 'தி. நகர் இளைஞர் விடுதி நிர்வாகி சரிபார்ப்புக்காகப் பதிவு ஆவணங்களைச் சமர்ப்பித்துள்ளது.',
    hi: 'टी. नगर यूथ हॉस्टल ने प्रशासक सत्यापन के लिए पंजीकरण दस्तावेज़ जमा किए हैं।',
    te: 'టి. నగర్ యూత్ హాస్టల్ అడ్మినిస్ట్రేటర్ ధృవీకరణ కోసం నమోదు పత్రాలను సమర్పించింది.',
  },
  'Evening hot meal service for 60 residents at Shelter A.': {
    ta: 'காப்பகம் A-இன் 60 குடியிருப்பாளர்களுக்கான மாலை சூடான உணவு சேவை.',
    hi: 'आश्रय A के 60 निवासियों के लिए शाम का गर्म भोजन।',
    te: 'ఆశ్రయం A లోని 60 మంది నివాసితులకు సాయంత్రం వేడి భోజనం.',
  },
  'Community Kitchen B dinner counter for daily-wage workers.': {
    ta: 'தினக்கூலித் தொழிலாளர்களுக்கான சமூக சமையலறை B இரவு உணவு மையம்.',
    hi: 'दैनिक मज़दूरों के लिए सामुदायिक रसोई B का रात्रि भोजन।',
    te: 'రోజువారీ కూలీల కోసం కమ్యూనిటీ కిచెన్ B రాత్రి భోజనం.',
  },
  '4x Food-grade stainless insulated cambro containers, tamper-sealed': {
    ta: '4x வெப்பப் பாதுகாப்பு எஃகு பாத்திரங்கள், முத்திரையிடப்பட்டவை',
    hi: '4x इंसुलेटेड स्टेनलेस स्टील कंटेनर, सीलबंद',
    te: '4x ఇన్సులేటెడ్ స్టెయిన్‌లెస్ స్టీల్ కంటైనర్లు, సీల్ చేయబడినవి',
  },
  '2x Sealed steel chafing trays': {
    ta: '2x முத்திரையிடப்பட்ட எஃகு தட்டுகள்',
    hi: '2x सीलबंद स्टील ट्रे',
    te: '2x సీల్ చేసిన స్టీల్ ట్రేలు',
  },
  'Core temperature 64.5°C verified by probe; containers tamper-sealed and clean.': {
    ta: 'உள் வெப்பநிலை 64.5°C உறுதிசெய்யப்பட்டது; பாத்திரங்கள் சுத்தமாகவும் முத்திரையிடப்பட்டும் உள்ளன.',
    hi: 'तापमान 64.5°C सत्यापित; कंटेनर साफ़ और सीलबंद हैं।',
    te: 'ఉష్ణోగ్రత 64.5°C ధృవీకరించబడింది; కంటైనర్లు శుభ్రంగా మరియు సీల్ చేయబడి ఉన్నాయి.',
  },
};

export function formatDynamicDemoText(text: string | null | undefined, language: SupportedLanguage): string {
  if (!text) return '';
  if (language === 'en') return text;
  return DEMO_TEXT_MAP[text]?.[language] ?? text;
}

const TOAST_EXACT_MAP: Record<string, { ta: string; hi: string; te: string }> = {
  'Demo Scenario Reset': { ta: 'மாதிரி காட்சி மீட்டமைக்கப்பட்டது', hi: 'डेमो डेटा रीसेट हो गया', te: 'డెమో డేటా రీసెట్ చేయబడింది' },
  'Wedding Hall A (100) / Shelter A (60) / Kitchen B (30) restored.': {
    ta: 'திருமண மண்டபம் A (100) / காப்பகம் A (60) / சமையலறை B (30) மீட்டமைக்கப்பட்டது.',
    hi: 'वेडिंग हॉल A (100) / आश्रय A (60) / रसोई B (30) पुनः लोड हुआ।',
    te: 'వెడ్డింగ్ హాల్ A (100) / ఆశ్రయం A (60) / కిచెన్ B (30) పునరుద్ధరించబడింది.',
  },
  'Isolated Demo Mode Active': {
    ta: 'தனிமைப்படுத்தப்பட்ட மாதிரி முறை இயக்கத்தில்',
    hi: 'डेमो मोड सक्रिय है',
    te: 'డెమో మోడ్ సక్రియంగా ఉంది',
  },
  'Session refreshed': { ta: 'அமர்வு புதுப்பிக்கப்பட்டது', hi: 'सत्र रीफ़्रेश हुआ', te: 'సెషన్ రిఫ్రెష్ అయింది' },
  'Session refresh failed': { ta: 'அமர்வு புதுப்பிப்பு தோல்வியடைந்தது', hi: 'सत्र रीफ़्रेश विफल', te: 'సెషన్ రిఫ్రెష్ విఫలమైంది' },
  'Organisation registered (Pending Verification)': {
    ta: 'நிறுவனம் பதிவு செய்யப்பட்டது (சரிபார்ப்பு நிலுவையில்)',
    hi: 'संगठन पंजीकृत (सत्यापन लंबित)',
    te: 'సంస్థ నమోదైంది (ధృవీకరణ పెండింగ్)',
  },
  'Organisation registered': { ta: 'நிறுவனம் பதிவு செய்யப்பட்டது', hi: 'संगठन पंजीकृत हुआ', te: 'సంస్థ నమోదైంది' },
  'Your organisation is now pending administrator verification.': {
    ta: 'உங்கள் நிறுவனம் இப்போது நிர்வாகி சரிபார்ப்புக்காகக் காத்திருக்கிறது.',
    hi: 'आपका संगठन अब प्रशासक सत्यापन की प्रतीक्षा में है।',
    te: 'మీ సంస్థ ఇప్పుడు అడ్మినిస్ట్రేటర్ ధృవీకరణ కోసం వేచి ఉంది.',
  },
  'Donation updated': { ta: 'உணவு தானம் புதுப்பிக்கப்பட்டது', hi: 'भोजन दान अपडेट हुआ', te: 'ఆహార దానం అప్‌డేట్ అయింది' },
  'Donation cancelled': { ta: 'உணவு தானம் ரத்து செய்யப்பட்டது', hi: 'भोजन दान रद्द हुआ', te: 'ఆహార దానం రద్దు చేయబడింది' },
  'Meal request recorded': { ta: 'உணவு கோரிக்கை பதிவு செய்யப்பட்டது', hi: 'भोजन अनुरोध दर्ज हुआ', te: 'భోజన అభ్యర్థన నమోదైంది' },
  'Meal request submitted': { ta: 'உணவு கோரிக்கை சமர்ப்பிக்கப்பட்டது', hi: 'भोजन अनुरोध जमा हुआ', te: 'భోజన అభ్యర్థన సమర్పించబడింది' },
  'Split allocations proposed via transactional RPC': {
    ta: 'பகுதி ஒதுக்கீடுகள் முன்மொழியப்பட்டன',
    hi: 'आवंटन प्रस्तावित किए गए',
    te: 'కేటాయింపులు ప్రతిపాదించబడ్డాయి',
  },
  'Allocation approved by coordinator': {
    ta: 'ஒதுக்கீடு ஒருங்கிணைப்பாளரால் அங்கீகரிக்கப்பட்டது',
    hi: 'आवंटन स्वीकृत किया गया',
    te: 'కేటాయింపు ఆమోదించబడింది',
  },
  'Allocation approved': { ta: 'ஒதுக்கீடு அங்கீகரிக்கப்பட்டது', hi: 'आवंटन स्वीकृत', te: 'కేటాయింపు ఆమోదించబడింది' },
  'Allocation accepted': { ta: 'ஒதுக்கீடு ஏற்கப்பட்டது', hi: 'आवंटन स्वीकार किया गया', te: 'కేటాయింపు అంగీకరించబడింది' },
  'Allocation declined': { ta: 'ஒதுக்கீடு மறுக்கப்பட்டது', hi: 'आवंटन अस्वीकार किया गया', te: 'కేటాయింపు తిరస్కరించబడింది' },
  'Delivery route dispatched': { ta: 'விநியோக வழித்தடம் அனுப்பப்பட்டது', hi: 'डिलीवरी रूट नियुक्त हुआ', te: 'డెలివరీ రూట్ కేటాయించబడింది' },
  'Receiving capacity updated': { ta: 'பெறும் திறன் புதுப்பிக்கப்பட்டது', hi: 'प्राप्ति क्षमता अपडेट हुई', te: 'స్వీకరణ సామర్థ్యం అప్‌డేట్ అయింది' },
  'Incident reported for administrator review': {
    ta: 'சிக்கல் நிர்வாகி மறுஆய்வுக்குப் பதிவு செய்யப்பட்டது',
    hi: 'घटना प्रशासक समीक्षा हेतु दर्ज हुई',
    te: 'సంఘటన అడ్మినిస్ట్రేటర్ సమీక్ష కోసం నమోదైంది',
  },
  'Incident logged': { ta: 'சிக்கல் பதிவு செய்யப்பட்டது', hi: 'घटना दर्ज हुई', te: 'సంఘటన నమోదైంది' },
  'Community nutrition profile saved': {
    ta: 'சமூக ஊட்டச்சத்து சுயவிவரம் சேமிக்கப்பட்டது',
    hi: 'सामुदायिक पोषण प्रोफ़ाइल सहेजी गई',
    te: 'కమ్యూనిటీ పోషకాహార ప్రొఫైల్ సేవ్ అయింది',
  },
  'Community food inventory recorded': {
    ta: 'சமூக உணவு இருப்பு பதிவு செய்யப்பட்டது',
    hi: 'सामुदायिक भोजन स्टॉक दर्ज हुआ',
    te: 'కమ్యూనిటీ ఆహార నిల్వ నమోదైంది',
  },
  'Community inventory logged': {
    ta: 'சமூக உணவு இருப்பு பதிவு செய்யப்பட்டது',
    hi: 'सामुदायिक भोजन स्टॉक दर्ज हुआ',
    te: 'కమ్యూనిటీ ఆహార నిల్వ నమోదైంది',
  },
  'Targeted request approved & published': {
    ta: 'இலக்கு உணவு கோரிக்கை அங்கீகரிக்கப்பட்டு வெளியிடப்பட்டது',
    hi: 'लक्षित अनुरोध स्वीकृत व प्रकाशित',
    te: 'లక్ష్యిత అభ్యర్థన ఆమోదించి ప్రచురించబడింది',
  },
  'Targeted request dismissed': {
    ta: 'இலக்கு கோரிக்கை தள்ளுபடி செய்யப்பட்டது',
    hi: 'लक्षित अनुरोध खारिज किया गया',
    te: 'లక్ష్యిత అభ్యర్థన తొలగించబడింది',
  },
  'Food composition reference saved': {
    ta: 'உணவு ஊட்டச்சத்து விவரம் சேமிக்கப்பட்டது',
    hi: 'भोजन पोषण संदर्भ सहेजा गया',
    te: 'ఆహార పోషకాహార సూచన సేవ్ అయింది',
  },
  'Saved to Offline Sync Queue': {
    ta: 'இணையமில்லா வரிசையில் சேமிக்கப்பட்டது',
    hi: 'ऑफ़लाइन कतार में सहेजा गया',
    te: 'ఆఫ్‌లైన్ క్యూలో సేవ్ చేయబడింది',
  },
  'Device is offline': { ta: 'சாதனம் இணைய இணைப்பில் இல்லை', hi: 'डिवाइस ऑफ़लाइन है', te: 'పరికరం ఆఫ్‌లైన్‌లో ఉంది' },
  'Reconnect before syncing pending drafts.': {
    ta: 'நிலுவைப் பதிவுகளை ஒத்திசைக்க இணையத்தில் இணைக்கவும்.',
    hi: 'लंबित ड्राफ़्ट सिंक करने से पहले इंटरनेट से जुड़ें।',
    te: 'పెండింగ్ డ్రాఫ్ట్‌లను సింక్ చేయడానికి ఇంటర్నెట్‌కు కనెక్ట్ అవ్వండి.',
  },
  'Offline queue sync finished': {
    ta: 'இணையமில்லா வரிசை ஒத்திசைவு முடிந்தது',
    hi: 'ऑफ़लाइन कतार सिंक पूर्ण',
    te: 'ఆఫ్‌లైన్ క్యూ సింక్ పూర్తయింది',
  },
};

export function translateToastText(text: string | undefined, language: SupportedLanguage): string | undefined {
  if (!text || language === 'en') return text;
  if (TOAST_EXACT_MAP[text]) return TOAST_EXACT_MAP[text][language];
  if (text.startsWith('Demo Persona: ')) {
    const roleLabel = text.replace('Demo Persona: ', '');
    return language === 'ta'
      ? `மாதிரிப் பாத்திரம்: ${roleLabel}`
      : language === 'hi'
      ? `डेमो भूमिका: ${roleLabel}`
      : `డెమో పాత్ర: ${roleLabel}`;
  }
  if (text.startsWith('Auto-Dispatched: ')) {
    const rest = text.replace('Auto-Dispatched: ', '');
    return language === 'ta'
      ? `தானியங்கி விநியோகம்: ${rest}`
      : language === 'hi'
      ? `स्वतः डिस्पैच हुआ: ${rest}`
      : `ఆటో-డిస్పాచ్ అయింది: ${rest}`;
  }
  if (text.startsWith('Auto-Safety Blocked: ')) {
    const rest = text.replace('Auto-Safety Blocked: ', '');
    return language === 'ta'
      ? `பாதுகாப்பு தடுப்பு: ${rest}`
      : language === 'hi'
      ? `सुरक्षा जाँच में रोका गया: ${rest}`
      : `భద్రతా తనిఖీలో నిరోధించబడింది: ${rest}`;
  }
  if (text.startsWith('Donation ') && text.endsWith(' submitted')) {
    const code = text.replace('Donation ', '').replace(' submitted', '');
    return language === 'ta'
      ? `உணவு தானம் ${code} சமர்ப்பிக்கப்பட்டது`
      : language === 'hi'
      ? `भोजन दान ${code} जमा हुआ`
      : `ఆహార దానం ${code} సమర్పించబడింది`;
  }
  if (text.startsWith('Inspection recorded: ')) {
    const st = formatInspectionStatus(text.replace('Inspection recorded: ', ''), language);
    return language === 'ta'
      ? `பாதுகாப்பு ஆய்வு பதிவு: ${st}`
      : language === 'hi'
      ? `निरीक्षण दर्ज: ${st}`
      : `తనిఖీ నమోదైంది: ${st}`;
  }
  if (text.startsWith('Route status updated to ') || text.startsWith('Route updated: ')) {
    const raw = text.replace('Route status updated to ', '').replace('Route updated: ', '');
    const st = formatRouteStatus(raw, language);
    return language === 'ta'
      ? `வழித்தட நிலை: ${st}`
      : language === 'hi'
      ? `रूट स्थिति अपडेट: ${st}`
      : `రూట్ స్థితి అప్‌డేట్: ${st}`;
  }
  if (text.startsWith('MealTrace event logged: ')) {
    const ev = formatMealTraceEvent(text.replace('MealTrace event logged: ', ''), language);
    return language === 'ta'
      ? `QR தடம் பதிவு: ${ev}`
      : language === 'hi'
      ? `QR इवेंट दर्ज: ${ev}`
      : `QR ఈవెంట్ నమోదైంది: ${ev}`;
  }
  if (text.startsWith('Organisation marked ')) {
    const st = formatVerificationStatus(text.replace('Organisation marked ', ''), language);
    return language === 'ta'
      ? `நிறுவன நிலை: ${st}`
      : language === 'hi'
      ? `संगठन स्थिति: ${st}`
      : `సంస్థ స్థితి: ${st}`;
  }
  if (text.startsWith('Incident updated to ')) {
    const st = formatIncidentStatus(text.replace('Incident updated to ', ''), language);
    return language === 'ta'
      ? `சிக்கல் நிலை: ${st}`
      : language === 'hi'
      ? `घटना स्थिति: ${st}`
      : `సంఘటన స్థితి: ${st}`;
  }
  if (text.startsWith('Assigned to ')) {
    const who = text.replace('Assigned to ', '');
    return language === 'ta'
      ? `ஒதுக்கப்பட்டவர்: ${who}`
      : language === 'hi'
      ? `नियुक्त ड्राइवर: ${who}`
      : `నియమిత డ్రైవర్: ${who}`;
  }
  return formatDynamicDemoText(text, language);
}
