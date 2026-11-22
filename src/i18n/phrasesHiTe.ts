/**
 * Complete Hindi (hi) and Telugu (te) UI phrase translations covering every
 * static string and dynamic sentence template across HUNGERLINK + NutriLoop.
 */

export const PHRASES_HI_TE: Record<string, { hi: string; te: string }> = {
  // Landing / Auth
  '1. Share': { hi: '1. साझा करें', te: '1. పంచుకోండి' },
  '2. Match': { hi: '2. स्वतः मिलान', te: '2. ఆటో మ్యాచింగ్' },
  '3. Deliver': { hi: '3. डिलीवरी', te: '3. డెలివరీ' },
  '2. Auto-Match & Dispatch': { hi: '2. स्वतः मिलान व डिलीवरी', te: '2. ఆటో మ్యాచ్ & డ్రైవర్' },
  'Share extra food with people who need it today.': {
    hi: 'आज अतिरिक्त भोजन ज़रूरतमंद लोगों के साथ साझा करें।',
    te: 'ఈరోజు మిగులు ఆహారాన్ని అవసరమైన వారితో పంచుకోండి.',
  },
  'HungerLink connects food donors, local shelters, and delivery volunteers—and helps every community receive the nutrients they are missing.': {
    hi: 'हंगरलिंक भोजन दाताओं, स्थानीय आश्रयों और डिलीवरी स्वयंसेवकों को जोड़ता है—और हर समुदाय को ज़रूरी पोषण पहुँचाने में मदद करता है।',
    te: 'హంగర్‌లింక్ ఆహార దాతలు, స్థానిక ఆశ్రయాలు మరియు డెలివరీ వాలంటీర్లను కలుపుతుంది—ప్రతి కమ్యూనిటీకి అవసరమైన పోషకాహారం అందేలా సహాయపడుతుంది.',
  },
  'Post safe surplus meals in minutes.': {
    hi: 'कुछ ही मिनटों में सुरक्षित अतिरिक्त भोजन साझा करें।',
    te: 'కొన్ని నిమిషాల్లో సురక్షిత మిగులు భోజనాన్ని పోస్ట్ చేయండి.',
  },
  'Prioritize shelters by need & nutrition.': {
    hi: 'ज़रूरत और पोषण के अनुसार आश्रयों को स्वतः प्राथमिकता।',
    te: 'అవసరం మరియు పోషకాహారం ఆధారంగా ఆశ్రయాలకు ప్రాధాన్యత.',
  },
  'Safety check, shelter matching, and driver dispatch run automatically.': {
    hi: 'खाद्य सुरक्षा जाँच, आश्रय मिलान और ड्राइवर आवंटन सब स्वतः होता है।',
    te: 'ఆహార భద్రతా తనిఖీ, ఆశ్రయ మ్యాచింగ్ మరియు డ్రైవర్ కేటాయింపు స్వయంచాలకంగా జరుగుతాయి.',
  },
  'Confirm handover with a quick QR scan.': {
    hi: 'त्वरित QR स्कैन से सुपुर्दगी की पुष्टि करें।',
    te: 'త్వరిత QR స్కాన్‌తో అప్పగింతను నిర్ధారించండి.',
  },
  'Track a Meal': { hi: 'भोजन ट्रैक करें', te: 'భోజనాన్ని ట్రాక్ చేయండి' },
  'Try Demo': { hi: 'डेमो देखें', te: 'డెమో చూడండి' },
  'Try Interactive Demo': { hi: 'इंटरैक्टिव डेमो आज़माएं', te: 'ఇంటరాక్టివ్ డెమో ప్రయత్నించండి' },
  'Try as Donor': { hi: 'दाता के रूप में देखें', te: 'దాతగా ప్రయత్నించండి' },
  'Your full name': { hi: 'आपका पूरा नाम', te: 'మీ పూర్తి పేరు' },
  'I am joining as': { hi: 'मेरी भूमिका', te: 'నేను చేరుతున్న పాత్ర' },
  'Forgot?': { hi: 'भूल गए?', te: 'మర్చిపోయారా?' },
  'At least 8 characters': { hi: 'कम से कम 8 अक्षर', te: 'కనీసం 8 అక్షరాలు' },
  'Please wait...': { hi: 'कृपया प्रतीक्षा करें...', te: 'దయచేసి వేచి ఉండండి...' },
  'Back to Sign In': { hi: 'साइन इन पर वापस जाएं', te: 'సైన్ ఇన్‌కు తిరిగి వెళ్ళండి' },
  'Live login needs Supabase setup · Use Demo Mode above': {
    hi: 'लाइव लॉगिन के लिए Supabase सेटअप आवश्यक है · ऊपर डेमो मोड उपयोग करें',
    te: 'లైవ్ లాగిన్‌కు Supabase సెటప్ అవసరం · పైన ఉన్న డెమో మోడ్ ఉపయోగించండి',
  },
  'Missing:': { hi: 'अनुपलब्ध:', te: 'లేదు:' },
  'Password must be at least 8 characters long.': {
    hi: 'पासवर्ड कम से कम 8 अक्षरों का होना चाहिए।',
    te: 'పాస్‌వర్డ్ కనీసం 8 అక్షరాలు ఉండాలి.',
  },
  'Account created. Check your email to confirm your address before signing in.': {
    hi: 'खाता बन गया। साइन इन करने से पहले अपना ईमेल सत्यापित करें।',
    te: 'ఖాతా సృష్టించబడింది. సైన్ ఇన్ చేసే ముందు మీ ఇమెయిల్‌ను ధృవీకరించండి.',
  },
  'Password reset link sent to your email.': {
    hi: 'पासवर्ड रीसेट लिंक आपके ईमेल पर भेज दिया गया है।',
    te: 'పాస్‌వర్డ్ రీసెట్ లింక్ మీ ఇమెయిల్‌కు పంపబడింది.',
  },

  // RoleGuard & Layout
  'Access Limited for Your Role': {
    hi: 'आपकी भूमिका के लिए यह भाग सीमित है',
    te: 'మీ పాత్రకు ఈ విభాగం పరిమితం చేయబడింది',
  },
  'Back to Home': { hi: 'होम पर वापस जाएं', te: 'హోమ్‌కు తిరిగి వెళ్ళండి' },
  'Restoring Supabase session...': {
    hi: 'सत्र लोड हो रहा है...',
    te: 'సెషన్ లోడ్ అవుతోంది...',
  },
  'Home': { hi: 'होम', te: 'హోమ్' },
  'Donate Food': { hi: 'भोजन दान करें', te: 'ఆహార దానం' },
  'Request Meals': { hi: 'भोजन का अनुरोध', te: 'భోజన అభ్యర్థన' },
  'Deliveries': { hi: 'डिलीवरी', te: 'డెలివరీలు' },
  'More tools': { hi: 'अधिक उपकरण', te: 'మరిన్ని సాధనాలు' },
  'Close navigation': { hi: 'मेनू बंद करें', te: 'మెనూ మూసివేయండి' },
  'Open navigation menu': { hi: 'नेविगेशन मेनू खोलें', te: 'నావిగేషన్ మెనూ తెరవండి' },
  'Switch Demo Role': { hi: 'डेमो भूमिका बदलें', te: 'డెమో పాత్ర మార్చండి' },
  'View as:': { hi: 'भूमिका:', te: 'పాత్ర:' },
  'Exit': { hi: 'बाहर निकलें', te: 'నిష్క్రమించు' },
  'Reset': { hi: 'रीसेट', te: 'రీసెట్' },
  'Demo mode — sample data only': {
    hi: 'डेमो मोड — केवल नमूना डेटा',
    te: 'డెమో మోడ్ — నమూనా డేటా మాత్రమే',
  },

  // Dashboard
  'Welcome': { hi: 'स्वागत है', te: 'స్వాగతం' },
  'View My Deliveries': { hi: 'मेरी डिलीवरी देखें', te: 'నా డెలివరీలు చూడండి' },
  'Log Community Request': { hi: 'समुदाय अनुरोध दर्ज करें', te: 'కమ్యూనిటీ అభ్యర్థన నమోదు' },
  'Donate Extra Food': { hi: 'अतिरिक्त भोजन दान करें', te: 'మిగులు ఆహారం దానం చేయండి' },
  'Here is a simple overview of meals being shared today.': {
    hi: 'आज साझा किए जा रहे भोजन का सरल सारांश यहाँ है।',
    te: 'ఈరోజు పంచుకుంటున్న భోజనాల సులభ సారాంశం ఇక్కడ ఉంది.',
  },
  'Account under review.': { hi: 'खाता समीक्षाधीन है।', te: 'ఖాతా సమీక్షలో ఉంది.' },
  'An administrator will verify your organisation before live donations or requests go out.': {
    hi: 'लाइव दान या अनुरोध शुरू होने से पहले प्रशासक आपके संगठन को सत्यापित करेगा।',
    te: 'లైవ్ దానాలు లేదా అభ్యర్థనలు ప్రారంభమయ్యే ముందు అడ్మినిస్ట్రేటర్ మీ సంస్థను ధృవీకరిస్తారు.',
  },
  "Today's summary": { hi: 'आज का सारांश', te: 'నేటి సారాంశం' },
  'Meals Delivered': { hi: 'वितरित भोजन', te: 'అందించిన భోజనాలు' },
  'Confirmed at handover': { hi: 'सुपुर्दगी पर सत्यापित', te: 'అప్పగింతలో నిర్ధారించబడింది' },
  'Active Routes': { hi: 'सक्रिय रूट', te: 'సక్రియ మార్గాలు' },
  'Active Food Batches': { hi: 'सक्रिय भोजन बैच', te: 'సక్రియ ఆహార బ్యాచ్‌లు' },
  'Nutrition Needs (NutriLoop)': { hi: 'पोषण आवश्यकताएं (NutriLoop)', te: 'పోషకాహార అవసరాలు (NutriLoop)' },
  'All communities tracked': { hi: 'सभी समुदाय ट्रैक किए गए', te: 'అన్ని కమ్యూనిటీలు ట్రాక్ చేయబడ్డాయి' },
  'Quick actions': { hi: 'त्वरित कार्य', te: 'త్వరిత చర్యలు' },
  'Let nearby donors know how many meals your community needs.': {
    hi: 'पास के दाताओं को बताएं कि आपके समुदाय को कितने भोजन की आवश्यकता है।',
    te: 'మీ కమ్యూనిటీకి ఎన్ని భోజనాలు అవసరమో సమీప దాతలకు తెలియజేయండి.',
  },
  'Update your assigned pickup and drop-off delivery progress.': {
    hi: 'अपने पिकअप और डिलीवरी की स्थिति अपडेट करें।',
    te: 'మీకు కేటాయించిన పికప్ మరియు డెలివరీ స్థితిని అప్‌డేట్ చేయండి.',
  },
  'Record requests for shelters even when offline.': {
    hi: 'ऑफ़लाइन होने पर भी आश्रयों के अनुरोध दर्ज करें।',
    te: 'ఆఫ్‌లైన్‌లో ఉన్నప్పుడు కూడా ఆశ్రయాల అభ్యర్థనలను నమోదు చేయండి.',
  },
  'List fresh surplus meals or respond to a shelter need.': {
    hi: 'ताज़ा अतिरिक्त भोजन साझा करें — सुरक्षा जाँच, मिलान और ड्राइवर स्वतः तय होंगे।',
    te: 'తాజా మిగులు ఆహారాన్ని పంచుకోండి — భద్రత, మ్యాచింగ్ మరియు డ్రైవర్ స్వయంచాలకంగా జరుగుతాయి.',
  },
  'Check Nutrition Gaps': { hi: 'पोषण अंतर देखें', te: 'పోషకాహార లోపాలు చూడండి' },
  'See which nutrients local shelters are missing and what foods help most.': {
    hi: 'देखें कि स्थानीय आश्रयों में किन पोषक तत्वों की कमी है और कौन से भोजन सबसे अधिक मदद करेंगे।',
    te: 'స్థానిక ఆశ్రయాలలో ఏ పోషకాలు తక్కువగా ఉన్నాయో మరియు ఏ ఆహారాలు ఎక్కువ సహాయపడతాయో చూడండి.',
  },
  'Delivery Impact': { hi: 'डिलीवरी प्रभाव', te: 'డెలివరీ ప్రభావం' },
  'View completed delivery shifts and confirmed meal handovers.': {
    hi: 'पूर्ण डिलीवरी शिफ्ट और सत्यापित भोजन वितरण देखें।',
    te: 'పూర్తయిన డెలివరీ షిఫ్ట్‌లు మరియు నిర్ధారించిన భోజనాలను చూడండి.',
  },
  'Scan Meal QR': { hi: 'भोजन QR स्कैन करें', te: 'భోజనం QR స్కాన్ చేయండి' },
  'Confirm pickup or delivery in seconds using your phone camera.': {
    hi: 'अपने फ़ोन कैमरे से सेकंडों में पिकअप या डिलीवरी की पुष्टि करें।',
    te: 'మీ ఫోన్ కెమెరాతో సెకన్లలో పికప్ లేదా డెలివరీని నిర్ధారించండి.',
  },
  'Recent Food Batches': { hi: 'हालिया भोजन बैच', te: 'ఇటీవలి ఆహార బ్యాచ్‌లు' },
  'See all': { hi: 'सभी देखें', te: 'అన్నీ చూడండి' },
  'No food batches listed yet.': { hi: 'अभी तक कोई भोजन बैच दर्ज नहीं है।', te: 'ఇంకా ఆహార బ్యాచ్‌లు ఏవీ లేవు.' },
  'Share First Meal': { hi: 'पहला भोजन साझा करें', te: 'మొదటి భోజనాన్ని పంచుకోండి' },
  'Verified Donor': { hi: 'सत्यापित दाता', te: 'ధృవీకరించబడిన దాత' },
  'meals': { hi: 'भोजन', te: 'భోజనాలు' },
  'Automatic Rescue Pipeline Active': {
    hi: 'स्वचालित भोजन बचाव प्रणाली सक्रिय',
    te: 'ఆటోమేటిక్ ఆహార రక్షణ వ్యవస్థ సక్రియం',
  },
  'Just submit food or request meals — safety check, shelter matching, and delivery driver assignment happen automatically.': {
    hi: 'बस भोजन साझा करें या अनुरोध करें — सुरक्षा जाँच, आश्रय मिलान और ड्राइवर आवंटन सब अपने आप हो जाएगा।',
    te: 'ఆహారం పంచుకోండి లేదా భోజనం అభ్యర్థించండి — భద్రతా తనిఖీ, ఆశ్రయ మ్యాచింగ్ మరియు డెలివరీ డ్రైవర్ కేటాయింపు అన్నీ స్వయంచాలకంగా జరుగుతాయి.',
  },

  // Donations
  'Surplus Food Donations': { hi: 'अतिरिक्त भोजन दान', te: 'మిగులు ఆహార దానాలు' },
  'Share safe surplus meals, check safety status, and track handover to nearby shelters.': {
    hi: 'सुरक्षित अतिरिक्त भोजन साझा करें — हंगरलिंक स्वतः सुरक्षा जाँच, आश्रय मिलान और डिलीवरी ड्राइवर तय करता है।',
    te: 'సురక్షిత మిగులు ఆహారాన్ని పంచుకోండి — హంగర్‌లింక్ స్వయంచాలకంగా భద్రత, ఆశ్రయ మ్యాచింగ్ మరియు డెలివరీ డ్రైవర్‌ను కేటాయిస్తుంది.',
  },
  'Close Form': { hi: 'फ़ॉर्म बंद करें', te: 'ఫారమ్ మూసివేయి' },
  'Submit Donation': { hi: 'भोजन दान करें', te: 'ఆహారం దానం చేయి' },
  'Shelters Need These Foods Right Now': {
    hi: 'आश्रयों को अभी इन भोजनों की ज़रूरत है',
    te: 'ఆశ్రయాలకు ప్రస్తుతం ఈ ఆహారాలు అవసరం',
  },
  'See nutrition details': { hi: 'पोषण विवरण देखें', te: 'పోషకాహార వివరాలు చూడండి' },
  'Local Shelter': { hi: 'स्थानीय आश्रय', te: 'స్థానిక ఆశ్రయం' },
  'Ideas:': { hi: 'सुझाव:', te: 'సూచనలు:' },
  'Donate This': { hi: 'यह दान करें', te: 'దీన్ని దానం చేయి' },
  'Log Surplus Food Batch': { hi: 'अतिरिक्त भोजन बैच दर्ज करें', te: 'మిగులు ఆహార బ్యాచ్ నమోదు చేయండి' },
  'Fulfilling NutriLoop targeted need': {
    hi: 'NutriLoop लक्षित पोषण आवश्यकता की पूर्ति',
    te: 'NutriLoop లక్ష్యిత పోషకాహార అవసరాన్ని తీరుస్తోంది',
  },
  'Unlink': { hi: 'हटाएं', te: 'తొలగించు' },
  'Verified Donor Organisation *': { hi: 'सत्यापित दाता संगठन *', te: 'ధృవీకరించబడిన దాత సంస్థ *' },
  'No verified donor organisation available': {
    hi: 'कोई सत्यापित दाता संगठन उपलब्ध नहीं है',
    te: 'ధృవీకరించబడిన దాత సంస్థ అందుబాటులో లేదు',
  },
  'Food Item Description *': { hi: 'भोजन का विवरण *', te: 'ఆహార వివరం *' },
  'e.g. Vegetable Biryani, Raita & Boiled Dal': {
    hi: 'उदा. वेज बिरयानी, रायता और उबली दाल',
    te: 'ఉదా. వెజ్ బిర్యానీ, రైతా మరియు పప్పు',
  },
  'Dietary Classification *': { hi: 'आहार प्रकार *', te: 'ఆహార రకం *' },
  'Available Portions *': { hi: 'उपलब्ध भोजन संख्या *', te: 'అందుబాటులో ఉన్న భోజనాలు *' },
  'Donor-Measured Temp (°C)': { hi: 'भोजन का तापमान (°C)', te: 'ఆహార ఉష్ణోగ్రత (°C)' },
  'Preparation Time *': { hi: 'तैयार करने का समय *', te: 'తయారు చేసిన సమయం *' },
  'Pickup Deadline *': { hi: 'पिकअप अंतिम समय *', te: 'పికప్ చివరి సమయం *' },
  'Consume-By Time *': { hi: 'सेवन अंतिम समय *', te: 'తినవలసిన చివరి సమయం *' },
  'Food Category *': { hi: 'भोजन श्रेणी *', te: 'ఆహార వర్గం *' },
  'Packaging & Seal Details *': { hi: 'पैकेजिंग व सील विवरण *', te: 'ప్యాకేజింగ్ & సీల్ వివరాలు *' },
  'NutriLoop Food Composition Reference (ICMR-NIN / FAO — Optional)': {
    hi: 'NutriLoop पोषण संदर्भ तालिका (ICMR-NIN / FAO — वैकल्पिक)',
    te: 'NutriLoop పోషకాహార సూచన పట్టిక (ICMR-NIN / FAO — ఐచ్ఛికం)',
  },
  'Auto-detect or leave unmapped (never fabricates nutrients)': {
    hi: 'स्वतः पहचानें या खाली छोड़ें',
    te: 'స్వయంచాలకంగా గుర్తించు లేదా ఖాళీగా ఉంచు',
  },
  'protein': { hi: 'प्रोटीन', te: 'ప్రోటీన్' },
  'iron': { hi: 'आयरन', te: 'ఐరన్' },
  'Submitted batches wait for an authorised inspector to record a physical safety check.': {
    hi: 'जैसे ही आप जमा करेंगे, सुरक्षा जाँच, आश्रय मिलान और ड्राइवर आवंटन स्वतः पूरा हो जाएगा।',
    te: 'మీరు సమర్పించిన వెంటనే భద్రతా తనిఖీ, ఆశ్రయ మ్యాచింగ్ మరియు డ్రైవర్ కేటాయింపు స్వయంచాలకంగా పూర్తవుతాయి.',
  },
  'One-click automatic dispatch: safety check, shelter matching, and driver assignment run instantly.': {
    hi: 'एक क्लिक में स्वतः प्रक्रिया: सुरक्षा जाँच, आश्रय मिलान और डिलीवरी ड्राइवर तुरंत तय हो जाएंगे।',
    te: 'ఒక్క క్లిక్ ఆటోమేటిక్ ప్రక్రియ: భద్రతా తనిఖీ, ఆశ్రయ మ్యాచింగ్ మరియు డ్రైవర్ కేటాయింపు వెంటనే జరుగుతాయి.',
  },
  'Submitting...': { hi: 'जमा किया जा रहा है...', te: 'సమర్పించబడుతోంది...' },
  'Submit Batch': { hi: 'भोजन साझा करें', te: 'ఆహారాన్ని సమర్పించు' },
  'Select a verified donor organisation before submitting.': {
    hi: 'जमा करने से पहले एक सत्यापित दाता संगठन चुनें।',
    te: 'సమర్పించే ముందు ధృవీకరించబడిన దాత సంస్థను ఎంచుకోండి.',
  },
  'Consume-by time must be after preparation time.': {
    hi: 'सेवन का अंतिम समय तैयारी के समय के बाद होना चाहिए।',
    te: 'తినవలసిన చివరి సమయం తయారు చేసిన సమయం తర్వాత ఉండాలి.',
  },
  'Pickup deadline cannot be later than consume-by time.': {
    hi: 'पिकअप अंतिम समय सेवन के अंतिम समय के बाद नहीं हो सकता।',
    te: 'పికప్ చివరి సమయం తినవలసిన చివరి సమయం కంటే తర్వాత ఉండకూడదు.',
  },
  'All': { hi: 'सभी', te: 'అన్నీ' },
  'Waiting Check': { hi: 'जाँच लंबित', te: 'తనిఖీ పెండింగ్' },
  'Ready': { hi: 'तैयार', te: 'సిద్ధం' },
  'Dispatched': { hi: 'ड्राइवर तय', te: 'డ్రైవర్ కేటాయింపు' },
  'Delivered': { hi: 'वितरित', te: 'డెలివరీ అయింది' },
  'Edit Food Item': { hi: 'भोजन संपादित करें', te: 'ఆహారాన్ని సవరించు' },
  'Portions': { hi: 'भोजन', te: 'భోజనాలు' },
  'Batch Code': { hi: 'बैच कोड', te: 'బ్యాచ్ కోడ్' },
  'Food & Packaging': { hi: 'भोजन व पैकेजिंग', te: 'ఆహారం & ప్యాకేజింగ్' },
  'Allocated / Avail': { hi: 'आवंटित / कुल', te: 'కేటాయింపు / మొత్తం' },
  'Deadlines': { hi: 'समय-सीमा', te: 'గడువులు' },
  'Status': { hi: 'स्थिति', te: 'స్థితి' },
  'Actions': { hi: 'कार्य', te: 'చర్యలు' },
  'free': { hi: 'शेष', te: 'మిగిలినవి' },
  'No temp': { hi: 'तापमान नहीं', te: 'ఉష్ణోగ్రత లేదు' },
  'Pickup:': { hi: 'पिकअप:', te: 'పికప్:' },
  'Consume:': { hi: 'सेवन:', te: 'తినడానికి:' },
  'Edit before allocation': { hi: 'आवंटन से पहले संपादित करें', te: 'కేటాయింపుకు ముందు సవరించు' },
  'Cancel batch with recorded reason': { hi: 'कारण के साथ बैच रद्द करें', te: 'కారణంతో బ్యాచ్ రద్దు చేయి' },
  'Cancel Donation': { hi: 'दान रद्द करें', te: 'దానం రద్దు చేయి' },
  'Cancelling a donation records an immutable audit trail entry and withdraws it from surplus matching.': {
    hi: 'दान रद्द करने पर ऑडिट लॉग में स्थायी प्रविष्टि दर्ज होगी और इसे मिलान से हटा दिया जाएगा।',
    te: 'దానం రద్దు చేయడం వల్ల ఆడిట్ లాగ్‌లో శాశ్వత నమోదు జరుగుతుంది మరియు మ్యాచింగ్ నుండి తొలగించబడుతుంది.',
  },
  'Cancellation Reason': { hi: 'रद्द करने का कारण', te: 'రద్దు చేయడానికి కారణం' },

  // Requests
  'Meal Requests & Receiving Confirmations': {
    hi: 'भोजन अनुरोध और प्राप्ति पुष्टि',
    te: 'భోజన అభ్యర్థనలు & స్వీకరణ నిర్ధారణలు',
  },
  'Verified NGOs and Community Kitchens log meal demand, accept or decline proposed allocations, and confirm actual received portions.': {
    hi: 'सत्यापित एनजीओ और सामुदायिक रसोई भोजन की मांग दर्ज करें — उपलब्ध सुरक्षित भोजन स्वतः मिलान होकर ड्राइवर के साथ भेजा जाएगा।',
    te: 'ధృవీకరించబడిన NGOలు మరియు కమ్యూనిటీ కిచెన్లు భోజన అవసరాన్ని నమోదు చేయండి — అందుబాటులో ఉన్న సురక్షిత ఆహారం స్వయంచాలకంగా మ్యాచ్ అయి డ్రైవర్‌తో పంపబడుతుంది.',
  },
  'New Meal Request': { hi: 'नया भोजन अनुरोध', te: 'కొత్త భోజన అభ్యర్థన' },
  'Submit Meal Request': { hi: 'भोजन अनुरोध जमा करें', te: 'భోజన అభ్యర్థన సమర్పించు' },
  'Verified Recipient Organisation *': { hi: 'सत्यापित प्राप्तकर्ता संगठन *', te: 'ధృవీకరించబడిన స్వీకర్త సంస్థ *' },
  'Verified Receiving Organisation *': { hi: 'सत्यापित प्राप्तकर्ता संगठन *', te: 'ధృవీకరించబడిన స్వీకర్త సంస్థ *' },
  'Select a verified NGO or Community Kitchen.': {
    hi: 'कृपया एक सत्यापित एनजीओ या सामुदायिक रसोई चुनें।',
    te: 'ధృవీకరించబడిన NGO లేదా కమ్యూనిటీ కిచెన్‌ను ఎంచుకోండి.',
  },
  'Portions Needed *': { hi: 'आवश्यक भोजन संख्या *', te: 'అవసరమైన భోజనాలు *' },
  'Dietary Preference *': { hi: 'आहार प्राथमिकता *', te: 'ఆహార ప్రాధాన్యత *' },
  'Dietary Requirement *': { hi: 'आहार आवश्यकता *', te: 'ఆహార అవసరం *' },
  'Urgency': { hi: 'आवश्यकता स्तर', te: 'అత్యవసర స్థాయి' },
  'Required By *': { hi: 'कब तक चाहिए *', te: 'ఎప్పటిలోపు అవసరం *' },
  'Service Context / Notes': { hi: 'सेवा विवरण / नोट्स', te: 'సేవా వివరాలు / నోట్స్' },
  'e.g. Evening shelter dinner service': {
    hi: 'उदा. आश्रय के लिए शाम का भोजन',
    te: 'ఉదా. ఆశ్రయం కోసం సాయంత్రం భోజనం',
  },
  'Submit Request': { hi: 'अनुरोध जमा करें', te: 'అభ్యర్థన సమర్పించు' },
  'Allocated Donations & Handover Confirmation': {
    hi: 'आवंटित भोजन और प्राप्ति पुष्टि',
    te: 'కేటాయించిన ఆహారాలు & స్వీకరణ నిర్ధారణ',
  },
  'Accept or decline coordinator-approved matches, and confirm actual delivered portions when food arrives.': {
    hi: 'आवंटित भोजन की स्थिति देखें और भोजन पहुँचने पर प्राप्त संख्या की पुष्टि करें।',
    te: 'కేటాయించిన భోజనాలను చూడండి మరియు ఆహారం చేరుకున్న తర్వాత అందిన సంఖ్యను నిర్ధారించండి.',
  },
  'No surplus allocations have been proposed for these requests yet.': {
    hi: 'इन अनुरोधों के लिए अभी तक कोई भोजन आवंटित नहीं हुआ है।',
    te: 'ఈ అభ్యర్థనలకు ఇంకా ఆహార కేటాయింపులు జరగలేదు.',
  },
  'Accept': { hi: 'स्वीकार करें', te: 'అంగీకరించు' },
  'Decline': { hi: 'अस्वीकार करें', te: 'తిరస్కరించు' },
  'Confirm Delivery': { hi: 'डिलीवरी पुष्टि करें', te: 'డెలివరీ నిర్ధారించు' },
  'Confirm Received Portions': { hi: 'प्राप्त भोजन पुष्टि करें', te: 'అందిన భోజనాలను నిర్ధారించు' },
  'Actual Portions Received *': { hi: 'वास्तव में प्राप्त भोजन *', te: 'వాస్తవంగా అందిన భోజనాలు *' },
  'Distribution Area *': { hi: 'वितरण क्षेत्र *', te: 'పంపిణీ ప్రాంతం *' },
  'Distribution Area': { hi: 'वितरण क्षेत्र', te: 'పంపిణీ ప్రాంతం' },
  'Meal Request Ledger': { hi: 'भोजन अनुरोध सूची', te: 'భోజన అభ్యర్థనల పట్టిక' },
  'Receiving Organisation': { hi: 'प्राप्तकर्ता संगठन', te: 'స్వీకరించే సంస్థ' },
  'Fulfilled / Needed': { hi: 'पूर्ण / आवश्यक', te: 'పూర్తయినవి / అవసరం' },
  'Dietary & Channel': { hi: 'आहार व माध्यम', te: 'ఆహారం & మాధ్యమం' },
  'Verified Org': { hi: 'सत्यापित संगठन', te: 'ధృవీకరించబడిన సంస్థ' },
  'Verified Recipient': { hi: 'सत्यापित प्राप्तकर्ता', te: 'ధృవీకరించబడిన స్వీకర్త' },

  // Food Safety
  'Food Safety Inspection Module': { hi: 'खाद्य सुरक्षा जाँच मॉड्यूल', te: 'ఆహార భద్రతా తనిఖీ మాడ్యూల్' },
  'FSSAI surplus-food aligned inspection ledger. Unsafe or uncertain temperature values fail closed and block matching.': {
    hi: 'FSSAI मानकों के अनुरूप स्वतः सुरक्षा जाँच व निरीक्षण लॉग। असुरक्षित तापमान वाला भोजन स्वतः रोक दिया जाता है।',
    te: 'FSSAI ప్రమాణాలకు అనుగుణంగా ఆటోమేటిక్ భద్రతా తనిఖీ & లాగ్. సురక్షితం కాని ఉష్ణోగ్రత ఉన్న ఆహారం స్వయంచాలకంగా ఆపివేయబడుతుంది.',
  },
  'Read-only view: Only authorised food-safety inspectors or administrators may record final inspection outcomes.': {
    hi: 'केवल देखने की अनुमति: अंतिम मैनुअल निरीक्षण परिणाम केवल अधिकृत खाद्य सुरक्षा निरीक्षक या प्रशासक दर्ज कर सकते हैं।',
    te: 'చదవడానికి మాత్రమే: తుది మాన్యువల్ తనిఖీ ఫలితాలను అధీకృత తనిఖీదారులు లేదా అడ్మినిస్ట్రేటర్లు మాత్రమే నమోదు చేయగలరు.',
  },
  'Select Donation Batch *': { hi: 'भोजन बैच चुनें *', te: 'ఆహార బ్యాచ్ ఎంచుకోండి *' },
  'Hot food target ≥ 60°C; chilled ≤ 5°C.': {
    hi: 'गर्म भोजन ≥ 60°C; ठंडा भोजन ≤ 5°C होना चाहिए।',
    te: 'వేడి ఆహారం ≥ 60°C; చల్లని ఆహారం ≤ 5°C ఉండాలి.',
  },
  'Sensory, Hygiene & Container Inspection Notes': {
    hi: 'स्वच्छता, गंध और कंटेनर निरीक्षण नोट्स',
    te: 'పరిశుభ్రత, వాసన & కంటైనర్ తనిఖీ నోట్స్',
  },
  'Probe thermometer verified, aroma/appearance fresh, food-grade container sealed.': {
    hi: 'थर्मामीटर से जाँच की गई, भोजन ताज़ा है, फूड-ग्रेड कंटेनर सील है।',
    te: 'థర్మామీటర్‌తో తనిఖీ చేయబడింది, ఆహారం తాజాగా ఉంది, ఫుడ్-గ్రేడ్ కంటైనర్ సీల్ చేయబడింది.',
  },
  'e.g. Core temperature 38°C within danger zone; rejected per safety protocol.': {
    hi: 'उदा. तापमान 38°C खतरे के स्तर में है; सुरक्षा नियम के अनुसार अस्वीकृत।',
    te: 'ఉదా. ఉష్ణోగ్రత 38°C ప్రమాద పరిధిలో ఉంది; భద్రతా నియమం ప్రకారం తిరస్కరించబడింది.',
  },
  'Fail-closed safety gate: a valid numeric temperature reading is required to pass.': {
    hi: 'सुरक्षा नियम: उत्तीर्ण होने के लिए वैध तापमान मान आवश्यक है।',
    te: 'భద్రతా నియమం: ఉత్తీర్ణం కావడానికి సరైన ఉష్ణోగ్రత విలువ అవసరం.',
  },
  'Physical inspection confirmation is mandatory before passing a batch.': {
    hi: 'बैच को उत्तीर्ण करने से पहले भौतिक निरीक्षण की पुष्टि अनिवार्य है।',
    te: 'బ్యాచ్‌ను ఉత్తీర్ణం చేసే ముందు భౌతిక తనిఖీ నిర్ధారణ తప్పనిసరి.',
  },
  'Please specify a clear rejection reason for the FSSAI-aligned inspection record.': {
    hi: 'कृपया अस्वीकृति का स्पष्ट कारण दर्ज करें।',
    te: 'దయచేసి స్పష్టమైన తిరస్కరణ కారణాన్ని పేర్కొనండి.',
  },
  'Recording...': { hi: 'दर्ज किया जा रहा है...', te: 'నమోదు చేయబడుతోంది...' },
  'Inspection Ledger': { hi: 'निरीक्षण लॉग', te: 'తనిఖీ లాగ్' },
  'No physical food safety inspections recorded yet.': {
    hi: 'अभी तक कोई खाद्य सुरक्षा जाँच दर्ज नहीं है।',
    te: 'ఇంకా ఆహార భద్రతా తనిఖీలు నమోదు కాలేదు.',
  },
  'Inspector:': { hi: 'निरीक्षक:', te: 'తనిఖీదారు:' },
  'Temp:': { hi: 'तापमान:', te: 'ఉష్ణోగ్రత:' },
  'Rejection:': { hi: 'अस्वीकृति:', te: 'తిరస్కరణ:' },
  'PASSED': { hi: 'उत्तीर्ण', te: 'ఉత్తీర్ణం' },
  'PENDING': { hi: 'लंबित', te: 'పెండింగ్' },
  'Safety PASSED': { hi: 'सुरक्षा उत्तीर्ण', te: 'భద్రత ఉత్తీర్ణం' },
  'Safety NOT PASSED': { hi: 'सुरक्षा अनुत्तीर्ण', te: 'భద్రత విఫలం' },

  // Smart Matching
  'Match Food to Shelters': { hi: 'आश्रयों से भोजन मिलान', te: 'ఆశ్రయాలకు ఆహార మ్యాచింగ్' },
  'Checks food safety first, then pairs available meals with the shelters that need them most.': {
    hi: 'मिलान हर दान पर स्वतः चलता है। सुरक्षा जाँच के बाद सबसे ज़रूरतमंद आश्रयों को प्राथमिकता मिलती है।',
    te: 'ప్రతి దానంపై మ్యాచింగ్ స్వయంచాలకంగా నడుస్తుంది. భద్రతా తనిఖీ తర్వాత అత్యవసర ఆశ్రయాలకు ప్రాధాన్యత ఇవ్వబడుతుంది.',
  },
  'Hide score weights': { hi: 'स्कोर नियम छिपाएं', te: 'స్కోర్ వివరాలు దాచు' },
  'Matching Settings': { hi: 'मिलान सेटिंग्स', te: 'మ్యాచింగ్ సెట్టింగ్స్' },
  'Target Donation Batch': { hi: 'लक्षित भोजन बैच', te: 'లక్ష్య ఆహార బ్యాచ్' },
  'Select Food Batch': { hi: 'भोजन बैच चुनें', te: 'ఆహార బ్యాచ్ ఎంచుకోండి' },
  'Available:': { hi: 'उपलब्ध:', te: 'అందుబాటులో:' },
  'Safety:': { hi: 'सुरक्षा:', te: 'భద్రత:' },
  'Use by:': { hi: 'अंतिम समय:', te: 'గడువు:' },
  'Batch Blocked by Fail-Closed Hard Eligibility Gate': {
    hi: 'सुरक्षा या पात्रता नियम द्वारा बैच अवरुद्ध',
    te: 'భద్రత లేదా అర్హత నియమం ద్వారా బ్యాచ్ నిరోధించబడింది',
  },
  'Split-Batch Proposal & Scoring Audit': {
    hi: 'विभाजित आवंटन प्रस्ताव व स्कोरिंग ऑडिट',
    te: 'విభజన కేటాయింపు ప్రతిపాదన & స్కోరింగ్ ఆడిట్',
  },
  'Recipient': { hi: 'प्राप्तकर्ता', te: 'స్వీకర్త' },
  'Score': { hi: 'स्कोर', te: 'స్కోర్' },
  'Proposed:': { hi: 'प्रस्तावित:', te: 'ప్రతిపాదన:' },
  'Blocked': { hi: 'अवरुद्ध', te: 'నిరోధించబడింది' },
  'Nutrition:': { hi: 'पोषण:', te: 'పోషకాహారం:' },
  'Allocations execute safely and still require Coordinator approval before dispatch.': {
    hi: 'नए दान स्वतः मिलान और डिस्पैच होते हैं; समन्वयक यहाँ अतिरिक्त आवंटन प्रस्तावित कर सकते हैं।',
    te: 'కొత్త దానాలు స్వయంచాలకంగా మ్యాచ్ అయి డిస్పాచ్ అవుతాయి; కోఆర్డినేటర్లు ఇక్కడ అదనపు కేటాయింపులు చేయవచ్చు.',
  },
  'Recorded Allocations & Coordinator Approvals': {
    hi: 'दर्ज आवंटन और स्वीकृतियाँ',
    te: 'నమోదైన కేటాయింపులు & ఆమోదాలు',
  },
  'Review match explanations and approve final allocations before delivery dispatch.': {
    hi: 'मिलान विवरण की समीक्षा करें और लंबित आवंटनों को स्वीकृत करें।',
    te: 'మ్యాచ్ వివరాలను సమీక్షించి పెండింగ్ కేటాయింపులను ఆమోదించండి.',
  },
  'Approve Allocation for Dispatch': { hi: 'डिलीवरी के लिए आवंटन स्वीकृत करें', te: 'డెలివరీకి కేటాయింపు ఆమోదించు' },
  'Coordinator Verification Note': { hi: 'समन्वयक सत्यापन नोट', te: 'కోఆర్డినేటర్ ధృవీకరణ నోట్' },
  'e.g. Verified receiving window and delivery capacity.': {
    hi: 'उदा. प्राप्ति समय और वाहन क्षमता सत्यापित।',
    te: 'ఉదా. స్వీకరణ సమయం మరియు వాహన సామర్థ్యం ధృవీకరించబడింది.',
  },

  // RescueRoute / Deliveries
  'Deliveries & Live Route Map': { hi: 'डिलीवरी और लाइव रूट मैप', te: 'డెలివరీలు & లైవ్ రూట్ మ్యాప్' },
  'Track food rescue deliveries on OpenStreetMap, verify time buffers, and update delivery progress.': {
    hi: 'नए भोजन दान पर डिलीवरी रूट स्वतः बनते हैं। OpenStreetMap पर रूट देखें और डिलीवरी की प्रगति अपडेट करें।',
    te: 'కొత్త ఆహార దానాలపై డెలివరీ మార్గాలు స్వయంచాలకంగా రూపొందుతాయి. OpenStreetMapలో రూట్ చూసి డెలివరీ స్థితిని అప్‌డేట్ చేయండి.',
  },
  'OpenStreetMap Operational View': { hi: 'OpenStreetMap लाइव मानचित्र', te: 'OpenStreetMap లైవ్ మ్యాప్' },
  'Dark Green: Verified Donor · Coral: Verified NGO / Kitchen': {
    hi: 'गहरा हरा: सत्यापित दाता · कोरल: सत्यापित एनजीओ / रसोई',
    te: 'ముదురు ఆకుపచ్చ: ధృవీకరించబడిన దాత · కోరల్: ధృవీకరించబడిన NGO / కిచెన్',
  },
  'RescueRoute interactive map': { hi: 'डिलीवरी इंटरैक्टिव मानचित्र', te: 'డెలివరీ ఇంటరాక్టివ్ మ్యాప్' },
  'Multi-Stop Route Planner': { hi: 'मल्टी-स्टॉप रूट प्लानर (मैनुअल ओवरराइड)', te: 'మల్టీ-స్టాప్ రూట్ ప్లానర్ (మాన్యువల్)' },
  'Approved Allocations Ready for Dispatch': {
    hi: 'डिस्पैच के लिए तैयार स्वीकृत आवंटन',
    te: 'డిస్పాచ్ కోసం సిద్ధమైన ఆమోదిత కేటాయింపులు',
  },
  'No approved allocations waiting for dispatch. Approve proposed matches in Smart Matching first.': {
    hi: 'डिस्पैच के लिए कोई लंबित आवंटन नहीं है — सभी योग्य आवंटन स्वतः ड्राइवर को सौंपे जा चुके हैं।',
    te: 'డిస్పాచ్ కోసం పెండింగ్ కేటాయింపులు లేవు — అర్హత గలవన్నీ స్వయంచాలకంగా డ్రైవర్లకు కేటాయించబడ్డాయి.',
  },
  'Approve or accept at least one allocation before computing a rescue route.': {
    hi: 'रूट की गणना करने से पहले कम से कम एक आवंटन चुनें।',
    te: 'రూట్ లెక్కించే ముందు కనీసం ఒక కేటాయింపును ఎంచుకోండి.',
  },
  'Assigned Delivery Partner': { hi: 'नियुक्त डिलीवरी पार्टनर', te: 'నియమిత డెలివరీ పార్టనర్' },
  'Vehicle Capacity': { hi: 'वाहन क्षमता', te: 'వాహన సామర్థ్యం' },
  'Shift Reference': { hi: 'शिफ्ट संदर्भ', te: 'షిఫ్ట్ సూచన' },
  'Compute Multi-Stop Route & Feasibility': { hi: 'रूट और समय की गणना करें', te: 'రూట్ మరియు సమయం లెక్కించు' },
  'Computing Route...': { hi: 'रूट की गणना हो रही है...', te: 'రూట్ లెక్కించబడుతోంది...' },
  'Dispatch Route to Delivery Partner': { hi: 'ड्राइवर को रूट सौंपें', te: 'డ్రైవర్‌కు రూట్ అప్పగించు' },
  'Live OSRM Route': { hi: 'लाइव OSRM रूट', te: 'లైవ్ OSRM రూట్' },
  'Estimated Road Route': { hi: 'अनुमानित सड़क मार्ग', te: 'అంచనా రహదారి మార్గం' },
  'Distance': { hi: 'दूरी', te: 'దూరం' },
  'Est. ETA': { hi: 'अनुमानित समय', te: 'అంచనా సమయం' },
  'Load': { hi: 'भार', te: 'లోడ్' },
  'Feasible': { hi: 'संभव', te: 'సాధ్యమే' },
  'min': { hi: 'मिनट', te: 'నిమి' },
  'Dispatched Delivery Shifts': { hi: 'नियुक्त डिलीवरी शिफ्ट', te: 'కేటాయించిన డెలివరీ షిఫ్ట్‌లు' },
  'Read-only tracking view: Only assigned Delivery Partners and Administrators can update delivery shift statuses.': {
    hi: 'केवल देखने की अनुमति: डिलीवरी स्थिति केवल नियुक्त डिलीवरी पार्टनर और प्रशासक अपडेट कर सकते हैं।',
    te: 'చదవడానికి మాత్రమే: డెలివరీ స్థితిని నియమిత డెలివరీ పార్టనర్లు మరియు అడ్మినిస్ట్రేటర్లు మాత్రమే అప్‌డేట్ చేయగలరు.',
  },
  'No delivery routes dispatched yet.': { hi: 'अभी तक कोई डिलीवरी रूट नियुक्त नहीं है।', te: 'ఇంకా డెలివరీ మార్గాలు కేటాయించబడలేదు.' },
  'Stop': { hi: 'स्टॉप', te: 'స్టాప్' },
  'Stop Location': { hi: 'स्टॉप स्थान', te: 'స్టాప్ ప్రదేశం' },
  'Cap': { hi: 'क्षमता', te: 'సామర్థ్యం' },
  'Cap:': { hi: 'क्षमता:', te: 'సామర్థ్యం:' },

  // MealTrace QR
  'MealTrace QR Tracking': { hi: 'MealTrace QR ट्रैकिंग', te: 'MealTrace QR ట్రాకింగ్' },
  'Public Meal Verification': { hi: 'सार्वजनिक भोजन सत्यापन', te: 'పబ్లిక్ భోజన ధృవీకరణ' },
  'Scan or verify food handover QR codes. Personal details are never stored inside QR codes.': {
    hi: 'भोजन सुपुर्दगी QR कोड स्कैन या सत्यापित करें। QR कोड में कभी कोई व्यक्तिगत जानकारी नहीं रखी जाती।',
    te: 'ఆహార అప్పగింత QR కోడ్‌లను స్కాన్ లేదా ధృవీకరించండి. QR కోడ్‌లలో వ్యక్తిగత వివరాలు ఎప్పుడూ నిల్వ చేయబడవు.',
  },
  'QR tracking confirms delivery and handover steps. It does not replace physical food-safety inspection.': {
    hi: 'QR ट्रैकिंग पिकअप और सुपुर्दगी चरणों की पुष्टि करती है।',
    te: 'QR ట్రాకింగ్ పికప్ మరియు అప్పగింత దశలను నిర్ధారిస్తుంది.',
  },
  'Open Platform': { hi: 'प्लेटफ़ॉर्म खोलें', te: 'ప్లాట్‌ఫారమ్ తెరవండి' },
  'Batch Tracking Token': { hi: 'बैच ट्रैकिंग टोकन', te: 'బ్యాచ్ ట్రాకింగ్ టోకెన్' },
  'Paste MealTrace QR token...': { hi: 'MealTrace QR टोकन पेस्ट करें...', te: 'MealTrace QR టోకెన్ పేస్ట్ చేయండి...' },
  'Scan with Camera': { hi: 'कैमरे से स्कैन करें', te: 'కెమెరాతో స్కాన్ చేయండి' },
  'Stop Camera': { hi: 'कैमरा बंद करें', te: 'కెమెరా ఆపండి' },
  'Browser camera access is unavailable. Enter the QR token manually.': {
    hi: 'ब्राउज़र कैमरा उपलब्ध नहीं है। कृपया QR टोकन मैन्युअल रूप से दर्ज करें।',
    te: 'బ్రౌజర్ కెమెరా అందుబాటులో లేదు. QR టోకెన్‌ను నేరుగా నమోదు చేయండి.',
  },
  'Camera permission denied or no camera device detected.': {
    hi: 'कैमरा अनुमति अस्वीकार की गई या कोई कैमरा नहीं मिला।',
    te: 'కెమెరా అనుమతి నిరాకరించబడింది లేదా కెమెరా కనుగొనబడలేదు.',
  },
  'Opaque QR Token': { hi: 'सुरक्षित QR टोकन', te: 'సురక్షిత QR టోకెన్' },
  'Open Public Tracking View': { hi: 'सार्वजनिक ट्रैकिंग पृष्ठ खोलें', te: 'పబ్లిక్ ట్రాకింగ్ పేజీ తెరవండి' },
  'No batch matched this token. Enter a valid QR token or scan a batch QR code.': {
    hi: 'इस टोकन से कोई बैच मेल नहीं खाया। कृपया सही QR टोकन दर्ज करें या स्कैन करें।',
    te: 'ఈ టోకెన్‌తో ఏ బ్యాచ్ సరిపోలలేదు. సరైన QR టోకెన్ నమోదు చేయండి లేదా స్కాన్ చేయండి.',
  },
  'Donor Identity': { hi: 'दाता पहचान', te: 'దాత గుర్తింపు' },
  'Category & Quantity': { hi: 'श्रेणी और मात्रा', te: 'వర్గం & పరిమాణం' },
  'Prep / Consume-By': { hi: 'तैयारी / अंतिम समय', te: 'తయారీ / గడువు సమయం' },
  'Prep:': { hi: 'तैयारी:', te: 'తయారీ:' },
  'Status:': { hi: 'स्थिति:', te: 'స్థితి:' },
  'Record Handover Scan Event': { hi: 'सुपुर्दगी स्कैन दर्ज करें', te: 'అప్పగింత స్కాన్ నమోదు చేయి' },
  'Resolve a valid MealTrace QR token before recording an event.': {
    hi: 'इवेंट दर्ज करने से पहले सही QR टोकन चुनें।',
    te: 'ఈవెంట్ నమోదు చేసే ముందు సరైన QR టోకెన్‌ను ఎంచుకోండి.',
  },
  'Milestone Event *': { hi: 'चरण चुनें *', te: 'దశను ఎంచుకోండి *' },
  'Delivery Partner: Pickup Scanned': { hi: 'डिलीवरी पार्टनर: पिकअप स्कैन', te: 'డెలివరీ పార్టనర్: పికప్ స్కాన్' },
  'Handover Scanned at Destination': { hi: 'गंतव्य पर सुपुर्दगी स्कैन', te: 'గమ్యస్థానంలో అప్పగింత స్కాన్' },
  'Confirmed Portions *': { hi: 'पुष्ट भोजन संख्या *', te: 'నిర్ధారించిన భోజనాలు *' },
  'Handover Notes': { hi: 'सुपुर्दगी नोट्स', te: 'అప్పగింత నోట్స్' },
  'Seal intact, container count verified': {
    hi: 'सील सुरक्षित है, कंटेनरों की गिनती सही है',
    te: 'సీల్ సురక్షితంగా ఉంది, కంటైనర్ల సంఖ్య సరిపోయింది',
  },
  'Save Scan Event': { hi: 'स्कैन दर्ज करें', te: 'స్కాన్ సేవ్ చేయి' },
  'Your role can view and share batch QR codes. Only Delivery Partners, Receiving Shelters, and Administrators can log handover scan events.': {
    hi: 'आपकी भूमिका QR कोड देख और साझा कर सकती है। स्कैन इवेंट केवल डिलीवरी पार्टनर, प्राप्तकर्ता आश्रय और प्रशासक दर्ज कर सकते हैं।',
    te: 'మీ పాత్ర QR కోడ్‌లను చూడగలదు మరియు పంచుకోగలదు. అప్పగింత స్కాన్‌లను డెలివరీ పార్టనర్లు, స్వీకరించే ఆశ్రయాలు మరియు అడ్మినిస్ట్రేటర్లు మాత్రమే నమోదు చేయగలరు.',
  },
  'Chain of Custody': { hi: 'सुपुर्दगी श्रृंखला (Chain of Custody)', te: 'అప్పగింత గొలుసు (Chain of Custody)' },
  'No scans': { hi: 'कोई स्कैन नहीं', te: 'స్కాన్‌లు లేవు' },
  'By:': { hi: 'द्वारा:', te: 'ద్వారా:' },
  'Confirmed:': { hi: 'पुष्ट:', te: 'నిర్ధారణ:' },

  // Field Intake
  'Register Assisted Meal Request': { hi: 'सहायता प्राप्त भोजन अनुरोध दर्ज करें', te: 'సహాయక భోజన అభ్యర్థన నమోదు' },
  'Intake Channel *': { hi: 'संपर्क माध्यम *', te: 'సంప్రదింపు మాధ్యమం *' },
  'Test Offline Queue Mode': { hi: 'ऑफ़लाइन मोड जाँचें', te: 'ఆఫ్‌లైన్ మోడ్ పరీక్షించు' },
  'Submit Assisted Request': { hi: 'अनुरोध जमा करें', te: 'అభ్యర్థన సమర్పించు' },
  'Avoid storing personal phone/ID numbers in offline drafts.': {
    hi: 'ऑफ़लाइन ड्राफ़्ट में व्यक्तिगत फ़ोन या आईडी नंबर न लिखें।',
    te: 'ఆఫ్‌లైన్ డ్రాఫ్ట్‌లలో వ్యక్తిగత ఫోన్ లేదా ID నంబర్లు నమోదు చేయవద్దు.',
  },
  'Pending drafts stay on this device until synced to the main database.': {
    hi: 'लंबित ड्राफ़्ट सिंक होने तक इसी डिवाइस पर सुरक्षित रहते हैं।',
    te: 'పెండింగ్ డ్రాఫ్ట్‌లు సింక్ అయ్యే వరకు ఈ పరికరంలోనే సురక్షితంగా ఉంటాయి.',
  },
  'No local offline drafts queued yet.': {
    hi: 'अभी तक कोई स्थानीय ऑफ़लाइन ड्राफ़्ट नहीं है।',
    te: 'ఇంకా స్థానిక ఆఫ్‌లైన్ డ్రాఫ్ట్‌లు ఏవీ లేవు.',
  },
  'Remove local draft': { hi: 'स्थानीय ड्राफ़्ट हटाएं', te: 'స్థానిక డ్రాఫ్ట్ తొలగించు' },
  'Synced': { hi: 'सिंक हो गया', te: 'సింక్ అయింది' },
  'Pending': { hi: 'लंबित', te: 'పెండింగ్' },
  'Failed': { hi: 'विफल', te: 'విఫలమైంది' },

  // ImpactLedger
  'Verified surplus food rescue analytics computed strictly from confirmed records.': {
    hi: 'केवल सत्यापित रिकॉर्ड से गणना किया गया अतिरिक्त भोजन बचाव विश्लेषण।',
    te: 'ధృవీకరించబడిన రికార్డుల నుండి మాత్రమే లెక్కించబడిన ఆహార రక్షణ విశ్లేషణ.',
  },
  'Filter by Organisation': { hi: 'संगठन के अनुसार फ़िल्टर', te: 'సంస్థ ప్రకారం ఫిల్టర్' },
  'All Organisations': { hi: 'सभी संगठन', te: 'అన్ని సంస్థలు' },
  'From Date': { hi: 'प्रारंभ तिथि', te: 'ప్రారంభ తేదీ' },
  'To Date': { hi: 'अंतिम तिथि', te: 'చివరి తేదీ' },
  'Surplus Portion Breakdown': { hi: 'भोजन वितरण सारांश', te: 'ఆహార పంపిణీ విభజన' },
  'Comparison of offered, allocated, confirmed delivered, unallocated, and safety-rejected portions.': {
    hi: 'दान, आवंटित, सत्यापित वितरित, अनाबंटित और अस्वीकृत भोजन की तुलना।',
    te: 'అందించినవి, కేటాయించినవి, నిర్ధారించిన డెలివరీ, కేటాయించనివి మరియు తిరస్కరించబడిన భాగాల పోలిక.',
  },
  'Offered': { hi: 'दान किए गए', te: 'అందించినవి' },
  'Allocated': { hi: 'आवंटित', te: 'కేటాయించినవి' },
  'Unallocated': { hi: 'अनाबंटित', te: 'కేటాయించనివి' },
  'Rejected': { hi: 'अस्वीकृत', te: 'తిరస్కరించబడినవి' },
  'Meals': { hi: 'भोजन', te: 'భోజనాలు' },
  'Confirmed Impact Records': { hi: 'सत्यापित प्रभाव रिकॉर्ड', te: 'ధృవీకరించబడిన ప్రభావ రికార్డులు' },
  'No confirmed deliveries recorded yet. Complete a QR handover confirmation to record verified impact.': {
    hi: 'अभी तक कोई सत्यापित डिलीवरी दर्ज नहीं है। प्रभाव दर्ज करने के लिए QR सुपुर्दगी की पुष्टि करें।',
    te: 'ఇంకా ధృవీకరించబడిన డెలివరీలు నమోదు కాలేదు. ప్రభావాన్ని నమోదు చేయడానికి QR అప్పగింతను నిర్ధారించండి.',
  },
  'Confirmed At': { hi: 'पुष्टि समय', te: 'నిర్ధారణ సమయం' },
  'Surplus Batch': { hi: 'भोजन बैच', te: 'ఆహార బ్యాచ్' },
  'Confirmed Portions': { hi: 'पुष्ट भोजन', te: 'నిర్ధారించిన భోజనాలు' },
  'Verified Community Site': { hi: 'सत्यापित सामुदायिक स्थल', te: 'ధృవీకరించబడిన కమ్యూనిటీ కేంద్రం' },

  // Notifications
  'Notifications & Alerts': { hi: 'सूचनाएं और अलर्ट', te: 'నోటిఫికేషన్లు & హెచ్చరికలు' },
  'Real-time updates about food safety checks, allocations, and deliveries.': {
    hi: 'खाद्य सुरक्षा जाँच, स्वतः मिलान और डिलीवरी के बारे में ताज़ा अपडेट।',
    te: 'ఆహార భద్రతా తనిఖీలు, ఆటో కేటాయింపులు మరియు డెలివరీల గురించిన తాజా అప్‌డేట్లు.',
  },
  'You have no notifications right now.': {
    hi: 'अभी आपके पास कोई सूचना नहीं है।',
    te: 'ప్రస్తుతం మీకు నోటిఫికేషన్లు ఏవీ లేవు.',
  },
  'Mark read': { hi: 'पढ़ा हुआ मानें', te: 'చదివినట్లు గుర్తించు' },
  'Read': { hi: 'पढ़ा गया', te: 'చదివారు' },

  // Onboarding
  'Profile & Organisation Details': { hi: 'प्रोफ़ाइल और संगठन विवरण', te: 'ప్రొఫైల్ & సంస్థ వివరాలు' },
  'Verification documents are stored privately and reviewed by administrators before live access is enabled.': {
    hi: 'सत्यापन दस्तावेज़ सुरक्षित रखे जाते हैं और लाइव एक्सेस से पहले प्रशासकों द्वारा जांचे जाते हैं।',
    te: 'ధృవీకరణ పత్రాలు సురక్షితంగా నిల్వ చేయబడి, లైవ్ యాక్సెస్ ముందు అడ్మినిస్ట్రేటర్లచే సమీక్షించబడతాయి.',
  },
  'Account Profile': { hi: 'खाता प्रोफ़ाइल', te: 'ఖాతా ప్రొఫైల్' },
  'Active Organisation': { hi: 'सक्रिय संगठन', te: 'సక్రియ సంస్థ' },
  'You are not yet linked to an organisation.': {
    hi: 'आप अभी तक किसी संगठन से जुड़े नहीं हैं।',
    te: 'మీరు ఇంకా ఏ సంస్థతోనూ అనుసంధానం కాలేదు.',
  },
  'No FSSAI on file': { hi: 'FSSAI संख्या दर्ज नहीं', te: 'FSSAI నంబర్ నమోదు కాలేదు' },
  'Delivery Cap': { hi: 'दैनिक क्षमता', te: 'రోజువారీ సామర్థ్యం' },
  'Update': { hi: 'अपडेट करें', te: 'అప్‌డేట్ చేయి' },
  'Register Organisation for Verification': {
    hi: 'सत्यापन के लिए संगठन पंजीकृत करें',
    te: 'ధృవీకరణ కోసం సంస్థను నమోదు చేయండి',
  },
  'New organisations start in pending status until an administrator approves verification.': {
    hi: 'नए संगठन तब तक लंबित स्थिति में रहते हैं जब तक प्रशासक सत्यापन स्वीकृत न करे।',
    te: 'అడ్మినిస్ట్రేటర్ ధృవీకరణ ఆమోదించే వరకు కొత్త సంస్థలు పెండింగ్ స్థితిలో ఉంటాయి.',
  },
  'Organisation Legal Name *': { hi: 'संगठन का कानूनी नाम *', te: 'సంస్థ చట్టపరమైన పేరు *' },
  'e.g. Sri Annapoorna Community Trust': {
    hi: 'उदा. श्री अन्नपूर्णा सामुदायिक ट्रस्ट',
    te: 'ఉదా. శ్రీ అన్నపూర్ణ కమ్యూనిటీ ట్రస్ట్',
  },
  'Organisation Category *': { hi: 'संगठन श्रेणी *', te: 'సంస్థ వర్గం *' },
  'Verified NGO / Shelter': { hi: 'सत्यापित एनजीओ / आश्रय', te: 'ధృవీకరించబడిన NGO / ఆశ్రయం' },
  'Full Street Address *': { hi: 'पूरा पता *', te: 'పూర్తి చిరునామా *' },
  'Street, Locality, City, PIN Code': {
    hi: 'गली, क्षेत्र, शहर, पिन कोड',
    te: 'వీధి, ప్రాంతం, నగరం, పిన్ కోడ్',
  },
  'Latitude *': { hi: 'अक्षांश (Latitude) *', te: 'అక్షాంశం (Latitude) *' },
  'Longitude *': { hi: 'देशांतर (Longitude) *', te: 'రేఖాంశం (Longitude) *' },
  'Use Current GPS': { hi: 'वर्तमान GPS उपयोग करें', te: 'ప్రస్తుత GPS ఉపయోగించు' },
  'Browser geolocation is unavailable on this device.': {
    hi: 'इस डिवाइस पर GPS लोकेशन उपलब्ध नहीं है।',
    te: 'ఈ పరికరంలో GPS లొకేషన్ అందుబాటులో లేదు.',
  },
  'Unable to read GPS location. You may enter coordinates manually.': {
    hi: 'GPS स्थान प्राप्त नहीं हो सका। आप निर्देशांक स्वयं दर्ज कर सकते हैं।',
    te: 'GPS స్థానాన్ని పొందలేకపోయాము. మీరు అక్షాంశ రేఖాంశాలను నేరుగా నమోదు చేయవచ్చు.',
  },
  'Valid latitude and longitude coordinates are required.': {
    hi: 'मान्य अक्षांश और देशांतर आवश्यक हैं।',
    te: 'సరైన అక్షాంశం మరియు రేఖాంశం అవసరం.',
  },
  'Primary Contact Person *': { hi: 'मुख्य संपर्क व्यक्ति *', te: 'ప్రధాన సంప్రదింపు వ్యక్తి *' },
  'Contact Phone *': { hi: 'संपर्क फ़ोन *', te: 'సంప్రదింపు ఫోన్ *' },
  'FSSAI Registration / Licence Number': { hi: 'FSSAI पंजीकरण / लाइसेंस संख्या', te: 'FSSAI నమోదు / లైసెన్స్ నంబర్' },
  'NGO Darpan / Trust Registration Number': { hi: 'NGO दर्पण / ट्रस्ट पंजीकरण संख्या', te: 'NGO దర్పణ్ / ట్రస్ట్ నమోదు నంబర్' },
  'Daily Portion Capacity *': { hi: 'दैनिक भोजन क्षमता *', te: 'రోజువారీ భోజన సామర్థ్యం *' },
  'Choose FSSAI / NGO Registration PDF or Image': {
    hi: 'FSSAI / NGO पंजीकरण PDF या छवि चुनें',
    te: 'FSSAI / NGO నమోదు PDF లేదా చిత్రాన్ని ఎంచుకోండి',
  },
  'Submit Organisation for Verification': {
    hi: 'सत्यापन के लिए संगठन जमा करें',
    te: 'ధృవీకరణ కోసం సంస్థను సమర్పించు',
  },
  'Unauthenticated': { hi: 'असत्यापित', te: 'ధృవీకరించబడలేదు' },
  'Not set': { hi: 'सेट नहीं', te: 'సెట్ చేయబడలేదు' },

  // NutriLoop
  'Community Nutrition': { hi: 'सामुदायिक पोषण (NutriLoop)', te: 'కమ్యూనిటీ పోషకాహారం (NutriLoop)' },
  'See which nutrients a shelter is short on and suggest the right foods for donors to share.': {
    hi: 'देखें कि किस आश्रय में कौन से पोषक तत्व कम हैं और दाताओं को सही भोजन सुझाएं।',
    te: 'ఆశ్రయంలో ఏ పోషకాలు తక్కువగా ఉన్నాయో చూసి, దాతలు పంచుకోవడానికి సరైన ఆహారాలను సూచించండి.',
  },
  'Choose community': { hi: 'समुदाय चुनें', te: 'కమ్యూనిటీని ఎంచుకోండి' },
  'No shelters yet': { hi: 'अभी कोई आश्रय नहीं', te: 'ఇంకా ఆశ్రయాలు లేవు' },
  'Suggest Needed Foods': { hi: 'आवश्यक भोजन सुझाएं', te: 'అవసరమైన ఆహారాలు సూచించు' },
  'Nutrition sections': { hi: 'पोषण अनुभाग', te: 'పోషకాహార విభాగాలు' },
  'Overview': { hi: 'अवलोकन', te: 'అవలోకనం' },
  'Needed Foods': { hi: 'आवश्यक भोजन', te: 'అవసరమైన ఆహారాలు' },
  'Food Stock & People': { hi: 'भोजन स्टॉक व लोग', te: 'ఆహార నిల్వ & ప్రజలు' },
  'Impact & Reference': { hi: 'प्रभाव व संदर्भ', te: 'ప్రభావం & సూచన' },
  'Covered': { hi: 'पूर्ण', te: 'కవర్ అయినవి' },
  'Still Needed': { hi: 'अभी आवश्यक', te: 'ఇంకా అవసరం' },
  "Set up this shelter's people & food stock first": {
    hi: 'पहले इस आश्रय के लोगों की संख्या और भोजन स्टॉक दर्ज करें',
    te: 'ముందుగా ఈ ఆశ్రయంలోని ప్రజల సంఖ్య మరియు ఆహార నిల్వను నమోదు చేయండి',
  },
  'Add how many people eat here and what food is currently in the kitchen to see what nutrients are missing.': {
    hi: 'यहाँ कितने लोग भोजन करते हैं और रसोई में क्या उपलब्ध है, यह जोड़ें ताकि पोषण की कमी दिखे।',
    te: 'ఏ పోషకాలు తక్కువగా ఉన్నాయో తెలుసుకోవడానికి ఇక్కడ ఎంతమంది తింటున్నారో మరియు వంటగదిలో ఏ ఆహారం ఉందో చేర్చండి.',
  },
  'Add People & Food Stock': { hi: 'लोग और भोजन स्टॉक जोड़ें', te: 'ప్రజలు & ఆహార నిల్వ చేర్చు' },
  'Estimated Nutrition Covered': { hi: 'अनुमानित पोषण पूर्ति', te: 'అంచనా పోషకాహార కవరేజ్' },
  'Missing Most Right Now': { hi: 'अभी सबसे अधिक कमी', te: 'ప్రస్తుతం అత్యధిక లోపం' },
  'All balanced': { hi: 'सभी संतुलित', te: 'అన్నీ సమతుల్యం' },
  'Meets daily reference targets': { hi: 'दैनिक मानक लक्ष्य पूर्ण', te: 'రోజువారీ లక్ష్యాలను చేరుకుంది' },
  'Food Currently Logged': { hi: 'वर्तमान में दर्ज भोजन', te: 'ప్రస్తుతం నమోదైన ఆహారం' },
  "What's Covered vs. Still Needed": { hi: 'पूर्ण बनाम अभी आवश्यक पोषण', te: 'కవర్ అయినవి vs ఇంకా అవసరమైనవి' },
  'Dark green shows what is available; coral shows what is still missing.': {
    hi: 'गहरा हरा उपलब्ध पोषण दिखाता है; कोरल रंग शेष कमी दिखाता है।',
    te: 'ముదురు ఆకుపచ్చ అందుబాటులో ఉన్నదాన్ని, కోరల్ రంగు ఇంకా లోపించినదాన్ని చూపుతుంది.',
  },
  'Download CSV': { hi: 'CSV डाउनलोड', te: 'CSV డౌన్‌లోడ్' },
  'Nutrient Summary': { hi: 'पोषक तत्व सारांश', te: 'పోషకాల సారాంశం' },
  'Hide extra columns': { hi: 'अतिरिक्त कॉलम छिपाएं', te: 'అదనపు కాలమ్‌లు దాచు' },
  'Show distributed & consumed': { hi: 'वितरित व उपभोग दिखाएं', te: 'పంపిణీ & వినియోగం చూపు' },
  'Community': { hi: 'समुदाय', te: 'కమ్యూనిటీ' },
  'Nutrient': { hi: 'पोषक तत्व', te: 'పోషకం' },
  'Unit': { hi: 'इकाई', te: 'యూనిట్' },
  'Target': { hi: 'लक्ष्य', te: 'లక్ష్యం' },
  'Available': { hi: 'उपलब्ध', te: 'అందుబాటు' },
  'Distributed': { hi: 'वितरित', te: 'పంపిణీ' },
  'Consumed': { hi: 'उपभोग किया गया', te: 'తిన్నది' },
  'Reported Eaten': { hi: 'उपभोग दर्ज', te: 'తిన్నట్లు నమోదు' },
  'Coverage %': { hi: 'पूर्ति %', te: 'కవరేజ్ %' },
  'Met': { hi: 'पूर्ण', te: 'పూర్తయింది' },
  'How these estimates are calculated (ICMR-NIN & FAO data)': {
    hi: 'ये अनुमान कैसे निकाले जाते हैं (ICMR-NIN व FAO डेटा)',
    te: 'ఈ అంచనాలు ఎలా లెక్కించబడతాయి (ICMR-NIN & FAO డేటా)',
  },
  'NutriLoop estimates remaining gaps using G(j) = max(0, R(j) - A(j)) with demographic-adjusted ICMR-NIN RDA 2020 targets and ICMR-NIN IFCT 2017 / FAO-INFOODS food composition tables. Food stock shows estimated community availability — not proof of individual consumption.': {
    hi: 'NutriLoop आयु-वर्ग आधारित ICMR-NIN RDA 2020 लक्ष्यों और ICMR-NIN IFCT 2017 / FAO-INFOODS तालिकाओं के साथ G(j) = max(0, R(j) - A(j)) सूत्र से अंतर निकालता है। भोजन स्टॉक केवल सामुदायिक उपलब्धता का अनुमान है — व्यक्तिगत उपभोग का प्रमाण नहीं।',
    te: 'NutriLoop వయస్సు ఆధారిత ICMR-NIN RDA 2020 లక్ష్యాలు మరియు ICMR-NIN IFCT 2017 / FAO-INFOODS పట్టికలతో G(j) = max(0, R(j) - A(j)) సూత్రం ద్వారా లోపాలను లెక్కిస్తుంది. ఆహార నిల్వ కమ్యూనిటీ అంచనా మాత్రమే — వ్యక్తిగత వినియోగ రుజువు కాదు.',
  },
  'Review suggested food requests before sharing them with donors.': {
    hi: 'दाताओं के साथ साझा करने से पहले सुझाए गए भोजन अनुरोधों की समीक्षा करें।',
    te: 'దాతలతో పంచుకునే ముందు సూచించిన ఆహార అభ్యర్థనలను సమీక్షించండి.',
  },
  'Shelter': { hi: 'आश्रय', te: 'ఆశ్రయం' },
  'Shelter / Community': { hi: 'आश्रय / समुदाय', te: 'ఆశ్రయం / కమ్యూనిటీ' },
  'Suggested:': { hi: 'सुझाव:', te: 'సూచన:' },
  'Approve & Share': { hi: 'स्वीकृत करें व साझा करें', te: 'ఆమోదించి పంచుకోండి' },
  'Dismiss': { hi: 'खारिज करें', te: 'తొలగించు' },
  'Donors can respond directly to help fill these nutritional gaps.': {
    hi: 'दाता इन पोषण कमियों को पूरा करने के लिए सीधे भोजन दान कर सकते हैं।',
    te: 'ఈ పోషకాహార లోపాలను పూరించడానికి దాతలు నేరుగా ఆహారాన్ని దానం చేయవచ్చు.',
  },
  'Suggest More': { hi: 'और सुझाएं', te: 'మరిన్ని సూచించు' },
  'No food requests published yet.': {
    hi: 'अभी तक कोई भोजन अनुरोध प्रकाशित नहीं हुआ है।',
    te: 'ఇంకా ఆహార అభ్యర్థనలు ప్రచురించబడలేదు.',
  },
  'Matched': { hi: 'मिलान हुआ', te: 'మ్యాచ్ అయింది' },
  'Match': { hi: 'मिलान', te: 'మ్యాచ్' },
  'View-only access. Only the shelter/kitchen team or an administrator can edit people counts and kitchen stock.': {
    hi: 'केवल देखने की अनुमति। लोगों की संख्या और रसोई स्टॉक केवल आश्रय/रसोई टीम या प्रशासक बदल सकते हैं।',
    te: 'చదవడానికి మాత్రమే. ప్రజల సంఖ్య మరియు వంటగది నిల్వను ఆశ్రయం/కిచెన్ బృందం లేదా అడ్మినిస్ట్రేటర్ మాత్రమే సవరించగలరు.',
  },
  'People Served Here': { hi: 'यहाँ भोजन पाने वाले लोग', te: 'ఇక్కడ భోజనం చేసే ప్రజలు' },
  'Group counts only (no personal names). Used to estimate daily nutrition needs.': {
    hi: 'केवल समूह संख्या (कोई व्यक्तिगत नाम नहीं)। दैनिक पोषण आवश्यकता के अनुमान के लिए।',
    te: 'సమూహ సంఖ్య మాత్రమే (వ్యక్తిగత పేర్లు లేవు). రోజువారీ పోషకాహార అవసరం అంచనా వేయడానికి.',
  },
  'Children (1–9)': { hi: 'बच्चे (1–9)', te: 'పిల్లలు (1–9)' },
  'Teens (10–18)': { hi: 'किशोर (10–18)', te: 'కిశోరులు (10–18)' },
  'Adults (19–59)': { hi: 'वयस्क (19–59)', te: 'పెద్దలు (19–59)' },
  'Pregnant / Nursing': { hi: 'गर्भवती / स्तनपान कराने वाली', te: 'గర్భిణీ / పాలిచ్చే తల్లులు' },
  'Seniors (60+)': { hi: 'वरिष्ठ नागरिक (60+)', te: 'వృద్ధులు (60+)' },
  'Days': { hi: 'दिन', te: 'రోజులు' },
  'Diet Preference': { hi: 'आहार प्राथमिकता', te: 'ఆహార ప్రాధాన్యత' },
  'Save People Count': { hi: 'संख्या सहेजें', te: 'ప్రజల సంఖ్యను సేవ్ చేయి' },
  'Add Food Stock': { hi: 'भोजन स्टॉक जोड़ें', te: 'ఆహార నిల్వ చేర్చు' },
  'Choose Food': { hi: 'भोजन चुनें', te: 'ఆహారాన్ని ఎంచుకోండి' },
  'Other food (not in table)': { hi: 'अन्य भोजन (तालिका में नहीं)', te: 'ఇతర ఆహారం (పట్టికలో లేదు)' },
  'Number of Meals': { hi: 'भोजन की संख्या', te: 'భోజనాల సంఖ్య' },
  'Save Food Stock': { hi: 'भोजन स्टॉक सहेजें', te: 'ఆహార నిల్వ సేవ్ చేయి' },
  'No food logged yet.': { hi: 'अभी तक कोई भोजन दर्ज नहीं है।', te: 'ఇంకా ఆహారం నమోదు కాలేదు.' },
  'Automatically recorded whenever a meal delivery is confirmed via QR scan.': {
    hi: 'QR स्कैन द्वारा डिलीवरी पुष्टि होते ही यह स्वतः दर्ज हो जाता है।',
    te: 'QR స్కాన్ ద్వారా డెలివరీ నిర్ధారించబడినప్పుడల్లా ఇది స్వయంచాలకంగా నమోదవుతుంది.',
  },
  'No completed delivery snapshots yet. Confirm a delivery in Scan QR to see nutrition gains here.': {
    hi: 'अभी तक कोई पूर्ण डिलीवरी रिकॉर्ड नहीं है। पोषण सुधार देखने के लिए QR स्कैन में डिलीवरी पुष्टि करें।',
    te: 'ఇంకా పూర్తయిన డెలివరీ రికార్డులు లేవు. పోషకాహార వృద్ధిని చూడటానికి QR స్కాన్‌లో డెలివరీని నిర్ధారించండి.',
  },
  'verified meals': { hi: 'सत्यापित भोजन', te: 'ధృవీకరించబడిన భోజనాలు' },
  'Values per 100g cooked serving sourced from ICMR-NIN IFCT 2017 & FAO-INFOODS.': {
    hi: 'ICMR-NIN IFCT 2017 और FAO-INFOODS से प्रति 100 ग्राम पके भोजन के मान।',
    te: 'ICMR-NIN IFCT 2017 & FAO-INFOODS నుండి 100 గ్రాముల వండిన ఆహారానికి విలువలు.',
  },
  'Food': { hi: 'भोजन', te: 'ఆహారం' },
  'Kcal': { hi: 'कैलोरी', te: 'కేలరీలు' },
  'Protein': { hi: 'प्रोटीन', te: 'ప్రోటీన్' },
  'Iron': { hi: 'आयरन', te: 'ఐరన్' },
  'Source': { hi: 'स्रोत', te: 'మూలం' },
  'Admin: Add Food Entry': { hi: 'प्रशासक: नया भोजन जोड़ें', te: 'అడ్మిన్: కొత్త ఆహారం చేర్చు' },
  'Code (e.g. IFCT-B009)': { hi: 'कोड (उदा. IFCT-B009)', te: 'కోడ్ (ఉదా. IFCT-B009)' },
  'Food Name': { hi: 'भोजन का नाम', te: 'ఆహారం పేరు' },
  'Portion (g)': { hi: 'हिस्सा (ग्राम)', te: 'భాగం (గ్రా)' },
  'Calories / 100g': { hi: 'कैलोरी / 100g', te: 'కేలరీలు / 100g' },
  'Protein g / 100g': { hi: 'प्रोटीन g / 100g', te: 'ప్రోటీన్ g / 100g' },
  'Iron mg / 100g': { hi: 'आयरन mg / 100g', te: 'ఐరన్ mg / 100g' },
  'Calcium mg / 100g': { hi: 'कैल्शियम mg / 100g', te: 'కాల్షియం mg / 100g' },
  'Vit A mcg / 100g': { hi: 'विटामिन A mcg / 100g', te: 'విటమిన్ A mcg / 100g' },
  'Fibre g / 100g': { hi: 'फ़ाइबर g / 100g', te: 'ఫైబర్ g / 100g' },
  'Source Dataset': { hi: 'स्रोत डेटासेट', te: 'మూల డేటాసెట్' },
  'Citation Note': { hi: 'संदर्भ नोट', te: 'సూచన నోట్' },
  'Save Food Item': { hi: 'भोजन सहेजें', te: 'ఆహారాన్ని సేవ్ చేయి' },
  'Key (e.g. vitamin_c_mg)': { hi: 'कुंजी (उदा. vitamin_c_mg)', te: 'కీ (ఉదా. vitamin_c_mg)' },
  'Name (e.g. Vitamin C)': { hi: 'नाम (उदा. विटामिन C)', te: 'పేరు (ఉదా. విటమిన్ C)' },
  'Unit (mg)': { hi: 'इकाई (mg)', te: 'యూనిట్ (mg)' },
  'Daily RDA': { hi: 'दैनिक RDA', te: 'రోజువారీ RDA' },
  'Weight (0.1)': { hi: 'प्राथमिकता (0.1)', te: 'ప్రాధాన్యత (0.1)' },
  'Guideline': { hi: 'दिशानिर्देश', te: 'మార్గదర్శకం' },
  'Add Nutrient': { hi: 'पोषक तत्व जोड़ें', te: 'పోషకం చేర్చు' },
  'Optional Note': { hi: 'वैकल्पिक नोट', te: 'ఐచ్ఛిక నోట్' },
  'e.g. Kitchen ready for evening pickup.': {
    hi: 'उदा. शाम के पिकअप के लिए रसोई तैयार है।',
    te: 'ఉదా. సాయంత్రం పికప్ కోసం వంటగది సిద్ధంగా ఉంది.',
  },
  'Dismiss Suggested Request': { hi: 'सुझाया गया अनुरोध खारिज करें', te: 'సూచించిన అభ్యర్థనను తొలగించు' },
  'This removes the suggestion so it will not be shared with donors.': {
    hi: 'यह सुझाव हटा देगा और दाताओं को साझा नहीं किया जाएगा।',
    te: 'ఇది సూచనను తొలగిస్తుంది; దాతలతో పంచుకోబడదు.',
  },
  'Reason': { hi: 'कारण', te: 'కారణం' },
  'e.g. Already covered by local partner.': {
    hi: 'उदा. स्थानीय भागीदार द्वारा पहले ही पूरा कर दिया गया।',
    te: 'ఉదా. స్థానిక భాగస్వామి ద్వారా ఇప్పటికే అందించబడింది.',
  },

  // Admin & Setup & ConfirmDialog
  'Administrator Authorisation Required': { hi: 'प्रशासक अनुमति आवश्यक', te: 'అడ్మినిస్ట్రేటర్ అనుమతి అవసరం' },
  'Administrative governance controls are restricted to verified administrators and enforced by PostgreSQL Row Level Security policies.': {
    hi: 'प्रशासनिक नियंत्रण केवल सत्यापित प्रशासकों तक सीमित हैं और PostgreSQL RLS द्वारा सुरक्षित हैं।',
    te: 'పరిపాలనా నియంత్రణలు ధృవీకరించబడిన అడ్మినిస్ట్రేటర్లకు మాత్రమే పరిమితం మరియు PostgreSQL RLS ద్వారా రక్షించబడతాయి.',
  },
  'Administrative Governance & Audit Console': { hi: 'प्रशासन और ऑडिट कंसोल', te: 'పరిపాలన & ఆడిట్ కన్సోల్' },
  'Verify or suspend organisations, manage food-safety incidents, and inspect the immutable audit log. Every sensitive action records actor identity, timestamp, and reason.': {
    hi: 'संगठनों को सत्यापित या निलंबित करें, घटनाएं प्रबंधित करें और स्थायी ऑडिट लॉग देखें।',
    te: 'సంస్థలను ధృవీకరించండి లేదా సస్పెండ్ చేయండి, సంఘటనలను నిర్వహించండి మరియు శాశ్వత ఆడిట్ లాగ్ చూడండి.',
  },
  'Organisation': { hi: 'संगठन', te: 'సంస్థ' },
  'Registrations': { hi: 'पंजीकरण संख्या', te: 'నమోదు సంఖ్యలు' },
  'Verification Doc': { hi: 'सत्यापन दस्तावेज़', te: 'ధృవీకరణ పత్రం' },
  'Governance Actions': { hi: 'प्रशासनिक कार्रवाई', te: 'పరిపాలనా చర్యలు' },
  'Private doc stored': { hi: 'निजी दस्तावेज़ सुरक्षित', te: 'ప్రైవేట్ పత్రం సేవ్ అయింది' },
  'Not uploaded': { hi: 'अपलोड नहीं हुआ', te: 'అప్‌లోడ్ కాలేదు' },
  'Verify': { hi: 'सत्यापित करें', te: 'ధృవీకరించు' },
  'Suspend': { hi: 'निलंबित करें', te: 'సస్పెండ్ చేయి' },
  'Reject': { hi: 'अस्वीकार करें', te: 'తిరస్కరించు' },
  'Related Batch': { hi: 'संबंधित बैच', te: 'సంబంధిత బ్యాచ్' },
  'General Operational Incident': { hi: 'सामान्य संचालन घटना', te: 'సాధారణ కార్యకలాప సంఘటన' },
  'Incident Type': { hi: 'घटना का प्रकार', te: 'సంఘటన రకం' },
  'Document observed incident details...': {
    hi: 'घटना का विवरण लिखें...',
    te: 'సంఘటన వివరాలను నమోదు చేయండి...',
  },
  'Log Incident': { hi: 'घटना दर्ज करें', te: 'సంఘటన నమోదు చేయి' },
  'No open or historical incidents recorded.': {
    hi: 'अभी तक कोई घटना दर्ज नहीं हुई है।',
    te: 'ఇంకా సంఘటనలు ఏవీ నమోదు కాలేదు.',
  },
  'Protected against UPDATE and DELETE by PostgreSQL triggers.': {
    hi: 'PostgreSQL ट्रिगर्स द्वारा संशोधन और विलोपन से सुरक्षित।',
    te: 'PostgreSQL ట్రిగ్గర్ల ద్వారా మార్పు మరియు తొలగింపు నుండి రక్షించబడింది.',
  },
  'No audit entries yet.': { hi: 'अभी तक कोई ऑडिट प्रविष्टि नहीं है।', te: 'ఇంకా ఆడిట్ నమోదులు లేవు.' },
  'System': { hi: 'सिस्टम', te: 'సిస్టమ్' },
  'Changing organisation verification status controls whether the organisation can participate in live surplus food allocation. An audit reason is mandatory.': {
    hi: 'सत्यापन स्थिति बदलने से यह तय होता है कि संगठन लाइव भोजन वितरण में भाग ले सकता है या नहीं। कारण अनिवार्य है।',
    te: 'ధృవీకరణ స్థితిని మార్చడం వల్ల సంస్థ లైవ్ ఆహార పంపిణీలో పాల్గొనగలదా లేదా అనేది నియంత్రించబడుతుంది. కారణం తప్పనిసరి.',
  },
  'Verification / Suspension Audit Reason': { hi: 'सत्यापन / निलंबन ऑडिट कारण', te: 'ధృవీకరణ / సస్పెన్షన్ ఆడిట్ కారణం' },
  'Shared Supabase Backend & Deployment Diagnostics': {
    hi: 'साझा Supabase बैकएंड और परिनियोजन जाँच',
    te: 'భాగస్వామ్య Supabase బ్యాకెండ్ & డిప్లాయ్‌మెంట్ పరీక్ష',
  },
  'HUNGERLINK 2.0 Web and the separate Native Android client connect to the exact same Supabase PostgreSQL, Auth, RLS, Realtime, Storage, and Edge Function backend.': {
    hi: 'हंगरलिंक 2.0 वेब और अलग एंड्रॉइड ऐप एक ही Supabase PostgreSQL, Auth, RLS, Realtime, Storage और Edge Functions से जुड़ते हैं।',
    te: 'హంగర్‌లింక్ 2.0 వెబ్ మరియు ప్రత్యేక Android యాప్ ఒకే Supabase PostgreSQL, Auth, RLS, Realtime, Storage మరియు Edge Functions‌తో కనెక్ట్ అవుతాయి.',
  },
  'Environment Configuration Status': { hi: 'पर्यावरण कॉन्फ़िगरेशन स्थिति', te: 'ఎన్విరాన్‌మెంట్ కాన్ఫిగరేషన్ స్థితి' },
  'Exit Demo Mode': { hi: 'डेमो मोड से बाहर निकलें', te: 'డెమో మోడ్ నుండి నిష్క్రమించు' },
  'Switch to Isolated Demo Mode': { hi: 'अलग डेमो मोड पर जाएं', te: 'డెమో మోడ్‌కు మారు' },
  'Configured': { hi: 'सेट है', te: 'సెట్ చేయబడింది' },
  'Missing': { hi: 'अनुपलब्ध', te: 'లేదు' },
  'Shared Supabase project URL (Web + Native Android)': {
    hi: 'साझा Supabase प्रोजेक्ट URL (वेब + एंड्रॉइड)',
    te: 'భాగస్వామ్య Supabase ప్రాజెక్ట్ URL (వెబ్ + ఆండ్రాయిడ్)',
  },
  'Public anon or sb_publishable key (never service_role)': {
    hi: 'सार्वजनिक anon या sb_publishable कुंजी (service_role कभी नहीं)',
    te: 'పబ్లిక్ anon లేదా sb_publishable కీ (service_role ఎప్పుడూ కాదు)',
  },
  'Not set — RescueRoute gracefully falls back to geodesic road estimation': {
    hi: 'सेट नहीं — रूट स्वतः भौगोलिक दूरी अनुमान का उपयोग करेगा',
    te: 'సెట్ చేయబడలేదు — రూట్ స్వయంచాలకంగా భౌగోళిక దూర అంచనాను ఉపయోగిస్తుంది',
  },
  'Supabase Migration & Edge Function Deployment': {
    hi: 'Supabase माइग्रेशन और Edge Function परिनियोजन',
    te: 'Supabase మైగ్రేషన్ & Edge Function డిప్లాయ్‌మెంట్',
  },
  'Cancel': { hi: 'रद्द करें', te: 'రద్దు చేయి' },
  'Confirm': { hi: 'पुष्टि करें', te: 'నిర్ధారించు' },
  'Audit Reason': { hi: 'ऑडिट कारण', te: 'ఆడిట్ కారణం' },
  'Provide a clear operational or safety reason for the audit log...': {
    hi: 'ऑडिट लॉग के लिए स्पष्ट कारण लिखें...',
    te: 'ఆడిట్ లాగ్ కోసం స్పష్టమైన కారణాన్ని నమోదు చేయండి...',
  },
  'Close confirmation dialog': { hi: 'संवाद बंद करें', te: 'డైలాగ్ మూసివేయి' },
  'Processing...': { hi: 'प्रक्रिया जारी...', te: 'ప్రాసెస్ అవుతోంది...' },
  'Batch': { hi: 'बैच', te: 'బ్యాచ్' },
  'Recipient:': { hi: 'प्राप्तकर्ता:', te: 'స్వీకర్త:' },
};

