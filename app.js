// ========================================
// HealthScope BD - Main Application JavaScript (Updated)
// ========================================

// ===================
// STATE MANAGEMENT
// ===================
const appState = {
    selectedSymptoms: new Set(),
    diseaseMap: null,
    diseaseLayers: {} // per-disease heat layers stored here
};

// ===================
// Bangladesh DISTRICTS DATA
// ===================
const bangladeshDistricts = {
    dhaka: ['Dhaka', 'Gazipur', 'Narayanganj', 'Tangail', 'Kishoreganj', 'Manikganj', 'Munshiganj', 'Narsingdi', 'Rajbari', 'Gopalganj', 'Faridpur', 'Madaripur', 'Shariatpur'],
    chittagong: ['Chittagong', "Cox's Bazar", 'Rangamati', 'Bandarban', 'Khagrachari', 'Feni', 'Lakshmipur', 'Comilla', 'Noakhali', 'Brahmanbaria', 'Chandpur'],
    rajshahi: ['Rajshahi', 'Natore', 'Naogaon', 'Chapainawabganj', 'Pabna', 'Sirajganj', 'Bogra', 'Joypurhat'],
    khulna: ['Khulna', 'Bagerhat', 'Satkhira', 'Jessore', 'Jhenaidah', 'Magura', 'Narail', 'Kushtia', 'Chuadanga', 'Meherpur'],
    barisal: ['Barisal', 'Patuakhali', 'Barguna', 'Bhola', 'Pirojpur', 'Jhalokathi'],
    sylhet: ['Sylhet', 'Moulvibazar', 'Habiganj', 'Sunamganj'],
    rangpur: ['Rangpur', 'Dinajpur', 'Gaibandha', 'Kurigram', 'Lalmonirhat', 'Nilphamari', 'Panchagarh', 'Thakurgaon'],
    mymensingh: ['Mymensingh', 'Jamalpur', 'Netrokona', 'Sherpur']
};

// ===================
// INITIALIZATION
// ===================
document.addEventListener('DOMContentLoaded', function () {
    initializeNavigation();
    initializeSymptomChecker();
    initializeDiseaseMap();
    initializeReportForm();
    initializeHealthTips();
});

// ===================
// NAVIGATION (unchanged)
// ===================
function initializeNavigation() {
    const mobileMenu = document.getElementById('mobile-menu');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    if (mobileMenu) {
        mobileMenu.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href && href.startsWith('#')) {
                e.preventDefault();
                const section = document.querySelector(href);
                if (section) {
                    section.scrollIntoView({ behavior: 'smooth' });
                    navMenu.classList.remove('active');
                    navLinks.forEach(l => l.classList.remove('active'));
                    link.classList.add('active');
                }
            }
        });
    });

    let scrollTimeout;
    window.addEventListener('scroll', () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            let current = '';
            const sections = document.querySelectorAll('.section, .hero');

            sections.forEach(section => {
                const sectionTop = section.offsetTop;
                const sectionHeight = section.offsetHeight;
                if (scrollY >= (sectionTop - 200) && scrollY < (sectionTop + sectionHeight - 200)) {
                    current = section.getAttribute('id');
                }
            });

            if (!current || scrollY < 100) current = 'home';

            navLinks.forEach(link => {
                link.classList.remove('active');
                const linkHref = link.getAttribute('href');
                if (linkHref === `#${current}` || (linkHref === '#home' && current === 'home')) {
                    link.classList.add('active');
                }
            });
        }, 100);
    });
}

function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) section.scrollIntoView({ behavior: 'smooth' });
}

// ===================
// SYMPTOM CHECKER (unchanged)
// ===================
// ===================
// SYMPTOM CHECKER
// ===================
function initializeSymptomChecker() {
    const symptomChips = document.querySelectorAll('.symptom-chip');
    const analyzeBtn = document.getElementById('analyze-btn');
    const searchInput = document.getElementById('symptom-search');

    // Symptom selection
    symptomChips.forEach(chip => {
        chip.addEventListener('click', () => {
            const symptom = chip.dataset.symptom;

            if (appState.selectedSymptoms.has(symptom)) {
                appState.selectedSymptoms.delete(symptom);
                chip.classList.remove('selected');
                removeSelectedChip(symptom);
            } else {
                appState.selectedSymptoms.add(symptom);
                chip.classList.add('selected');
                addSelectedChip(symptom, chip.textContent.trim());
            }

            updateAnalyzeButton();
        });
    });

    // Search functionality
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            symptomChips.forEach(chip => {
                const symptomText = chip.textContent.toLowerCase();
                chip.style.display = symptomText.includes(searchTerm) ? '' : 'none';
            });
        });
    }

    // Analyze symptoms
    if (analyzeBtn) {
        analyzeBtn.addEventListener('click', () => {
            analyzeSymptoms();
        });
    }
}

