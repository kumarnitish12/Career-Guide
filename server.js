const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config();
const { Configuration, OpenAIApi } = require("openai");

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/career_guidance', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// User Schema
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    grade: { type: String, required: true }, // 10th or 12th
    interests: [String],
    role: { type: String, enum: ['student', 'mentor'], default: 'student' }, // <-- Added role
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Career Schema
const careerSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    educationLevel: { type: String, required: true }, // 10th or 12th
    subjects: [String],
    skills: [String],
    salary: String,
    duration: String,
    requirements: [String],
    opportunities: [String]
});

const Career = mongoose.model('Career', careerSchema);

// College Schema
const collegeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    location: { type: String, required: true },
    region: { type: String, required: true }, // Mumbai or Pune
    type: { type: String, required: true }, // Government, Private, Autonomous
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

// Career Roadmap Schema
const careerRoadmapSchema = new mongoose.Schema({
    careerTitle: { type: String, required: true },
    currentPosition: { type: String, required: true }, // 10th, 12th, Graduation, etc.
    targetPosition: { type: String, required: true }, // Doctor, Engineer, etc.
    totalSteps: { type: Number, required: true },
    estimatedDuration: { type: String, required: true },
    roadmap: [{
        stepNumber: { type: Number, required: true },
        title: { type: String, required: true },
        description: { type: String, required: true },
        duration: { type: String, required: true },
        requirements: [String],
        tasks: [String],
        exams: [String],
        tips: [String],
        isCompleted: { type: Boolean, default: false }
    }],
    prerequisites: [String],
    successRate: { type: String, required: true },
    difficulty: { type: String, required: true }, // Easy, Medium, Hard
    investment: { type: String, required: true }, // Low, Medium, High
    alternatives: [String]
});

const CareerRoadmap = mongoose.model('CareerRoadmap', careerRoadmapSchema);

// Assessment Question Schema
const assessmentQuestionSchema = new mongoose.Schema({
    question: { type: String, required: true },
    options: [{
        value: { type: String, required: true },
        text: { type: String, required: true }
    }],
    category: { type: String, required: true }, // personality, skills, interests, etc.
    weight: { type: Number, default: 1 }
});

const AssessmentQuestion = mongoose.model('AssessmentQuestion', assessmentQuestionSchema);

// Assessment Result Schema
const assessmentResultSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    answers: { type: Map, of: String },
    personalityType: String,
    careerRecommendations: [{
        career: String,
        score: Number,
        description: String
    }],
    skillsAnalysis: [{
        name: String,
        level: Number,
        stars: Number
    }],
    actionPlan: [{
        step: Number,
        title: String,
        description: String
    }],
    createdAt: { type: Date, default: Date.now }
});

const AssessmentResult = mongoose.model('AssessmentResult', assessmentResultSchema);

// Blog Schema
const blogSchema = new mongoose.Schema({
    title: { type: String, required: true },
    excerpt: { type: String, required: true },
    content: { type: String, required: true },
    category: { type: String, required: true }, // career-tips, exam-updates, study-tips, industry-news, inspiration
    author: { type: String, required: true },
    date: { type: Date, default: Date.now },
    readTime: String,
    featured: { type: Boolean, default: false },
    tags: [String],
    image: String,
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 }
});

const Blog = mongoose.model('Blog', blogSchema);

// Contact Message Schema
const contactMessageSchema = new mongoose.Schema({
    name: String,
    email: String,
    message: String,
    createdAt: { type: Date, default: Date.now }
});
const ContactMessage = mongoose.model('ContactMessage', contactMessageSchema);

// JWT Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid token' });
        }
        req.user = user;
        next();
    });
};

