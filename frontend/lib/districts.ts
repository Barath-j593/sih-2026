/**
 * Centralized registry and resolver for Indian States and Authentic District Names.
 * Translates synthetic IDs (e.g. 'TAM-District-05', 'tam-01', 'BIH-District-01') into authentic district names
 * across all 18 supported Indian states.
 */

export const STATE_DISTRICTS: Record<string, string[]> = {
  "Tamil Nadu": [
    "Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tirunelveli", "Erode", "Vellore",
    "Thanjavur", "Dindigul", "Kanchipuram", "Tiruppur", "Cuddalore", "Karur", "Nagapattinam", "Sivaganga",
    "Virudhunagar", "Theni", "Thoothukudi", "Ramanathapuram", "Dharmapuri", "Krishnagiri", "Nilgiris",
    "Namakkal", "Pudukkottai", "Perambalur", "Ariyalur", "Tenkasi", "Tirupathur", "Ranipet",
    "Chengalpattu", "Kallakurichi", "Mayiladuthurai", "Tiruvallur", "Tiruvannamalai", "Tiruvarur",
    "Viluppuram", "Kanyakumari"
  ],
  "Bihar": [
    "Darbhanga", "Patna Sahib", "Saran", "Gaya", "Muzaffarpur", "Bhagalpur", "Begusarai", "Purnia",
    "Nalanda", "Vaishali", "Samastipur", "Madhubani", "Rohtas", "Aurangabad", "Katihar", "Munger",
    "Saharsa", "West Champaran", "East Champaran", "Sitamarhi", "Siwan", "Gopalganj", "Kishanganj",
    "Supaul", "Madhepura", "Buxar", "Bhojpur", "Jamui", "Jehanabad", "Khagaria", "Banka",
    "Kaimur", "Nawada", "Lakhisarai", "Araria", "Sheikhpura", "Arwal", "Sheohar"
  ],
  "Uttar Pradesh": [
    "Lucknow", "Varanasi", "Kanpur Nagar", "Agra", "Prayagraj", "Meerut", "Ghaziabad", "Bareilly",
    "Aligarh", "Moradabad", "Saharanpur", "Gorakhpur", "Gautam Buddha Nagar", "Firozabad", "Jhansi",
    "Muzaffarnagar", "Mathura", "Ayodhya", "Budaun", "Rampur", "Shahjahanpur", "Farrukhabad", "Hapur",
    "Etawah", "Mirzapur", "Bulandshahr", "Sambhal", "Amroha", "Hardoi", "Fatehpur", "Raebareli",
    "Jalaun", "Sitapur", "Bahraich", "Unnao", "Jaunpur", "Lakhimpur Kheri", "Hathras", "Banda",
    "Pilibhit", "Barabanki", "Chandauli", "Gonda", "Mainpuri", "Lalitpur", "Deoria", "Ghazipur",
    "Sultanpur", "Azamgarh", "Bijnor", "Basti", "Ballia", "Shamli", "Kasganj", "Amethi",
    "Ambedkar Nagar", "Auraiya", "Baghpat", "Balrampur", "Bhadohi", "Chitrakoot", "Etah", "Hamirpur",
    "Kannauj", "Kanpur Dehat", "Kaushambi", "Kushinagar", "Mahoba", "Maharajganj", "Mau", "Pratapgarh",
    "Sant Kabir Nagar", "Shravasti", "Siddharthnagar", "Sonbhadra"
  ],
  "Maharashtra": [
    "Mumbai City", "Mumbai Suburban", "Pune", "Nagpur", "Thane", "Nashik", "Aurangabad", "Solapur",
    "Amravati", "Kolhapur", "Navi Mumbai", "Sangli", "Jalgaon", "Akola", "Latur", "Dhule",
    "Ahmednagar", "Chandrapur", "Parbhani", "Jalna", "Beed", "Nanded", "Satara", "Wardha",
    "Yavatmal", "Osmanabad", "Nandurbar", "Ratnagiri", "Gondia", "Bhandara", "Washim", "Hingoli",
    "Gadchiroli", "Raigad", "Sindhudurg", "Palghar"
  ],
  "Karnataka": [
    "Bengaluru Urban", "Mysuru", "Hubballi-Dharwad", "Mangaluru", "Belagavi", "Kalaburagi", "Davanagere",
    "Ballari", "Vijayapura", "Shivamogga", "Tumakuru", "Raichur", "Bidar", "Vijayanagara", "Gadag",
    "Hassan", "Bagalkote", "Udupi", "Mandya", "Chikkamagaluru", "Kolar", "Chikkaballapura", "Chitradurga",
    "Haveri", "Koppal", "Ramanagara", "Yadgir", "Uttara Kannada", "Kodagu", "Chamarajanagar", "Bengaluru Rural"
  ],
  "Gujarat": [
    "Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar", "Junagadh", "Gandhinagar",
    "Anand", "Navsari", "Morbi", "Bharuch", "Porbandar", "Mehsana", "Surendranagar", "Amreli",
    "Valsad", "Patan", "Banaskantha", "Sabarkantha", "Kheda", "Panchmahal", "Dahod", "Gir Somnath",
    "Botad", "Devbhumi Dwarka", "Aravalli", "Mahisagar", "Chhota Udaipur", "Narmada", "Tapi", "Dang", "Kutch"
  ],
  "Rajasthan": [
    "Jaipur", "Jodhpur", "Kota", "Bikaner", "Ajmer", "Udaipur", "Bhilwara", "Alwar",
    "Bharatpur", "Sikar", "Pali", "Sri Ganganagar", "Hanumangarh", "Jhunjhunu", "Churu", "Nagaur",
    "Tonk", "Sawai Madhopur", "Dausa", "Karauli", "Dholpur", "Barmer", "Jaisalmer", "Jalore",
    "Sirohi", "Rajsamand", "Chittorgarh", "Banswara", "Dungarpur", "Pratapgarh", "Baran", "Bundi",
    "Jhalawar", "Anupgarh", "Balotra", "Beawar", "Deeg", "Didwana-Kuchaman", "Dudu", "Gangapur City",
    "Jaipur Rural", "Jodhpur Rural", "Kekri", "Kotputli-Behror", "Khairthal-Tijara", "Neem Ka Thana", "Phalodi", "Salumbar",
    "Sanchore", "Shahpura"
  ],
  "Madhya Pradesh": [
    "Bhopal", "Indore", "Jabalpur", "Gwalior", "Ujjain", "Sagar", "Dewas", "Satna",
    "Ratlam", "Rewa", "Katni", "Singrauli", "Burhanpur", "Khandwa", "Bhind", "Chhindwara",
    "Guna", "Shivpuri", "Vidisha", "Chhatarpur", "Damoh", "Mandsaur", "Khargone", "Neemuch",
    "Dhar", "Narmadapuram", "Itarsi", "Sehore", "Betul", "Seoni", "Datia", "Nagda",
    "Shahdol", "Tikamgarh", "Ashoknagar", "Balaghat", "Barwani", "Dindori", "Harda", "Jhabua",
    "Mandla", "Narsinghpur", "Panna", "Raisen", "Rajgarh", "Shajapur", "Sheopur", "Sidhi",
    "Umaria", "Alirajpur", "Anuppur", "Agar Malwa", "Niwari", "Mauganj", "Maihar"
  ],
  "West Bengal": [
    "Kolkata", "North 24 Parganas", "South 24 Parganas", "Howrah", "Hooghly", "Darjeeling", "Jalpaiguri",
    "Kalimpong", "Alipurduar", "Cooch Behar", "Uttar Dinajpur", "Dakshin Dinajpur", "Malda", "Murshidabad",
    "Nadia", "Purba Medinipur", "Paschim Medinipur", "Jhargram", "Purulia", "Bankura", "Purba Bardhaman",
    "Paschim Bardhaman", "Birbhum"
  ],
  "Andhra Pradesh": [
    "Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool", "Kakinada", "Rajahmundry", "Kadapa",
    "Tirupati", "Anantapur", "Vizianagaram", "Eluru", "Ongole", "Nandyal", "Machilipatnam", "Srikakulam",
    "Chittoor", "Anakapalli", "Bapatla", "Palnadu", "Alluri Sitharama Raju", "Parvathipuram Manyam", "Konaseema",
    "West Godavari", "Sri Sathya Sai", "Annamayya"
  ],
  "Telangana": [
    "Hyderabad", "Medchal-Malkajgiri", "Ranga Reddy", "Warangal", "Hanamkonda", "Karimnagar", "Nizamabad",
    "Khammam", "Peddapalli", "Mahbubnagar", "Nalgonda", "Adilabad", "Suryapet", "Siddipet", "Miryalaguda",
    "Jagtial", "Nirmal", "Kamareddy", "Bhadradri Kothagudem", "Mancherial", "Sangareddy", "Vikarabad",
    "Jangaon", "Komaram Bheem Asifabad", "Jayashankar Bhupalpally", "Jogulamba Gadwal", "Mahabubabad",
    "Medak", "Mulugu", "Nagarkurnool", "Narayanpet", "Rajanna Sircilla", "Wanaparthy"
  ],
  "Kerala": [
    "Thiruvananthapuram", "Ernakulam", "Kozhikode", "Thrissur", "Kollam", "Palakkad", "Malappuram",
    "Kannur", "Alappuzha", "Kottayam", "Kasaragod", "Pathanamthitta", "Idukki", "Wayanad"
  ],
  "Assam": [
    "Guwahati", "Dibrugarh", "Silchar", "Jorhat", "Nagaon", "Tinsukia", "Tezpur", "Bongaigaon",
    "Dhubri", "Karimganj", "Sivasagar", "Goalpara", "Barpeta", "Golaghat", "Darrang", "Morigaon",
    "Nalbari", "Kokrajhar", "Hailakandi", "Karbi Anglong", "Dima Hasao", "Lakhimpur", "Dhemaji",
    "Baksa", "Chirang", "Udalguri", "Kamrup Rural", "Biswanath", "Charaideo", "Hojai", "Majuli",
    "South Salmara", "West Karbi Anglong", "Bajali", "Tamulpur"
  ],
  "Punjab": [
    "Amritsar", "Ludhiana", "Jalandhar", "Patiala", "Bathinda", "Mohali", "Hoshiarpur", "Gurdaspur",
    "Pathankot", "Moga", "Fazilka", "Malerkotla", "Khanna", "Kapurthala", "Muktsar", "Barnala",
    "Firozpur", "Faridkot", "Sangrur", "Mansa", "Rupnagar", "Fatehgarh Sahib", "Nawanshahr"
  ],
  "Haryana": [
    "Gurugram", "Faridabad", "Panipat", "Ambala", "Yamunanagar", "Rohtak", "Hisar", "Karnal",
    "Sonipat", "Panchkula", "Bhiwani", "Sirsa", "Jhajjar", "Jind", "Kurukshetra", "Kaithal",
    "Rewari", "Palwal", "Mahendragarh", "Fatehabad", "Charkhi Dadri", "Nuh"
  ],
  "Odisha": [
    "Bhubaneswar", "Cuttack", "Rourkela", "Berhampur", "Sambalpur", "Puri", "Balasore", "Bhadrak",
    "Baripada", "Jharsuguda", "Koraput", "Bargarh", "Angul", "Dhenkanal", "Rayagada", "Kendrapara",
    "Jagatsinghpur", "Jajpur", "Nayagarh", "Balangir", "Kalahandi", "Kandhamal", "Nabarangpur",
    "Nuapada", "Subarnapur", "Deogarh", "Gajapati", "Boudh", "Malkangiri", "Kendujhar"
  ],
  "Chhattisgarh": [
    "Raipur", "Bhilai", "Bilaspur", "Korba", "Rajnandgaon", "Raigarh", "Jagdalpur", "Ambikapur",
    "Dhamtari", "Mahasamund", "Janjgir-Champa", "Kabirdham", "Kanker", "Dantewada", "Bemetara",
    "Balod", "Baloda Bazar", "Gariaband", "Mungeli", "Surajpur", "Balrampur", "Kondagaon",
    "Narayanpur", "Sukma", "Bijapur", "Koriya", "Gaurela-Pendra", "Khairagarh", "Mohla-Manpur",
    "Sarangarh-Bilaigarh", "Sakti", "Manendragarh", "Jashpur"
  ],
  "Jharkhand": [
    "Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Deoghar", "Hazaribagh", "Giridih", "Ramgarh",
    "Medininagar", "Chaibasa", "Dumka", "Sahibganj", "Godda", "Gumla", "Jamtara", "Khunti",
    "Koderma", "Latehar", "Lohardaga", "Pakur", "Simdega", "Seraikela", "Chatra", "Garhwa"
  ]
};

