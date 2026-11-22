import type { SupportedLanguage } from './translations';
import type { FoodCompositionCategory } from '../types/nutriloop';

/**
 * Concise inline bilingual text selector.
 * Returns the Tamil string when `language === 'ta'`, otherwise English.
 */
export function tx(language: SupportedLanguage, en: string, ta: string): string {
  return language === 'ta' ? ta : en;
}

const BATCH_STATUS_LABELS: Record<string, { en: string; ta: string }> = {
  SUBMITTED: { en: 'Submitted', ta: 'சமர்ப்பிக்கப்பட்டது' },
  PENDING_INSPECTION: { en: 'Waiting for safety check', ta: 'பாதுகாப்பு ஆய்வுக்குக் காத்திருக்கிறது' },
  INSPECTION_PASSED: { en: 'Safe & ready', ta: 'பாதுகாப்பானது & தயார்' },
  INSPECTION_REJECTED: { en: 'Not approved', ta: 'அங்கீகரிக்கப்படவில்லை' },
  ALLOCATION_PROPOSED: { en: 'Match proposed', ta: 'பொருத்தம் முன்மொழியப்பட்டது' },
  ALLOCATED: { en: 'Matched to shelter', ta: 'காப்பகத்திற்கு ஒதுக்கப்பட்டது' },
  DISPATCHED: { en: 'Driver assigned', ta: 'ஓட்டுநர் நியமிக்கப்பட்டார்' },
  PICKED_UP: { en: 'On the way', ta: 'வழியில் உள்ளது' },
  DELIVERED: { en: 'Delivered', ta: 'வழங்கப்பட்டது' },
  CANCELLED: { en: 'Cancelled', ta: 'ரத்து செய்யப்பட்டது' },
  EXPIRED: { en: 'Expired', ta: 'காலாவதியானது' },
};

export function formatBatchStatus(status: string, language: SupportedLanguage): string {
  const entry = BATCH_STATUS_LABELS[status];
  if (entry) return entry[language];
  return status.replace(/_/g, ' ').toLowerCase();
}

const DIETARY_LABELS: Record<string, { en: string; ta: string }> = {
  ANY: { en: 'Any', ta: 'எதுவும்' },
  VEGETARIAN: { en: 'Vegetarian', ta: 'சைவம்' },
  VEGAN: { en: 'Vegan', ta: 'முழு சைவம் (வீகன்)' },
  JAIN: { en: 'Jain', ta: 'ஜெயின் சைவம்' },
  EGGETARIAN: { en: 'Eggetarian', ta: 'முட்டை சைவம்' },
  HALAL: { en: 'Halal', ta: 'ஹலால்' },
  NON_VEGETARIAN: { en: 'Non-Vegetarian', ta: 'அசைவம்' },
};

export function formatDietary(diet: string, language: SupportedLanguage): string {
  const entry = DIETARY_LABELS[diet];
  if (entry) return entry[language];
  return diet.replace(/_/g, ' ').toLowerCase();
}

const FOOD_CATEGORY_LABELS: Record<string, { en: string; ta: string }> = {
  COOKED_MEALS: { en: 'Cooked Hot Meals', ta: 'சமைத்த சூடான உணவுகள்' },
  CHILLED_MEALS: { en: 'Chilled Prepared Food', ta: 'குளிரூட்டப்பட்ட உணவுகள்' },
  BAKERY_DRY: { en: 'Bakery & Dry Packaged', ta: 'பேக்கரி & உலர் உணவுகள்' },
  FRESH_PRODUCE: { en: 'Fresh Produce', ta: 'புதிய காய்கறிகள் & பழங்கள்' },
};

export function formatFoodCategory(cat: string, language: SupportedLanguage): string {
  const entry = FOOD_CATEGORY_LABELS[cat];
  if (entry) return entry[language];
  return cat.replace(/_/g, ' ');
}

