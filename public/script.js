// Global variables
let currentUser = null;
let careers = [];
let colleges = [];
let roadmaps = [];
let currentFilter = 'all';
let searchQuery = '';
let comparisonCareers = [];
let currentCollegeFilter = { region: 'all', type: 'all' };
let collegeSearchQuery = '';

// DOM Elements
const navToggle = document.getElementById('nav-toggle');
const navMenu = document.getElementById('nav-menu');
const authModal = document.getElementById('authModal');
const careerModal = document.getElementById('careerModal');
const collegeModal = document.getElementById('collegeModal');
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const getStartedBtn = document.getElementById('getStartedBtn');
const careersGrid = document.getElementById('careersGrid');
const collegesGrid = document.getElementById('collegesGrid');
const careerSearch = document.getElementById('careerSearch');
const collegeSearch = document.getElementById('collegeSearch');
const comparisonSection = document.getElementById('comparisonSection');
const comparisonGrid = document.getElementById('comparisonGrid');
const roadmapDisplay = document.getElementById('roadmapDisplay');

// API Base URL
const API_BASE_URL = 'http://localhost:3000/api';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Load careers data
    loadCareers();
    
    // Load colleges data
    loadColleges();
    
    // Load roadmaps data
    loadRoadmaps();
    
    // Set up event listeners
    setupEventListeners();
    
    // Check if user is already logged in
    checkAuthStatus();
}

function setupEventListeners() {
    // Mobile navigation toggle
    navToggle.addEventListener('click', toggleMobileMenu);
    
    // Authentication modal
    loginBtn.addEventListener('click', () => openAuthModal('login'));
    registerBtn.addEventListener('click', () => openAuthModal('register'));
    getStartedBtn.addEventListener('click', () => openAuthModal('register'));
    
    // Modal close buttons
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', closeModals);
    });
    
    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModals();
        }
    });
    
    // Authentication forms
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    
    // Tab switching in auth modal
    document.querySelectorAll('.tab-btn').forEach(tab => {
        tab.addEventListener('click', switchAuthTab);
    });
    
    // Career filters
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const level = e.target.dataset.level;
            filterCareers(level);
        });
    });
    
    // Search functionality
    if (careerSearch) {
        careerSearch.addEventListener('input', (e) => {
            searchQuery = e.target.value.toLowerCase();
            filterAndDisplayCareers();
        });
    }
    
    // College search functionality
    if (collegeSearch) {
        collegeSearch.addEventListener('input', (e) => {
            collegeSearchQuery = e.target.value.toLowerCase();
            filterAndDisplayColleges();
        });
    }
    
    // College filters
    document.querySelectorAll('.college-filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const filterType = e.target.dataset.region || e.target.dataset.type;
            const filterCategory = e.target.dataset.region ? 'region' : 'type';
            
            // Update active button
            document.querySelectorAll(`[data-${filterCategory}]`).forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            // Update filter
            currentCollegeFilter[filterCategory] = filterType;
            filterAndDisplayColleges();
        });
    });
    
    // Contact form
    document.querySelector('.contact-form').addEventListener('submit', handleContactForm);
    
    // Newsletter form
    document.querySelector('.newsletter-form').addEventListener('submit', handleNewsletter);
    
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Mobile Navigation
function toggleMobileMenu() {
    navMenu.classList.toggle('active');
    navToggle.classList.toggle('active');
}

// Authentication Functions
function openAuthModal(tab = 'login') {
    authModal.style.display = 'block';
    switchAuthTab({ target: document.querySelector(`[data-tab="${tab}"]`) });
}

function closeModals() {
    authModal.style.display = 'none';
    careerModal.style.display = 'none';
    collegeModal.style.display = 'none';
}

function switchAuthTab(e) {
    const targetTab = e.target.dataset.tab;
    
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');
    
    // Show/hide forms
    document.getElementById('loginForm').style.display = targetTab === 'login' ? 'block' : 'none';
    document.getElementById('registerForm').style.display = targetTab === 'register' ? 'block' : 'none';
}

async function handleLogin(e) {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    // Set loading state
    submitBtn.disabled = true;
    submitBtn.textContent = 'Loading...';
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Store token and user data
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            currentUser = data.user;
            
            showMessage('Login successful!', 'success');
            closeModals();
            updateAuthUI();
        } else {
            showMessage(data.message || 'Login failed', 'error');
        }
    } catch (error) {
        showMessage('Network error. Please try again.', 'error');
    } finally {
        // Reset button state
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    // Set loading state
    submitBtn.disabled = true;
    submitBtn.textContent = 'Loading...';
    
    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const grade = document.getElementById('registerGrade').value;
    const interests = document.getElementById('registerInterests').value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username,
                email,
                password,
                grade,
                interests: interests ? interests.split(',').map(i => i.trim()) : []
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Store token and user data
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            currentUser = data.user;
            
            showMessage('Registration successful!', 'success');
            closeModals();
            updateAuthUI();
        } else {
            showMessage(data.message || 'Registration failed', 'error');
        }
    } catch (error) {
        showMessage('Network error. Please try again.', 'error');
    } finally {
        // Reset button state
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

function checkAuthStatus() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
        currentUser = JSON.parse(user);
        updateAuthUI();
    }
}