function addSelectedChip(symptom, label) {
    const container = document.getElementById('selected-symptoms');
    const chip = document.createElement('div');
    chip.className = 'selected-chip';
    chip.dataset.symptom = symptom;
    chip.innerHTML = `
        <span>${label}</span>
        <button onclick="removeSymptom('${symptom}')">&times;</button>
    `;
    container.appendChild(chip);
}

function removeSelectedChip(symptom) {
    const chip = document.querySelector(`.selected-chip[data-symptom="${symptom}"]`);
    if (chip) chip.remove();
}

function removeSymptom(symptom) {
    appState.selectedSymptoms.delete(symptom);
    removeSelectedChip(symptom);

    const chip = document.querySelector(`.symptom-chip[data-symptom="${symptom}"]`);
    if (chip) chip.classList.remove('selected');

    updateAnalyzeButton();
}

function updateAnalyzeButton() {
    const analyzeBtn = document.getElementById('analyze-btn');
    if (analyzeBtn) {
        analyzeBtn.disabled = appState.selectedSymptoms.size === 0;
    }
}

function analyzeSymptoms() {
    const symptoms = Array.from(appState.selectedSymptoms);
    const resultsPanel = document.querySelector('#results-panel .panel-card');

    resultsPanel.innerHTML = `
        <div class="empty-state">
            <div class="empty-icon">⏳</div>
            <h3>Analyzing Symptoms...</h3>
            <p>Please wait while we process your symptoms</p>
        </div>
    `;

    // Simulate analysis delay
    setTimeout(() => {
        const matches = matchSymptoms(symptoms);
        displayResults(matches);
    }, 1000);
}