const NUTRILOOP_CATEGORY_LABELS: Record<FoodCompositionCategory, { en: string; ta: string }> = {
  CEREALS_GRAINS: { en: 'Grains & Rice', ta: 'தானியங்கள் & அரிசி' },
  PULSES_LEGUMES: { en: 'Dal & Pulses', ta: 'பருப்பு & பயறு வகைகள்' },
  DAIRY_PROTEIN: { en: 'Milk & Paneer', ta: 'பால் & பன்னீர்' },
  EGG_MEAT_FISH: { en: 'Eggs & Fish', ta: 'முட்டை & மீன்' },
  LEAFY_VEGETABLES: { en: 'Leafy Greens', ta: 'கீரை வகைகள்' },
  FRUITS_VEGETABLES: { en: 'Fruits & Veg', ta: 'பழங்கள் & காய்கறிகள்' },
  NUTS_SEEDS: { en: 'Nuts & Seeds', ta: 'கொட்டைகள் & விதைகள்' },
  MIXED_COOKED_MEAL: { en: 'Cooked Meals', ta: 'சமைத்த உணவுகள்' },
};

export function formatNutriCategory(cat: FoodCompositionCategory, language: SupportedLanguage): string {
  return NUTRILOOP_CATEGORY_LABELS[cat]?.[language] ?? cat;
}

const REQUEST_STATUS_LABELS: Record<string, { en: string; ta: string }> = {
  OPEN: { en: 'Open', ta: 'திறந்துள்ளது' },
  PARTIALLY_ALLOCATED: { en: 'Partially Allocated', ta: 'பகுதி ஒதுக்கப்பட்டது' },
  FULFILLED: { en: 'Fulfilled', ta: 'நிறைவேற்றப்பட்டது' },
  CANCELLED: { en: 'Cancelled', ta: 'ரத்து செய்யப்பட்டது' },
  EXPIRED: { en: 'Expired', ta: 'காலாவதியானது' },
};

export function formatRequestStatus(status: string, language: SupportedLanguage): string {
  return REQUEST_STATUS_LABELS[status]?.[language] ?? status.replace(/_/g, ' ');
}

const ALLOCATION_STATUS_LABELS: Record<string, { en: string; ta: string }> = {
  PROPOSED: { en: 'Proposed', ta: 'முன்மொழியப்பட்டது' },
  APPROVED: { en: 'Approved', ta: 'அங்கீகரிக்கப்பட்டது' },
  ACCEPTED: { en: 'Accepted', ta: 'ஏற்கப்பட்டது' },
  DECLINED: { en: 'Declined', ta: 'மறுக்கப்பட்டது' },
  DISPATCHED: { en: 'Dispatched', ta: 'அனுப்பப்பட்டது' },
  PICKED_UP: { en: 'Picked Up', ta: 'சேகரிக்கப்பட்டது' },
  DELIVERED: { en: 'Delivered', ta: 'வழங்கப்பட்டது' },
  CANCELLED: { en: 'Cancelled', ta: 'ரத்து செய்யப்பட்டது' },
};

export function formatAllocationStatus(status: string, language: SupportedLanguage): string {
  return ALLOCATION_STATUS_LABELS[status]?.[language] ?? status.replace(/_/g, ' ');
}

const TARGETED_STATUS_LABELS: Record<string, { en: string; ta: string }> = {
  DRAFT_GENERATED: { en: 'Draft', ta: 'வரைவு' },
  APPROVED_PUBLISHED: { en: 'Published', ta: 'வெளியிடப்பட்டது' },
  MATCHED: { en: 'Matched', ta: 'பொருத்தப்பட்டது' },
  FULFILLED: { en: 'Fulfilled', ta: 'நிறைவேற்றப்பட்டது' },
  DISMISSED: { en: 'Dismissed', ta: 'தள்ளுபடி செய்யப்பட்டது' },
};

export function formatTargetedStatus(status: string, language: SupportedLanguage): string {
  return TARGETED_STATUS_LABELS[status]?.[language] ?? status.replace(/_/g, ' ').toLowerCase();
}

const INTAKE_CHANNEL_LABELS: Record<string, { en: string; ta: string }> = {
  WEB_PORTAL: { en: 'Web Portal', ta: 'இணையதளம்' },
  FIELD_ASSISTED_PHONE: { en: 'Phone Helpline', ta: 'தொலைபேசி உதவி' },
  FIELD_ASSISTED_WALKIN: { en: 'Walk-In Desk', ta: 'நேரடி மையம்' },
  FIELD_ASSISTED_OUTREACH: { en: 'Outreach Visit', ta: 'களப் பார்வை' },
};