function updateAuthUI() {
    if (currentUser) {
        // Replace auth buttons with user info
        const authButtons = document.querySelectorAll('.auth-btn');
        authButtons.forEach(btn => {
            if (btn.id === 'loginBtn') {
                btn.textContent = `Welcome, ${currentUser.username}`;
                btn.onclick = null;
            } else if (btn.id === 'registerBtn') {
                btn.textContent = 'Logout';
                btn.onclick = logout;
            }
        });
    } else {
        // Reset to original state
        loginBtn.textContent = 'Login';
        loginBtn.onclick = () => openAuthModal('login');
        registerBtn.textContent = 'Register';
        registerBtn.onclick = () => openAuthModal('register');
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    currentUser = null;
    updateAuthUI();
    showMessage('Logged out successfully', 'success');
}

// Career Functions
async function loadCareers() {
    try {
        showLoading(careersGrid);
        
        const response = await fetch(`${API_BASE_URL}/careers`);
        const data = await response.json();
        
        if (response.ok) {
            careers = data;
            displayCareers(careers);
        } else {
            showMessage('Failed to load careers', 'error');
        }
    } catch (error) {
        showMessage('Network error. Please try again.', 'error');
    }
}

function displayCareers(careersToShow) {
    if (!careersGrid) return;
    
    careersGrid.innerHTML = '';
    
    if (careersToShow.length === 0) {
        careersGrid.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <h3>No careers found</h3>
                <p>Try adjusting your filters or search terms</p>
            </div>
        `;
        return;
    }
    
    careersToShow.forEach(career => {
        const careerCard = document.createElement('div');
        careerCard.className = 'career-card';
        careerCard.innerHTML = `
            <div class="career-header">
                <div class="career-icon">
                    <i class="fas ${getCareerIcon(career.title)}"></i>
                </div>
                <div class="career-title-section">
                    <h3>${career.title}</h3>
                    <span class="education-level">After ${career.educationLevel}</span>
                </div>
                <button class="expand-btn" onclick="toggleCareerDetails(this)">
                    <i class="fas fa-chevron-down"></i>
                </button>
            </div>
            <div class="career-summary">
                <p>${career.description.substring(0, 150)}${career.description.length > 150 ? '...' : ''}</p>
                <div class="career-highlights">
                    <div class="highlight">
                        <i class="fas fa-clock"></i>
                        <span>${career.duration}</span>
                    </div>
                    <div class="highlight">
                        <i class="fas fa-money-bill-wave"></i>
                        <span>${career.salary}</span>
                    </div>
                </div>
            </div>
            <div class="career-details" style="display: none;">
                <div class="detail-section">
                    <h4><i class="fas fa-book"></i> Subjects Required</h4>
                    <div class="tags">
                        ${career.subjects.map(subject => `<span class="tag">${subject}</span>`).join('')}
                    </div>
                </div>
                <div class="detail-section">
                    <h4><i class="fas fa-tools"></i> Skills Needed</h4>
                    <div class="tags">
                        ${career.skills.map(skill => `<span class="tag">${skill}</span>`).join('')}
                    </div>
                </div>
                <div class="detail-section">
                    <h4><i class="fas fa-clipboard-check"></i> Requirements</h4>
                    <ul class="requirements-list">
                        ${career.requirements.map(req => `<li>${req}</li>`).join('')}
                    </ul>
                </div>
                <div class="detail-section">
                    <h4><i class="fas fa-briefcase"></i> Career Opportunities</h4>
                    <div class="opportunities-grid">
                        ${career.opportunities.map(opp => `<span class="opportunity">${opp}</span>`).join('')}
                    </div>
                </div>
                <div class="career-actions">
                    <button class="btn btn-primary" onclick="showCareerDetails('${career._id}')">
                        <i class="fas fa-info-circle"></i> Learn More
                    </button>
                    <button class="btn btn-secondary" onclick="saveCareer('${career._id}')">
                        <i class="fas fa-bookmark"></i> Save
                    </button>
                    <button class="btn btn-outline" onclick="addToComparison('${career._id}')">
                        <i class="fas fa-balance-scale"></i> Compare
                    </button>
                </div>
            </div>
        `;
        careersGrid.appendChild(careerCard);
    });
}

function toggleCareerDetails(button) {
    const careerCard = button.closest('.career-card');
    const details = careerCard.querySelector('.career-details');
    const icon = button.querySelector('i');
    
    if (details.style.display === 'none') {
        details.style.display = 'block';
        icon.className = 'fas fa-chevron-up';
        careerCard.classList.add('expanded');
    } else {
        details.style.display = 'none';
        icon.className = 'fas fa-chevron-down';
        careerCard.classList.remove('expanded');
    }
}

function getCareerIcon(careerTitle) {
    const iconMap = {
        'Engineering': 'fa-cogs',
        'Medical': 'fa-user-md',
        'Commerce': 'fa-chart-line',
        'Arts & Humanities': 'fa-palette',
        'ITI (Industrial Training Institute)': 'fa-wrench',
        'Polytechnic': 'fa-tools',
        'Hotel Management': 'fa-hotel',
        'Design': 'fa-paint-brush',
        'Law': 'fa-balance-scale',
        'Agriculture': 'fa-seedling',
        'Aviation': 'fa-plane',
        'Fashion Technology': 'fa-tshirt',
        'Media & Journalism': 'fa-newspaper',
        'Psychology': 'fa-brain',
        'Environmental Science': 'fa-leaf'
    };
    return iconMap[careerTitle] || 'fa-graduation-cap';
}

function filterAndDisplayCareers() {
    let filteredCareers = careers;
    
    // Apply level filter
    if (currentFilter !== 'all') {
        filteredCareers = filteredCareers.filter(career => career.educationLevel === currentFilter);
    }
    
    // Apply search filter
    if (searchQuery) {
        filteredCareers = filteredCareers.filter(career => {
            const searchText = `${career.title} ${career.description} ${career.skills.join(' ')} ${career.subjects.join(' ')} ${career.opportunities.join(' ')}`.toLowerCase();
            return searchText.includes(searchQuery);
        });
    }
    
    displayCareers(filteredCareers);
}

function filterCareers(level) {
    currentFilter = level;
    
    // Update active filter button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    filterAndDisplayCareers();
}

function selectLevel(level) {
    filterCareers(level);
    scrollToSection('careers');
}

async function showCareerDetails(careerId) {
    const career = careers.find(c => c._id === careerId);
    if (!career) return;
    
    const modalContent = document.getElementById('careerDetailContent');
    modalContent.innerHTML = `
        <div class="career-detail-header">
            <h2 class="career-detail-title">${career.title}</h2>
            <p class="career-detail-level">After ${career.educationLevel}</p>
        </div>
        
        <div class="career-detail-section">
            <h3>Description</h3>
            <p>${career.description}</p>
        </div>
        
        <div class="career-detail-section">
            <h3>Key Information</h3>
            <div class="career-detail-grid">
                <div class="career-detail-item">
                    <h4>Duration</h4>
                    <p>${career.duration}</p>
                </div>
                <div class="career-detail-item">
                    <h4>Salary Range</h4>
                    <p>${career.salary}</p>
                </div>
                <div class="career-detail-item">
                    <h4>Education Level</h4>
                    <p>After ${career.educationLevel}</p>
                </div>
            </div>
        </div>
        
        <div class="career-detail-section">
            <h3>Subjects</h3>
            <ul class="career-detail-list">
                ${career.subjects.map(subject => `<li>${subject}</li>`).join('')}
            </ul>
        </div>
        
        <div class="career-detail-section">
            <h3>Required Skills</h3>
            <ul class="career-detail-list">
                ${career.skills.map(skill => `<li>${skill}</li>`).join('')}
            </ul>
        </div>
        
        <div class="career-detail-section">
            <h3>Requirements</h3>
            <ul class="career-detail-list">
                ${career.requirements.map(req => `<li>${req}</li>`).join('')}
            </ul>
        </div>
        
        <div class="career-detail-section">
            <h3>Career Opportunities</h3>
            <ul class="career-detail-list">
                ${career.opportunities.map(opp => `<li>${opp}</li>`).join('')}
            </ul>
        </div>
    `;
    
    careerModal.style.display = 'block';
}

// Utility Functions
function showMessage(message, type = 'success') {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());
    
    // Create new message
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    
    // Insert at the top of the body
    document.body.insertBefore(messageDiv, document.body.firstChild);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        messageDiv.remove();
    }, 5000);
}

function showLoading(container) {
    container.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
        </div>
    `;
}

function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// Form Handlers
function handleContactForm(e) {
    e.preventDefault();
    const name = e.target.querySelector('input[type="text"]').value;
    const email = e.target.querySelector('input[type="email"]').value;
    const message = e.target.querySelector('textarea').value;
    fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message })
    })
    .then(res => {
        if (res.ok) {
            showMessage('Thank you for your message! We will get back to you soon.', 'success');
            e.target.reset();
        } else {
            showMessage('Failed to send message. Please try again.', 'error');
        }
    })
    .catch(() => {
        showMessage('Network error. Please try again.', 'error');
    });
}

function handleNewsletter(e) {
    e.preventDefault();
    const email = e.target.querySelector('input[type="email"]').value;
    showMessage(`Thank you for subscribing with ${email}!`, 'success');
    e.target.reset();
}

