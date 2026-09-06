"""
Comprehensive registry of real Indian districts mapped to state codes.
Translates synthetic identifiers like TAM-District-05 or BIH-District-01 into authentic district names
(e.g., Madurai, Darbhanga, Patna Sahib, Chennai) across all 18 supported Indian states.
"""
from typing import Dict, List, Optional
import re

STATE_DISTRICT_NAMES: Dict[str, List[str]] = {
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
}

STATE_PREFIX_MAP: Dict[str, str] = {
    "AND": "Andhra Pradesh",
    "ASS": "Assam",
    "BIH": "Bihar",
    "CHH": "Chhattisgarh",
    "GUJ": "Gujarat",
    "HAR": "Haryana",
    "JHA": "Jharkhand",
    "KAR": "Karnataka",
    "KER": "Kerala",
    "MAD": "Madhya Pradesh",
    "MAH": "Maharashtra",
    "ODI": "Odisha",
    "PUN": "Punjab",
    "RAJ": "Rajasthan",
    "TAM": "Tamil Nadu",
    "TEL": "Telangana",
    "UTT": "Uttar Pradesh",
    "WES": "West Bengal"
}

def resolve_district_name(code_or_name: Optional[str], state_hint: Optional[str] = None) -> str:
    """
    Resolves synthetic district codes (e.g. 'TAM-District-05', 'BIH-District-01', 'tam-01')
    to real authentic district names (e.g. 'Madurai', 'Darbhanga').
    """
    if not code_or_name:
        return "National"
    
    clean = code_or_name.strip()
    
    # 1. Match PREFIX-District-NN or prefix-nn
    m = re.search(r'([A-Za-z]{3})[-_]District[-_](\d+)', clean, re.IGNORECASE)
    if not m:
        m = re.search(r'([A-Za-z]{3})[-_](\d+)', clean, re.IGNORECASE)
        
    if m:
        prefix = m.group(1).upper()
        idx = int(m.group(2)) - 1
        state_name = STATE_PREFIX_MAP.get(prefix, state_hint)
        if state_name and state_name in STATE_DISTRICT_NAMES:
            districts = STATE_DISTRICT_NAMES[state_name]
            if 0 <= idx < len(districts):
                return districts[idx]

    # 2. Check if state_hint provides a match for generic 'District-NN'
    m_num = re.search(r'District[-_](\d+)', clean, re.IGNORECASE)
    if m_num and state_hint and state_hint in STATE_DISTRICT_NAMES:
        idx = int(m_num.group(1)) - 1
        districts = STATE_DISTRICT_NAMES[state_hint]
        if 0 <= idx < len(districts):
            return districts[idx]

    # If already a human name, return normalized
    return clean

def resolve_constituency_name(code_or_name: Optional[str], state_hint: Optional[str] = None) -> str:
    """
    Translates 'TAM-District-05-Seat-338' into 'Madurai (Seat 338)'.
    """
    if not code_or_name:
        return "Constituency"
    clean = code_or_name.strip()
    
    # Check for Seat pattern
    m_seat = re.search(r'([A-Za-z]{3}[-_]District[-_]\d+)[-_]Seat[-_](\d+)', clean, re.IGNORECASE)
    if m_seat:
        dist_code = m_seat.group(1)
        seat_num = m_seat.group(2)
        dist_name = resolve_district_name(dist_code, state_hint)
        return f"{dist_name} (Seat {seat_num})"
        
    return resolve_district_name(clean, state_hint)