function matchSymptoms(symptoms) {
    // Advanced disease database with weighted symptom matching
    const diseases = [
        {
            name: 'Seasonal Flu / Viral Infection',
            prior: 1.0,
            triage: 'low',
            description: 'A contagious viral infection affecting the respiratory system',
            symptoms: {
                'fever': 1.5,
                'cough': 1.2,
                'headache': 1.0,
                'fatigue': 1.0,
                'body_ache': 1.2,
                'sore_throat': 1.0,
                'runny_nose': 0.6
            },
            recommendations: [
                'Get plenty of rest',
                'Stay hydrated with water and warm fluids',
                'Take over-the-counter pain relievers if needed',
                'Monitor your symptoms and seek medical care if they worsen'
            ]
        },
        {
            name: 'Common Cold',
            prior: 0.9,
            triage: 'low',
            description: 'A mild viral infection of the upper respiratory tract',
            symptoms: {
                'runny_nose': 1.4,
                'sore_throat': 1.0,
                'cough': 0.8,
                'headache': 0.6,
                'fever': 0.5,
                'fatigue': 0.4
            },
            recommendations: [
                'Rest and stay well hydrated',
                'Use saline nasal drops for congestion',
                'Gargle with warm salt water for sore throat',
                'Recovery usually occurs within 7-10 days'
            ]
        },
        {
            name: 'COVID-19',
            prior: 1.0,
            triage: 'high',
            description: 'A respiratory illness caused by the SARS-CoV-2 virus',
            symptoms: {
                'fever': 1.6,
                'cough': 1.4,
                'shortness_of_breath': 1.6,
                'fatigue': 1.0,
                'headache': 0.8
            },
            recommendations: [
                'Isolate yourself from others immediately',
                'Get tested for COVID-19',
                'Monitor oxygen levels if possible',
                'Seek medical care if breathing difficulty worsens',
                'Contact local health authorities'
            ]
        },
        {
            name: 'Pneumonia',
            prior: 0.9,
            triage: 'high',
            description: 'An infection that inflames air sacs in one or both lungs',
            symptoms: {
                'fever': 1.4,
                'cough': 1.4,
                'shortness_of_breath': 2.0,
                'chest_pain': 1.8,
                'wheezing': 1.0
            },
            recommendations: [
                'Seek immediate medical attention',
                'Get a chest X-ray and proper diagnosis',
                'Antibiotics may be needed if bacterial',
                'Stay hydrated and rest'
            ]
        },
        {
            name: 'Bronchitis',
            prior: 0.7,
            triage: 'medium',
            description: 'Inflammation of the bronchial tubes carrying air to lungs',
            symptoms: {
                'cough': 1.6,
                'wheezing': 1.0,
                'shortness_of_breath': 1.2,
                'fever': 0.8
            },
            recommendations: [
                'Rest and drink plenty of fluids',
                'Use a humidifier',
                'Avoid lung irritants like smoke',
                'See a doctor if symptoms persist beyond 3 weeks'
            ]
        },
        {
            name: 'Asthma Exacerbation',
            prior: 0.6,
            triage: 'high',
            description: 'Worsening of asthma symptoms including airway inflammation',
            symptoms: {
                'wheezing': 2.0,
                'shortness_of_breath': 1.8,
                'chest_pain': 1.2
            },
            recommendations: [
                'Use your rescue inhaler immediately',
                'Sit upright and try to stay calm',
                'Seek emergency care if symptoms don\'t improve',
                'Follow your asthma action plan'
            ]
        },
        {
            name: 'Gastroenteritis (Food Poisoning)',
            prior: 1.0,
            triage: 'medium',
            description: 'Stomach and intestinal infection, often from contaminated food',
            symptoms: {
                'nausea': 1.5,
                'vomiting': 1.8,
                'diarrhea': 2.0,
                'abdominal_pain': 1.4,
                'loss_of_appetite': 0.8
            },
            recommendations: [
                'Stay hydrated with oral rehydration solution',
                'Rest your stomach - eat bland foods when ready',
                'Avoid dairy and fatty foods',
                'Seek medical help if severe dehydration or blood in stool'
            ]
        },
        {
            name: 'Appendicitis',
            prior: 0.4,
            triage: 'emergency',
            description: 'Inflammation of the appendix requiring immediate medical attention',
            symptoms: {
                'abdominal_pain': 2.0,
                'nausea': 1.2,
                'vomiting': 1.0,
                'fever': 0.8
            },
            recommendations: [
                '🚨 SEEK EMERGENCY MEDICAL CARE IMMEDIATELY',
                'Do not eat or drink anything',
                'Do not take laxatives or pain medication',
                'Surgery is often required'
            ]
        },
        {
            name: 'Dengue Fever',
            prior: 0.8,
            triage: 'high',
            description: 'A mosquito-borne viral infection common in Bangladesh',
            symptoms: {
                'fever': 2.0,
                'rash': 1.6,
                'joint_pain': 1.8,
                'chills': 0.8,
                'headache': 1.0,
                'sweating': 0.6
            },
            recommendations: [
                'Seek medical attention immediately',
                'Get a blood test to confirm dengue',
                'Rest and stay well hydrated',
                'Monitor for warning signs (bleeding, severe abdominal pain)',
                'Use mosquito nets and repellent'
            ]
        },
        {
            name: 'Chikungunya',
            prior: 0.6,
            triage: 'medium',
            description: 'A mosquito-borne viral disease causing fever and joint pain',
            symptoms: {
                'fever': 1.8,
                'joint_pain': 2.0,
                'rash': 1.4,
                'fatigue': 0.8
            },
            recommendations: [
                'Consult a doctor for proper diagnosis',
                'Rest and drink plenty of fluids',
                'Take pain relievers as recommended',
                'Joint pain may persist for weeks or months'
            ]
        },
        {
            name: 'Typhoid Fever',
            prior: 0.5,
            triage: 'high',
            description: 'A bacterial infection spread through contaminated food/water',
            symptoms: {
                'fever': 1.8,
                'headache': 1.0,
                'loss_of_appetite': 1.0,
                'abdominal_pain': 1.0,
                'diarrhea': 0.8,
                'fatigue': 0.6
            },
            recommendations: [
                'Seek medical attention for blood tests',
                'Antibiotics are necessary for treatment',
                'Drink only boiled or bottled water',
                'Maintain good hygiene and handwashing'
            ]
        }
    ];

    // Weighted matching algorithm
    const results = diseases.map(disease => {
        let score = disease.prior; // Start with prior probability
        let matchedCount = 0;
        const matchedSymptoms = [];

        // Calculate weighted score based on matching symptoms
        symptoms.forEach(symptom => {
            if (disease.symptoms[symptom]) {
                score += disease.symptoms[symptom];
                matchedCount++;
                matchedSymptoms.push(symptom);
            }
        });

        // Normalize by number of selected symptoms to avoid bias toward diseases with many symptoms
        const confidence = matchedCount > 0 ? score / (symptoms.length + 1) : 0;
        const confidencePercent = Math.round(Math.min(confidence * 100, 99));

        return {
            ...disease,
            matchedSymptoms,
            matchedCount,
            score,
            confidence,
            confidencePercent
        };
    }).filter(d => d.matchedCount > 0).sort((a, b) => b.score - a.score);

    return results;
}