// Search functionality
function searchCareers(query) {
    if (!query.trim()) {
        displayCareers(careers);
        return;
    }
    
    const filteredCareers = careers.filter(career => 
        career.title.toLowerCase().includes(query.toLowerCase()) ||
        career.description.toLowerCase().includes(query.toLowerCase()) ||
        career.skills.some(skill => skill.toLowerCase().includes(query.toLowerCase()))
    );
    
    displayCareers(filteredCareers);
}

// Add search functionality to the page
function addSearchFunctionality() {
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Search careers...';
    searchInput.className = 'search-input';
    searchInput.style.cssText = `
        width: 100%;
        max-width: 400px;
        padding: 0.75rem 1rem;
        border: 2px solid #e5e7eb;
        border-radius: 25px;
        margin-bottom: 2rem;
        font-family: inherit;
        transition: border-color 0.3s ease;
    `;
    
    searchInput.addEventListener('input', (e) => {
        searchCareers(e.target.value);
    });
    
    // Insert search input before careers grid
    const careersSection = document.querySelector('.careers .container');
    careersSection.insertBefore(searchInput, careersGrid);
}

// Initialize search functionality
document.addEventListener('DOMContentLoaded', function() {
    addSearchFunctionality();
});

// Add some interactive animations
function addAnimations() {
    // Animate elements on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    document.querySelectorAll('.career-card, .feature-card, .level-card').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}

// Initialize animations
document.addEventListener('DOMContentLoaded', function() {
    addAnimations();
});

// Add keyboard navigation for modals
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeModals();
    }
});

// Add smooth scrolling for all internal links
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                const offsetTop = targetElement.offsetTop - 80; // Account for fixed navbar
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
});

// Add responsive navigation
function setupResponsiveNav() {
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                navMenu.classList.remove('active');
                navToggle.classList.remove('active');
            }
        });
    });
}

// Initialize responsive navigation
document.addEventListener('DOMContentLoaded', function() {
    setupResponsiveNav();
});

// Add career recommendation based on user interests
function getCareerRecommendations() {
    if (!currentUser || !currentUser.interests) return [];
    
    const userInterests = currentUser.interests.map(interest => interest.toLowerCase());
    
    return careers.filter(career => 
        career.skills.some(skill => 
            userInterests.some(interest => 
                skill.toLowerCase().includes(interest) || 
                interest.includes(skill.toLowerCase())
            )
        )
    ).slice(0, 3);
}

// Display recommendations if user is logged in
function displayRecommendations() {
    if (!currentUser) return;
    
    const recommendations = getCareerRecommendations();
    if (recommendations.length === 0) return;
    
    const recommendationsSection = document.createElement('section');
    recommendationsSection.className = 'recommendations';
    recommendationsSection.innerHTML = `
        <div class="container">
            <h2>Recommended for You</h2>
            <div class="careers-grid">
                ${recommendations.map(career => `
                    <div class="career-card recommended" onclick="showCareerDetails('${career._id}')">
                        <div class="career-header">
                            <h3 class="career-title">${career.title}</h3>
                            <p class="career-level">After ${career.educationLevel}</p>
                        </div>
                        <div class="career-body">
                            <p class="career-description">${career.description}</p>
                            <button class="view-details">View Details</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    // Insert after education levels section
    const educationSection = document.querySelector('.education-levels');
    educationSection.parentNode.insertBefore(recommendationsSection, educationSection.nextSibling);
}

// Initialize recommendations
document.addEventListener('DOMContentLoaded', function() {
    // Check for recommendations after a short delay to ensure user data is loaded
    setTimeout(displayRecommendations, 1000);
});

function addToComparison(careerId) {
    const career = careers.find(c => c._id === careerId);
    if (!career) return;
    
    if (comparisonCareers.length >= 3) {
        showMessage('You can compare up to 3 careers at a time. Remove one to add another.', 'error');
        return;
    }
    
    if (comparisonCareers.find(c => c._id === careerId)) {
        showMessage('This career is already in your comparison.', 'error');
        return;
    }
    
    comparisonCareers.push(career);
    updateComparisonSection();
    showMessage(`${career.title} added to comparison`, 'success');
}

function removeFromComparison(careerId) {
    comparisonCareers = comparisonCareers.filter(c => c._id !== careerId);
    updateComparisonSection();
}

function clearComparison() {
    comparisonCareers = [];
    updateComparisonSection();
    showMessage('Comparison cleared', 'success');
}

function updateComparisonSection() {
    if (comparisonCareers.length === 0) {
        comparisonSection.style.display = 'none';
        return;
    }
    
    comparisonSection.style.display = 'block';
    comparisonGrid.innerHTML = comparisonCareers.map(career => `
        <div class="comparison-card">
            <div class="comparison-header">
                <h4>${career.title}</h4>
                <button class="remove-comparison" onclick="removeFromComparison('${career._id}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="comparison-content">
                <div class="comparison-item">
                    <strong>Duration:</strong> ${career.duration}
                </div>
                <div class="comparison-item">
                    <strong>Salary:</strong> ${career.salary}
                </div>
                <div class="comparison-item">
                    <strong>Subjects:</strong> ${career.subjects.slice(0, 3).join(', ')}${career.subjects.length > 3 ? '...' : ''}
                </div>
                <div class="comparison-item">
                    <strong>Skills:</strong> ${career.skills.slice(0, 3).join(', ')}${career.skills.length > 3 ? '...' : ''}
                </div>
            </div>
        </div>
    `).join('');
}

function saveCareer(careerId) {
    if (!currentUser) {
        showMessage('Please login to save careers', 'error');
        return;
    }
    
    const savedCareers = JSON.parse(localStorage.getItem('savedCareers') || '[]');
    const career = careers.find(c => c._id === careerId);
    
    if (savedCareers.find(c => c._id === careerId)) {
        showMessage('Career already saved', 'error');
        return;
    }
    
    savedCareers.push(career);
    localStorage.setItem('savedCareers', JSON.stringify(savedCareers));
    showMessage(`${career.title} saved to your list`, 'success');
}

// College Functions
async function loadColleges() {
    try {
        const response = await fetch(`${API_BASE_URL}/colleges`);
        if (response.ok) {
            colleges = await response.json();
            displayColleges(colleges);
        } else {
            console.error('Failed to load colleges');
        }
    } catch (error) {
        console.error('Error loading colleges:', error);
    }
}