export function formatIntakeChannel(channel: string, language: SupportedLanguage): string {
  return INTAKE_CHANNEL_LABELS[channel]?.[language] ?? channel.replace(/_/g, ' ');
}

const ROUTE_STATUS_LABELS: Record<string, { en: string; ta: string }> = {
  ASSIGNED: { en: 'Assigned', ta: 'ஒதுக்கப்பட்டது' },
  ACCEPTED: { en: 'Accepted', ta: 'ஏற்கப்பட்டது' },
  EN_ROUTE_PICKUP: { en: 'En Route to Pickup', ta: 'சேகரிப்புக்குச் செல்கிறது' },
  PICKED_UP: { en: 'Picked Up', ta: 'சேகரிக்கப்பட்டது' },
  EN_ROUTE_DROPOFF: { en: 'En Route to Drop-off', ta: 'விநியோகத்திற்குச் செல்கிறது' },
  COMPLETED: { en: 'Completed', ta: 'நிறைவடைந்தது' },
  CANCELLED: { en: 'Cancelled', ta: 'ரத்து செய்யப்பட்டது' },
  PENDING: { en: 'Pending', ta: 'நிலுவையில்' },
  ARRIVED: { en: 'Arrived', ta: 'வந்துவிட்டது' },
};

export function formatRouteStatus(status: string, language: SupportedLanguage): string {
  return ROUTE_STATUS_LABELS[status]?.[language] ?? status.replace(/_/g, ' ');
}

const STOP_TYPE_LABELS: Record<string, { en: string; ta: string }> = {
  PICKUP: { en: 'Pickup', ta: 'சேகரிப்பு' },
  DROPOFF: { en: 'Drop-off', ta: 'விநியோகம்' },
};

export function formatStopType(stopType: string, language: SupportedLanguage): string {
  return STOP_TYPE_LABELS[stopType]?.[language] ?? stopType;
}

const INSPECTION_STATUS_LABELS: Record<string, { en: string; ta: string }> = {
  PASSED: { en: 'Passed', ta: 'தேர்ச்சி' },
  REJECTED: { en: 'Rejected', ta: 'நிராகரிக்கப்பட்டது' },
  PENDING_REVIEW: { en: 'Pending Review', ta: 'மறுஆய்வு நிலுவையில்' },
};

export function formatInspectionStatus(status: string, language: SupportedLanguage): string {
  return INSPECTION_STATUS_LABELS[status]?.[language] ?? status;
}

const PACKAGING_LABELS: Record<string, { en: string; ta: string }> = {
  INTACT_SEALED: { en: 'Intact & Tamper-Sealed', ta: 'உடையாமல் முத்திரையிடப்பட்டது' },
  INSULATED_CLEAN: { en: 'Insulated Food-Grade Clean', ta: 'வெப்பப் பாதுகாப்பு சுத்தமான பாத்திரம்' },
  MINOR_WEAR_ACCEPTABLE: { en: 'Minor Exterior Wear (Safe)', ta: 'சிறிய வெளிப்புற உராய்வு (பாதுகாப்பானது)' },
  COMPROMISED_REJECT: { en: 'Compromised / Unsealed (Reject)', ta: 'சேதமடைந்தது / திறந்துள்ளது (நிராகரி)' },
};

export function formatPackagingCondition(cond: string, language: SupportedLanguage): string {
  return PACKAGING_LABELS[cond]?.[language] ?? cond.replace(/_/g, ' ');
}

const MEALTRACE_EVENT_LABELS: Record<string, { en: string; ta: string }> = {
  BATCH_SUBMITTED: { en: 'Batch Submitted', ta: 'உணவுத் தொகுதி சமர்ப்பிக்கப்பட்டது' },
  SAFETY_PASSED: { en: 'Safety Check Passed', ta: 'பாதுகாப்பு ஆய்வு தேர்ச்சி' },
  SAFETY_REJECTED: { en: 'Safety Check Rejected', ta: 'பாதுகாப்பு ஆய்வு நிராகரிப்பு' },
  ALLOCATION_APPROVED: { en: 'Allocation Approved', ta: 'ஒதுக்கீடு அங்கீகரிக்கப்பட்டது' },
  PICKUP_SCANNED: { en: 'Pickup Scanned', ta: 'சேகரிப்பு ஸ்கேன் செய்யப்பட்டது' },
  HANDOVER_SCANNED: { en: 'Handover Scanned', ta: 'ஒப்படைப்பு ஸ்கேன் செய்யப்பட்டது' },
  PORTIONS_CONFIRMED: { en: 'Portions Confirmed', ta: 'பங்குகள் உறுதிப்படுத்தப்பட்டன' },
  CANCELLED: { en: 'Cancelled', ta: 'ரத்து செய்யப்பட்டது' },
};