/**
 * Pattern-based fallback translator for dynamic template strings in Hindi and Telugu.
 */
export function translatePhraseHiTe(en: string, lang: 'hi' | 'te'): string {
  const exact = PHRASES_HI_TE[en];
  if (exact) return exact[lang];

  // Dynamic patterns
  let m: RegExpMatchArray | null;

  if ((m = en.match(/^Hello,\s*(.+)$/))) {
    return lang === 'hi' ? `नमस्ते, ${m[1]}` : `నమస్కారం, ${m[1]}`;
  }
  if ((m = en.match(/^(.+?)\s*·\s*Here is what needs attention today\.$/))) {
    return lang === 'hi'
      ? `${m[1]} · आज ध्यान देने योग्य मुख्य बातें यहाँ हैं।`
      : `${m[1]} · ఈరోజు గమనించాల్సిన ముఖ్య అంశాలు ఇక్కడ ఉన్నాయి.`;
  }
  if ((m = en.match(/^(\d+)\s+shelter request\(s\) open$/))) {
    return lang === 'hi'
      ? `${m[1]} आश्रय अनुरोध लंबित`
      : `${m[1]} ఆశ్రయ అభ్యర్థనలు పెండింగ్‌లో ఉన్నాయి`;
  }
  if ((m = en.match(/^Most needed:\s*(.+)$/))) {
    return lang === 'hi' ? `सबसे अधिक आवश्यकता: ${m[1]}` : `అత్యధిక అవసరం: ${m[1]}`;
  }
  if ((m = en.match(/^(.+?)-rich foods?\s*·\s*(\d+)\s*meals$/))) {
    return lang === 'hi'
      ? `${m[1]} युक्त भोजन · ${m[2]} थालियाँ`
      : `${m[1]} అధికంగా ఉన్న ఆహారం · ${m[2]} భోజనాలు`;
  }
  if ((m = en.match(/^(.+?)-rich foods?\s*·\s*$/))) {
    return lang === 'hi' ? `${m[1]} युक्त भोजन · ` : `${m[1]} అధికంగా ఉన్న ఆహారం · `;
  }
  if ((m = en.match(/^Cancel Donation\s*(.*)$/))) {
    return lang === 'hi' ? `दान रद्द करें ${m[1]}` : `దానం రద్దు చేయి ${m[1]}`;
  }
  if ((m = en.match(/^Split across (\d+) allocation\(s\)$/))) {
    return lang === 'hi' ? `${m[1]} आवंटनों में विभाजित` : `${m[1]} కేటాయింపులుగా విభజించబడింది`;
  }
  if ((m = en.match(/^For (\d+) people \((\d+) day\)$/))) {
    return lang === 'hi'
      ? `${m[1]} लोगों के लिए (${m[2]} दिन)`
      : `${m[1]} మందికి (${m[2]} రోజు)`;
  }
  if ((m = en.match(/^(\d+) nutrient\(s\) need attention$/))) {
    return lang === 'hi'
      ? `${m[1]} पोषक तत्वों पर ध्यान आवश्यक`
      : `${m[1]} పోషకాలపై శ్రద్ధ అవసరం`;
  }
  if ((m = en.match(/^(\d+) distributed · (\d+) reported eaten$/))) {
    return lang === 'hi'
      ? `${m[1]} वितरित · ${m[2]} उपभोग दर्ज`
      : `${m[1]} పంపిణీ · ${m[2]} తిన్నట్లు నమోదు`;
  }
  if ((m = en.match(/^(\d+) logged food item\(s\) had no reference match and were left out rather than guessed\.$/))) {
    return lang === 'hi'
      ? `${m[1]} दर्ज भोजन तालिका से मेल नहीं खाए, इसलिए अनुमान लगाने के बजाय उन्हें छोड़ा गया।`
      : `నమోదైన ${m[1]} ఆహార పదార్థాలకు సూచన సరిపోలనందున, ఊహించకుండా మినహాయించబడ్డాయి.`;
  }
  if ((m = en.match(/^Waiting for Your Approval \((\d+)\)$/))) {
    return lang === 'hi' ? `आपकी स्वीकृति की प्रतीक्षा (${m[1]})` : `మీ ఆమోదం కోసం వేచి ఉన్నవి (${m[1]})`;
  }
  if ((m = en.match(/^Published Community Food Needs \((\d+)\)$/))) {
    return lang === 'hi' ? `प्रकाशित सामुदायिक भोजन आवश्यकताएं (${m[1]})` : `ప్రచురించిన కమ్యూనిటీ ఆహార అవసరాలు (${m[1]})`;
  }
  if ((m = en.match(/^Current Logged Stock \((\d+)\)$/))) {
    return lang === 'hi' ? `वर्तमान दर्ज स्टॉक (${m[1]})` : `ప్రస్తుత నమోదైన నిల్వ (${m[1]})`;
  }
  if ((m = en.match(/^Before & After Delivery Impact \((\d+)\)$/))) {
    return lang === 'hi' ? `डिलीवरी से पहले और बाद का प्रभाव (${m[1]})` : `డెలివరీ ముందు & తర్వాత ప్రభావం (${m[1]})`;
  }
  if ((m = en.match(/^Food Nutrition Reference \((\d+) foods\)$/))) {
    return lang === 'hi' ? `भोजन पोषण संदर्भ तालिका (${m[1]} भोजन)` : `ఆహార పోషకాహార పట్టిక (${m[1]} ఆహారాలు)`;
  }
  if ((m = en.match(/^Admin: Add Tracked Nutrient \((\d+)\)$/))) {
    return lang === 'hi' ? `प्रशासक: नया पोषक तत्व जोड़ें (${m[1]})` : `అడ్మిన్: కొత్త పోషకం చేర్చు (${m[1]})`;
  }
  if ((m = en.match(/^Share (.+) Request with Donors$/))) {
    return lang === 'hi' ? `${m[1]} अनुरोध दाताओं को साझा करें` : `${m[1]} అభ్యర్థనను దాతలతో పంచుకోండి`;
  }
  if ((m = en.match(/^This publishes a (\d+)-meal request so verified donors can respond\.$/))) {
    return lang === 'hi'
      ? `यह सत्यापित दाताओं के लिए ${m[1]} भोजन का अनुरोध प्रकाशित करेगा।`
      : `ధృవీకరించబడిన దాతలు స్పందించడానికి ఇది ${m[1]} భోజనాల అభ్యర్థనను ప్రచురిస్తుంది.`;
  }
  if ((m = en.match(/^Organisation Verification & Status Review \((\d+)\)$/))) {
    return lang === 'hi' ? `संगठन सत्यापन व स्थिति समीक्षा (${m[1]})` : `సంస్థ ధృవీకరణ & స్థితి సమీక్ష (${m[1]})`;
  }
  if ((m = en.match(/^Incident Management \((\d+)\)$/))) {
    return lang === 'hi' ? `घटना प्रबंधन (${m[1]})` : `సంఘటనల నిర్వహణ (${m[1]})`;
  }
  if ((m = en.match(/^Append-Only Audit Log \((\d+)\)$/))) {
    return lang === 'hi' ? `स्थायी ऑडिट लॉग (${m[1]})` : `మార్చలేని ఆడిట్ లాగ్ (${m[1]})`;
  }
  if ((m = en.match(/^Mark (.+)$/))) {
    return lang === 'hi' ? `${m[1]} चिह्नित करें` : `${m[1]}గా గుర్తించు`;
  }
  if ((m = en.match(/^Set (.+) to (.+)$/))) {
    return lang === 'hi' ? `${m[1]} की स्थिति "${m[2]}" करें` : `${m[1]} స్థితిని "${m[2]}"గా మార్చు`;
  }
  if ((m = en.match(/^Confirm (.+)$/))) {
    return lang === 'hi' ? `${m[1]} — पुष्टि करें` : `${m[1]} — నిర్ధారించు`;
  }
  if ((m = en.match(/^Connected:\s*(.+)$/))) {
    return lang === 'hi' ? `जुड़ा हुआ: ${m[1]}` : `కనెక్ట్ అయింది: ${m[1]}`;
  }
  if ((m = en.match(/^Your current role \((.+?)\) does not have permission to use this section\./))) {
    return lang === 'hi'
      ? `आपकी वर्तमान भूमिका (${m[1]}) को इस अनुभाग का उपयोग करने की अनुमति नहीं है। यह नियंत्रण इंटरफ़ेस और डेटाबेस दोनों में लागू है।`
      : `మీ ప్రస్తుత పాత్ర (${m[1]})కు ఈ విభాగాన్ని ఉపయోగించే అనుమతి లేదు. ఈ నియంత్రణ ఇంటర్‌ఫేస్ మరియు డేటాబేస్ రెండింటిలోనూ అమలు చేయబడుతుంది.`;
  }
  if ((m = en.match(/^Confirm coordinator approval for (\d+) portions\./))) {
    return lang === 'hi'
      ? `${m[1]} भोजन के आवंटन की पुष्टि करें। यह ऑडिट लॉग में दर्ज होगा।`
      : `${m[1]} భోజనాల కేటాయింపును నిర్ధారించండి. ఇది ఆడిట్ లాగ్‌లో నమోదవుతుంది.`;
  }
  if (en.startsWith('No allocations recorded for the selected batch yet.')) {
    return lang === 'hi'
      ? 'चुने गए बैच के लिए अभी कोई आवंटन दर्ज नहीं है। उम्मीदवार देखने के लिए ऊपर "मिलान इंजन चलाएं" पर क्लिक करें।'
      : 'ఎంచుకున్న బ్యాచ్‌కు ఇంకా కేటాయింపులు నమోదు కాలేదు. అభ్యర్థులను చూడటానికి పైన ఉన్న "మ్యాచింగ్ ఇంజిన్ నడపండి" క్లిక్ చేయండి.';
  }

  return en;
}