function displayColleges(collegesToShow) {
    if (!collegesGrid) return;
    
    collegesGrid.innerHTML = '';
    
    if (collegesToShow.length === 0) {
        collegesGrid.innerHTML = `
            <div class="no-results">
                <i class="fas fa-university"></i>
                <h3>No colleges found</h3>
                <p>Try adjusting your filters or search terms</p>
            </div>
        `;
        return;
    }
    
    collegesToShow.forEach(college => {
        const collegeCard = document.createElement('div');
        collegeCard.className = 'college-card';
        collegeCard.innerHTML = `
            <div class="college-header">
                <div class="college-badge ${college.type.toLowerCase()}">
                    <span>${college.type}</span>
                </div>
                <div class="college-rank">
                    <i class="fas fa-trophy"></i>
                    <span>NIRF Rank: ${college.nirfRank || 'N/A'}</span>
                </div>
            </div>
            <div class="college-content">
                <h3 class="college-name">${college.name}</h3>
                <div class="college-location">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${college.location}, ${college.region}</span>
                </div>
                <div class="college-established">
                    <i class="fas fa-calendar"></i>
                    <span>Established: ${college.established}</span>
                </div>
                <div class="college-highlights">
                    <div class="highlight">
                        <i class="fas fa-graduation-cap"></i>
                        <span>${college.specializations.length} Specializations</span>
                    </div>
                    <div class="highlight">
                        <i class="fas fa-money-bill-wave"></i>
                        <span>Avg: ${college.placement.averagePackage}</span>
                    </div>
                    <div class="highlight">
                        <i class="fas fa-percentage"></i>
                        <span>${college.placement.placementPercentage} Placement</span>
                    </div>
                </div>
                <div class="college-cutoffs">
                    <h4>MHT-CET Cutoffs (Previous Year)</h4>
                    <div class="cutoff-grid">
                        ${Object.entries(college.mhtcetCutoffs)
                            .filter(([_, cutoff]) => cutoff > 0)
                            .map(([branch, cutoff]) => `
                                <div class="cutoff-item">
                                    <span class="branch">${getBranchName(branch)}</span>
                                    <span class="cutoff">${cutoff}%</span>
                                </div>
                            `).join('')}
                    </div>
                </div>
            </div>
            <div class="college-actions">
                <button class="btn btn-primary" onclick="showCollegeDetails('${college._id}')">
                    <i class="fas fa-info-circle"></i> View Details
                </button>
                <button class="btn btn-secondary" onclick="saveCollege('${college._id}')">
                    <i class="fas fa-bookmark"></i> Save
                </button>
            </div>
        `;
        collegesGrid.appendChild(collegeCard);
    });
}

function getBranchName(branch) {
    const branchNames = {
        computer: 'Computer',
        mechanical: 'Mechanical',
        electrical: 'Electrical',
        civil: 'Civil',
        it: 'IT',
        ai: 'AI/ML',
        dataScience: 'Data Science'
    };
    return branchNames[branch] || branch;
}

function filterAndDisplayColleges() {
    let filteredColleges = colleges;
    
    // Apply region filter
    if (currentCollegeFilter.region !== 'all') {
        filteredColleges = filteredColleges.filter(college => college.region === currentCollegeFilter.region);
    }
    
    // Apply type filter
    if (currentCollegeFilter.type !== 'all') {
        filteredColleges = filteredColleges.filter(college => college.type === currentCollegeFilter.type);
    }
    
    // Apply search filter
    if (collegeSearchQuery) {
        filteredColleges = filteredColleges.filter(college => 
            college.name.toLowerCase().includes(collegeSearchQuery.toLowerCase()) ||
            college.location.toLowerCase().includes(collegeSearchQuery.toLowerCase())
        );
    }
    
    displayColleges(filteredColleges);
}

async function showCollegeDetails(collegeId) {
    try {
        const response = await fetch(`${API_BASE_URL}/college/${collegeId}`);
        if (response.ok) {
            const college = await response.json();
            displayCollegeModal(college);
        } else {
            showMessage('Failed to load college details', 'error');
        }
    } catch (error) {
        showMessage('Error loading college details', 'error');
    }
}

function displayCollegeModal(college) {
    const content = document.getElementById('collegeDetailContent');
    content.innerHTML = `
        <div class="college-detail-header">
            <h2>${college.name}</h2>
            <div class="college-meta">
                <span class="college-type ${college.type.toLowerCase()}">${college.type}</span>
                <span class="college-rank">NIRF Rank: ${college.nirfRank || 'N/A'}</span>
            </div>
        </div>
        
        <div class="college-detail-content">
            <div class="detail-section">
                <h3><i class="fas fa-map-marker-alt"></i> Location & Contact</h3>
                <p><strong>Address:</strong> ${college.address}</p>
                <p><strong>Contact:</strong> ${college.contact}</p>
                <p><strong>Website:</strong> <a href="${college.website}" target="_blank">${college.website}</a></p>
                <p><strong>Established:</strong> ${college.established}</p>
            </div>
            
            <div class="detail-section">
                <h3><i class="fas fa-graduation-cap"></i> Specializations</h3>
                <div class="specializations-grid">
                    ${college.specializations.map(spec => `<span class="specialization">${spec}</span>`).join('')}
                </div>
            </div>
            
            <div class="detail-section">
                <h3><i class="fas fa-chart-line"></i> MHT-CET Cutoffs (Previous Year)</h3>
                <div class="cutoffs-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Branch</th>
                                <th>Cutoff (%)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${Object.entries(college.mhtcetCutoffs)
                                .filter(([_, cutoff]) => cutoff > 0)
                                .map(([branch, cutoff]) => `
                                    <tr>
                                        <td>${getBranchName(branch)}</td>
                                        <td>${cutoff}%</td>
                                    </tr>
                                `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div class="detail-section">
                <h3><i class="fas fa-money-bill-wave"></i> Fee Structure</h3>
                <div class="fees-grid">
                    <div class="fee-item">
                        <span class="fee-type">Government Quota</span>
                        <span class="fee-amount">${college.fees.government}</span>
                    </div>
                    <div class="fee-item">
                        <span class="fee-type">Private Quota</span>
                        <span class="fee-amount">${college.fees.private}</span>
                    </div>
                    <div class="fee-item">
                        <span class="fee-type">NRI Quota</span>
                        <span class="fee-amount">${college.fees.nri}</span>
                    </div>
                </div>
            </div>
            
            <div class="detail-section">
                <h3><i class="fas fa-briefcase"></i> Placement Information</h3>
                <div class="placement-grid">
                    <div class="placement-item">
                        <span class="placement-label">Average Package</span>
                        <span class="placement-value">${college.placement.averagePackage}</span>
                    </div>
                    <div class="placement-item">
                        <span class="placement-label">Highest Package</span>
                        <span class="placement-value">${college.placement.highestPackage}</span>
                    </div>
                    <div class="placement-item">
                        <span class="placement-label">Placement Percentage</span>
                        <span class="placement-value">${college.placement.placementPercentage}</span>
                    </div>
                </div>
                <div class="recruiters">
                    <h4>Top Recruiters</h4>
                    <div class="recruiters-grid">
                        ${college.placement.topRecruiters.map(recruiter => `<span class="recruiter">${recruiter}</span>`).join('')}
                    </div>
                </div>
            </div>
            
            <div class="detail-section">
                <h3><i class="fas fa-clipboard-list"></i> Admission Process</h3>
                <ol class="process-list">
                    ${college.admissionProcess.map(step => `<li>${step}</li>`).join('')}
                </ol>
            </div>
            
            <div class="detail-section">
                <h3><i class="fas fa-file-alt"></i> Required Documents</h3>
                <ul class="documents-list">
                    ${college.documents.map(doc => `<li>${doc}</li>`).join('')}
                </ul>
            </div>
            
            <div class="detail-section">
                <h3><i class="fas fa-calendar-alt"></i> Important Dates</h3>
                <ul class="dates-list">
                    ${college.importantDates.map(date => `<li>${date}</li>`).join('')}
                </ul>
            </div>
            
            <div class="detail-section">
                <h3><i class="fas fa-building"></i> Facilities</h3>
                <div class="facilities-grid">
                    ${college.facilities.map(facility => `<span class="facility">${facility}</span>`).join('')}
                </div>
            </div>
        </div>
    `;
    
    collegeModal.style.display = 'block';
}