export function formatMealTraceEvent(eventType: string, language: SupportedLanguage): string {
  return MEALTRACE_EVENT_LABELS[eventType]?.[language] ?? eventType.replace(/_/g, ' ');
}

const INVENTORY_STAGE_LABELS: Record<string, { en: string; ta: string }> = {
  AVAILABLE: { en: 'In Kitchen (Available)', ta: 'சமையலறையில் இருப்பு' },
  DISTRIBUTED: { en: 'Handed Out (Distributed)', ta: 'விநியோகிக்கப்பட்டது' },
  REPORTED_CONSUMED: { en: 'Reported Eaten', ta: 'உட்கொள்ளப்பட்டதாகப் பதிவு' },
};

export function formatInventoryStage(stage: string, language: SupportedLanguage): string {
  return INVENTORY_STAGE_LABELS[stage]?.[language] ?? stage.replace(/_/g, ' ').toLowerCase();
}

const VERIFICATION_STATUS_LABELS: Record<string, { en: string; ta: string }> = {
  verified: { en: 'Verified', ta: 'சரிபார்க்கப்பட்டது' },
  pending: { en: 'Pending', ta: 'நிலுவையில்' },
  rejected: { en: 'Rejected', ta: 'நிராகரிக்கப்பட்டது' },
  suspended: { en: 'Suspended', ta: 'இடைநிறுத்தப்பட்டது' },
};

export function formatVerificationStatus(status: string, language: SupportedLanguage): string {
  return VERIFICATION_STATUS_LABELS[status]?.[language] ?? status;
}

const INCIDENT_TYPE_LABELS: Record<string, { en: string; ta: string }> = {
  TEMP_DEVIATION: { en: 'Temperature Deviation', ta: 'வெப்பநிலை மாற்றம்' },
  PACKAGING_DAMAGE: { en: 'Packaging Damage', ta: 'பேக்கேஜிங் சேதம்' },
  DELIVERY_DELAY: { en: 'Delivery Delay', ta: 'விநியோக தாமதம்' },
  QUANTITY_DISCREPANCY: { en: 'Quantity Discrepancy', ta: 'அளவு வேறுபாடு' },
  SAFETY_CONCERN: { en: 'Food Safety Concern', ta: 'உணவுப் பாதுகாப்பு சிக்கல்' },
  OTHER: { en: 'Other', ta: 'மற்றவை' },
};

export function formatIncidentType(type: string, language: SupportedLanguage): string {
  return INCIDENT_TYPE_LABELS[type]?.[language] ?? type.replace(/_/g, ' ');
}

const INCIDENT_STATUS_LABELS: Record<string, { en: string; ta: string }> = {
  OPEN: { en: 'Open', ta: 'திறந்துள்ளது' },
  INVESTIGATING: { en: 'Investigating', ta: 'ஆய்வில் உள்ளது' },
  RESOLVED: { en: 'Resolved', ta: 'தீர்க்கப்பட்டது' },
  CLOSED: { en: 'Closed', ta: 'மூடப்பட்டது' },
};

export function formatIncidentStatus(status: string, language: SupportedLanguage): string {
  return INCIDENT_STATUS_LABELS[status]?.[language] ?? status;
}

const ORG_TYPE_LABELS: Record<string, { en: string; ta: string }> = {
  FOOD_DONOR: { en: 'Food Donor', ta: 'உணவு தானதாரர்' },
  VERIFIED_NGO: { en: 'Verified NGO', ta: 'தன்னார்வ நிறுவனம்' },
  COMMUNITY_KITCHEN: { en: 'Community Kitchen', ta: 'சமூக சமையலறை' },
  DELIVERY_PARTNER: { en: 'Delivery Partner', ta: 'விநியோகப் பங்குதாரர்' },
};