// Routes

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Contact form endpoint
app.post('/api/contact', async (req, res) => {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
        return res.status(400).json({ message: 'All fields are required.' });
    }
    try {
        // Save to MongoDB
        await ContactMessage.create({ name, email, message });
        res.json({ message: 'Message received.' });
    } catch (err) {
        console.error('Error saving contact message:', err);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Register User
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password, grade, interests, role } = req.body; // allow role from body (optional)

        // Check if user already exists
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const user = new User({
            username,
            email,
            password: hashedPassword,
            grade,
            interests,
            role: role || 'student' // default to student if not provided
        });

        await user.save();

        // Generate JWT token
        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '24h' });

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                grade: user.grade,
                role: user.role // include role
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Login User
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '24h' });

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                grade: user.grade,
                role: user.role // include role
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get Careers by Education Level
app.get('/api/careers/:level', async (req, res) => {
    try {
        const { level } = req.params;
        const careers = await Career.find({ educationLevel: level });
        res.json(careers);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get All Careers
app.get('/api/careers', async (req, res) => {
    try {
        const careers = await Career.find();
        res.json(careers);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get All Colleges
app.get('/api/colleges', async (req, res) => {
    try {
        const colleges = await College.find();
        res.json(colleges);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get Colleges by Region
app.get('/api/colleges/:region', async (req, res) => {
    try {
        const { region } = req.params;
        const colleges = await College.find({ region: region });
        res.json(colleges);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get College by ID
app.get('/api/college/:id', async (req, res) => {
    try {
        const college = await College.findById(req.params.id);
        if (!college) {
            return res.status(404).json({ message: 'College not found' });
        }
        res.json(college);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get Career Roadmaps
app.get('/api/roadmaps', async (req, res) => {
    try {
        const roadmaps = await CareerRoadmap.find();
        res.json(roadmaps);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get Career Roadmap by Career Title
app.get('/api/roadmaps/:careerTitle', async (req, res) => {
    try {
        const { careerTitle } = req.params;
        const roadmap = await CareerRoadmap.findOne({ careerTitle: careerTitle });
        if (!roadmap) {
            return res.status(404).json({ message: 'Roadmap not found' });
        }
        res.json(roadmap);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get Personalized Roadmap
app.post('/api/roadmaps/personalized', async (req, res) => {
    try {
        const { careerTitle, currentPosition } = req.body;
        const roadmap = await CareerRoadmap.findOne({ 
            careerTitle: careerTitle,
            currentPosition: currentPosition 
        });
        
        if (!roadmap) {
            return res.status(404).json({ message: 'Roadmap not found for this combination' });
        }
        res.json(roadmap);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get User Profile
app.get('/api/profile', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Initialize sample career data
const initializeCareers = async () => {
    const careersCount = await Career.countDocuments();
    if (careersCount === 0) {
        const sampleCareers = [
            {
                title: "Engineering",
                description: "Engineering is the application of scientific and mathematical principles to design, build, and maintain structures, machines, devices, systems, and processes. Engineers solve complex problems and create innovative solutions that improve our daily lives. This field offers diverse specializations including mechanical, electrical, civil, computer science, and chemical engineering.",
                educationLevel: "12th",
                subjects: ["Physics", "Chemistry", "Mathematics"],
                skills: ["Problem Solving", "Analytical Thinking", "Technical Skills", "Creativity", "Teamwork", "Communication"],
                salary: "₹3-15 LPA (Entry Level), ₹8-25 LPA (Mid-Level), ₹15-50+ LPA (Senior Level)",
                duration: "4 years (B.Tech/B.E.)",
                requirements: ["12th with PCM (Physics, Chemistry, Mathematics)", "Minimum 50-60% marks", "JEE Main/JEE Advanced or state entrance exams", "Strong foundation in mathematics and science"],
                opportunities: ["Software Engineer", "Mechanical Engineer", "Civil Engineer", "Electrical Engineer", "Chemical Engineer", "Aerospace Engineer", "Biomedical Engineer", "Robotics Engineer", "Data Scientist", "AI/ML Engineer"]
            },
            {
                title: "Medical",
                description: "Medicine is the science and practice of diagnosing, treating, and preventing diseases. Medical professionals work to improve human health and save lives. This career requires dedication, compassion, and continuous learning. The medical field offers various specializations and opportunities to make a significant impact on society.",
                educationLevel: "12th",
                subjects: ["Physics", "Chemistry", "Biology"],
                skills: ["Patient Care", "Diagnostic Skills", "Communication", "Empathy", "Critical Thinking", "Problem Solving", "Attention to Detail", "Stress Management"],
                salary: "₹5-20 LPA (Resident), ₹15-40 LPA (General Physician), ₹25-80+ LPA (Specialist/Surgeon)",
                duration: "5.5 years (MBBS) + 3-5 years (Specialization)",
                requirements: ["12th with PCB (Physics, Chemistry, Biology)", "Minimum 50% marks", "NEET qualification", "Strong academic record", "Physical and mental fitness"],
                opportunities: ["General Physician", "Surgeon", "Cardiologist", "Neurologist", "Pediatrician", "Psychiatrist", "Dermatologist", "Orthopedic Surgeon", "Radiologist", "Anesthesiologist"]
            },
            {
                title: "Commerce",
                description: "Commerce encompasses the study of business, economics, finance, and trade. It prepares students for careers in accounting, finance, marketing, and business management. This field is essential for understanding how businesses operate and how economic systems function in society.",
                educationLevel: "12th",
                subjects: ["Accountancy", "Business Studies", "Economics", "Mathematics"],
                skills: ["Financial Analysis", "Business Acumen", "Communication", "Leadership", "Strategic Thinking", "Problem Solving", "Negotiation", "Data Analysis"],
                salary: "₹3-12 LPA (Entry Level), ₹8-20 LPA (Mid-Level), ₹15-40+ LPA (Senior Level)",
                duration: "3 years (B.Com) + 2 years (M.Com/MBA)",
                requirements: ["12th with Commerce/Arts", "Strong mathematical skills", "Good communication abilities", "Analytical thinking"],
                opportunities: ["Chartered Accountant", "Business Analyst", "Financial Advisor", "Investment Banker", "Marketing Manager", "Human Resource Manager", "Tax Consultant", "Auditor", "Stock Broker", "Entrepreneur"]
            },
            {
                title: "Arts & Humanities",
                description: "Arts and Humanities explore human culture, history, literature, philosophy, and social sciences. This field develops critical thinking, creativity, and understanding of human behavior and society. It prepares students for careers in education, media, social work, and cultural organizations.",
                educationLevel: "12th",
                subjects: ["History", "Geography", "Political Science", "Literature", "Philosophy"],
                skills: ["Critical Thinking", "Research", "Writing", "Communication", "Creativity", "Cultural Awareness", "Analysis", "Empathy"],
                salary: "₹2-8 LPA (Entry Level), ₹5-15 LPA (Mid-Level), ₹10-25+ LPA (Senior Level)",
                duration: "3 years (BA) + 2 years (MA)",
                requirements: ["12th with Arts/any stream", "Good writing skills", "Interest in human behavior and society", "Creative thinking"],
                opportunities: ["Journalist", "Teacher", "Social Worker", "Psychologist", "Librarian", "Museum Curator", "Policy Analyst", "Content Writer", "Translator", "Cultural Consultant"]
            },
            {
                title: "ITI (Industrial Training Institute)",
                description: "ITI provides vocational training in various technical trades and crafts. It offers hands-on training for students who prefer practical work over theoretical studies. ITI courses are designed to create skilled workers for various industries and help students become self-employed.",
                educationLevel: "10th",
                subjects: ["Technical Drawing", "Workshop Practice", "Theory", "Safety Procedures"],
                skills: ["Technical Skills", "Hands-on Work", "Problem Solving", "Attention to Detail", "Safety Awareness", "Manual Dexterity"],
                salary: "₹2-6 LPA (Skilled Worker), ₹4-10 LPA (Supervisor), ₹6-15 LPA (Self-employed)",
                duration: "1-2 years",
                requirements: ["10th pass", "Age 14-40 years", "Physical fitness", "Interest in technical work"],
                opportunities: ["Electrician", "Welder", "Mechanic", "Plumber", "Carpenter", "Mason", "Painter", "Fitter", "Turner", "Self-employed Technician"]
            },
            {
                title: "Polytechnic",
                description: "Polytechnic offers diploma courses in engineering and technical fields. It provides a middle path between ITI and full engineering degree. Polytechnic graduates can work as technicians, supervisors, or continue their education to become engineers.",
                educationLevel: "10th",
                subjects: ["Engineering Mathematics", "Technical Subjects", "Practical Training", "Computer Applications"],
                skills: ["Technical Skills", "Problem Solving", "Team Work", "Communication", "Computer Literacy", "Project Management"],
                salary: "₹2-8 LPA (Diploma Holder), ₹4-12 LPA (Supervisor), ₹6-18 LPA (After further studies)",
                duration: "3 years",
                requirements: ["10th pass", "Entrance exam scores", "Interest in technical subjects", "Good mathematical skills"],
                opportunities: ["Diploma Engineer", "Technician", "Supervisor", "Quality Inspector", "Maintenance Engineer", "CAD Operator", "Field Engineer"]
            },
            {
                title: "Hotel Management",
                description: "Hotel Management focuses on hospitality, tourism, and service industry management. It prepares students for careers in hotels, restaurants, resorts, and tourism organizations. This field requires excellent interpersonal skills and a passion for customer service.",
                educationLevel: "12th",
                subjects: ["Food Production", "Front Office", "Housekeeping", "Food & Beverage Service", "Tourism Management"],
                skills: ["Customer Service", "Leadership", "Communication", "Problem Solving", "Cultural Awareness", "Time Management", "Stress Management"],
                salary: "₹2-10 LPA (Entry Level), ₹5-15 LPA (Mid-Level), ₹10-30+ LPA (Senior Level)",
                duration: "3-4 years",
                requirements: ["12th pass", "Good communication skills", "Customer service orientation", "Physical fitness", "Flexible working hours"],
                opportunities: ["Hotel Manager", "Chef", "Event Planner", "Restaurant Manager", "Tourism Officer", "Catering Manager", "Food & Beverage Manager", "Housekeeping Manager"]
            },
            {
                title: "Design",
                description: "Design is a creative field that combines art, technology, and problem-solving to create visual solutions. Designers work in various industries including advertising, fashion, product design, and digital media. This career requires creativity, technical skills, and understanding of user needs.",
                educationLevel: "12th",
                subjects: ["Design Principles", "Digital Tools", "Art History", "Color Theory", "Typography"],
                skills: ["Creativity", "Visual Communication", "Technical Skills", "Problem Solving", "Attention to Detail", "User Empathy", "Project Management"],
                salary: "₹3-12 LPA (Entry Level), ₹6-20 LPA (Mid-Level), ₹12-40+ LPA (Senior Level)",
                duration: "4 years (B.Des)",
                requirements: ["12th pass", "Creative portfolio", "Entrance exam", "Drawing skills", "Computer literacy"],
                opportunities: ["Graphic Designer", "UI/UX Designer", "Fashion Designer", "Product Designer", "Interior Designer", "Web Designer", "Animation Designer", "Industrial Designer"]
            },
            {
                title: "Law",
                description: "Law is the study of legal systems, regulations, and justice. Lawyers help individuals and organizations navigate legal matters, protect rights, and ensure justice. This career requires strong analytical skills, excellent communication, and a commitment to justice and ethics.",
                educationLevel: "12th",
                subjects: ["Legal Studies", "Political Science", "History", "English", "Economics"],
                skills: ["Analytical Thinking", "Research", "Communication", "Argumentation", "Problem Solving", "Ethics", "Attention to Detail", "Public Speaking"],
                salary: "₹3-8 LPA (Entry Level), ₹6-20 LPA (Mid-Level), ₹15-50+ LPA (Senior Level)",
                duration: "5 years (Integrated LLB) or 3 years (LLB after graduation)",
                requirements: ["12th pass", "CLAT or other law entrance exams", "Strong English skills", "Logical reasoning", "Interest in justice and society"],
                opportunities: ["Criminal Lawyer", "Corporate Lawyer", "Civil Lawyer", "Family Lawyer", "Intellectual Property Lawyer", "Judicial Officer", "Legal Advisor", "Human Rights Lawyer"]
            },
            {
                title: "Agriculture",
                description: "Agriculture involves the study of farming, crop production, animal husbandry, and agricultural technology. With India being an agricultural economy, this field offers opportunities in farming, research, agribusiness, and rural development. Modern agriculture combines traditional knowledge with technology.",
                educationLevel: "12th",
                subjects: ["Biology", "Chemistry", "Physics", "Mathematics"],
                skills: ["Scientific Knowledge", "Problem Solving", "Practical Skills", "Business Acumen", "Technology Adaptation", "Environmental Awareness"],
                salary: "₹2-6 LPA (Entry Level), ₹4-12 LPA (Mid-Level), ₹8-25+ LPA (Senior Level)",
                duration: "4 years (B.Sc Agriculture)",
                requirements: ["12th with Science", "Interest in farming and environment", "Physical fitness", "Willingness to work outdoors"],
                opportunities: ["Agricultural Officer", "Farm Manager", "Agricultural Scientist", "Agribusiness Manager", "Seed Technologist", "Soil Scientist", "Horticulturist", "Agricultural Entrepreneur"]
            },
            {
                title: "Aviation",
                description: "Aviation encompasses careers in flying, aircraft maintenance, air traffic control, and airport management. This field offers exciting opportunities for those interested in aircraft and air travel. Aviation careers require technical knowledge, safety awareness, and often international exposure.",
                educationLevel: "12th",
                subjects: ["Physics", "Mathematics", "English", "Geography"],
                skills: ["Technical Knowledge", "Safety Awareness", "Communication", "Problem Solving", "Decision Making", "Stress Management", "Teamwork"],
                salary: "₹3-8 LPA (Entry Level), ₹8-25 LPA (Mid-Level), ₹20-80+ LPA (Senior Level)",
                duration: "1-4 years (depending on specialization)",
                requirements: ["12th with PCM", "Medical fitness", "English proficiency", "Age requirements", "Entrance exams"],
                opportunities: ["Commercial Pilot", "Aircraft Maintenance Engineer", "Air Traffic Controller", "Flight Attendant", "Aviation Manager", "Aerospace Engineer", "Ground Staff", "Aviation Safety Officer"]
            },
            {
                title: "Fashion Technology",
                description: "Fashion Technology combines design creativity with technical knowledge of textiles, manufacturing, and business. This field covers everything from design and production to marketing and retail. It's perfect for those who love fashion and want to understand the business behind it.",
                educationLevel: "12th",
                subjects: ["Design", "Textile Science", "Fashion Marketing", "Pattern Making", "Computer Applications"],
                skills: ["Creativity", "Technical Skills", "Business Acumen", "Trend Analysis", "Communication", "Project Management", "Quality Control"],
                salary: "₹2-8 LPA (Entry Level), ₹5-15 LPA (Mid-Level), ₹10-30+ LPA (Senior Level)",
                duration: "3-4 years",
                requirements: ["12th pass", "Creative portfolio", "Interest in fashion", "Good communication skills", "Computer literacy"],
                opportunities: ["Fashion Designer", "Textile Designer", "Fashion Merchandiser", "Pattern Maker", "Quality Controller", "Fashion Buyer", "Fashion Stylist", "Fashion Entrepreneur"]
            },
            {
                title: "Media & Journalism",
                description: "Media and Journalism involve creating, editing, and distributing news and entertainment content across various platforms. This field is crucial for democracy and information dissemination. It offers opportunities in print, digital, broadcast, and new media platforms.",
                educationLevel: "12th",
                subjects: ["English", "Current Affairs", "Media Studies", "Communication", "Political Science"],
                skills: ["Writing", "Communication", "Research", "Critical Thinking", "Creativity", "Digital Skills", "Ethics", "Time Management"],
                salary: "₹2-6 LPA (Entry Level), ₹4-12 LPA (Mid-Level), ₹8-25+ LPA (Senior Level)",
                duration: "3 years (BA Journalism) or 1-2 years (Diploma)",
                requirements: ["12th pass", "Strong English skills", "Current affairs knowledge", "Writing ability", "Communication skills"],
                opportunities: ["Journalist", "News Anchor", "Content Writer", "Video Editor", "Social Media Manager", "Public Relations Officer", "Radio Jockey", "Documentary Filmmaker"]
            },
            {
                title: "Psychology",
                description: "Psychology is the scientific study of human behavior and mental processes. Psychologists help people understand themselves and others, solve problems, and improve mental health. This field combines scientific research with practical applications in various settings.",
                educationLevel: "12th",
                subjects: ["Psychology", "Biology", "Statistics", "English", "Sociology"],
                skills: ["Empathy", "Communication", "Research", "Analysis", "Problem Solving", "Patience", "Ethics", "Observation"],
                salary: "₹2-6 LPA (Entry Level), ₹4-12 LPA (Mid-Level), ₹8-25+ LPA (Senior Level)",
                duration: "3 years (BA Psychology) + 2 years (MA Psychology)",
                requirements: ["12th pass", "Interest in human behavior", "Good communication skills", "Empathy", "Research aptitude"],
                opportunities: ["Clinical Psychologist", "Counseling Psychologist", "Industrial Psychologist", "Educational Psychologist", "Research Psychologist", "Sports Psychologist", "Forensic Psychologist", "Child Psychologist"]
            },
            {
                title: "Environmental Science",
                description: "Environmental Science studies the environment and develops solutions for environmental problems. With growing environmental concerns, this field offers opportunities in conservation, pollution control, sustainable development, and environmental policy. It's perfect for those passionate about protecting the planet.",
                educationLevel: "12th",
                subjects: ["Biology", "Chemistry", "Physics", "Geography", "Mathematics"],
                skills: ["Scientific Analysis", "Problem Solving", "Research", "Communication", "Environmental Awareness", "Data Analysis", "Project Management"],
                salary: "₹2-6 LPA (Entry Level), ₹4-12 LPA (Mid-Level), ₹8-25+ LPA (Senior Level)",
                duration: "3 years (B.Sc Environmental Science)",
                requirements: ["12th with Science", "Interest in environment", "Research aptitude", "Field work willingness"],
                opportunities: ["Environmental Scientist", "Conservation Officer", "Pollution Control Officer", "Environmental Consultant", "Wildlife Biologist", "Climate Change Analyst", "Sustainability Manager", "Environmental Educator"]
            }
        ];

        await Career.insertMany(sampleCareers);
        console.log('Sample career data initialized');
    }
};

// Initialize sample college data
const initializeColleges = async () => {
    const collegesCount = await College.countDocuments();
    if (collegesCount === 0) {
        const sampleColleges = [
            {
                name: "Veermata Jijabai Technological Institute (VJTI)",
                location: "Mumbai",
                region: "Mumbai",
                type: "Government",
                nirfRank: 151,
                established: 1887,
                website: "https://vjti.ac.in",
                contact: "+91-22-24198151",
                address: "H R Mahajani Marg, Matunga, Mumbai, Maharashtra 400019",
                facilities: ["Modern Laboratories", "Library", "Sports Complex", "Hostel", "Cafeteria", "WiFi Campus", "Computer Center"],
                specializations: ["Computer Engineering", "Mechanical Engineering", "Electrical Engineering", "Civil Engineering", "Information Technology", "Textile Technology"],
                mhtcetCutoffs: {
                    computer: 99.5,
                    mechanical: 98.2,
                    electrical: 97.8,
                    civil: 96.5,
                    it: 98.9,
                    ai: 99.2,
                    dataScience: 99.0
                },
                fees: {
                    government: "₹1.5-2 LPA",
                    private: "N/A",
                    nri: "N/A"
                },
                placement: {
                    averagePackage: "₹8.5 LPA",
                    highestPackage: "₹45 LPA",
                    placementPercentage: "85%",
                    topRecruiters: ["Google", "Microsoft", "Amazon", "TCS", "Infosys", "Wipro", "L&T"]
                },
                admissionProcess: [
                    "MHT-CET Score",
                    "Centralized Admission Process (CAP)",
                    "Document Verification",
                    "Seat Allotment"
                ],
                documents: [
                    "MHT-CET Score Card",
                    "10th and 12th Mark Sheets",
                    "Domicile Certificate",
                    "Caste Certificate (if applicable)",
                    "Income Certificate (if applicable)",
                    "Passport Size Photographs"
                ],
                importantDates: [
                    "MHT-CET Registration: January 2024",
                    "MHT-CET Exam: April 2024",
                    "CAP Registration: June 2024",
                    "Document Verification: July 2024",
                    "Seat Allotment: July-August 2024"
                ]
            },
            {
                name: "College of Engineering, Pune (COEP)",
                location: "Pune",
                region: "Pune",
                type: "Government",
                nirfRank: 89,
                established: 1854,
                website: "https://www.coep.org.in",
                contact: "+91-20-25507000",
                address: "Wellesely Road, Shivajinagar, Pune, Maharashtra 411005",
                facilities: ["State-of-the-art Labs", "Central Library", "Sports Ground", "Hostels", "Auditorium", "Innovation Center", "Incubation Center"],
                specializations: ["Computer Engineering", "Mechanical Engineering", "Electrical Engineering", "Civil Engineering", "E&TC", "Metallurgy", "Production"],
                mhtcetCutoffs: {
                    computer: 99.8,
                    mechanical: 98.5,
                    electrical: 98.0,
                    civil: 97.0,
                    it: 99.5,
                    ai: 99.7,
                    dataScience: 99.3
                },
                fees: {
                    government: "₹1.2-1.8 LPA",
                    private: "N/A",
                    nri: "N/A"
                },
                placement: {
                    averagePackage: "₹9.2 LPA",
                    highestPackage: "₹52 LPA",
                    placementPercentage: "90%",
                    topRecruiters: ["Google", "Microsoft", "Amazon", "Adobe", "Oracle", "Intel", "Qualcomm"]
                },
                admissionProcess: [
                    "MHT-CET Score",
                    "CAP Rounds",
                    "Document Verification",
                    "Seat Confirmation"
                ],
                documents: [
                    "MHT-CET Score Card",
                    "Academic Certificates",
                    "Domicile Certificate",
                    "Category Certificate",
                    "Income Certificate",
                    "Photo ID Proof"
                ],
                importantDates: [
                    "MHT-CET Application: January 2024",
                    "MHT-CET Exam: April 2024",
                    "Result Declaration: June 2024",
                    "CAP Registration: June 2024",
                    "Seat Allotment: July 2024"
                ]
            },
            {
                name: "Sardar Patel Institute of Technology (SPIT)",
                location: "Mumbai",
                region: "Mumbai",
                type: "Autonomous",
                nirfRank: 201,
                established: 1962,
                website: "https://www.spit.ac.in",
                contact: "+91-22-26707440",
                address: "Munshi Nagar, Andheri (West), Mumbai, Maharashtra 400058",
                facilities: ["Advanced Labs", "Digital Library", "Sports Complex", "Hostel", "Cafeteria", "WiFi", "Innovation Hub"],
                specializations: ["Computer Engineering", "Information Technology", "Electronics & Telecommunication", "Artificial Intelligence & Data Science"],
                mhtcetCutoffs: {
                    computer: 99.3,
                    mechanical: 0,
                    electrical: 0,
                    civil: 0,
                    it: 99.0,
                    ai: 99.6,
                    dataScience: 99.4
                },
                fees: {
                    government: "₹2.5-3 LPA",
                    private: "₹4-5 LPA",
                    nri: "₹8-10 LPA"
                },
                placement: {
                    averagePackage: "₹7.8 LPA",
                    highestPackage: "₹38 LPA",
                    placementPercentage: "88%",
                    topRecruiters: ["Amazon", "Microsoft", "TCS", "Infosys", "Wipro", "Accenture", "Cognizant"]
                },
                admissionProcess: [
                    "MHT-CET Score",
                    "CAP Rounds",
                    "Document Submission",
                    "Fee Payment"
                ],
                documents: [
                    "MHT-CET Score Card",
                    "Academic Records",
                    "Domicile Certificate",
                    "Category Certificate",
                    "Income Certificate",
                    "Address Proof"
                ],
                importantDates: [
                    "MHT-CET Registration: January 2024",
                    "MHT-CET Exam: April 2024",
                    "CAP Registration: June 2024",
                    "Document Verification: July 2024",
                    "Admission: August 2024"
                ]
            },
            {
                name: "Pune Institute of Computer Technology (PICT)",
                location: "Pune",
                region: "Pune",
                type: "Private",
                nirfRank: 251,
                established: 1983,
                website: "https://pict.edu",
                contact: "+91-20-24371101",
                address: "Survey No. 27, Near Trimurti Chowk, Dhankawadi, Pune, Maharashtra 411043",
                facilities: ["Computer Labs", "Library", "Sports Ground", "Hostel", "Cafeteria", "WiFi", "Placement Cell"],
                specializations: ["Computer Engineering", "Information Technology", "E&TC", "Artificial Intelligence & Data Science"],
                mhtcetCutoffs: {
                    computer: 98.8,
                    mechanical: 0,
                    electrical: 0,
                    civil: 0,
                    it: 98.2,
                    ai: 99.1,
                    dataScience: 98.9
                },
                fees: {
                    government: "₹3-4 LPA",
                    private: "₹5-6 LPA",
                    nri: "₹10-12 LPA"
                },
                placement: {
                    averagePackage: "₹6.5 LPA",
                    highestPackage: "₹32 LPA",
                    placementPercentage: "85%",
                    topRecruiters: ["TCS", "Infosys", "Wipro", "Accenture", "Cognizant", "Tech Mahindra", "Capgemini"]
                },
                admissionProcess: [
                    "MHT-CET Score",
                    "CAP Rounds",
                    "Document Verification",
                    "Seat Allotment"
                ],
                documents: [
                    "MHT-CET Score Card",
                    "Academic Certificates",
                    "Domicile Certificate",
                    "Category Certificate",
                    "Income Certificate",
                    "Passport Photos"
                ],
                importantDates: [
                    "MHT-CET Application: January 2024",
                    "MHT-CET Exam: April 2024",
                    "CAP Registration: June 2024",
                    "Document Verification: July 2024",
                    "Admission: August 2024"
                ]
            },
            {
                name: "KJ Somaiya College of Engineering",
                location: "Mumbai",
                region: "Mumbai",
                type: "Private",
                nirfRank: 301,
                established: 1991,
                website: "https://kjsce.somaiya.edu",
                contact: "+91-22-66449191",
                address: "Vidyanagar, Vidyavihar, Mumbai, Maharashtra 400077",
                facilities: ["Modern Labs", "Library", "Sports Complex", "Hostel", "Cafeteria", "WiFi", "Innovation Center"],
                specializations: ["Computer Engineering", "Mechanical Engineering", "Electrical Engineering", "Civil Engineering", "Information Technology"],
                mhtcetCutoffs: {
                    computer: 98.5,
                    mechanical: 96.8,
                    electrical: 97.2,
                    civil: 95.5,
                    it: 98.0,
                    ai: 98.8,
                    dataScience: 98.3
                },
                fees: {
                    government: "₹3.5-4.5 LPA",
                    private: "₹6-7 LPA",
                    nri: "₹12-15 LPA"
                },
                placement: {
                    averagePackage: "₹6.2 LPA",
                    highestPackage: "₹28 LPA",
                    placementPercentage: "82%",
                    topRecruiters: ["TCS", "Infosys", "Wipro", "Accenture", "Cognizant", "Tech Mahindra", "L&T"]
                },
                admissionProcess: [
                    "MHT-CET Score",
                    "CAP Rounds",
                    "Document Submission",
                    "Fee Payment"
                ],
                documents: [
                    "MHT-CET Score Card",
                    "Academic Records",
                    "Domicile Certificate",
                    "Category Certificate",
                    "Income Certificate",
                    "Address Proof"
                ],
                importantDates: [
                    "MHT-CET Registration: January 2024",
                    "MHT-CET Exam: April 2024",
                    "CAP Registration: June 2024",
                    "Document Verification: July 2024",
                    "Admission: August 2024"
                ]
            },
            {
                name: "Vishwakarma Institute of Technology (VIT)",
                location: "Pune",
                region: "Pune",
                type: "Private",
                nirfRank: 351,
                established: 1983,
                website: "https://vit.edu",
                contact: "+91-20-24201101",
                address: "666, Upper Indira Nagar, Bibwewadi, Pune, Maharashtra 411037",
                facilities: ["Advanced Labs", "Library", "Sports Ground", "Hostel", "Cafeteria", "WiFi", "Placement Cell"],
                specializations: ["Computer Engineering", "Mechanical Engineering", "Electrical Engineering", "Civil Engineering", "E&TC", "Information Technology"],
                mhtcetCutoffs: {
                    computer: 98.2,
                    mechanical: 96.5,
                    electrical: 96.8,
                    civil: 95.0,
                    it: 97.8,
                    ai: 98.5,
                    dataScience: 98.0
                },
                fees: {
                    government: "₹3-4 LPA",
                    private: "₹5-6 LPA",
                    nri: "₹10-12 LPA"
                },
                placement: {
                    averagePackage: "₹5.8 LPA",
                    highestPackage: "₹25 LPA",
                    placementPercentage: "80%",
                    topRecruiters: ["TCS", "Infosys", "Wipro", "Accenture", "Cognizant", "Tech Mahindra", "Capgemini"]
                },
                admissionProcess: [
                    "MHT-CET Score",
                    "CAP Rounds",
                    "Document Verification",
                    "Seat Allotment"
                ],
                documents: [
                    "MHT-CET Score Card",
                    "Academic Certificates",
                    "Domicile Certificate",
                    "Category Certificate",
                    "Income Certificate",
                    "Passport Photos"
                ],
                importantDates: [
                    "MHT-CET Application: January 2024",
                    "MHT-CET Exam: April 2024",
                    "CAP Registration: June 2024",
                    "Document Verification: July 2024",
                    "Admission: August 2024"
                ]
            },
            {
                name: "Thadomal Shahani Engineering College (TSEC)",
                location: "Mumbai",
                region: "Mumbai",
                type: "Private",
                nirfRank: 401,
                established: 1983,
                website: "https://tsec.edu",
                contact: "+91-22-26487291",
                address: "Gulmohar Cross Road No. 1, Juhu Scheme, Andheri (West), Mumbai, Maharashtra 400049",
                facilities: ["Computer Labs", "Library", "Sports Ground", "Hostel", "Cafeteria", "WiFi", "Innovation Hub"],
                specializations: ["Computer Engineering", "Information Technology", "E&TC", "Chemical Engineering", "Biotechnology"],
                mhtcetCutoffs: {
                    computer: 97.8,
                    mechanical: 0,
                    electrical: 0,
                    civil: 0,
                    it: 97.2,
                    ai: 98.0,
                    dataScience: 97.5
                },
                fees: {
                    government: "₹3.5-4.5 LPA",
                    private: "₹6-7 LPA",
                    nri: "₹12-15 LPA"
                },
                placement: {
                    averagePackage: "₹5.5 LPA",
                    highestPackage: "₹22 LPA",
                    placementPercentage: "78%",
                    topRecruiters: ["TCS", "Infosys", "Wipro", "Accenture", "Cognizant", "Tech Mahindra", "Capgemini"]
                },
                admissionProcess: [
                    "MHT-CET Score",
                    "CAP Rounds",
                    "Document Submission",
                    "Fee Payment"
                ],
                documents: [
                    "MHT-CET Score Card",
                    "Academic Records",
                    "Domicile Certificate",
                    "Category Certificate",
                    "Income Certificate",
                    "Address Proof"
                ],
                importantDates: [
                    "MHT-CET Registration: January 2024",
                    "MHT-CET Exam: April 2024",
                    "CAP Registration: June 2024",
                    "Document Verification: July 2024",
                    "Admission: August 2024"
                ]
            },
            {
                name: "D.Y. Patil College of Engineering",
                location: "Pune",
                region: "Pune",
                type: "Private",
                nirfRank: 451,
                established: 1984,
                website: "https://dypcoeakurdi.ac.in",
                contact: "+91-20-27642201",
                address: "Akurdi, Pune, Maharashtra 411044",
                facilities: ["Modern Labs", "Library", "Sports Complex", "Hostel", "Cafeteria", "WiFi", "Placement Cell"],
                specializations: ["Computer Engineering", "Mechanical Engineering", "Electrical Engineering", "Civil Engineering", "E&TC", "Information Technology"],
                mhtcetCutoffs: {
                    computer: 97.2,
                    mechanical: 95.8,
                    electrical: 96.0,
                    civil: 94.5,
                    it: 96.8,
                    ai: 97.5,
                    dataScience: 97.0
                },
                fees: {
                    government: "₹3-4 LPA",
                    private: "₹5-6 LPA",
                    nri: "₹10-12 LPA"
                },
                placement: {
                    averagePackage: "₹5.2 LPA",
                    highestPackage: "₹20 LPA",
                    placementPercentage: "75%",
                    topRecruiters: ["TCS", "Infosys", "Wipro", "Accenture", "Cognizant", "Tech Mahindra", "Capgemini"]
                },
                admissionProcess: [
                    "MHT-CET Score",
                    "CAP Rounds",
                    "Document Verification",
                    "Seat Allotment"
                ],
                documents: [
                    "MHT-CET Score Card",
                    "Academic Certificates",
                    "Domicile Certificate",
                    "Category Certificate",
                    "Income Certificate",
                    "Passport Photos"
                ],
                importantDates: [
                    "MHT-CET Application: January 2024",
                    "MHT-CET Exam: April 2024",
                    "CAP Registration: June 2024",
                    "Document Verification: July 2024",
                    "Admission: August 2024"
                ]
            },
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
        ];

        await College.insertMany(sampleColleges);
        console.log('Sample college data initialized');
    }
};

// Initialize sample career roadmap data
const initializeRoadmaps = async () => {
    const roadmapsCount = await CareerRoadmap.countDocuments();
    if (roadmapsCount === 0) {
        const sampleRoadmaps = [
            {
                careerTitle: "Medical",
                currentPosition: "10th",
                targetPosition: "Doctor",
                totalSteps: 8,
                estimatedDuration: "7-8 years",
                successRate: "85%",
                difficulty: "Hard",
                investment: "High",
                prerequisites: ["Strong foundation in Science", "Good academic record", "Physical and mental fitness"],
                alternatives: ["Nursing", "Physiotherapy", "Pharmacy", "Medical Lab Technology"],
                roadmap: [
                    {
                        stepNumber: 1,
                        title: "Complete 10th Standard",
                        description: "Focus on building a strong foundation in Science, especially Biology, Chemistry, and Physics",
                        duration: "1 year",
                        requirements: ["Minimum 50% marks", "Strong interest in Science"],
                        tasks: ["Study Biology, Chemistry, Physics thoroughly", "Develop good study habits", "Participate in Science competitions"],
                        exams: ["10th Board Exams"],
                        tips: ["Focus on understanding concepts rather than memorizing", "Practice diagrams and experiments", "Stay updated with current affairs"]
                    },
                    {
                        stepNumber: 2,
                        title: "Choose Science Stream (PCB)",
                        description: "Opt for Science stream with Physics, Chemistry, and Biology in 11th and 12th standard",
                        duration: "2 years",
                        requirements: ["10th pass with good marks", "Interest in medical field"],
                        tasks: ["Enroll in Science stream", "Study PCB subjects intensively", "Prepare for NEET simultaneously"],
                        exams: ["12th Board Exams", "NEET"],
                        tips: ["Start NEET preparation early", "Join coaching classes if needed", "Practice previous year questions"]
                    },
                    {
                        stepNumber: 3,
                        title: "Appear for NEET",
                        description: "Take the National Eligibility cum Entrance Test (NEET) for medical admissions",
                        duration: "1 day exam",
                        requirements: ["12th with PCB", "Age 17-25 years", "Indian nationality"],
                        tasks: ["Register for NEET", "Complete application process", "Take the exam"],
                        exams: ["NEET"],
                        tips: ["Practice time management", "Focus on accuracy", "Stay calm during exam"]
                    },
                    {
                        stepNumber: 4,
                        title: "Get MBBS Admission",
                        description: "Secure admission in a recognized medical college through NEET counseling",
                        duration: "1-2 months",
                        requirements: ["Good NEET score", "Document verification", "Medical fitness"],
                        tasks: ["Participate in counseling", "Choose preferred college", "Complete admission formalities"],
                        exams: ["Medical fitness test"],
                        tips: ["Research colleges thoroughly", "Consider location and fees", "Keep all documents ready"]
                    },
                    {
                        stepNumber: 5,
                        title: "Complete MBBS",
                        description: "Undertake 5.5 years of medical education including 1 year of internship",
                        duration: "5.5 years",
                        requirements: ["Regular attendance", "Pass all subjects", "Complete internship"],
                        tasks: ["Study medical subjects", "Attend clinical rotations", "Complete internship"],
                        exams: ["MBBS semester exams", "Final MBBS exam"],
                        tips: ["Focus on practical skills", "Build good relationships with seniors", "Stay updated with medical advances"]
                    },
                    {
                        stepNumber: 6,
                        title: "Register with Medical Council",
                        description: "Register with the Medical Council of India (MCI) to practice medicine",
                        duration: "1-2 months",
                        requirements: ["MBBS degree", "Internship completion certificate"],
                        tasks: ["Apply for registration", "Submit required documents", "Pay registration fees"],
                        exams: ["None"],
                        tips: ["Keep all certificates safe", "Apply early", "Follow up on application status"]
                    },
                    {
                        stepNumber: 7,
                        title: "Choose Specialization (Optional)",
                        description: "Decide whether to pursue postgraduate specialization or start practice",
                        duration: "3-5 years (if pursuing PG)",
                        requirements: ["MBBS degree", "Good academic record", "NEET PG score"],
                        tasks: ["Appear for NEET PG", "Choose specialization", "Complete PG course"],
                        exams: ["NEET PG", "PG entrance exams"],
                        tips: ["Research different specializations", "Consider future prospects", "Choose based on interest"]
                    },
                    {
                        stepNumber: 8,
                        title: "Start Medical Practice",
                        description: "Begin your career as a medical professional in hospitals, clinics, or private practice",
                        duration: "Lifetime career",
                        requirements: ["Medical registration", "Specialization (if pursued)"],
                        tasks: ["Join hospital/clinic", "Build patient base", "Continue learning"],
                        exams: ["None"],
                        tips: ["Focus on patient care", "Build good reputation", "Stay updated with medical advances"]
                    }
                ]
            },
            {
                careerTitle: "Engineering",
                currentPosition: "10th",
                targetPosition: "Software Engineer",
                totalSteps: 7,
                estimatedDuration: "6-7 years",
                successRate: "90%",
                difficulty: "Medium",
                investment: "Medium",
                prerequisites: ["Strong foundation in Mathematics", "Logical thinking", "Interest in technology"],
                alternatives: ["Data Scientist", "AI Engineer", "DevOps Engineer", "Product Manager"],
                roadmap: [
                    {
                        stepNumber: 1,
                        title: "Complete 10th Standard",
                        description: "Build strong foundation in Mathematics, Science, and Computer basics",
                        duration: "1 year",
                        requirements: ["Minimum 50% marks", "Interest in technology"],
                        tasks: ["Study Mathematics thoroughly", "Learn basic computer skills", "Develop logical thinking"],
                        exams: ["10th Board Exams"],
                        tips: ["Practice problem-solving", "Learn programming basics", "Stay curious about technology"]
                    },
                    {
                        stepNumber: 2,
                        title: "Choose Science Stream (PCM)",
                        description: "Opt for Science stream with Physics, Chemistry, and Mathematics",
                        duration: "2 years",
                        requirements: ["10th pass with good marks", "Interest in engineering"],
                        tasks: ["Enroll in Science stream", "Study PCM subjects", "Prepare for engineering entrance"],
                        exams: ["12th Board Exams", "JEE Main", "State entrance exams"],
                        tips: ["Start JEE preparation early", "Practice mathematics daily", "Join coaching if needed"]
                    },
                    {
                        stepNumber: 3,
                        title: "Appear for Engineering Entrance",
                        description: "Take JEE Main or state-level engineering entrance exams",
                        duration: "1 day exam",
                        requirements: ["12th with PCM", "Good preparation"],
                        tasks: ["Register for entrance exam", "Take the exam", "Check results"],
                        exams: ["JEE Main", "State entrance exams"],
                        tips: ["Practice previous year papers", "Focus on accuracy", "Manage time well"]
                    },
                    {
                        stepNumber: 4,
                        title: "Get B.Tech Admission",
                        description: "Secure admission in Computer Science or related engineering branch",
                        duration: "1-2 months",
                        requirements: ["Good entrance exam score", "Document verification"],
                        tasks: ["Participate in counseling", "Choose college and branch", "Complete admission"],
                        exams: ["None"],
                        tips: ["Research colleges and branches", "Consider placement records", "Check infrastructure"]
                    },
                    {
                        stepNumber: 5,
                        title: "Complete B.Tech in Computer Science",
                        description: "Undertake 4 years of engineering education with focus on programming",
                        duration: "4 years",
                        requirements: ["Regular attendance", "Pass all subjects", "Complete projects"],
                        tasks: ["Learn programming languages", "Complete projects", "Attend workshops"],
                        exams: ["B.Tech semester exams", "Final year project"],
                        tips: ["Practice coding daily", "Build portfolio", "Participate in hackathons"]
                    },
                    {
                        stepNumber: 6,
                        title: "Gain Experience (Optional)",
                        description: "Work as intern or fresher to gain practical experience",
                        duration: "6 months - 1 year",
                        requirements: ["B.Tech degree", "Programming skills"],
                        tasks: ["Apply for internships", "Work on real projects", "Learn industry tools"],
                        exams: ["None"],
                        tips: ["Build strong resume", "Network with professionals", "Learn new technologies"]
                    },
                    {
                        stepNumber: 7,
                        title: "Start Career as Software Engineer",
                        description: "Begin your career in software development companies",
                        duration: "Lifetime career",
                        requirements: ["B.Tech degree", "Programming skills", "Problem-solving ability"],
                        tasks: ["Apply for jobs", "Join software company", "Contribute to projects"],
                        exams: ["Technical interviews"],
                        tips: ["Keep learning new technologies", "Build good relationships", "Focus on quality code"]
                    }
                ]
            },
            {
                careerTitle: "Law",
                currentPosition: "10th",
                targetPosition: "Lawyer",
                totalSteps: 6,
                estimatedDuration: "5-6 years",
                successRate: "80%",
                difficulty: "Medium",
                investment: "Medium",
                prerequisites: ["Good communication skills", "Analytical thinking", "Interest in justice"],
                alternatives: ["Legal Advisor", "Corporate Lawyer", "Human Rights Lawyer", "Judge"],
                roadmap: [
                    {
                        stepNumber: 1,
                        title: "Complete 10th Standard",
                        description: "Build strong foundation in English, Social Studies, and general knowledge",
                        duration: "1 year",
                        requirements: ["Minimum 50% marks", "Good English skills"],
                        tasks: ["Study English thoroughly", "Read newspapers", "Develop communication skills"],
                        exams: ["10th Board Exams"],
                        tips: ["Improve English speaking", "Stay updated with current affairs", "Practice debating"]
                    },
                    {
                        stepNumber: 2,
                        title: "Choose Any Stream in 12th",
                        description: "Complete 12th standard in any stream (Arts/Commerce/Science)",
                        duration: "2 years",
                        requirements: ["10th pass", "Interest in law"],
                        tasks: ["Complete 12th standard", "Develop analytical skills", "Prepare for CLAT"],
                        exams: ["12th Board Exams", "CLAT"],
                        tips: ["Start CLAT preparation early", "Read legal articles", "Practice logical reasoning"]
                    },
                    {
                        stepNumber: 3,
                        title: "Appear for CLAT",
                        description: "Take the Common Law Admission Test for law school admissions",
                        duration: "1 day exam",
                        requirements: ["12th pass", "Age 17-20 years", "Good preparation"],
                        tasks: ["Register for CLAT", "Take the exam", "Check results"],
                        exams: ["CLAT"],
                        tips: ["Practice previous year papers", "Focus on English and reasoning", "Manage time well"]
                    },
                    {
                        stepNumber: 4,
                        title: "Get LLB Admission",
                        description: "Secure admission in a recognized law school",
                        duration: "1-2 months",
                        requirements: ["Good CLAT score", "Document verification"],
                        tasks: ["Participate in counseling", "Choose law school", "Complete admission"],
                        exams: ["None"],
                        tips: ["Research law schools", "Consider reputation and placement", "Check infrastructure"]
                    },
                    {
                        stepNumber: 5,
                        title: "Complete LLB",
                        description: "Undertake 5 years of legal education (3 years for graduates)",
                        duration: "3-5 years",
                        requirements: ["Regular attendance", "Pass all subjects", "Complete internships"],
                        tasks: ["Study law subjects", "Complete internships", "Participate in moot courts"],
                        exams: ["LLB semester exams", "Final year exams"],
                        tips: ["Focus on practical learning", "Build network", "Stay updated with laws"]
                    },
                    {
                        stepNumber: 6,
                        title: "Start Legal Practice",
                        description: "Begin your career as a lawyer in courts or law firms",
                        duration: "Lifetime career",
                        requirements: ["LLB degree", "Bar Council registration"],
                        tasks: ["Register with Bar Council", "Join law firm or start practice", "Build client base"],
                        exams: ["Bar Council registration"],
                        tips: ["Build good reputation", "Focus on client service", "Continue learning"]
                    }
                ]
            },
            {
                careerTitle: "Commerce",
                currentPosition: "10th",
                targetPosition: "Chartered Accountant",
                totalSteps: 6,
                estimatedDuration: "4-5 years",
                successRate: "75%",
                difficulty: "Hard",
                investment: "Medium",
                prerequisites: ["Strong foundation in Mathematics", "Analytical skills", "Interest in finance"],
                alternatives: ["Company Secretary", "Cost Accountant", "Financial Analyst", "Tax Consultant"],
                roadmap: [
                    {
                        stepNumber: 1,
                        title: "Complete 10th Standard",
                        description: "Build strong foundation in Mathematics and basic accounting concepts",
                        duration: "1 year",
                        requirements: ["Minimum 50% marks", "Good mathematical skills"],
                        tasks: ["Study Mathematics thoroughly", "Learn basic accounting", "Develop analytical skills"],
                        exams: ["10th Board Exams"],
                        tips: ["Practice mathematics daily", "Understand basic accounting", "Develop logical thinking"]
                    },
                    {
                        stepNumber: 2,
                        title: "Choose Commerce Stream",
                        description: "Opt for Commerce stream with Accountancy, Business Studies, and Economics",
                        duration: "2 years",
                        requirements: ["10th pass", "Interest in commerce"],
                        tasks: ["Enroll in Commerce stream", "Study commerce subjects", "Prepare for CA foundation"],
                        exams: ["12th Board Exams", "CA Foundation"],
                        tips: ["Start CA preparation early", "Focus on accountancy", "Practice calculations"]
                    },
                    {
                        stepNumber: 3,
                        title: "Appear for CA Foundation",
                        description: "Take the CA Foundation exam to start CA journey",
                        duration: "1 day exam",
                        requirements: ["12th pass", "Registration with ICAI"],
                        tasks: ["Register with ICAI", "Take CA Foundation exam", "Clear the exam"],
                        exams: ["CA Foundation"],
                        tips: ["Study systematically", "Practice previous papers", "Focus on accuracy"]
                    },
                    {
                        stepNumber: 4,
                        title: "Complete CA Intermediate",
                        description: "Clear CA Intermediate exam and complete articleship",
                        duration: "2-3 years",
                        requirements: ["CA Foundation cleared", "Articleship training"],
                        tasks: ["Study for CA Intermediate", "Complete articleship", "Clear intermediate exam"],
                        exams: ["CA Intermediate"],
                        tips: ["Balance studies and articleship", "Learn practical skills", "Build network"]
                    },
                    {
                        stepNumber: 5,
                        title: "Complete CA Final",
                        description: "Clear CA Final exam to become a Chartered Accountant",
                        duration: "1-2 years",
                        requirements: ["CA Intermediate cleared", "Articleship completed"],
                        tasks: ["Study for CA Final", "Take the exam", "Clear all papers"],
                        exams: ["CA Final"],
                        tips: ["Study intensively", "Practice case studies", "Stay updated with laws"]
                    },
                    {
                        stepNumber: 6,
                        title: "Start CA Practice",
                        description: "Begin your career as a Chartered Accountant",
                        duration: "Lifetime career",
                        requirements: ["CA Final cleared", "ICAI membership"],
                        tasks: ["Get ICAI membership", "Start practice or join firm", "Build client base"],
                        exams: ["None"],
                        tips: ["Build reputation", "Focus on quality service", "Continue learning"]
                    }
                ]
            },
            {
                careerTitle: "Arts",
                currentPosition: "10th",
                targetPosition: "Journalist",
                totalSteps: 6,
                estimatedDuration: "5-6 years",
                successRate: "80%",
                difficulty: "Medium",
                investment: "Low",
                prerequisites: ["Strong communication skills", "Writing ability", "Interest in current affairs"],
                alternatives: ["Content Writer", "Public Relations Officer", "Media Professional", "Author"],
                roadmap: [
                    {
                        stepNumber: 1,
                        title: "Complete 10th Standard",
                        description: "Build strong foundation in English, Social Studies, and general knowledge",
                        duration: "1 year",
                        requirements: ["Minimum 50% marks", "Good English skills"],
                        tasks: ["Study English thoroughly", "Read newspapers", "Develop writing skills"],
                        exams: ["10th Board Exams"],
                        tips: ["Improve English speaking and writing", "Stay updated with current affairs", "Practice creative writing"]
                    },
                    {
                        stepNumber: 2,
                        title: "Choose Arts Stream",
                        description: "Opt for Arts stream with English, History, Political Science, and Economics",
                        duration: "2 years",
                        requirements: ["10th pass", "Interest in humanities"],
                        tasks: ["Enroll in Arts stream", "Study humanities subjects", "Develop analytical skills"],
                        exams: ["12th Board Exams"],
                        tips: ["Read extensively", "Practice writing articles", "Participate in debates"]
                    },
                    {
                        stepNumber: 3,
                        title: "Get Journalism Degree",
                        description: "Pursue Bachelor's degree in Journalism and Mass Communication",
                        duration: "3 years",
                        requirements: ["12th pass", "Good communication skills"],
                        tasks: ["Apply for journalism courses", "Study media subjects", "Complete internships"],
                        exams: ["University entrance exams", "Semester exams"],
                        tips: ["Choose reputed institutions", "Focus on practical skills", "Build portfolio"]
                    },
                    {
                        stepNumber: 4,
                        title: "Gain Practical Experience",
                        description: "Work as intern or freelancer to gain hands-on experience",
                        duration: "6 months - 1 year",
                        requirements: ["Journalism degree", "Writing skills"],
                        tasks: ["Apply for internships", "Write articles", "Build network"],
                        exams: ["None"],
                        tips: ["Start with local newspapers", "Build online presence", "Network with professionals"]
                    },
                    {
                        stepNumber: 5,
                        title: "Specialize (Optional)",
                        description: "Choose specialization like print, broadcast, or digital journalism",
                        duration: "1-2 years",
                        requirements: ["Basic experience", "Interest in specialization"],
                        tasks: ["Choose specialization", "Learn specific skills", "Get specialized training"],
                        exams: ["Specialized courses"],
                        tips: ["Research different specializations", "Consider future trends", "Choose based on interest"]
                    },
                    {
                        stepNumber: 6,
                        title: "Start Journalism Career",
                        description: "Begin your career as a journalist in media organizations",
                        duration: "Lifetime career",
                        requirements: ["Journalism degree", "Experience", "Network"],
                        tasks: ["Apply for jobs", "Join media organization", "Build reputation"],
                        exams: ["None"],
                        tips: ["Focus on quality reporting", "Build sources", "Stay ethical"]
                    }
                ]
            },
            {
                careerTitle: "ITI",
                currentPosition: "10th",
                targetPosition: "Electrician",
                totalSteps: 5,
                estimatedDuration: "2-3 years",
                successRate: "90%",
                difficulty: "Easy",
                investment: "Low",
                prerequisites: ["Basic technical aptitude", "Physical fitness", "Interest in electrical work"],
                alternatives: ["Plumber", "Carpenter", "Welder", "Mechanic"],
                roadmap: [
                    {
                        stepNumber: 1,
                        title: "Complete 10th Standard",
                        description: "Build basic foundation in Science and Mathematics",
                        duration: "1 year",
                        requirements: ["Minimum 40% marks", "Basic technical interest"],
                        tasks: ["Study Science and Mathematics", "Develop technical aptitude", "Improve physical fitness"],
                        exams: ["10th Board Exams"],
                        tips: ["Focus on practical subjects", "Develop problem-solving skills", "Stay physically active"]
                    },
                    {
                        stepNumber: 2,
                        title: "Enroll in ITI Electrician Course",
                        description: "Join Industrial Training Institute for electrician training",
                        duration: "2 years",
                        requirements: ["10th pass", "Age 14-40 years"],
                        tasks: ["Apply for ITI admission", "Complete theoretical training", "Learn practical skills"],
                        exams: ["ITI semester exams", "Practical assessments"],
                        tips: ["Choose government ITI", "Focus on practical learning", "Build technical skills"]
                    },
                    {
                        stepNumber: 3,
                        title: "Complete Apprenticeship",
                        description: "Undertake apprenticeship training in electrical industry",
                        duration: "6 months - 1 year",
                        requirements: ["ITI completion", "Apprenticeship registration"],
                        tasks: ["Register for apprenticeship", "Work under supervision", "Learn industry practices"],
                        exams: ["Apprenticeship assessment"],
                        tips: ["Learn from experienced workers", "Focus on safety", "Build industry contacts"]
                    },
                    {
                        stepNumber: 4,
                        title: "Get Certification",
                        description: "Obtain necessary certifications and licenses",
                        duration: "1-2 months",
                        requirements: ["ITI certificate", "Apprenticeship completion"],
                        tasks: ["Apply for certifications", "Take licensing exams", "Get safety certifications"],
                        exams: ["Licensing exams", "Safety certifications"],
                        tips: ["Study safety regulations", "Practice exam questions", "Stay updated with codes"]
                    },
                    {
                        stepNumber: 5,
                        title: "Start Electrician Career",
                        description: "Begin your career as a certified electrician",
                        duration: "Lifetime career",
                        requirements: ["ITI certificate", "Licenses", "Experience"],
                        tasks: ["Join electrical company", "Work independently", "Build client base"],
                        exams: ["None"],
                        tips: ["Focus on safety", "Build reputation", "Continue learning"]
                    }
                ]
            },
            {
                careerTitle: "Polytechnic",
                currentPosition: "10th",
                targetPosition: "Diploma Engineer",
                totalSteps: 5,
                estimatedDuration: "3-4 years",
                successRate: "85%",
                difficulty: "Medium",
                investment: "Low",
                prerequisites: ["Strong foundation in Mathematics", "Technical aptitude", "Interest in engineering"],
                alternatives: ["B.Tech", "ITI", "Technical Supervisor", "Quality Inspector"],
                roadmap: [
                    {
                        stepNumber: 1,
                        title: "Complete 10th Standard",
                        description: "Build strong foundation in Mathematics, Science, and English",
                        duration: "1 year",
                        requirements: ["Minimum 50% marks", "Interest in technical subjects"],
                        tasks: ["Study Mathematics and Science", "Develop technical aptitude", "Improve English"],
                        exams: ["10th Board Exams"],
                        tips: ["Focus on Mathematics", "Practice problem-solving", "Develop logical thinking"]
                    },
                    {
                        stepNumber: 2,
                        title: "Apply for Polytechnic",
                        description: "Apply for diploma courses in engineering branches",
                        duration: "2-3 months",
                        requirements: ["10th pass", "Good marks in Mathematics and Science"],
                        tasks: ["Research polytechnic colleges", "Apply for admission", "Choose engineering branch"],
                        exams: ["Polytechnic entrance exams"],
                        tips: ["Choose reputed institutions", "Consider placement records", "Select branch wisely"]
                    },
                    {
                        stepNumber: 3,
                        title: "Complete Diploma Course",
                        description: "Undertake 3 years of diploma education in chosen branch",
                        duration: "3 years",
                        requirements: ["Regular attendance", "Pass all subjects", "Complete projects"],
                        tasks: ["Study engineering subjects", "Complete practical training", "Work on projects"],
                        exams: ["Diploma semester exams", "Final year project"],
                        tips: ["Focus on practical skills", "Build technical knowledge", "Participate in competitions"]
                    },
                    {
                        stepNumber: 4,
                        title: "Gain Experience (Optional)",
                        description: "Work as trainee or junior engineer to gain experience",
                        duration: "6 months - 1 year",
                        requirements: ["Diploma certificate", "Technical skills"],
                        tasks: ["Apply for trainee positions", "Work under supervision", "Learn industry practices"],
                        exams: ["None"],
                        tips: ["Start with small companies", "Learn from seniors", "Build technical skills"]
                    },
                    {
                        stepNumber: 5,
                        title: "Start Engineering Career",
                        description: "Begin your career as a diploma engineer",
                        duration: "Lifetime career",
                        requirements: ["Diploma certificate", "Technical skills", "Experience"],
                        tasks: ["Apply for engineering jobs", "Join engineering company", "Contribute to projects"],
                        exams: ["Technical interviews"],
                        tips: ["Focus on technical skills", "Build good relationships", "Continue learning"]
                    }
                ]
            },
            {
                careerTitle: "Hotel Management",
                currentPosition: "10th",
                targetPosition: "Hotel Manager",
                totalSteps: 6,
                estimatedDuration: "5-6 years",
                successRate: "85%",
                difficulty: "Medium",
                investment: "Medium",
                prerequisites: ["Good communication skills", "Customer service attitude", "Leadership qualities"],
                alternatives: ["Chef", "Restaurant Manager", "Event Manager", "Tourism Professional"],
                roadmap: [
                    {
                        stepNumber: 1,
                        title: "Complete 10th Standard",
                        description: "Build strong foundation in English, Mathematics, and general knowledge",
                        duration: "1 year",
                        requirements: ["Minimum 50% marks", "Good communication skills"],
                        tasks: ["Study English thoroughly", "Develop communication skills", "Learn basic mathematics"],
                        exams: ["10th Board Exams"],
                        tips: ["Improve English speaking", "Practice customer service", "Develop interpersonal skills"]
                    },
                    {
                        stepNumber: 2,
                        title: "Choose Any Stream in 12th",
                        description: "Complete 12th standard in any stream with focus on communication",
                        duration: "2 years",
                        requirements: ["10th pass", "Interest in hospitality"],
                        tasks: ["Complete 12th standard", "Improve communication skills", "Learn about hospitality industry"],
                        exams: ["12th Board Exams"],
                        tips: ["Focus on English", "Learn about different cultures", "Develop leadership skills"]
                    },
                    {
                        stepNumber: 3,
                        title: "Get Hotel Management Degree",
                        description: "Pursue Bachelor's degree in Hotel Management",
                        duration: "3 years",
                        requirements: ["12th pass", "Good communication skills"],
                        tasks: ["Apply for hotel management courses", "Study hospitality subjects", "Complete internships"],
                        exams: ["University entrance exams", "Semester exams"],
                        tips: ["Choose reputed institutions", "Focus on practical training", "Build industry contacts"]
                    },
                    {
                        stepNumber: 4,
                        title: "Gain Industry Experience",
                        description: "Work in hotels to gain practical experience",
                        duration: "1-2 years",
                        requirements: ["Hotel management degree", "Customer service skills"],
                        tasks: ["Apply for hotel jobs", "Work in different departments", "Learn hotel operations"],
                        exams: ["None"],
                        tips: ["Start with entry-level positions", "Learn from seniors", "Build network"]
                    },
                    {
                        stepNumber: 5,
                        title: "Specialize (Optional)",
                        description: "Choose specialization like food service, front office, or housekeeping",
                        duration: "1-2 years",
                        requirements: ["Basic experience", "Interest in specialization"],
                        tasks: ["Choose specialization", "Get specialized training", "Work in specialized role"],
                        exams: ["Specialized courses"],
                        tips: ["Research different specializations", "Consider career growth", "Choose based on interest"]
                    },
                    {
                        stepNumber: 6,
                        title: "Start Management Career",
                        description: "Begin your career as a hotel manager",
                        duration: "Lifetime career",
                        requirements: ["Hotel management degree", "Experience", "Leadership skills"],
                        tasks: ["Apply for management positions", "Lead hotel operations", "Manage staff"],
                        exams: ["Management interviews"],
                        tips: ["Focus on customer satisfaction", "Build team leadership", "Stay updated with trends"]
                    }
                ]
            },
            {
                careerTitle: "Design",
                currentPosition: "10th",
                targetPosition: "Graphic Designer",
                totalSteps: 5,
                estimatedDuration: "4-5 years",
                successRate: "80%",
                difficulty: "Medium",
                investment: "Medium",
                prerequisites: ["Creative thinking", "Artistic skills", "Interest in design"],
                alternatives: ["Web Designer", "UI/UX Designer", "Interior Designer", "Fashion Designer"],
                roadmap: [
                    {
                        stepNumber: 1,
                        title: "Complete 10th Standard",
                        description: "Build foundation in Arts, Mathematics, and Computer basics",
                        duration: "1 year",
                        requirements: ["Minimum 50% marks", "Interest in arts and design"],
                        tasks: ["Study Arts and Mathematics", "Learn basic computer skills", "Develop creative thinking"],
                        exams: ["10th Board Exams"],
                        tips: ["Practice drawing", "Learn design software basics", "Develop artistic skills"]
                    },
                    {
                        stepNumber: 2,
                        title: "Choose Arts Stream",
                        description: "Opt for Arts stream with focus on creative subjects",
                        duration: "2 years",
                        requirements: ["10th pass", "Interest in design"],
                        tasks: ["Enroll in Arts stream", "Study creative subjects", "Practice design skills"],
                        exams: ["12th Board Exams"],
                        tips: ["Focus on creative subjects", "Practice design software", "Build portfolio"]
                    },
                    {
                        stepNumber: 3,
                        title: "Get Design Degree",
                        description: "Pursue Bachelor's degree in Design or related field",
                        duration: "3-4 years",
                        requirements: ["12th pass", "Creative skills", "Portfolio"],
                        tasks: ["Apply for design courses", "Study design principles", "Build portfolio"],
                        exams: ["Design entrance exams", "Portfolio review", "Semester exams"],
                        tips: ["Choose reputed design schools", "Focus on portfolio building", "Learn industry software"]
                    },
                    {
                        stepNumber: 4,
                        title: "Gain Experience",
                        description: "Work as intern or freelancer to gain practical experience",
                        duration: "6 months - 1 year",
                        requirements: ["Design degree", "Portfolio", "Software skills"],
                        tasks: ["Apply for internships", "Work on real projects", "Build client base"],
                        exams: ["None"],
                        tips: ["Start with small projects", "Build online presence", "Network with professionals"]
                    },
                    {
                        stepNumber: 5,
                        title: "Start Design Career",
                        description: "Begin your career as a graphic designer",
                        duration: "Lifetime career",
                        requirements: ["Design degree", "Portfolio", "Software skills"],
                        tasks: ["Apply for design jobs", "Join design agency", "Create designs"],
                        exams: ["Portfolio review"],
                        tips: ["Keep portfolio updated", "Stay creative", "Learn new trends"]
                    }
                ]
            }
        ];

        await CareerRoadmap.insertMany(sampleRoadmaps);
        console.log('Sample career roadmap data initialized');
    }
};

// Initialize assessment questions
const initializeAssessmentQuestions = async () => {
    try {
        const count = await AssessmentQuestion.countDocuments();
        if (count === 0) {
            const defaultQuestions = [
                {
                    question: "What subjects do you enjoy studying the most?",
                    options: [
                        { value: "science", text: "Science (Physics, Chemistry, Biology)" },
                        { value: "math", text: "Mathematics and Logic" },
                        { value: "arts", text: "Arts and Literature" },
                        { value: "commerce", text: "Commerce and Business" },
                        { value: "technology", text: "Technology and Computers" }
                    ],
                    category: "interests",
                    weight: 2
                },
                {
                    question: "How do you prefer to spend your free time?",
                    options: [
                        { value: "creative", text: "Creating something (art, music, writing)" },
                        { value: "social", text: "Spending time with friends and family" },
                        { value: "analytical", text: "Solving puzzles and problems" },
                        { value: "physical", text: "Sports and physical activities" },
                        { value: "learning", text: "Reading and learning new things" }
                    ],
                    category: "personality",
                    weight: 2
                },
                {
                    question: "What type of work environment appeals to you most?",
                    options: [
                        { value: "office", text: "Structured office environment" },
                        { value: "creative", text: "Creative and flexible workspace" },
                        { value: "outdoor", text: "Outdoor and field work" },
                        { value: "lab", text: "Laboratory or research setting" },
                        { value: "remote", text: "Remote work from anywhere" }
                    ],
                    category: "preferences",
                    weight: 1
                },
                {
                    question: "How do you handle challenges and problems?",
                    options: [
                        { value: "analytical", text: "Analyze the problem step by step" },
                        { value: "creative", text: "Think of creative solutions" },
                        { value: "collaborative", text: "Work with others to solve it" },
                        { value: "research", text: "Research and gather information" },
                        { value: "intuitive", text: "Follow my intuition and experience" }
                    ],
                    category: "problem-solving",
                    weight: 2
                },
                {
                    question: "What motivates you the most in your work?",
                    options: [
                        { value: "money", text: "Financial rewards and stability" },
                        { value: "impact", text: "Making a positive impact on others" },
                        { value: "recognition", text: "Recognition and achievement" },
                        { value: "learning", text: "Continuous learning and growth" },
                        { value: "creativity", text: "Creative expression and innovation" }
                    ],
                    category: "motivation",
                    weight: 1
                }
            ];
            
            await AssessmentQuestion.insertMany(defaultQuestions);
            console.log('Assessment questions initialized');
        }
    } catch (error) {
        console.error('Error initializing assessment questions:', error);
    }
};

// Initialize blogs
const initializeBlogs = async () => {
    try {
        const count = await Blog.countDocuments();
        if (count === 0) {
            const defaultBlogs = [
                {
                    title: "How to Choose the Right Career After 12th Standard",
                    excerpt: "Making the right career choice after 12th standard is crucial for your future success. Here's a comprehensive guide to help you make an informed decision.",
                    content: `
                        <h3>Understanding Your Options</h3>
                        <p>After completing 12th standard, students have numerous career paths to choose from. The key is to understand your interests, strengths, and the current market trends.</p>
                        
                        <h3>Popular Career Options</h3>
                        <ul>
                            <li><strong>Engineering:</strong> Various branches like Computer, Mechanical, Electrical, Civil</li>
                            <li><strong>Medical:</strong> MBBS, BDS, Nursing, Pharmacy</li>
                            <li><strong>Commerce:</strong> B.Com, CA, CS, BBA</li>
                            <li><strong>Arts:</strong> Journalism, Literature, Psychology, Sociology</li>
                            <li><strong>Design:</strong> Fashion, Interior, Graphic, Web Design</li>
                        </ul>
                        
                        <h3>Factors to Consider</h3>
                        <ol>
                            <li><strong>Interest:</strong> Choose a field that genuinely interests you</li>
                            <li><strong>Aptitude:</strong> Consider your natural abilities and strengths</li>
                            <li><strong>Market Demand:</strong> Research job opportunities and growth potential</li>
                            <li><strong>Financial Investment:</strong> Consider the cost of education and training</li>
                            <li><strong>Work-Life Balance:</strong> Think about the lifestyle you want</li>
                        </ol>
                    `,
                    category: "career-tips",
                    author: "Career Expert",
                    readTime: "5 min read",
                    featured: true,
                    tags: ["career-choice", "12th-standard", "guidance"]
                },
                {
                    title: "Latest Updates on MHT-CET 2024",
                    excerpt: "Stay updated with the latest information about MHT-CET 2024 including important dates, exam pattern, and preparation tips.",
                    content: `
                        <h3>MHT-CET 2024 Overview</h3>
                        <p>The Maharashtra Common Entrance Test (MHT-CET) is a state-level entrance examination for admission to various professional courses in Maharashtra.</p>
                        
                        <h3>Important Dates</h3>
                        <ul>
                            <li><strong>Application Start Date:</strong> January 2024</li>
                            <li><strong>Application End Date:</strong> March 2024</li>
                            <li><strong>Admit Card Release:</strong> April 2024</li>
                            <li><strong>Exam Date:</strong> May 2024</li>
                            <li><strong>Result Declaration:</strong> June 2024</li>
                        </ul>
                        
                        <h3>Exam Pattern</h3>
                        <p>The exam consists of three sections:</p>
                        <ul>
                            <li><strong>Physics:</strong> 50 questions (50 marks)</li>
                            <li><strong>Chemistry:</strong> 50 questions (50 marks)</li>
                            <li><strong>Mathematics:</strong> 50 questions (50 marks)</li>
                        </ul>
                    `,
                    category: "exam-updates",
                    author: "Exam Expert",
                    readTime: "4 min read",
                    featured: false,
                    tags: ["mht-cet", "entrance-exam", "maharashtra"]
                },
                {
                    title: "Effective Study Techniques for Competitive Exams",
                    excerpt: "Discover proven study techniques that can help you excel in competitive exams and achieve your academic goals.",
                    content: `
                        <h3>The Power of Active Learning</h3>
                        <p>Active learning involves engaging with the material rather than passively reading or listening. This approach helps in better retention and understanding.</p>
                        
                        <h3>Effective Study Techniques</h3>
                        <ol>
                            <li><strong>Pomodoro Technique:</strong> Study for 25 minutes, then take a 5-minute break</li>
                            <li><strong>Spaced Repetition:</strong> Review material at increasing intervals</li>
                            <li><strong>Mind Mapping:</strong> Create visual diagrams to connect concepts</li>
                            <li><strong>Practice Testing:</strong> Test yourself regularly on the material</li>
                            <li><strong>Teaching Others:</strong> Explain concepts to friends or family</li>
                        </ol>
                        
                        <h3>Time Management</h3>
                        <p>Effective time management is crucial for exam preparation:</p>
                        <ul>
                            <li>Create a study schedule</li>
                            <li>Prioritize difficult topics</li>
                            <li>Allocate time for revision</li>
                            <li>Include breaks and rest periods</li>
                        </ul>
                    `,
                    category: "study-tips",
                    author: "Study Coach",
                    readTime: "6 min read",
                    featured: false,
                    tags: ["study-techniques", "exam-preparation", "time-management"]
                },
                {
                    title: "Emerging Career Trends in 2024",
                    excerpt: "Explore the latest career trends and job opportunities that are shaping the future of work in 2024 and beyond.",
                    content: `
                        <h3>Technology-Driven Careers</h3>
                        <p>The technology sector continues to dominate with emerging fields like:</p>
                        <ul>
                            <li><strong>Artificial Intelligence:</strong> AI engineers, data scientists, ML specialists</li>
                            <li><strong>Cybersecurity:</strong> Security analysts, ethical hackers, security architects</li>
                            <li><strong>Blockchain:</strong> Blockchain developers, cryptocurrency experts</li>
                            <li><strong>Cloud Computing:</strong> Cloud architects, DevOps engineers</li>
                        </ul>
                        
                        <h3>Healthcare Innovations</h3>
                        <p>The healthcare sector is evolving with new opportunities:</p>
                        <ul>
                            <li>Telemedicine and digital health</li>
                            <li>Medical technology and devices</li>
                            <li>Mental health and wellness</li>
                            <li>Healthcare data analytics</li>
                        </ul>
                        
                        <h3>Sustainability and Green Jobs</h3>
                        <p>Environmental consciousness is creating new career paths:</p>
                        <ul>
                            <li>Renewable energy specialists</li>
                            <li>Environmental consultants</li>
                            <li>Sustainability managers</li>
                            <li>Green building architects</li>
                        </ul>
                    `,
                    category: "industry-news",
                    author: "Industry Analyst",
                    readTime: "7 min read",
                    featured: false,
                    tags: ["career-trends", "technology", "healthcare", "sustainability"]
                },
                {
                    title: "Success Stories: From Student to Professional",
                    excerpt: "Read inspiring stories of students who successfully transitioned from education to their dream careers.",
                    content: `
                        <h3>Story 1: Priya's Journey to Software Engineering</h3>
                        <p>Priya, a 12th standard student from Mumbai, always had a passion for technology. Despite facing financial constraints, she worked hard and secured admission to a top engineering college.</p>
                        
                        <p><strong>Her Strategy:</strong></p>
                        <ul>
                            <li>Focused on strong fundamentals in mathematics and science</li>
                            <li>Learned programming languages during summer breaks</li>
                            <li>Participated in coding competitions</li>
                            <li>Built a portfolio of projects</li>
                        </ul>
                        
                        <p>Today, Priya works as a senior software engineer at a leading tech company, earning a competitive salary and enjoying her work.</p>
                        
                        <h3>Story 2: Rahul's Path to Medical School</h3>
                        <p>Rahul dreamed of becoming a doctor since childhood. His journey was challenging but ultimately successful.</p>
                        
                        <p><strong>His Approach:</strong></p>
                        <ul>
                            <li>Maintained excellent academic performance</li>
                            <li>Prepared systematically for NEET</li>
                            <li>Volunteered at local hospitals</li>
                            <li>Stayed focused despite multiple attempts</li>
                        </ul>
                        
                        <p>Rahul is now a third-year medical student, well on his way to achieving his dream of becoming a cardiologist.</p>
                    `,
                    category: "inspiration",
                    author: "Career Counselor",
                    readTime: "8 min read",
                    featured: false,
                    tags: ["success-stories", "inspiration", "career-journey"]
                }
            ];
            
            await Blog.insertMany(defaultBlogs);
            console.log('Blogs initialized');
        }
    } catch (error) {
        console.error('Error initializing blogs:', error);
    }
};

// Initialize all data
app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    await initializeCareers();
    await initializeColleges();
    await initializeRoadmaps();
    await initializeAssessmentQuestions();
    await initializeBlogs();
}); 

// Get personalized roadmap
app.get('/api/roadmaps/personalized', authenticateToken, async (req, res) => {
    try {
        const { careerTitle, currentPosition } = req.query;
        
        let roadmap = await CareerRoadmap.findOne({
            careerTitle: { $regex: careerTitle, $options: 'i' },
            currentPosition: { $regex: currentPosition, $options: 'i' }
        });
        
        if (!roadmap) {
            // Try to find by career title only
            roadmap = await CareerRoadmap.findOne({
                careerTitle: { $regex: careerTitle, $options: 'i' }
            });
        }
        
        if (!roadmap) {
            return res.status(404).json({ message: 'Roadmap not found' });
        }
        
        res.json(roadmap);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Assessment Routes

// Get assessment questions
app.get('/api/assessment/questions', async (req, res) => {
    try {
        const questions = await AssessmentQuestion.find().sort({ category: 1, weight: -1 });
        res.json(questions);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Evaluate assessment
app.post('/api/assessment/evaluate', async (req, res) => {
    try {
        const { answers, userId } = req.body;
        
        // Simple scoring algorithm
        const scores = {
            technical: 0,
            creative: 0,
            social: 0,
            analytical: 0,
            business: 0
        };
        
        // Score based on answers
        Object.values(answers).forEach(answer => {
            switch(answer) {
                case 'science':
                case 'math':
                case 'technology':
                case 'analytical':
                case 'technical':
                    scores.technical += 2;
                    scores.analytical += 1;
                    break;
                case 'arts':
                case 'creative':
                case 'design':
                    scores.creative += 2;
                    break;
                case 'social':
                case 'communication':
                case 'team':
                case 'human':
                    scores.social += 2;
                    break;
                case 'commerce':
                case 'business':
                case 'money':
                case 'lead':
                    scores.business += 2;
                    break;
            }
        });
        
        // Generate personality type
        const maxScore = Math.max(...Object.values(scores));
        const personalityType = Object.keys(scores).find(key => scores[key] === maxScore);
        
        // Generate results
        const results = {
            personalityType,
            personalitySummary: getPersonalitySummary(personalityType),
            careerRecommendations: getCareerRecommendations(personalityType),
            skillsAnalysis: getSkillsAnalysis(scores),
            actionPlan: getActionPlan(personalityType)
        };
        
        // Save result if user is logged in
        if (userId) {
            const assessmentResult = new AssessmentResult({
                userId,
                answers,
                ...results
            });
            await assessmentResult.save();
        }
        
        res.json(results);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get user's assessment history
app.get('/api/assessment/history', authenticateToken, async (req, res) => {
    try {
        const results = await AssessmentResult.find({ userId: req.user.userId })
            .sort({ createdAt: -1 })
            .limit(10);
        res.json(results);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Blog Routes

// Get blogs with pagination and filters
app.get('/api/blogs', async (req, res) => {
    try {
        const { page = 1, limit = 10, category, search } = req.query;
        const skip = (page - 1) * limit;
        
        let query = {};
        
        if (category && category !== 'all') {
            query.category = category;
        }
        
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { excerpt: { $regex: search, $options: 'i' } },
                { content: { $regex: search, $options: 'i' } }
            ];
        }
        
        const blogs = await Blog.find(query)
            .sort({ featured: -1, date: -1 })
            .skip(skip)
            .limit(parseInt(limit));
            
        const total = await Blog.countDocuments(query);
        
        res.json({
            blogs,
            total,
            pages: Math.ceil(total / limit),
            currentPage: parseInt(page)
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get single blog
app.get('/api/blogs/:id', async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) {
            return res.status(404).json({ message: 'Blog not found' });
        }
        
        // Increment views
        blog.views += 1;
        await blog.save();
        
        res.json(blog);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Like a blog
app.post('/api/blogs/:id/like', async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) {
            return res.status(404).json({ message: 'Blog not found' });
        }
        
        blog.likes += 1;
        await blog.save();
        
        res.json({ likes: blog.likes });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Helper functions for assessment
function getPersonalitySummary(type) {
    const summaries = {
        technical: "You have a strong analytical mind and enjoy working with technology, systems, and data. You prefer structured environments where you can solve complex problems using logical thinking.",
        creative: "You are imaginative and innovative, with a natural talent for artistic expression and creative problem-solving. You thrive in environments that allow for creative freedom and expression.",
        social: "You are people-oriented and excel at communication, collaboration, and helping others. You enjoy working in teams and making a positive impact on people's lives.",
        analytical: "You have excellent problem-solving skills and enjoy analyzing data, patterns, and systems. You prefer work that requires critical thinking and logical reasoning.",
        business: "You are goal-oriented and have strong leadership potential. You enjoy strategic thinking, managing resources, and achieving measurable results."
    };
    return summaries[type] || summaries.technical;
}

function getCareerRecommendations(type) {
    const recommendations = {
        technical: [
            { career: "Software Engineer", score: 95, description: "Develop software applications and systems" },
            { career: "Data Scientist", score: 90, description: "Analyze and interpret complex data" },
            { career: "Mechanical Engineer", score: 85, description: "Design and build mechanical systems" },
            { career: "Network Administrator", score: 80, description: "Manage computer networks and systems" }
        ],
        creative: [
            { career: "Graphic Designer", score: 95, description: "Create visual designs and artwork" },
            { career: "Content Writer", score: 90, description: "Write engaging content for various platforms" },
            { career: "UI/UX Designer", score: 85, description: "Design user interfaces and experiences" },
            { career: "Marketing Specialist", score: 80, description: "Create marketing campaigns and strategies" }
        ],
        social: [
            { career: "Teacher", score: 95, description: "Educate and inspire students" },
            { career: "Human Resources Manager", score: 90, description: "Manage people and workplace culture" },
            { career: "Counselor", score: 85, description: "Help people with personal and professional issues" },
            { career: "Sales Representative", score: 80, description: "Build relationships and sell products" }
        ],
        analytical: [
            { career: "Research Analyst", score: 95, description: "Conduct research and analyze data" },
            { career: "Financial Analyst", score: 90, description: "Analyze financial data and trends" },
            { career: "Management Consultant", score: 85, description: "Solve business problems and improve processes" },
            { career: "Statistician", score: 80, description: "Collect and analyze statistical data" }
        ],
        business: [
            { career: "Business Manager", score: 95, description: "Lead and manage business operations" },
            { career: "Entrepreneur", score: 90, description: "Start and run your own business" },
            { career: "Project Manager", score: 85, description: "Plan and execute projects" },
            { career: "Marketing Manager", score: 80, description: "Develop and implement marketing strategies" }
        ]
    };
    return recommendations[type] || recommendations.technical;
}

function getSkillsAnalysis(scores) {
    const skills = [
        { name: "Technical Skills", level: scores.technical },
        { name: "Creative Thinking", level: scores.creative },
        { name: "Communication", level: scores.social },
        { name: "Analytical Thinking", level: scores.analytical },
        { name: "Leadership", level: scores.business }
    ];
    
    return skills.map(skill => ({
        name: skill.name,
        level: Math.min(100, (skill.level / 10) * 100),
        stars: Math.ceil((skill.level / 10) * 5)
    }));
}

function getActionPlan(type) {
    const plans = {
        technical: [
            { step: 1, title: "Learn Programming", description: "Start with Python or JavaScript to build technical skills" },
            { step: 2, title: "Get Certified", description: "Obtain relevant certifications in your chosen technical field" },
            { step: 3, title: "Build Projects", description: "Create a portfolio of technical projects to showcase your skills" },
            { step: 4, title: "Network", description: "Join technical communities and attend industry events" }
        ],
        creative: [
            { step: 1, title: "Build Portfolio", description: "Create a portfolio showcasing your creative work" },
            { step: 2, title: "Learn Tools", description: "Master industry-standard creative software and tools" },
            { step: 3, title: "Take Courses", description: "Enroll in creative design or art courses" },
            { step: 4, title: "Freelance", description: "Start with freelance projects to gain experience" }
        ],
        social: [
            { step: 1, title: "Volunteer", description: "Volunteer in community organizations to build people skills" },
            { step: 2, title: "Get Certified", description: "Obtain relevant certifications in counseling or HR" },
            { step: 3, title: "Practice Communication", description: "Join public speaking clubs or take communication courses" },
            { step: 4, title: "Gain Experience", description: "Seek internships or entry-level positions in people-oriented roles" }
        ],
        analytical: [
            { step: 1, title: "Learn Analytics", description: "Study data analysis tools and statistical methods" },
            { step: 2, title: "Get Certified", description: "Obtain certifications in data analysis or research methods" },
            { step: 3, title: "Practice Analysis", description: "Work on real-world analytical problems and case studies" },
            { step: 4, title: "Specialize", description: "Choose a specific field for analytical expertise" }
        ],
        business: [
            { step: 1, title: "Study Business", description: "Learn business fundamentals and management principles" },
            { step: 2, title: "Get Experience", description: "Seek internships or entry-level positions in business" },
            { step: 3, title: "Network", description: "Build professional relationships in the business community" },
            { step: 4, title: "Develop Leadership", description: "Take on leadership roles in projects or organizations" }
        ]
    };
    return plans[type] || plans.technical;
} 

// --- Chatbot API Route ---
app.post('/api/chatbot', async (req, res) => {
    const { message, user } = req.body;
    const openaiApiKey = process.env.OPENAI_API_KEY;

    if (!message || typeof message !== 'string') {
        return res.status(400).json({ reply: "Please provide a valid message." });
    }

    // If OpenAI API key is set, use OpenAI
    if (openaiApiKey) {
        try {
            const configuration = new Configuration({ apiKey: openaiApiKey });
            const openai = new OpenAIApi(configuration);

            const completion = await openai.createChatCompletion({
                model: "gpt-3.5-turbo",
                messages: [
                    { role: "system", content: "You are a helpful, friendly career guidance counselor for students in India. Give practical, positive, and actionable advice." },
                    { role: "user", content: message }
                ],
                max_tokens: 300,
                temperature: 0.7
            });

            const reply = completion.data.choices[0].message.content.trim();
            return res.json({ reply });
        } catch (err) {
            console.error("OpenAI error:", err.message);
            // Fallback to rules-based response below
        }
    }

    // Fallback: simple rules-based response
    let reply = "I'm here to help with your career questions! Please ask about courses, colleges, or career options.";
    if (/science/i.test(message)) reply = "After 12th science, you can consider engineering, medicine, pharmacy, pure sciences, or research. Would you like details on any of these?";
    else if (/data scientist/i.test(message)) reply = "To become a data scientist, focus on mathematics, statistics, programming (Python/R), and learn about machine learning. Consider BSc/BTech in CS, then a master's or certifications.";
    else if (/ui.?ux|design/i.test(message)) reply = "For UI/UX design, you can pursue courses in design, learn tools like Figma/Adobe XD, and build a portfolio. Many colleges offer B.Des or short-term certifications.";
    // Add more rules as needed

    res.json({ reply });
}); 