function saveCollege(collegeId) {
    if (!currentUser) {
        showMessage('Please login to save colleges', 'error');
        return;
    }
    
    const savedColleges = JSON.parse(localStorage.getItem('savedColleges') || '[]');
    const college = colleges.find(c => c._id === collegeId);
    
    if (savedColleges.find(c => c._id === collegeId)) {
        showMessage('College already saved', 'error');
        return;
    }
    
    savedColleges.push(college);
    localStorage.setItem('savedColleges', JSON.stringify(savedColleges));
    showMessage(`${college.name} saved to your list`, 'success');
}

// Roadmap Functions
async function loadRoadmaps() {
    try {
        const response = await fetch(`${API_BASE_URL}/roadmaps`);
        if (response.ok) {
            roadmaps = await response.json();
        } else {
            console.error('Failed to load roadmaps');
        }
    } catch (error) {
        console.error('Error loading roadmaps:', error);
    }
}

async function generateRoadmap() {
    const currentPosition = document.getElementById('currentPosition').value;
    const careerGoal = document.getElementById('careerGoal').value;
    
    if (!currentPosition || !careerGoal) {
        showMessage('Please select both current position and career goal', 'error');
        return;
    }
    
    console.log('Generating roadmap for:', { currentPosition, careerGoal });
    
    try {
        // First try personalized endpoint
        const response = await fetch(`${API_BASE_URL}/roadmaps/personalized`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                careerTitle: careerGoal,
                currentPosition: currentPosition
            })
        });
        
        console.log('Response status:', response.status);
        
        if (response.ok) {
            const roadmap = await response.json();
            console.log('Roadmap data:', roadmap);
            displayRoadmap(roadmap);
        } else {
            // Fallback: try to find roadmap by career title only
            console.log('Personalized endpoint failed, trying general endpoint...');
            const generalResponse = await fetch(`${API_BASE_URL}/roadmaps/${careerGoal}`);
            
            if (generalResponse.ok) {
                const roadmap = await generalResponse.json();
                console.log('Found roadmap via general endpoint:', roadmap);
                displayRoadmap(roadmap);
            } else {
                const errorData = await response.json();
                console.log('Error data:', errorData);
                showMessage('Roadmap not found for this combination. Try different options.', 'error');
            }
        }
    } catch (error) {
        console.error('Error generating roadmap:', error);
        showMessage('Error generating roadmap', 'error');
    }
}

function displayRoadmap(roadmap) {
    // Update roadmap header
    document.getElementById('roadmapTitle').textContent = `Roadmap: ${roadmap.currentPosition} → ${roadmap.targetPosition}`;
    document.getElementById('roadmapDuration').textContent = roadmap.estimatedDuration;
    document.getElementById('roadmapSuccessRate').textContent = roadmap.successRate;
    document.getElementById('roadmapDifficulty').textContent = roadmap.difficulty;
    document.getElementById('roadmapInvestment').textContent = roadmap.investment;
    
    // Display prerequisites
    const prerequisitesList = document.getElementById('prerequisitesList');
    prerequisitesList.innerHTML = roadmap.prerequisites.map(prereq => 
        `<div class="prerequisite-item">
            <i class="fas fa-check-circle"></i>
            <span>${prereq}</span>
        </div>`
    ).join('');
    
    // Display roadmap steps
    const roadmapSteps = document.getElementById('roadmapSteps');
    roadmapSteps.innerHTML = roadmap.roadmap.map(step => `
        <div class="roadmap-step">
            <div class="step-header">
                <div class="step-number">${step.stepNumber}</div>
                <div class="step-info">
                    <h4>${step.title}</h4>
                    <div class="step-meta">
                        <span class="step-duration"><i class="fas fa-clock"></i> ${step.duration}</span>
                    </div>
                </div>
                <button class="step-toggle" onclick="toggleStepDetails(this)">
                    <i class="fas fa-chevron-down"></i>
                </button>
            </div>
            <div class="step-description">
                <p>${step.description}</p>
            </div>
            <div class="step-details" style="display: none;">
                <div class="detail-section">
                    <h5><i class="fas fa-clipboard-list"></i> Requirements</h5>
                    <ul>
                        ${step.requirements.map(req => `<li>${req}</li>`).join('')}
                    </ul>
                </div>
                <div class="detail-section">
                    <h5><i class="fas fa-tasks"></i> Tasks</h5>
                    <ul>
                        ${step.tasks.map(task => `<li>${task}</li>`).join('')}
                    </ul>
                </div>
                <div class="detail-section">
                    <h5><i class="fas fa-file-alt"></i> Exams</h5>
                    <ul>
                        ${step.exams.map(exam => `<li>${exam}</li>`).join('')}
                    </ul>
                </div>
                <div class="detail-section">
                    <h5><i class="fas fa-lightbulb"></i> Tips</h5>
                    <ul>
                        ${step.tips.map(tip => `<li>${tip}</li>`).join('')}
                    </ul>
                </div>
            </div>
        </div>
    `).join('');
    
    // Display alternatives
    const alternativesList = document.getElementById('alternativesList');
    alternativesList.innerHTML = roadmap.alternatives.map(alt => 
        `<div class="alternative-item">
            <i class="fas fa-route"></i>
            <span>${alt}</span>
        </div>`
    ).join('');
    
    // Show roadmap display
    roadmapDisplay.style.display = 'block';
    
    // Scroll to roadmap
    document.getElementById('roadmap').scrollIntoView({ behavior: 'smooth' });
}

function toggleStepDetails(button) {
    const stepDetails = button.closest('.roadmap-step').querySelector('.step-details');
    const icon = button.querySelector('i');
    
    if (stepDetails.style.display === 'none') {
        stepDetails.style.display = 'block';
        icon.className = 'fas fa-chevron-up';
    } else {
        stepDetails.style.display = 'none';
        icon.className = 'fas fa-chevron-down';
    }
}

// Career Assessment Variables
let assessmentQuestions = [];
let currentQuestionIndex = 0;
let assessmentAnswers = {};
let blogs = [];
let currentBlogPage = 1;
let currentBlogCategory = 'all';
let blogSearchQuery = '';

// Assessment Functions
async function loadAssessmentQuestions() {
    try {
        const response = await fetch(`${API_BASE_URL}/assessment/questions`);
        if (response.ok) {
            assessmentQuestions = await response.json();
        } else {
            assessmentQuestions = getDefaultQuestions();
        }
    } catch (error) {
        console.error('Error loading assessment questions:', error);
        assessmentQuestions = getDefaultQuestions();
    }
}