export function formatOrgType(orgType: string, language: SupportedLanguage): string {
  return ORG_TYPE_LABELS[orgType]?.[language] ?? orgType.replace(/_/g, ' ');
}

const NUTRIENT_LABELS_TA: Record<string, string> = {
  'Calories (Energy)': 'கலோரிகள் (ஆற்றல்)',
  Calories: 'கலோரிகள்',
  Protein: 'புரதம்',
  Iron: 'இரும்புச்சத்து',
  Calcium: 'கால்சியம்',
  'Vitamin A (RAE)': 'வைட்டமின் A',
  'Vitamin A': 'வைட்டமின் A',
  'Dietary Fibre': 'நார்ச்சத்து',
  'Vitamin C': 'வைட்டமின் C',
};

export function formatNutrientName(name: string, language: SupportedLanguage, short = false): string {
  if (language === 'ta') {
    const clean = name.replace(' (Energy)', '').replace(' (RAE)', '');
    return NUTRIENT_LABELS_TA[name] ?? NUTRILOOP_SHORT_TA(clean) ?? name;
  }
  return short ? name.replace(' (Energy)', '').replace(' (RAE)', '') : name;
}

function NUTRILOOP_SHORT_TA(clean: string): string | undefined {
  return NUTRIENT_LABELS_TA[clean];
}

const FOOD_NAME_TA: Record<string, string> = {
  'Steamed Parboiled White Rice (Cooked)': 'வேகவைத்த புழுங்கல் அரிசி சாதம்',
  'Sambar Sadam & Vegetable Poriyal (Prepared)': 'சாம்பார் சாதம் & காய்கறி பொரியல்',
  'Red Gram (Toor) Dal Tadka (Cooked)': 'துவரம் பருப்பு கடைசல்',
  'Bengal Gram / Chickpea (Chana) Curry': 'கொண்டைக்கடலை (சன்னா) குழம்பு',
  'Soya Chunks Protein Curry (Cooked)': 'சோயா உருண்டை புரதக் குழம்பு',
  'Paneer & Green Peas Masala': 'பன்னீர் & பச்சை பட்டாணி மசாலா',
  'Amaranth & Drumstick Leaves (Keerai) Stir-Fry': 'முருங்கை & அரைக்கீரை பொரியல்',
  'Finger Millet (Ragi) Porridge / Mudde': 'கேழ்வரகு (ராகி) கூழ் / களி',
  'Toned Milk / Plain Curd (Dahi)': 'பால் / தயிர்',
  'Boiled Hen Eggs (2 Eggs Portion)': 'அவித்த முட்டை (2 முட்டைகள்)',
  'Carrot, Pumpkin & Sweet Potato Stew': 'கேரட், பூசணி & சர்க்கரைவள்ளி கூட்டு',
  'Boiled Groundnut & Green Gram Sundal': 'வேர்க்கடலை & பாசிப்பயறு சுண்டல்',
  'Sambar Sadam, Curd Rice & Vegetable Poriyal': 'சாம்பார் சாதம், தயிர் சாதம் & காய்கறி பொரியல்',
  'Soya Chunks Protein Curry & Toor Dal (Awaiting Physical Inspection)':
    'சோயா புரதக் குழம்பு & துவரம் பருப்பு (ஆய்வுக்குக் காத்திருக்கிறது)',
};

export function formatFoodName(name: string, language: SupportedLanguage): string {
  if (language === 'ta') {
    return FOOD_NAME_TA[name] ?? name;
  }
  return name;
}

const DEMO_ORG_TA: Record<string, string> = {
  'Wedding Hall A [Demo]': 'திருமண மண்டபம் A [மாதிரி]',
  'Shelter A — Adyar Care Home [Demo]': 'காப்பகம் A — அடையாறு பராமரிப்பு இல்லம் [மாதிரி]',
  'Community Kitchen B — Velachery [Demo]': 'சமூக சமையலறை B — வேளச்சேரி [மாதிரி]',
  'T. Nagar Youth Hostel [Demo Pending]': 'தி. நகர் இளைஞர் விடுதி [சரிபார்ப்பு நிலுவை]',
};