function displayResults(matches) {
    const resultsPanel = document.querySelector('#results-panel .panel-card');

    if (!matches || matches.length === 0) {
        resultsPanel.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🤔</div>
                <h3>No Clear Match Found</h3>
                <p>The selected symptoms don't match our database patterns clearly. Please consult a healthcare professional for proper diagnosis.</p>
            </div>
        `;
        return;
    }

    const topMatch = matches[0];
    const triageClass = `triage-${topMatch.triage}`;
    const triageLabel = topMatch.triage.charAt(0).toUpperCase() + topMatch.triage.slice(1);
    const triageIcon = topMatch.triage === 'emergency' ? '🆘' :
        topMatch.triage === 'high' ? '🚨' :
            topMatch.triage === 'medium' ? '⚠️' : '✓';

    let html = `
        <div class="results-content">
            <div class="triage-badge ${triageClass}">
                <span>${triageIcon}</span>
                <span>${triageLabel} Priority</span>
            </div>
            
            <h3 class="panel-title">Analysis Results</h3>
            
            <div class="disease-list">
    `;

    matches.slice(0, 3).forEach(disease => {
        html += `
            <div class="disease-item">
                <div class="disease-name">${disease.name}</div>
                <span class="disease-confidence">${disease.confidencePercent}% Match</span>
                <p class="disease-description">${disease.description}</p>
            </div>
        `;
    });

    html += `
            </div>
            
            <div class="recommendations">
                <h4>💡 Recommended Actions</h4>
                <ul>
    `;

    topMatch.recommendations.forEach(rec => {
        html += `<li>${rec}</li>`;
    });

    html += `
                </ul>
            </div>
            
            <div style="margin-top: 1.5rem; padding: 1rem; background: #fef3c7; border-radius: 0.75rem; font-size: 0.875rem;">
                ⚠️ <strong>Disclaimer:</strong> This is an automated assessment tool and not a substitute for professional medical advice. Please consult a qualified healthcare provider for accurate diagnosis and treatment.
            </div>
        </div>
    `;

    resultsPanel.innerHTML = html;
    resultsPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ===================
// DISEASE MAP (updated & fixed)
// ===================
function initializeDiseaseMap() {
    const map = L.map('disease-map').setView([23.8103, 90.4125], 7);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18
    }).addTo(map);

    appState.diseaseMap = map;

    // build per-disease layers from heatmap data
    const diseaseHeatmaps = getDiseaseHeatmaps();

    // default gradients (you asked earlier for red, but keep distinct gradients available)
    const gradients = {
        all: { 0.0: 'rgba(16,185,129,0.08)', 0.4: 'rgba(16,185,129,0.35)', 1.0: 'rgba(16,185,129,0.8)' },
        flu: { 0.0: 'rgba(79,70,229,0.08)', 0.4: 'rgba(99,102,241,0.35)', 1.0: 'rgba(79,70,229,0.85)' },
        dengue: { 0.0: 'rgba(219,39,119,0.08)', 0.4: 'rgba(236,72,153,0.35)', 1.0: 'rgba(219,39,119,0.85)' },
        covid: { 0.0: 'rgba(6,182,212,0.08)', 0.4: 'rgba(34,211,238,0.35)', 1.0: 'rgba(6,182,212,0.85)' },
        gastroenteritis: { 0.0: 'rgba(250,204,21,0.08)', 0.4: 'rgba(253,186,116,0.35)', 1.0: 'rgba(245,158,11,0.85)' },
        typhoid: { 0.0: 'rgba(34,197,94,0.08)', 0.4: 'rgba(52,211,153,0.35)', 1.0: 'rgba(16,185,129,0.85)' }
    };

    // create heat layers (not added to map yet)
    Object.keys(diseaseHeatmaps).forEach(key => {
        const data = diseaseHeatmaps[key] || [];
        appState.diseaseLayers[key] = createHeatLayerForDisease(data, gradients[key] || gradients.all);
    });

    // default visible: show 'all' layer
    if (appState.diseaseLayers['all']) appState.diseaseLayers['all'].addTo(map);

    // create controls; after controls exist we can safely apply red mode if desired
    createDiseaseControls(map, Object.keys(diseaseHeatmaps));

    // ensure dropdown changes still update stats
    const timeFilter = document.getElementById('time-filter');
    const diseaseFilter = document.getElementById('disease-filter');

    if (timeFilter) {
        timeFilter.addEventListener('change', () => refreshVisibleLayers());
    }
    if (diseaseFilter) {
        diseaseFilter.addEventListener('change', () => updateStatistics(diseaseFilter.value || 'all'));
    }

    // call red-mode conversion if you want all heatmaps red by default
    // applyRedHeatmap(); // <-- uncomment if you want pure-red immediately

    // set initial stats
    updateStatistics('all');
}

// --- Red gradient definition (strong red) ---
const redGradient = {
    0.0: 'rgba(255,240,240,0.06)',
    0.25: 'rgba(255,200,200,0.20)',
    0.5: 'rgba(255,150,150,0.40)',
    0.75: 'rgba(255,90,90,0.70)',
    1.0: 'rgba(220,38,38,0.95)'
};

// Recreate single disease layer using red gradient
function recreateLayerWithRed(diseaseKey) {
    const map = appState.diseaseMap;
    if (!appState.diseaseLayers || typeof appState.diseaseLayers[diseaseKey] === 'undefined') return;

    const heatmaps = getDiseaseHeatmaps();
    const data = heatmaps[diseaseKey] || [];

    const oldLayer = appState.diseaseLayers[diseaseKey];
    if (map && oldLayer && map.hasLayer(oldLayer)) {
        try { map.removeLayer(oldLayer); } catch (e) { /* ignore */ }
    }

    const newLayer = createHeatLayerForDisease(data, redGradient);
    appState.diseaseLayers[diseaseKey] = newLayer;

    // add back to map only if control checkbox is checked (visible)
    const cb = document.querySelector(`.disease-toggle[data-disease="${diseaseKey}"]`);
    if (cb && cb.checked && map) newLayer.addTo(map);
}

// Apply red gradient to all created disease layers (safe: runs after controls exist)
function applyRedHeatmap() {
    Object.keys(appState.diseaseLayers || {}).forEach(k => recreateLayerWithRed(k));
}

// create a heat layer helper
function createHeatLayerForDisease(heatData, gradient) {
    return L.heatLayer(heatData, {
        radius: 36,
        blur: 48,
        maxZoom: 10,
        max: 1.0,
        gradient: gradient
    });
}

// create controls with checkboxes to toggle layers
function createDiseaseControls(map, diseaseKeys) {
    // Friendly labels (Bangla + English)
    const diseaseLabels = {
        all: 'Jaundice / জাউন্ডিস',
        flu: 'Flu / সর্দি-কাশি',
        dengue: 'Dengue / ডেঙ্গু',
        covid: 'COVID-19 / কোভিড-১৯',
        gastroenteritis: 'Gastroenteritis / পানিপেটে সংক্রমণ',
        typhoid: 'Typhoid / টাইফয়েড'
    };

    // Swatch colors (pick one strong color per disease for the little badge)
    const diseaseColors = {
        all: '#10b981',
        flu: '#4f46e5',
        dengue: '#db2777',
        covid: '#06b6d4',
        gastroenteritis: '#f59e0b',
        typhoid: '#16a34a'
    };

    // container
    const controlDiv = L.DomUtil.create('div', 'disease-control-container leaflet-bar');
    Object.assign(controlDiv.style, {
        background: 'rgba(255,255,255,0.98)',
        padding: '0.65rem',
        borderRadius: '10px',
        maxHeight: '320px',
        overflowY: 'auto',
        minWidth: '220px',
        boxShadow: '0 10px 30px rgba(2,6,23,0.12)',
        fontFamily: 'Inter, Arial, sans-serif',
        fontSize: '0.95rem',
        color: '#0f172a',
        zIndex: 650
    });

    // title
    const title = L.DomUtil.create('div', '', controlDiv);
    title.textContent = 'Show diseases';
    Object.assign(title.style, {
        fontWeight: 700,
        marginBottom: '0.6rem',
        fontSize: '0.98rem',
        color: '#0f172a',
        letterSpacing: '0.2px'
    });

    // "toggle all" row
    const allWrapper = L.DomUtil.create('label', '', controlDiv);
    Object.assign(allWrapper.style, {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginBottom: '0.6rem',
        cursor: 'pointer',
        userSelect: 'none'
    });

    const allCheckbox = document.createElement('input');
    allCheckbox.type = 'checkbox';
    allCheckbox.id = 'disease-toggle-all';
    allCheckbox.style.width = '16px';
    allCheckbox.style.height = '16px';
    allCheckbox.style.margin = '0';
    allWrapper.appendChild(allCheckbox);

    const allText = document.createElement('span');
    allText.textContent = 'All Diseases / সব রোগ';
    Object.assign(allText.style, { fontWeight: 600, color: '#0f172a' });
    allWrapper.appendChild(allText);

    // Create each disease row
    diseaseKeys.forEach(key => {
        const wrapper = L.DomUtil.create('label', '', controlDiv);
        Object.assign(wrapper.style, {
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            marginBottom: '0.45rem',
            cursor: 'pointer',
            padding: '6px 8px',
            borderRadius: '8px',
            transition: 'background 180ms ease, transform 140ms ease',
            userSelect: 'none'
        });

        // hover highlight (using events because inline CSS can't have :hover)
        wrapper.addEventListener('mouseenter', () => {
            wrapper.style.background = 'rgba(15, 23, 42, 0.04)';
            wrapper.style.transform = 'translateY(-1px)';
        });
        wrapper.addEventListener('mouseleave', () => {
            wrapper.style.background = 'transparent';
            wrapper.style.transform = 'none';
        });

        // checkbox
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.className = 'disease-toggle';
        cb.dataset.disease = key;
        cb.style.width = '16px';
        cb.style.height = '16px';
        cb.style.margin = '0';
        cb.style.flex = '0 0 auto';
        if (key === 'all') cb.checked = true;

        // swatch
        const swatch = document.createElement('span');
        Object.assign(swatch.style, {
            display: 'inline-block',
            width: '12px',
            height: '12px',
            borderRadius: '3px',
            background: diseaseColors[key] || '#cbd5e1',
            boxShadow: '0 1px 3px rgba(2,6,23,0.12)',
            flex: '0 0 auto',
            marginLeft: '2px'
        });

        // label text
        const span = document.createElement('span');
        span.textContent = diseaseLabels[key] || (key.charAt(0).toUpperCase() + key.slice(1));
        Object.assign(span.style, {
            color: '#0f172a',
            fontSize: '0.95rem',
            lineHeight: '1',
            fontWeight: 600,
            marginLeft: '4px'
        });

        // small secondary subtitle (Bangla/English split) — optional: try to split to two lines when long
        const subtitle = document.createElement('div');
        subtitle.textContent = ''; // leave empty unless you want separate small text
        Object.assign(subtitle.style, {
            fontSize: '0.78rem',
            color: '#6b7280',
            marginLeft: '4px',
            display: 'none'
        });

        wrapper.appendChild(cb);
        wrapper.appendChild(swatch);
        wrapper.appendChild(span);
        wrapper.appendChild(subtitle);
    });

    // disable propagation so map doesn't move while interacting
    L.DomEvent.disableClickPropagation(controlDiv);
    L.DomEvent.disableScrollPropagation(controlDiv);

    // add control to map
    const control = L.control({ position: 'topleft' });
    control.onAdd = function () { return controlDiv; };
    control.addTo(map);

    // attach listeners AFTER inputs exist
    const checkboxes = controlDiv.querySelectorAll('.disease-toggle');
    checkboxes.forEach(cb => {
        cb.addEventListener('change', (e) => {
            const disease = e.target.dataset.disease;
            const layer = appState.diseaseLayers[disease];
            if (!layer) return;
            if (e.target.checked) layer.addTo(map);
            else if (map.hasLayer(layer)) map.removeLayer(layer);

            const visible = getVisibleDiseaseKeys();
            if (visible.length === 1) updateStatistics(visible[0]);
            else updateStatistics('all');
        });
    });

    // select-all behavior
    allCheckbox.addEventListener('change', (e) => {
        const checked = e.target.checked;
        controlDiv.querySelectorAll('.disease-toggle').forEach(cb => {
            cb.checked = checked;
            const disease = cb.dataset.disease;
            const layer = appState.diseaseLayers[disease];
            if (!layer) return;
            if (checked) layer.addTo(map);
            else if (map.hasLayer(layer)) map.removeLayer(layer);
        });
        updateStatistics('all');
    });
}

// NOTE: controls now exist — safe to change gradients or call applyRedHeatmap() externally


// return currently visible disease keys
function getVisibleDiseaseKeys() {
    const visible = [];
    document.querySelectorAll('.disease-toggle').forEach(cb => {
        if (cb.checked) visible.push(cb.dataset.disease);
    });
    return visible;
}

// simple redraw helper
function refreshVisibleLayers() {
    const map = appState.diseaseMap;
    if (!map) return;
    const visible = getVisibleDiseaseKeys();
    Object.keys(appState.diseaseLayers).forEach(key => {
        const layer = appState.diseaseLayers[key];
        if (!layer) return;
        if (visible.includes(key)) {
            if (!map.hasLayer(layer)) layer.addTo(map);
        } else {
            if (map.hasLayer(layer)) map.removeLayer(layer);
        }
    });
}

// update stats (unchanged)
function updateStatistics(disease) {
    const stats = {
        all: { total: 1247, hotspots: 8, areas: 23, severity: 'Medium' },
        flu: { total: 456, hotspots: 7, areas: 18, severity: 'Low' },
        dengue: { total: 234, hotspots: 6, areas: 12, severity: 'High' },
        covid: { total: 189, hotspots: 5, areas: 11, severity: 'Medium' },
        gastroenteritis: { total: 178, hotspots: 5, areas: 11, severity: 'Medium' },
        typhoid: { total: 190, hotspots: 6, areas: 11, severity: 'High' }
    };

    const selectedStats = stats[disease] || stats.all;
    const elTotal = document.getElementById('total-reports');
    const elHotspots = document.getElementById('hotspot-count');
    const elAreas = document.getElementById('affected-areas');
    const elSeverity = document.getElementById('severity-level');

    if (elTotal) elTotal.textContent = selectedStats.total.toLocaleString();
    if (elHotspots) elHotspots.textContent = selectedStats.hotspots;
    if (elAreas) elAreas.textContent = selectedStats.areas;
    if (elSeverity) elSeverity.textContent = selectedStats.severity;
}

// helper: disease heatmap data
function getDiseaseHeatmaps() {
    return {
        all: [
            [23.8103, 90.4125, 1.0], [23.7900, 90.4000, 0.9], [22.3569, 91.7832, 0.85],
            [24.3745, 88.6042, 0.7], [22.8456, 89.5403, 0.75], [24.8949, 91.8687, 0.7],
            [25.7439, 89.2752, 0.55], [24.7471, 90.4203, 0.65], [23.9000, 90.5000, 0.6],
            [22.7500, 91.1500, 0.55]
        ],
        flu: [
            [23.8103, 90.4125, 0.9], [23.8800, 90.3800, 0.85], [22.3569, 91.7832, 0.8],
            [24.3745, 88.6042, 0.75], [22.8456, 89.5403, 0.7], [24.8949, 91.8687, 0.65],
            [25.7439, 89.2752, 0.6], [24.7471, 90.4203, 0.7], [23.9000, 90.5000, 0.65],
            [22.7500, 91.1500, 0.6], [24.0900, 90.4126, 0.55], [25.6217, 88.6354, 0.5]
        ],
        dengue: [
            [22.3569, 91.7832, 1.0], [22.4000, 91.8000, 0.95], [21.4272, 92.0058, 0.9],
            [23.8103, 90.4125, 0.85], [22.8456, 89.5403, 0.75], [22.7000, 89.1000, 0.7],
            [24.8949, 91.8687, 0.7], [22.7000, 90.3500, 0.65], [22.3700, 90.3300, 0.6],
            [23.1700, 91.9800, 0.55]
        ],
        covid: [
            [23.8103, 90.4125, 1.0], [23.8200, 90.4200, 0.95], [23.9000, 90.5000, 0.85],
            [22.3569, 91.7832, 0.9], [24.3745, 88.6042, 0.75], [22.8456, 89.5403, 0.7],
            [24.8949, 91.8687, 0.7], [24.7471, 90.4203, 0.65], [25.7439, 89.2752, 0.6]
        ],
        gastroenteritis: [
            [24.7471, 90.4203, 0.9], [24.9200, 89.9000, 0.85], [22.7000, 90.3500, 0.85],
            [22.3700, 90.3300, 0.8], [23.5200, 89.1700, 0.75], [24.0900, 90.4126, 0.7],
            [24.4300, 90.7800, 0.7], [23.4500, 89.0300, 0.65], [22.8456, 91.1000, 0.6],
            [25.7439, 89.2752, 0.6]
        ],
        typhoid: [
            [22.7000, 90.3500, 1.0], [22.3700, 90.3300, 0.95], [24.7471, 90.4203, 0.85],
            [23.5200, 89.1700, 0.8], [23.4500, 89.0300, 0.75], [24.0900, 90.4126, 0.7],
            [24.4300, 90.7800, 0.7], [24.9200, 89.9000, 0.65], [22.8456, 89.5403, 0.6]
        ]
    };
}

// ===================
// REPORT FORM (unchanged)
// ===================
function initializeReportForm() {
    const form = document.getElementById('report-form');
    const divisionSelect = document.getElementById('division');

    if (divisionSelect) {
        divisionSelect.addEventListener('change', (e) => updateDistrictOptions(e.target.value));
    }

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            submitReport();
        });
    }
}

function updateDistrictOptions(division) {
    const districtSelect = document.getElementById('district');
    if (!districtSelect || !division) return;

    districtSelect.innerHTML = '<option value="">Select district</option>';
    const districts = bangladeshDistricts[division] || [];
    districts.forEach(district => {
        const option = document.createElement('option');
        option.value = district.toLowerCase().replace(/\s+/g, '_');
        option.textContent = district;
        districtSelect.appendChild(option);
    });
}

function submitReport() {
    const diseaseType = document.getElementById('disease-type')?.value;
    const severity = document.querySelector('input[name="severity"]:checked')?.value;
    const division = document.getElementById('division')?.value;
    const district = document.getElementById('district')?.value;

    if (!diseaseType || !severity || !division || !district) {
        showToast('❌ Please fill in all required fields', 'error');
        return;
    }

    showToast('✓ Report submitted successfully! Thank you for contributing to community health.', 'success');
    document.getElementById('report-form').reset();
    setTimeout(() => document.getElementById('trends').scrollIntoView({ behavior: 'smooth' }), 1000);
}

// ===================
// HEALTH TIPS (unchanged)
// ===================
function initializeHealthTips() {
    const tipsContainer = document.getElementById('health-tips');
    if (!tipsContainer) return;

    const healthTips = [
        { icon: '🦟', title: 'Prevent Mosquito Bites', description: 'Use mosquito nets, wear long sleeves, and apply repellent to protect against dengue and malaria.' },
        { icon: '💧', title: 'Drink Clean Water', description: 'Always drink boiled or filtered water to prevent waterborne diseases like typhoid and cholera.' },
        { icon: '🧼', title: 'Wash Your Hands', description: 'Regular handwashing with soap prevents the spread of many infectious diseases.' },
        { icon: '🍎', title: 'Eat Healthy Foods', description: 'A balanced diet rich in fruits and vegetables strengthens your immune system.' },
        { icon: '💉', title: 'Stay Vaccinated', description: 'Keep your vaccinations up to date to protect against preventable diseases.' },
        { icon: '😴', title: 'Get Enough Sleep', description: '7-8 hours of quality sleep helps your body fight infections and stay healthy.' }
    ];

    let html = '';
    healthTips.forEach(tip => {
        html += `<div class="tip-card"><div class="tip-icon">${tip.icon}</div><h3>${tip.title}</h3><p>${tip.description}</p></div>`;
    });

    tipsContainer.innerHTML = html;
}

// ===================
// TOAST (unchanged)
// ===================
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 4000);
}

// expose some utilities to global
window.scrollToSection = scrollToSection;
window.removeSymptom = removeSymptom;
window.applyRedHeatmap = applyRedHeatmap; // export this so you can toggle red mode from console/button