function getDefaultQuestions() {
    return [
        {
            id: 1,
            question: "What subjects do you enjoy studying the most?",
            options: [
                { value: "science", text: "Science (Physics, Chemistry, Biology)" },
                { value: "math", text: "Mathematics and Logic" },
                { value: "arts", text: "Arts and Literature" },
                { value: "commerce", text: "Commerce and Business" },
                { value: "technology", text: "Technology and Computers" }
            ]
        },
        {
            id: 2,
            question: "How do you prefer to spend your free time?",
            options: [
                { value: "creative", text: "Creating something (art, music, writing)" },
                { value: "social", text: "Spending time with friends and family" },
                { value: "analytical", text: "Solving puzzles and problems" },
                { value: "physical", text: "Sports and physical activities" },
                { value: "learning", text: "Reading and learning new things" }
            ]
        },
        {
            id: 3,
            question: "What type of work environment appeals to you most?",
            options: [
                { value: "office", text: "Structured office environment" },
                { value: "creative", text: "Creative and flexible workspace" },
                { value: "outdoor", text: "Outdoor and field work" },
                { value: "lab", text: "Laboratory or research setting" },
                { value: "remote", text: "Remote work from anywhere" }
            ]
        },
        {
            id: 4,
            question: "How do you handle challenges and problems?",
            options: [
                { value: "analytical", text: "Analyze the problem step by step" },
                { value: "creative", text: "Think of creative solutions" },
                { value: "collaborative", text: "Work with others to solve it" },
                { value: "research", text: "Research and gather information" },
                { value: "intuitive", text: "Follow my intuition and experience" }
            ]
        },
        {
            id: 5,
            question: "What motivates you the most in your work?",
            options: [
                { value: "money", text: "Financial rewards and stability" },
                { value: "impact", text: "Making a positive impact on others" },
                { value: "recognition", text: "Recognition and achievement" },
                { value: "learning", text: "Continuous learning and growth" },
                { value: "creativity", text: "Creative expression and innovation" }
            ]
        }
    ];
}

function startAssessment() {
    document.querySelector('.assessment-intro').style.display = 'none';
    document.getElementById('assessmentQuiz').style.display = 'block';
    currentQuestionIndex = 0;
    assessmentAnswers = {};
    displayQuestion();
}

function displayQuestion() {
    if (currentQuestionIndex >= assessmentQuestions.length) {
        submitAssessment();
        return;
    }

    const question = assessmentQuestions[currentQuestionIndex];
    document.getElementById('questionText').textContent = question.question;
    document.getElementById('currentQuestion').textContent = currentQuestionIndex + 1;
    document.getElementById('totalQuestions').textContent = assessmentQuestions.length;
    
    // Update progress bar
    const progress = ((currentQuestionIndex + 1) / assessmentQuestions.length) * 100;
    document.getElementById('progressFill').style.width = progress + '%';
    
    // Display options
    const optionsContainer = document.getElementById('questionOptions');
    optionsContainer.innerHTML = '';
    
    question.options.forEach(option => {
        const optionBtn = document.createElement('div');
        optionBtn.className = 'option-btn';
        optionBtn.innerHTML = `
            <input type="radio" name="question${question.id}" value="${option.value}" id="option${option.value}">
            <label for="option${option.value}">${option.text}</label>
        `;
        
        optionBtn.addEventListener('click', () => selectOption(option.value));
        optionsContainer.appendChild(optionBtn);
    });
    
    // Update navigation buttons
    document.getElementById('prevBtn').disabled = currentQuestionIndex === 0;
    document.getElementById('nextBtn').style.display = currentQuestionIndex === assessmentQuestions.length - 1 ? 'none' : 'inline-block';
    document.getElementById('submitBtn').style.display = currentQuestionIndex === assessmentQuestions.length - 1 ? 'inline-block' : 'none';
    
    // Pre-select if answer exists
    if (assessmentAnswers[question.id]) {
        const radio = document.querySelector(`input[value="${assessmentAnswers[question.id]}"]`);
        if (radio) {
            radio.checked = true;
            radio.closest('.option-btn').classList.add('selected');
        }
    }
}

function selectOption(value) {
    const question = assessmentQuestions[currentQuestionIndex];
    assessmentAnswers[question.id] = value;
    
    // Update UI
    document.querySelectorAll('.option-btn').forEach(btn => btn.classList.remove('selected'));
    event.target.closest('.option-btn').classList.add('selected');
}

function nextQuestion() {
    const question = assessmentQuestions[currentQuestionIndex];
    const selectedOption = document.querySelector(`input[name="question${question.id}"]:checked`);
    
    if (!selectedOption) {
        showMessage('Please select an option before proceeding', 'error');
        return;
    }
    
    currentQuestionIndex++;
    displayQuestion();
}

function previousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        displayQuestion();
    }
}