export function formatOrgName(name: string | undefined, language: SupportedLanguage): string {
  if (!name) return '';
  if (language === 'ta') {
    return DEMO_ORG_TA[name] ?? name;
  }
  return name;
}

const DEMO_TEXT_TA: Record<string, string> = {
  'Batch HL-DEMO-2026-001 Passed Inspection': 'தொகுதி HL-DEMO-2026-001 பாதுகாப்பு ஆய்வில் தேர்ச்சி பெற்றது',
  'Wedding Hall A (100 vegetarian portions) passed physical safety inspection and is ready for Smart Matching.':
    'திருமண மண்டபம் A (100 சைவ பங்குகள்) நேரடி பாதுகாப்பு ஆய்வில் தேர்ச்சி பெற்று திறன் பொருத்தத்திற்குத் தயாராக உள்ளது.',
  'New Organisation Awaiting Verification': 'புதிய நிறுவனம் சரிபார்ப்புக்காகக் காத்திருக்கிறது',
  'T. Nagar Youth Hostel submitted registration credentials for administrator verification.':
    'தி. நகர் இளைஞர் விடுதி நிர்வாகி சரிபார்ப்புக்காகப் பதிவு ஆவணங்களைச் சமர்ப்பித்துள்ளது.',
  'Evening hot meal service for 60 residents at Shelter A.':
    'காப்பகம் A-இன் 60 குடியிருப்பாளர்களுக்கான மாலை சூடான உணவு சேவை.',
  'Community Kitchen B dinner counter for daily-wage workers.':
    'தினக்கூலித் தொழிலாளர்களுக்கான சமூக சமையலறை B இரவு உணவு மையம்.',
  '4x Food-grade stainless insulated cambro containers, tamper-sealed':
    '4x வெப்பப் பாதுகாப்பு எஃகு பாத்திரங்கள், முத்திரையிடப்பட்டவை',
  '2x Sealed steel chafing trays': '2x முத்திரையிடப்பட்ட எஃகு தட்டுகள்',
  'Core temperature 64.5°C verified by probe; containers tamper-sealed and clean.':
    'உள் வெப்பநிலை 64.5°C உறுதிசெய்யப்பட்டது; பாத்திரங்கள் சுத்தமாகவும் முத்திரையிடப்பட்டும் உள்ளன.',
};

export function formatDynamicDemoText(text: string | null | undefined, language: SupportedLanguage): string {
  if (!text) return '';
  if (language === 'ta') {
    return DEMO_TEXT_TA[text] ?? text;
  }
  return text;
}