const STATE_PREFIX_MAP: Record<string, string> = {
  AND: "Andhra Pradesh",
  ASS: "Assam",
  BIH: "Bihar",
  CHH: "Chhattisgarh",
  GUJ: "Gujarat",
  HAR: "Haryana",
  JHA: "Jharkhand",
  KAR: "Karnataka",
  KER: "Kerala",
  MAD: "Madhya Pradesh",
  MAH: "Maharashtra",
  ODI: "Odisha",
  PUN: "Punjab",
  RAJ: "Rajasthan",
  TAM: "Tamil Nadu",
  TEL: "Telangana",
  UTT: "Uttar Pradesh",
  WES: "West Bengal"
};

/**
 * Returns human-friendly district name from any synthetic ID or raw identifier.
 * Example: 'TAM-District-05' -> 'Salem', 'tam-01' -> 'Chennai', 'BIH-District-01' -> 'Darbhanga'
 */
export function formatDistrictName(nameOrCode?: string | null, stateHint?: string): string {
  if (!nameOrCode) return "National";
  const str = String(nameOrCode).trim();

  // If Seat suffix exists (e.g. 'TAM-District-05-Seat-338')
  const seatMatch = str.match(/^([A-Za-z]{3}[-_]District[-_]\d+)[-_]Seat[-_](\d+)$/i);
  if (seatMatch) {
    const baseDistrict = formatDistrictName(seatMatch[1], stateHint);
    return `${baseDistrict} (Seat ${seatMatch[2]})`;
  }

  // 1. Match PREFIX-District-NN or prefix-nn
  const match = str.match(/^([A-Za-z]{3})[-_]District[-_](\d+)$/i) || str.match(/^([A-Za-z]{3})[-_](\d+)$/i);
  if (match) {
    const prefix = match[1].toUpperCase();
    const idx = parseInt(match[2], 10) - 1;
    const stateName = STATE_PREFIX_MAP[prefix] || stateHint;
    if (stateName && STATE_DISTRICTS[stateName]) {
      const list = STATE_DISTRICTS[stateName];
      if (idx >= 0 && idx < list.length) {
        return list[idx];
      }
    }
  }

  // 2. Match generic District-NN with stateHint
  const genericMatch = str.match(/^District[-_](\d+)$/i);
  if (genericMatch && stateHint && STATE_DISTRICTS[stateHint]) {
    const idx = parseInt(genericMatch[1], 10) - 1;
    const list = STATE_DISTRICTS[stateHint];
    if (idx >= 0 && idx < list.length) {
      return list[idx];
    }
  }

  return str;
}

/**
 * Returns the list of real district names for a given state, falling back to Bihar or all states.
 */
export function getDistrictsForState(stateName?: string): string[] {
  if (!stateName || stateName === "National" || stateName === "All India") {
    return STATE_DISTRICTS["Bihar"] || [];
  }
  return STATE_DISTRICTS[stateName] || STATE_DISTRICTS["Bihar"] || [];
}