async function submitAssessment() {
    try {
        const response = await fetch(`${API_BASE_URL}/assessment/evaluate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ answers: assessmentAnswers })
        });
        
        let results;
        if (response.ok) {
            results = await response.json();
        } else {
            results = generateAssessmentResults(assessmentAnswers);
        }
        
        displayAssessmentResults(results);
    } catch (error) {
        console.error('Error submitting assessment:', error);
        const results = generateAssessmentResults(assessmentAnswers);
        displayAssessmentResults(results);
    }
}

function generateAssessmentResults(answers) {
    const scores = {
        technical: 0,
        creative: 0,
        social: 0,
        analytical: 0,
        business: 0
    };
    
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
    
    const maxScore = Math.max(...Object.values(scores));
    const personalityType = Object.keys(scores).find(key => scores[key] === maxScore);
    
    const personalitySummaries = {
        technical: "You have a strong analytical mind and enjoy working with technology, systems, and data. You prefer structured environments where you can solve complex problems using logical thinking.",
        creative: "You are imaginative and innovative, with a natural talent for artistic expression and creative problem-solving. You thrive in environments that allow for creative freedom and expression.",
        social: "You are people-oriented and excel at communication, collaboration, and helping others. You enjoy working in teams and making a positive impact on people's lives.",
        analytical: "You have excellent problem-solving skills and enjoy analyzing data, patterns, and systems. You prefer work that requires critical thinking and logical reasoning.",
        business: "You are goal-oriented and have strong leadership potential. You enjoy strategic thinking, managing resources, and achieving measurable results."
    };
    
    return {
        personalityType,
        personalitySummary: personalitySummaries[personalityType],
        careerRecommendations: getCareerRecommendationsByType(personalityType),
        skillsAnalysis: generateSkillsAnalysis(scores),
        actionPlan: generateActionPlan(personalityType)
    };
}

function getCareerRecommendationsByType(type) {
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

function generateSkillsAnalysis(scores) {
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

function generateActionPlan(type) {
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

function displayAssessmentResults(results) {
    document.getElementById('assessmentQuiz').style.display = 'none';
    document.getElementById('assessmentResults').style.display = 'block';
    
    // Display personality summary
    document.getElementById('personalitySummary').innerHTML = `
        <p><strong>Personality Type:</strong> ${results.personalityType.charAt(0).toUpperCase() + results.personalityType.slice(1)}</p>
        <p>${results.personalitySummary}</p>
    `;
    
    // Display career recommendations
    const recommendationsHtml = results.careerRecommendations.map(career => `
        <div class="recommendation-card">
            <h5>${career.career}</h5>
            <p>${career.description}</p>
            <div class="recommendation-score">
                <div class="score-bar">
                    <div class="score-fill" style="width: ${career.score}%"></div>
                </div>
                <span class="score-text">${career.score}% Match</span>
            </div>
        </div>
    `).join('');
    document.getElementById('careerRecommendations').innerHTML = recommendationsHtml;
    
    // Display skills analysis
    const skillsHtml = results.skillsAnalysis.map(skill => `
        <div class="skill-item">
            <span class="skill-name">${skill.name}</span>
            <div class="skill-level">
                <span class="skill-stars">${'★'.repeat(skill.stars)}${'☆'.repeat(5 - skill.stars)}</span>
                <span class="skill-percentage">${Math.round(skill.level)}%</span>
            </div>
        </div>
    `).join('');
    document.getElementById('skillsAnalysis').innerHTML = skillsHtml;
    
    // Display action plan
    const planHtml = results.actionPlan.map(step => `
        <div class="plan-step">
            <div class="plan-step-number">${step.step}</div>
            <div class="plan-step-content">
                <h5>${step.title}</h5>
                <p>${step.description}</p>
            </div>
        </div>
    `).join('');
    document.getElementById('actionPlan').innerHTML = planHtml;
}

function retakeAssessment() {
    document.getElementById('assessmentResults').style.display = 'none';
    document.querySelector('.assessment-intro').style.display = 'grid';
    currentQuestionIndex = 0;
    assessmentAnswers = {};
}

function downloadReport() {
    const report = generateAssessmentReport();
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'career-assessment-report.txt';
    a.click();
    URL.revokeObjectURL(url);
}

function generateAssessmentReport() {
    const results = generateAssessmentResults(assessmentAnswers);
    return `
Career Assessment Report
========================

Personality Type: ${results.personalityType}
${results.personalitySummary}

Top Career Recommendations:
${results.careerRecommendations.map(career => `- ${career.career} (${career.score}% match): ${career.description}`).join('\n')}

Skills Analysis:
${results.skillsAnalysis.map(skill => `- ${skill.name}: ${Math.round(skill.level)}%`).join('\n')}

Action Plan:
${results.actionPlan.map(step => `${step.step}. ${step.title}: ${step.description}`).join('\n')}

Generated on: ${new Date().toLocaleDateString()}
    `;
}

function shareResults() {
    if (navigator.share) {
        navigator.share({
            title: 'My Career Assessment Results',
            text: 'Check out my career assessment results from CareerGuide!',
            url: window.location.href
        });
    } else {
        const results = generateAssessmentResults(assessmentAnswers);
        const shareText = `My Career Assessment Results:\nPersonality Type: ${results.personalityType}\nTop Recommendation: ${results.careerRecommendations[0].career}`;
        
        navigator.clipboard.writeText(shareText).then(() => {
            showMessage('Results copied to clipboard!', 'success');
        });
    }
}

// Blog Functions
async function loadBlogs() {
    try {
        const response = await fetch(`${API_BASE_URL}/blogs?page=${currentBlogPage}&category=${currentBlogCategory}&search=${blogSearchQuery}`);
        if (response.ok) {
            const data = await response.json();
            blogs = data.blogs || [];
            displayBlogs();
        } else {
            blogs = getDefaultBlogs();
            displayBlogs();
        }
    } catch (error) {
        console.error('Error loading blogs:', error);
        blogs = getDefaultBlogs();
        displayBlogs();
    }
}

function getDefaultBlogs() {
    return [
        {
            id: 1,
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
                
                <h3>Steps to Make the Right Choice</h3>
                <p>1. <strong>Self-Assessment:</strong> Evaluate your interests, skills, and values</p>
                <p>2. <strong>Research:</strong> Gather information about different careers</p>
                <p>3. <strong>Consult:</strong> Talk to professionals and career counselors</p>
                <p>4. <strong>Experience:</strong> Try internships or shadowing opportunities</p>
                <p>5. <strong>Decide:</strong> Make an informed decision based on your research</p>
                
                <h3>Conclusion</h3>
                <p>Choosing the right career is a significant decision that requires careful consideration. Take your time, do thorough research, and don't hesitate to seek guidance from experts.</p>
            `,
            category: "career-tips",
            author: "Career Expert",
            date: "2024-01-15",
            readTime: "5 min read",
            featured: true
        },
        {
            id: 2,
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
                
                <h3>Preparation Tips</h3>
                <ol>
                    <li>Focus on NCERT textbooks for basic concepts</li>
                    <li>Practice previous year question papers</li>
                    <li>Take regular mock tests</li>
                    <li>Manage your time effectively</li>
                    <li>Stay updated with current affairs</li>
                </ol>
            `,
            category: "exam-updates",
            author: "Exam Expert",
            date: "2024-01-10",
            readTime: "4 min read",
            featured: false
        },
        {
            id: 3,
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
                
                <h3>Healthy Study Habits</h3>
                <p>Maintain a healthy lifestyle during exam preparation:</p>
                <ul>
                    <li>Get adequate sleep (7-8 hours)</li>
                    <li>Exercise regularly</li>
                    <li>Eat nutritious meals</li>
                    <li>Stay hydrated</li>
                    <li>Take regular breaks</li>
                </ul>
            `,
            category: "study-tips",
            author: "Study Coach",
            date: "2024-01-08",
            readTime: "6 min read",
            featured: false
        },
        {
            id: 4,
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
                
                <h3>Remote Work Opportunities</h3>
                <p>The pandemic has accelerated remote work adoption:</p>
                <ul>
                    <li>Digital marketing specialists</li>
                    <li>Content creators and influencers</li>
                    <li>Virtual assistants</li>
                    <li>Online educators</li>
                </ul>
            `,
            category: "industry-news",
            author: "Industry Analyst",
            date: "2024-01-05",
            readTime: "7 min read",
            featured: false
        },
        {
            id: 5,
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
                
                <h3>Key Lessons</h3>
                <p>These success stories teach us important lessons:</p>
                <ol>
                    <li>Persistence and hard work pay off</li>
                    <li>Early planning and preparation are crucial</li>
                    <li>Building practical skills alongside academics</li>
                    <li>Staying motivated despite challenges</li>
                    <li>Seeking guidance and mentorship</li>
                </ol>
            `,
            category: "inspiration",
            author: "Career Counselor",
            date: "2024-01-03",
            readTime: "8 min read",
            featured: false
        }
    ];
}

function displayBlogs() {
    const blogsGrid = document.getElementById('blogsGrid');
    const featuredBlog = document.getElementById('featuredBlog');
    
    // Display featured blog
    const featured = blogs.find(blog => blog.featured);
    if (featured) {
        featuredBlog.innerHTML = `
            <div class="featured-blog-image">
                <i class="fas fa-star"></i>
            </div>
            <div class="featured-blog-content">
                <h3>${featured.title}</h3>
                <p>${featured.excerpt}</p>
                <div class="featured-blog-meta">
                    <span><i class="fas fa-user"></i> ${featured.author}</span>
                    <span><i class="fas fa-calendar"></i> ${new Date(featured.date).toLocaleDateString()}</span>
                    <span><i class="fas fa-clock"></i> ${featured.readTime}</span>
                    <span class="blog-detail-category">${featured.category.replace('-', ' ')}</span>
                </div>
                <button class="btn btn-primary" onclick="showBlogDetails(${featured.id})">
                    Read More
                </button>
            </div>
        `;
        featuredBlog.style.display = 'grid';
    } else {
        featuredBlog.style.display = 'none';
    }
    
    // Display regular blogs
    const regularBlogs = blogs.filter(blog => !blog.featured);
    blogsGrid.innerHTML = regularBlogs.map(blog => `
        <div class="blog-card" onclick="showBlogDetails(${blog.id})">
            <div class="blog-card-image">
                <i class="fas fa-newspaper"></i>
            </div>
            <div class="blog-card-content">
                <h3>${blog.title}</h3>
                <p>${blog.excerpt}</p>
                <div class="blog-card-meta">
                    <span class="category">${blog.category.replace('-', ' ')}</span>
                    <span class="date"><i class="fas fa-calendar"></i> ${new Date(blog.date).toLocaleDateString()}</span>
                </div>
            </div>
        </div>
    `).join('');
}