const TOAST_EXACT_TA: Record<string, string> = {
  'Demo Scenario Reset': 'மாதிரி காட்சி மீட்டமைக்கப்பட்டது',
  'Wedding Hall A (100) / Shelter A (60) / Kitchen B (30) restored.':
    'திருமண மண்டபம் A (100) / காப்பகம் A (60) / சமையலறை B (30) மீட்டமைக்கப்பட்டது.',
  'Session refreshed': 'அமர்வு புதுப்பிக்கப்பட்டது',
  'Session refresh failed': 'அமர்வு புதுப்பிப்பு தோல்வியடைந்தது',
  'Organisation registered (Pending Verification)': 'நிறுவனம் பதிவு செய்யப்பட்டது (சரிபார்ப்பு நிலுவையில்)',
  'Organisation registered': 'நிறுவனம் பதிவு செய்யப்பட்டது',
  'Your organisation is now pending administrator verification.':
    'உங்கள் நிறுவனம் இப்போது நிர்வாகி சரிபார்ப்புக்காகக் காத்திருக்கிறது.',
  'Donation updated': 'உணவு தானம் புதுப்பிக்கப்பட்டது',
  'Donation cancelled': 'உணவு தானம் ரத்து செய்யப்பட்டது',
  'Meal request recorded': 'உணவு கோரிக்கை பதிவு செய்யப்பட்டது',
  'Meal request submitted': 'உணவு கோரிக்கை சமர்ப்பிக்கப்பட்டது',
  'Split allocations proposed via transactional RPC': 'பகுதி ஒதுக்கீடுகள் முன்மொழியப்பட்டன',
  'Allocation approved by coordinator': 'ஒதுக்கீடு ஒருங்கிணைப்பாளரால் அங்கீகரிக்கப்பட்டது',
  'Allocation approved': 'ஒதுக்கீடு அங்கீகரிக்கப்பட்டது',
  'Allocation accepted': 'ஒதுக்கீடு ஏற்கப்பட்டது',
  'Allocation declined': 'ஒதுக்கீடு மறுக்கப்பட்டது',
  'Delivery route dispatched': 'விநியோக வழித்தடம் அனுப்பப்பட்டது',
  'Receiving capacity updated': 'பெறும் திறன் புதுப்பிக்கப்பட்டது',
  'Incident reported for administrator review': 'சிக்கல் நிர்வாகி மறுஆய்வுக்குப் பதிவு செய்யப்பட்டது',
  'Incident logged': 'சிக்கல் பதிவு செய்யப்பட்டது',
  'Community nutrition profile saved': 'சமூக ஊட்டச்சத்து சுயவிவரம் சேமிக்கப்பட்டது',
  'Community food inventory recorded': 'சமூக உணவு இருப்பு பதிவு செய்யப்பட்டது',
  'Targeted donation request approved & published': 'இலக்கு உணவு கோரிக்கை அங்கீகரிக்கப்பட்டு வெளியிடப்பட்டது',
  'Targeted request dismissed': 'இலக்கு கோரிக்கை தள்ளுபடி செய்யப்பட்டது',
  'Food composition item saved': 'உணவு ஊட்டச்சத்து விவரம் சேமிக்கப்பட்டது',
  'Custom nutrient added': 'புதிய ஊட்டச்சத்து சேர்க்கப்பட்டது',
  'Saved to Offline Sync Queue': 'இணையமில்லா வரிசையில் சேமிக்கப்பட்டது',
  'Device is offline': 'சாதனம் இணைய இணைப்பில் இல்லை',
  'Reconnect before syncing pending drafts.': 'நிலுவைப் பதிவுகளை ஒத்திசைக்க இணையத்தில் இணைக்கவும்.',
  'Offline queue sync finished': 'இணையமில்லா வரிசை ஒத்திசைவு முடிந்தது',
};

export function translateToastText(text: string | undefined, language: SupportedLanguage): string | undefined {
  if (!text || language !== 'ta') return text;
  if (TOAST_EXACT_TA[text]) return TOAST_EXACT_TA[text];
  if (text.startsWith('Demo Persona: ')) {
    return `மாதிரிப் பாத்திரம்: ${text.replace('Demo Persona: ', '')}`;
  }
  if (text.startsWith('Donation ') && text.endsWith(' submitted')) {
    return text.replace('Donation ', 'உணவு தானம் ').replace(' submitted', ' சமர்ப்பிக்கப்பட்டது');
  }
  if (text.startsWith('Inspection recorded: ')) {
    const st = text.replace('Inspection recorded: ', '');
    return `பாதுகாப்பு ஆய்வு பதிவு: ${formatInspectionStatus(st, 'ta')}`;
  }
  if (text.startsWith('Route status updated to ')) {
    const st = text.replace('Route status updated to ', '');
    return `வழித்தட நிலை புதுப்பிக்கப்பட்டது: ${formatRouteStatus(st, 'ta')}`;
  }
  if (text.startsWith('Route updated: ')) {
    const st = text.replace('Route updated: ', '');
    return `வழித்தடம் புதுப்பிக்கப்பட்டது: ${formatRouteStatus(st, 'ta')}`;
  }
  if (text.startsWith('MealTrace event logged: ')) {
    const ev = text.replace('MealTrace event logged: ', '');
    return `QR தடம் பதிவு செய்யப்பட்டது: ${formatMealTraceEvent(ev, 'ta')}`;
  }
  if (text.startsWith('Organisation marked ')) {
    const st = text.replace('Organisation marked ', '');
    return `நிறுவன நிலை: ${formatVerificationStatus(st, 'ta')}`;
  }
  if (text.startsWith('Incident updated to ')) {
    const st = text.replace('Incident updated to ', '');
    return `சிக்கல் நிலை: ${formatIncidentStatus(st, 'ta')}`;
  }
  if (text.startsWith('Assigned to ')) {
    return `ஒதுக்கப்பட்டவர்: ${text.replace('Assigned to ', '')}`;
  }
  return formatDynamicDemoText(text, 'ta');
}

