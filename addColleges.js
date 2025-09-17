const mongoose = require('mongoose');

// Define the College schema (copy from server.js for standalone use)
const collegeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    location: { type: String, required: true },
    region: { type: String, required: true },
    type: { type: String, required: true },
    nirfRank: Number,
    established: Number,
    website: String,
    contact: String,
    address: String,
    facilities: [String],
    specializations: [String],
    mhtcetCutoffs: {
        computer: { type: Number, default: 0 },
        mechanical: { type: Number, default: 0 },
        electrical: { type: Number, default: 0 },
        civil: { type: Number, default: 0 },
        it: { type: Number, default: 0 },
        ai: { type: Number, default: 0 },
        dataScience: { type: Number, default: 0 }
    },
    fees: {
        government: String,
        private: String,
        nri: String
    },
    placement: {
        averagePackage: String,
        highestPackage: String,
        placementPercentage: String,
        topRecruiters: [String]
    },
    admissionProcess: [String],
    documents: [String],
    importantDates: [String],
    image: String
});

const College = mongoose.model('College', collegeSchema);

mongoose.connect('mongodb://localhost:27017/career_guidance', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const colleges = [
  {
    name: "Fr. Conceicao Rodrigues Institute of Technology",
    location: "Vashi",
    region: "Navi Mumbai",
    type: "Private",
    nirfRank: 201,
    established: 1994,
    website: "https://fcrit.ac.in",
    contact: "022-27771000",
    address: "Sector 9A, Vashi, Navi Mumbai, Maharashtra 400703",
    facilities: ["Library", "Hostel", "Sports", "Labs", "Cafeteria"],
    specializations: ["Computer Engineering", "Mechanical Engineering", "Electronics Engineering", "Electrical Engineering"],
    mhtcetCutoffs: { computer: 95, mechanical: 85, electrical: 80, civil: 0, it: 90, ai: 0, dataScience: 0 },
    fees: { government: "₹1,20,000", private: "₹1,50,000", nri: "₹2,50,000" },
    placement: {
      averagePackage: "₹4.5 LPA",
      highestPackage: "₹12 LPA",
      placementPercentage: "85%",
      topRecruiters: ["TCS", "Infosys", "L&T", "Capgemini"]
    },
    admissionProcess: ["MHT-CET Entrance Exam", "Counseling", "Document Verification"],
    documents: ["10th Marksheet", "12th Marksheet", "CET Scorecard", "Aadhar Card"],
    importantDates: ["Application: May", "Exam: June", "Counseling: July"],
    image: ""
  },
  {
    name: "Lokmanya Tilak College of Engineering",
    location: "Kopar Khairane",
    region: "Navi Mumbai",
    type: "Private",
    nirfRank: 251,
    established: 1994,
    website: "https://ltce.in",
    contact: "022-27541005",
    address: "Sector 4, Kopar Khairane, Navi Mumbai, Maharashtra 400709",
    facilities: ["Library", "Hostel", "Sports", "Labs", "Cafeteria"],
    specializations: ["Computer Engineering", "Mechanical Engineering", "Electronics Engineering", "Civil Engineering", "IT"],
    mhtcetCutoffs: { computer: 92, mechanical: 80, electrical: 75, civil: 70, it: 88, ai: 0, dataScience: 0 },
    fees: { government: "₹1,10,000", private: "₹1,40,000", nri: "₹2,30,000" },
    placement: {
      averagePackage: "₹4 LPA",
      highestPackage: "₹10 LPA",
      placementPercentage: "80%",
      topRecruiters: ["TCS", "Infosys", "Wipro", "L&T"]
    },
    admissionProcess: ["MHT-CET Entrance Exam", "Counseling", "Document Verification"],
    documents: ["10th Marksheet", "12th Marksheet", "CET Scorecard", "Aadhar Card"],
    importantDates: ["Application: May", "Exam: June", "Counseling: July"],
    image: ""
  }
  // Add more colleges as needed
];

College.insertMany(colleges)
  .then(() => {
    console.log('Colleges added!');
    mongoose.disconnect();
  })
  .catch(err => {
    console.error('Error:', err);
    mongoose.disconnect();
  }); 