function showBlogDetails(blogId) {
    const blog = blogs.find(b => b.id === blogId);
    if (!blog) return;
    
    const content = document.getElementById('blogDetailContent');
    content.innerHTML = `
        <div class="blog-detail-header">
            <h2>${blog.title}</h2>
            <div class="blog-detail-meta">
                <span><i class="fas fa-user"></i> ${blog.author}</span>
                <span><i class="fas fa-calendar"></i> ${new Date(blog.date).toLocaleDateString()}</span>
                <span><i class="fas fa-clock"></i> ${blog.readTime}</span>
                <span class="blog-detail-category">${blog.category.replace('-', ' ')}</span>
            </div>
        </div>
        <div class="blog-detail-content">
            ${blog.content}
        </div>
    `;
    
    document.getElementById('blogModal').style.display = 'block';
}

function loadMoreBlogs() {
    currentBlogPage++;
    loadBlogs();
}

// Initialize assessment and blogs
document.addEventListener('DOMContentLoaded', function() {
    loadAssessmentQuestions();
    loadBlogs();
    
    // Blog category filter
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentBlogCategory = e.target.dataset.category;
            currentBlogPage = 1;
            loadBlogs();
        });
    });
    
    // Blog search
    const blogSearch = document.getElementById('blogSearch');
    if (blogSearch) {
        blogSearch.addEventListener('input', (e) => {
            blogSearchQuery = e.target.value;
            currentBlogPage = 1;
            loadBlogs();
        });
    }
});

// --- Ask a Mentor Module ---
async function loadMentorQuestions() {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE_URL}/mentor/questions`, {
    headers: token ? { 'Authorization': 'Bearer ' + token } : {}
  });
  const questions = await res.json();
  renderMentorQuestions(questions);
}

function renderMentorQuestions(questions) {
  const list = document.getElementById('mentorQuestionsList');
  list.innerHTML = questions.map(q => `
    <div class="mentor-question">
      <div class="mentor-question-q">
        <strong>Q:</strong> ${q.question}
        <span class="mentor-question-meta">Asked by: ${q.askedBy?.username || 'Student'} on ${new Date(q.createdAt).toLocaleDateString()}</span>
      </div>
      <div class="mentor-question-a">
        ${q.answer
          ? `<strong>A:</strong> ${q.answer} <span class="mentor-question-meta">Answered by: ${q.answeredBy?.username || 'Mentor'} on ${q.answeredAt ? new Date(q.answeredAt).toLocaleDateString() : ''}</span>`
          : (window.currentUser && window.currentUser.role === 'mentor'
              ? `<form class="mentor-answer-form" data-id="${q._id}">
                  <textarea required placeholder="Type your answer..."></textarea>
                  <button type="submit" class="btn btn-secondary">Submit Answer</button>
                </form>`
              : '<em>Awaiting mentor answer...</em>')}
      </div>
    </div>
  `).join('');
  // Attach answer form listeners
  document.querySelectorAll('.mentor-answer-form').forEach(form => {
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      const id = form.getAttribute('data-id');
      const answer = form.querySelector('textarea').value;
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/mentor/questions/${id}/answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ answer })
      });
      if (res.ok) {
        loadMentorQuestions();
      } else {
        alert('Failed to submit answer');
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', function() {
  // Show/hide ask form based on user role
  window.currentUser = JSON.parse(localStorage.getItem('user') || 'null');
  const askForm = document.getElementById('askMentorForm');
  const loginPrompt = document.getElementById('askMentorLoginPrompt');
  if (askForm && loginPrompt) {
    if (window.currentUser && window.currentUser.role === 'student') {
      askForm.style.display = '';
      loginPrompt.style.display = 'none';
    } else {
      askForm.style.display = 'none';
      loginPrompt.style.display = '';
    }
    // Ask question submit
    askForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      const question = document.getElementById('mentorQuestionInput').value.trim();
      if (!question) return;
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/mentor/questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ question })
      });
      if (res.ok) {
        document.getElementById('mentorQuestionInput').value = '';
        loadMentorQuestions();
      } else {
        alert('Failed to submit question');
      }
    });
  }
  loadMentorQuestions();
});

// --- Career Guidance Chatbot ---
const chatbotWidget = document.getElementById('chatbotWidget');
const chatbotWindow = document.getElementById('chatbotWindow');
const openChatbotBtn = document.getElementById('openChatbotBtn');
const closeChatbotBtn = document.getElementById('closeChatbotBtn');
const chatbotMessages = document.getElementById('chatbotMessages');
const chatbotForm = document.getElementById('chatbotForm');
const chatbotInput = document.getElementById('chatbotInput');

if (openChatbotBtn && chatbotWindow && closeChatbotBtn) {
  openChatbotBtn.onclick = () => chatbotWindow.style.display = 'flex';
  closeChatbotBtn.onclick = () => chatbotWindow.style.display = 'none';
}

function appendChatbotMessage(text, sender = 'bot') {
  const msgDiv = document.createElement('div');
  msgDiv.className = `chatbot-message ${sender}`;
  msgDiv.innerHTML = `<div class="chatbot-bubble">${text}</div>`;
  chatbotMessages.appendChild(msgDiv);
  chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
}

chatbotForm?.addEventListener('submit', async function(e) {
  e.preventDefault();
  const userMsg = chatbotInput.value.trim();
  if (!userMsg) return;
  appendChatbotMessage(userMsg, 'user');
  chatbotInput.value = '';
  appendChatbotMessage('<span style="color:#888;">Thinking...</span>', 'bot');
  // Call backend AI API
  const res = await fetch(`${API_BASE_URL}/chatbot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: userMsg, user: window.currentUser || null })
  });
  chatbotMessages.removeChild(chatbotMessages.lastChild); // remove 'Thinking...'
  if (res.ok) {
    const data = await res.json();
    appendChatbotMessage(data.reply, 'bot');
  } else {
    appendChatbotMessage('Sorry, I could not process your request. Please try again.', 'bot');
  }
});

// Initial greeting
document.addEventListener('DOMContentLoaded', function() {
  if (chatbotMessages && chatbotMessages.childElementCount === 0) {
    appendChatbotMessage(
      `👋 Hi! I'm your virtual career counselor. Ask me anything about careers, courses, or your future!<br>
      <ul>
        <li>Which career is best for me after 12th science?</li>
        <li>How to become a data scientist?</li>
        <li>Which courses should I take for UI/UX design?</li>
      </ul>`, 'bot'
    );
  }
}); 