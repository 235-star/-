import { db, collection, addDoc, getDocs, query, where } from './firebase-config.js';

// メインスクリプト - 階層ナビゲーション
// Global variables
let currentUniversity = null;
let universitiesData = [];
let universityReviewsData = [];
let professorsData = [];
let reviewsData = [];

let currentFilteredUniversities = [];
const universitiesPerPage = 20;
let displayedUniversitiesCount = 0;
const maxDomUniversities = 60; // virtualization limit
let universityItemHeight = 0;
let currentSearchQuery = '';

// Firestore helper functions
async function fetchProfessorReviews(professorId) {
    try {
        const q = query(collection(db, 'reviews'), where('professorId', '==', professorId));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
        console.error('Failed to fetch professor reviews:', e);
        return [];
    }
}

async function fetchUniversityReviews(universityId) {
    try {
        const q = query(collection(db, 'universityReviews'), where('universityId', '==', universityId));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
        console.error('Failed to fetch university reviews:', e);
        return [];
    }
}

// Fetch existing professors from Firestore
async function fetchProfessorsFromFirestore() {
    try {
        const snapshot = await getDocs(collection(db, 'professors'));
        return snapshot.docs.map(doc => ({ id: doc.data().id, ...doc.data() }));
    } catch (e) {
        console.error('Failed to fetch professors:', e);
        return [];
    }
}

// Add a professor document to Firestore
async function addProfessorToFirestore(professor) {
    try {
        const docRef = await addDoc(collection(db, 'professors'), professor);
        console.log('Professor saved to Firestore with doc id:', docRef.id);
    } catch (e) {
        console.error('Firestore error while adding professor:', e);
        throw e;
    }
}

// XSS Protection - HTML Sanitization Functions
function sanitizeHTML(str) {
    if (typeof str !== 'string') return '';
    
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
}

// Enhanced sanitization for specific contexts
function sanitizeForAttribute(str) {
    if (typeof str !== 'string') return '';
    
    return str.replace(/[<>"'&]/g, function(match) {
        const entities = {
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#x27;',
            '&': '&amp;'
        };
        return entities[match];
    });
}

// Additional validation functions
function isValidInput(str, maxLength = 1000) {
    if (typeof str !== 'string') return false;
    if (str.length > maxLength) return false;
    
    // Check for suspicious patterns
    const suspiciousPatterns = [
        /<script/i,
        /javascript:/i,
        /vbscript:/i,
        /onload/i,
        /onerror/i,
        /onclick/i,
        /onmouseover/i,
        /<iframe/i,
        /<object/i,
        /<embed/i
    ];
    
    return !suspiciousPatterns.some(pattern => pattern.test(str));
}

function validateAndSanitize(str, maxLength = 1000) {
    if (!isValidInput(str, maxLength)) {
        console.warn('Potentially malicious input detected and blocked:', str);
        return '';
    }
    return sanitizeHTML(str);
}



// Rate limiting check function - prevents submissions within 30 seconds per type
function checkRateLimit(type) {
    const now = Date.now();
    const storageKey = `lastPostTime-${type}`;
    const lastPostTime = localStorage.getItem(storageKey);
    
    if (lastPostTime) {
        const timeDiff = now - parseInt(lastPostTime);
        
        if (timeDiff < 30000) { // Less than 30 seconds
            const remainingSeconds = Math.ceil((30000 - timeDiff) / 1000);
            alert(`レビューの投稿間隔は30秒以上空けてください。あと${remainingSeconds}秒待ってから再度お試しください。`);
            return false; // Prevent submission
        }
    }
    
    // Update the time and allow submission
    localStorage.setItem(storageKey, now.toString());
    return true;
}

// Check if user can submit (for UI updates)
function canSubmit(type) {
    const now = Date.now();
    const storageKey = `lastPostTime-${type}`;
    const lastPostTime = localStorage.getItem(storageKey);
    
    if (lastPostTime) {
        const timeDiff = now - parseInt(lastPostTime);
        return timeDiff >= 30000;
    }
    
    return true;
}

// Get remaining time until next submission allowed
function getRemainingTime(type) {
    const now = Date.now();
    const storageKey = `lastPostTime-${type}`;
    const lastPostTime = localStorage.getItem(storageKey);
    
    if (lastPostTime) {
        const timeDiff = now - parseInt(lastPostTime);
        const remainingTime = 30000 - timeDiff;
        
        if (remainingTime > 0) {
            return Math.ceil(remainingTime / 1000);
        }
    }
    
    return 0;
}

// Utility: throttle execution to reduce DOM updates
function throttle(fn, wait) {
    let lastTime = 0;
    let timeout;
    return function(...args) {
        const now = Date.now();
        const remaining = wait - (now - lastTime);
        if (remaining <= 0) {
            clearTimeout(timeout);
            timeout = null;
            lastTime = now;
            fn.apply(this, args);
        } else if (!timeout) {
            timeout = setTimeout(() => {
                lastTime = Date.now();
                timeout = null;
                fn.apply(this, args);
            }, remaining);
        }
    };
}

// Update submit button state based on rate limiting
function updateSubmitButtonState(buttonSelector, type, originalText = 'レビューを投稿') {
    const button = document.querySelector(buttonSelector);
    if (!button) return;
    
    const remainingTime = getRemainingTime(type);
    
    if (remainingTime > 0) {
        button.disabled = true;
        button.textContent = `あと${remainingTime}秒待ってください`;
        button.style.opacity = '0.6';
        button.style.cursor = 'not-allowed';
        
        // Update countdown every second
        const countdown = setInterval(() => {
            const currentRemaining = getRemainingTime(type);
            if (currentRemaining <= 0) {
                clearInterval(countdown);
                button.disabled = false;
                button.textContent = originalText;
                button.style.opacity = '1';
                button.style.cursor = 'pointer';
            } else {
                button.textContent = `あと${currentRemaining}秒待ってください`;
            }
        }, 1000);
    }
}



document.addEventListener('DOMContentLoaded', function() {
    let currentPage = 'universities';
    let currentUniversityId = null;
    let currentProfessorId = null;

    // ナビゲーション管理
    const navigationStack = [];
    const pages = {
        universities: document.getElementById('universities-page'),
        universityDetail: document.getElementById('university-detail-page'),
        professors: document.getElementById('professors-page'),
        professorDetail: document.getElementById('professor-detail-page')
    };

    // 初期化
    loadDataAndInit();

    async function loadDataAndInit() {
        const dataModule = await import('./data.js');
        universitiesData = dataModule.universitiesData;
        universityReviewsData = dataModule.universityReviewsData;
        professorsData = dataModule.professorsData;
        reviewsData = dataModule.reviewsData;
        prepareData();
        await initializeApp();
    }

    function prepareData() {
        universitiesData.forEach(u => {
            u.normName = normalizeInput(u.name);
            u.normLocation = normalizeInput(u.location);
            u.normType = normalizeInput(u.type);
            if (u.nameVariations) {
                u.normVariations = u.nameVariations.map(v => normalizeInput(v));
            }
        });
    }

    async function initializeApp() {
        const firestoreProfessors = await fetchProfessorsFromFirestore();
        const existingIds = new Set(professorsData.map(p => p.id));
        firestoreProfessors.forEach(p => {
            if (!existingIds.has(p.id)) {
                professorsData.push(p);
            }
        });
        console.log(`Loaded ${firestoreProfessors.length} professors from Firestore`);
        for (const u of universitiesData) {
            await updateUniversityStats(u.id);
        }
        showPage('universities');
        displayUniversities();
        setupEventListeners();
        updateBreadcrumb();
        setupLogoClickHandler();
        console.log('✅ All review submissions and rating calculations are now working with Firestore.');
    }

    // ロゴクリックハンドラーの設定
    function setupLogoClickHandler() {
        const logoLink = document.getElementById('logo-link');
        if (logoLink) {
            logoLink.addEventListener('click', function(e) {
                e.preventDefault();
                navigateToUniversities();
            });
        }
    }

    // 入力正規化とオートサジェスト機能
    function normalizeInput(input) {
        return input.toLowerCase()
            .replace(/\s+/g, '') // スペースを除去
            .replace(/university/gi, '') // "university"を除去
            .replace(/daigaku/gi, '') // "daigaku"を除去
            .replace(/だいがく/g, '') // "だいがく"を除去
            .replace(/大学/g, '') // "大学"を除去
            .replace(/の/g, '') // "の"を除去
            .replace(/gakuin/gi, '') // "gakuin"を除去
            .replace(/学院/g, '') // "学院"を除去
            .replace(/tech/gi, '') // "tech"を除去
            .replace(/institute/gi, '') // "institute"を除去
            .replace(/college/gi, ''); // "college"を除去
    }

    function matchesUniversity(university, query) {
        const normalizedQuery = normalizeInput(query);
        
        // 大学名の全バリエーションをチェック
        if (university.nameVariations) {
            return university.nameVariations.some(variation => 
                normalizeInput(variation).includes(normalizedQuery)
            );
        }
        
        // バリエーションがない場合は従来の方法
        return normalizeInput(university.name).includes(normalizedQuery) ||
               normalizeInput(university.location).includes(normalizedQuery);
    }

    function showSuggestions(query) {
        showUniversitySuggestions(query);
    }

    function showUniversitySuggestions(query) {
        const suggestionsDropdown = document.getElementById('university-suggestions');
        
        if (query.length < 1) {
            hideSuggestions();
            return;
        }

        const normalizedQuery = normalizeInput(query);
        const filteredUniversities = universitiesData.filter(university => {
            const nameMatch = university.normName.includes(normalizedQuery);
            const locationMatch = university.normLocation.includes(normalizedQuery);
            const typeMatch = university.normType.includes(normalizedQuery);

            const variationMatch = university.normVariations &&
                university.normVariations.some(v => v.includes(normalizedQuery));

            return nameMatch || locationMatch || typeMatch || variationMatch;
        });

        // 関連性でソート（名前の一致を優先）
        filteredUniversities.sort((a, b) => {
            const aNameMatch = a.normName.includes(normalizedQuery);
            const bNameMatch = b.normName.includes(normalizedQuery);
            
            if (aNameMatch && !bNameMatch) return -1;
            if (!aNameMatch && bNameMatch) return 1;
            
            // 名前の先頭マッチを優先
            const aStartsWithMatch = a.normName.startsWith(normalizedQuery);
            const bStartsWithMatch = b.normName.startsWith(normalizedQuery);
            
            if (aStartsWithMatch && !bStartsWithMatch) return -1;
            if (!aStartsWithMatch && bStartsWithMatch) return 1;
            
            return b.overallRating - a.overallRating;
        });

        if (filteredUniversities.length === 0) {
            hideSuggestions();
            return;
        }

        const suggestionsHTML = filteredUniversities.slice(0, 6).map(university => `
            <div class="suggestion-item" onclick="selectSuggestion('${sanitizeForAttribute(university.name)}', ${university.id})">
                <div class="suggestion-content">
                    <div class="suggestion-name">${highlightMatch(sanitizeHTML(university.name), query)}</div>
                    <div class="suggestion-location">${sanitizeHTML(university.type)} - ${sanitizeHTML(university.location)}</div>
                </div>
            </div>
        `).join('');

        suggestionsDropdown.innerHTML = suggestionsHTML;
        suggestionsDropdown.style.display = 'block';
    }

    function hideSuggestions() {
        const suggestionsDropdown = document.getElementById('university-suggestions');
        if (suggestionsDropdown) {
            suggestionsDropdown.style.display = 'none';
        }
    }

    function highlightMatch(text, query) {
        // より柔軟なマッチングのため、クエリを正規化
        const normalizedQuery = normalizeInput(query);
        if (normalizedQuery.length < 1) return text;
        
        // 元のクエリでの完全一致を優先
        const exactRegex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
        if (exactRegex.test(text)) {
            return text.replace(exactRegex, '<strong>$1</strong>');
        }
        
        // 正規化されたクエリでの部分一致
        const partialRegex = new RegExp(`(${escapeRegExp(normalizedQuery)})`, 'gi');
        return text.replace(partialRegex, '<strong>$1</strong>');
    }
    
    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    window.selectSuggestion = function(universityName, universityId) {
        const searchInput = document.getElementById('university-search');
        searchInput.value = universityName;
        hideSuggestions();
        
        // 大学詳細ページに直接移動
        showUniversityDetail(universityId);
    };

    // ページ表示切り替え
    function showPage(pageName) {
        Object.values(pages).forEach(page => {
            page.style.display = 'none';
            page.classList.remove('active');
        });
        
        if (pages[pageName]) {
            pages[pageName].style.display = 'block';
            pages[pageName].classList.add('active');
        }
        
        // Hide the add professor button when not on professors page
        const addProfessorFooter = document.getElementById('add-professor-footer');
        if (addProfessorFooter) {
            if (pageName !== 'professors') {
                addProfessorFooter.style.display = 'none';
            }
            // For professors page, visibility will be handled in showProfessorsList
        }
        
        currentPage = pageName;
    }

    // パンくずリスト更新
    function updateBreadcrumb() {
        const breadcrumb = document.getElementById('breadcrumb-content');
        let content = '';

        switch(currentPage) {
            case 'universities':
                content = '<a onclick="navigateToUniversities()">大学一覧</a>';
                break;
            case 'universityDetail':
                const university = universitiesData.find(u => u.id === currentUniversityId);
                content = `<a onclick="navigateToUniversities()">大学一覧</a> 
                          <span class="breadcrumb-separator">></span> 
                          ${university ? university.name : ''}`;
                break;
            case 'professors':
                const uni = universitiesData.find(u => u.id === currentUniversityId);
                content = `<a onclick="navigateToUniversities()">大学一覧</a> 
                          <span class="breadcrumb-separator">></span> 
                          <a onclick="showUniversityDetail(${currentUniversityId})">${uni ? uni.name : ''}</a>
                          <span class="breadcrumb-separator">></span> 
                          教授一覧`;
                break;
            case 'professorDetail':
                const uniForProf = universitiesData.find(u => u.id === currentUniversityId);
                const professor = professorsData.find(p => p.id === currentProfessorId);
                content = `<a onclick="navigateToUniversities()">大学一覧</a> 
                          <span class="breadcrumb-separator">></span> 
                          <a onclick="showUniversityDetail(${currentUniversityId})">${uniForProf ? uniForProf.name : ''}</a>
                          <span class="breadcrumb-separator">></span> 
                          <a onclick="showProfessorsList(${currentUniversityId})">教授一覧</a>
                          <span class="breadcrumb-separator">></span> 
                          ${professor ? professor.name : ''}`;
                break;
        }

        breadcrumb.innerHTML = content;
    }

    // 大学一覧表示 (virtualized)
    function displayUniversities(searchQuery = '') {
        const universitiesList = document.getElementById('universities-list');
        let filteredUniversities = universitiesData;

        if (searchQuery) {
            const normalizedQuery = normalizeInput(searchQuery);
            filteredUniversities = universitiesData.filter(uni =>
                uni.normName.includes(normalizedQuery) ||
                uni.normLocation.includes(normalizedQuery) ||
                uni.normType.includes(normalizedQuery) ||
                (uni.normVariations && uni.normVariations.some(v => v.includes(normalizedQuery)))
            );

            // 関連性順にソート
            filteredUniversities.sort((a, b) => {
                const aNameMatch = a.normName.includes(normalizedQuery);
                const bNameMatch = b.normName.includes(normalizedQuery);

                if (aNameMatch && !bNameMatch) return -1;
                if (!aNameMatch && bNameMatch) return 1;

                return b.overallRating - a.overallRating;
            });
        } else {
            filteredUniversities.sort((a, b) => b.overallRating - a.overallRating);
        }

        if (filteredUniversities.length === 0) {
            universitiesList.innerHTML = `
            <div class="no-results">
                <h3>検索結果が見つかりませんでした</h3>
                <p>「${searchQuery}」に一致する大学が見つかりません。</p>
                <p>別のキーワードで検索してみてください。</p>
            </div>
            `;
            return;
        }

        currentFilteredUniversities = filteredUniversities;
        currentSearchQuery = searchQuery;
        universityItemHeight = 0;
        renderVirtualUniversities();
    }

    function renderVirtualUniversities() {
        const list = document.getElementById('universities-list');
        if (!currentFilteredUniversities.length) return;

        if (!universityItemHeight && list.firstElementChild) {
            universityItemHeight = list.firstElementChild.getBoundingClientRect().height + 20;
        }

        if (!universityItemHeight) {
            // 初回計測のため1件描画
            const first = currentFilteredUniversities[0];
            list.innerHTML = createUniversityHTML(first);
            universityItemHeight = list.firstElementChild.getBoundingClientRect().height + 20;
        }

        const scrollTop = window.scrollY - list.offsetTop;
        const startIndex = Math.max(0, Math.floor(scrollTop / universityItemHeight) - 5);
        const visibleCount = Math.ceil(window.innerHeight / universityItemHeight) + 10;
        const endIndex = Math.min(currentFilteredUniversities.length, startIndex + visibleCount);

        const visibleItems = currentFilteredUniversities.slice(startIndex, endIndex);

        list.style.paddingTop = `${startIndex * universityItemHeight}px`;
        list.style.paddingBottom = `${(currentFilteredUniversities.length - endIndex) * universityItemHeight}px`;
        list.innerHTML = visibleItems.map(createUniversityHTML).join('');
    }

    function createUniversityHTML(university) {
        const query = currentSearchQuery;
        return `
            <div class="university-card">
                <div class="university-header">
                    <div class="university-content" onclick="showUniversityDetail(${university.id})">
                        <div class="university-name">
                            ${query ? highlightMatch(sanitizeHTML(university.name), query) : sanitizeHTML(university.name)}
                            <span class="university-type">${sanitizeHTML(university.type)}</span>
                        </div>
                        <div class="university-info">
                            📍 ${sanitizeHTML(university.location)} | 設立: ${sanitizeHTML(university.established)}年
                        </div>
                        <div class="rating-display">
                            <span class="stars">${generateStars(university.overallRating)}</span>
                            <span class="rating-text">${university.overallRating.toFixed(1)}</span>
                        </div>
                        <div class="university-stats">
                            <div class="university-stat-item">
                                <div class="university-stat-value">${university.academicRating.toFixed(1)}</div>
                                <div class="university-stat-label">学術レベル</div>
                            </div>
                            <div class="university-stat-item">
                                <div class="university-stat-value">${university.facilityRating.toFixed(1)}</div>
                                <div class="university-stat-label">施設・環境</div>
                            </div>
                            <div class="university-stat-item">
                                <div class="university-stat-value">${university.employmentRating.toFixed(1)}</div>
                                <div class="university-stat-label">就職サポート</div>
                            </div>
                        </div>
                        <div class="review-count">${university.reviewCount}件のレビュー</div>
                    </div>
                </div>
            </div>`;
    }

    // 大学詳細表示
    window.showUniversityDetail = async function(universityId) {
        currentUniversityId = universityId;
        const university = universitiesData.find(u => u.id === universityId);
        const reviews = await fetchUniversityReviews(universityId);
        const professorCount = professorsData.filter(p => p.universityId === universityId).length;

        await updateUniversityStats(universityId);

        const reviewsHtml = reviews.map(review => `
            <div class="review-item">
                <div class="review-header">
                    <span class="review-course">${sanitizeHTML(review.faculty)}</span>
                    <span class="review-date">${sanitizeHTML(review.graduationYear)}年卒業</span>
                </div>
                <div class="review-ratings">
                    <span class="review-rating-item">総合: ${generateStars(review.rating)}</span>
                    <span class="review-rating-item">学術: ${review.academicRating}/5</span>
                    <span class="review-rating-item">施設: ${review.facilityRating}/5</span>
                    <span class="review-rating-item">就職: ${review.employmentRating}/5</span>
                </div>
                ${review.comment ? `<div class="review-comment">${sanitizeHTML(review.comment)}</div>` : ''}
            </div>
        `).join('');

        document.getElementById('university-detail-content').innerHTML = `
            <div class="professor-detail-header">
                <h2>${sanitizeHTML(university.name)}</h2>
                <p>${sanitizeHTML(university.location)} | ${sanitizeHTML(university.type)} | 設立: ${sanitizeHTML(university.established)}年</p>
                <div class="rating-display">
                    <span class="stars">${generateStars(university.overallRating)}</span>
                    <span class="rating-text">${university.overallRating.toFixed(1)}</span>
                </div>
                <div class="university-stats">
                    <div class="university-stat-item">
                        <div class="university-stat-value">${university.academicRating.toFixed(1)}</div>
                        <div class="university-stat-label">学術レベル</div>
                    </div>
                    <div class="university-stat-item">
                        <div class="university-stat-value">${university.facilityRating.toFixed(1)}</div>
                        <div class="university-stat-label">施設・環境</div>
                    </div>
                    <div class="university-stat-item">
                        <div class="university-stat-value">${university.employmentRating.toFixed(1)}</div>
                        <div class="university-stat-label">就職サポート</div>
                    </div>
                </div>
            </div>

            <div class="action-buttons" style="margin: 20px 0; display: flex; gap: 10px;">
                <button class="add-review-btn" onclick="openUniversityReviewModal(${university.id})">
                    大学レビューを書く
                </button>
                <button class="add-review-btn" style="background: linear-gradient(135deg, #48bb78, #38a169);" onclick="showProfessorsList(${university.id})">
                    教授一覧を見る (${professorCount}名)
                </button>
            </div>
            
            <div class="reviews-section">
                <h3>学生のレビュー (${reviews.length}件)</h3>
                ${reviewsHtml || '<p>まだレビューがありません。</p>'}
            </div>
        `;

        showPage('universityDetail');
        updateBreadcrumb();
    };

    // 教授一覧表示
    window.showProfessorsList = async function(universityId) {
        currentUniversityId = universityId;
        currentPage = 'professors';
        
        // Set the current university for professor addition
        const university = universitiesData.find(u => u.id === universityId);
        if (university) {
            currentUniversity = university;
            console.log('Set current university:', university.name);
            
            // Show the add professor button in the footer
            const addProfessorFooter = document.getElementById('add-professor-footer');
            if (addProfessorFooter) {
                addProfessorFooter.style.display = 'flex';
                console.log('Add professor footer button shown');
            } else {
                console.log('Add professor footer button not found');
            }
        }
        
        const professors = professorsData.filter(p => p.universityId === universityId);

        // Load aggregated review stats for each professor
        await Promise.all(
            professors.map(p => updateProfessorStats(p.id))
        );
        
        // 学部フィルター更新
        const departments = [...new Set(professors.map(p => p.department))];
        const departmentFilter = document.getElementById('department-filter');
        departmentFilter.innerHTML = '<option value="">全ての学部</option>';
        departments.forEach(dept => {
            const option = document.createElement('option');
            option.value = dept;
            option.textContent = dept;
            departmentFilter.appendChild(option);
        });

        displayProfessors(professors);
        showPage('professors');
        updateBreadcrumb();
    };

    // 教授一覧表示
    function displayProfessors(professors) {
        const professorsList = document.getElementById('professors-list');

        if (professors.length === 0) {
            if (currentUniversity) {
                professorsList.innerHTML = `
                    <div class="no-results">
                        <h3>該当する教授が見つかりませんでした</h3>
                        <p>検索条件を変更するか、上の「教授を追加」ボタンから新しい教授を追加してください</p>
                    </div>
                `;
            } else {
                professorsList.innerHTML = `
                    <div class="no-results">
                        <h3>該当する教授が見つかりませんでした</h3>
                        <p>検索条件を変更してお試しください</p>
                    </div>
                `;
            }
            return;
        }

        const professorsHtml = professors.map(professor => `
            <div class="professor-card" onclick="showProfessorDetail(${professor.id})">
                <div class="professor-name">${sanitizeHTML(professor.name)}</div>
                <div class="professor-info">
                    ${sanitizeHTML(professor.department)}
                </div>
                
                <div class="rating-display">
                    <span class="stars">${generateStars(professor.overallRating)}</span>
                    <span class="rating-text">${professor.overallRating.toFixed(1)}</span>
                </div>
                
                <div class="professor-stats">
                    <div class="stat-item">
                        <div class="stat-value">${professor.overallRating.toFixed(1)}</div>
                        <div class="stat-label">総合評価</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${professor.difficulty}/5</div>
                        <div class="stat-label">楽単度</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${professor.strictness}/5</div>
                        <div class="stat-label">自由度</div>
                    </div>
                    <div class="stat-item retake-rate">
                        <div class="stat-value">${professor.retakeRate || 0}%</div>
                        <div class="stat-label">再履修希望率</div>
                    </div>
                </div>
                
                <div class="review-count">${professor.reviewCount}件のレビュー</div>
                
                <button class="add-review-btn" onclick="event.stopPropagation(); openProfessorReviewModal(${professor.id})">
                    レビューを書く
                </button>
            </div>
        `).join('');

        // Just display the professors list without the add button at the end
        professorsList.innerHTML = professorsHtml;
    }

    // 教授詳細表示
    window.showProfessorDetail = async function(professorId) {
        currentProfessorId = professorId;
        const professor = professorsData.find(p => p.id === professorId);
        const reviews = await fetchProfessorReviews(professorId);

        await updateProfessorStats(professorId);

        const reviewsHtml = reviews.map(review => `
            <div class="review-item">
                <div class="review-header">
                    <span class="review-course">${sanitizeHTML(review.course)}</span>
                    <span class="review-date">${sanitizeHTML(review.date)}</span>
                </div>
                <div class="review-ratings">
                    <span class="review-rating-item">評価: ${generateStars(review.rating)}</span>
                    <span class="review-rating-item">楽単度: ${review.difficulty}/5</span>
                    <span class="review-rating-item">自由度: ${review.strictness}/5</span>
                    <span class="review-rating-item would-retake ${review.wouldRetake ? 'retake-yes' : 'retake-no'}">
                        再履修希望: ${review.wouldRetake ? 'はい' : 'いいえ'}
                    </span>
                </div>
                <div class="review-details">
                    <span class="review-detail-item">出席: ${getAttendanceText(review.attendanceRequired)}</span>
                    <span class="review-detail-item grade-${sanitizeForAttribute(review.grade?.replace('+', 'plus') || '')}">取得グレード (予想でも可): ${sanitizeHTML(review.grade) || 'N/A'}</span>
                </div>
                ${review.comment ? `<div class="review-comment">${sanitizeHTML(review.comment)}</div>` : ''}
                <div class="review-voting">
                    <button class="vote-button upvote ${hasVoted(review.id, 'up') ? 'voted' : ''}" onclick="voteReview(${review.id}, 'up')" ${hasVoted(review.id) ? 'disabled' : ''}>
                        <svg class="thumbs-icon" viewBox="0 0 24 24">
                            <path d="M7.41,15.41L12,10.83L16.59,15.41L18,14L12,8L6,14L7.41,15.41Z"/>
                        </svg>
                        <div>
                            <div class="vote-count">${review.upvotes || 0}</div>
                            <div class="vote-label">Good</div>
                        </div>
                    </button>
                    <button class="vote-button downvote ${hasVoted(review.id, 'down') ? 'voted' : ''}" onclick="voteReview(${review.id}, 'down')" ${hasVoted(review.id) ? 'disabled' : ''}>
                        <svg class="thumbs-icon" viewBox="0 0 24 24">
                            <path d="M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z"/>
                        </svg>
                        <div>
                            <div class="vote-count">${review.downvotes || 0}</div>
                            <div class="vote-label">Bad</div>
                        </div>
                    </button>
                </div>
            </div>
        `).join('');

        document.getElementById('professor-detail-content').innerHTML = `
            <div class="professor-detail-header">
                <h2>${sanitizeHTML(professor.name)}</h2>
                <p>${sanitizeHTML(professor.department)}</p>

                <div class="rating-display">
                    <span class="stars">${generateStars(professor.overallRating)}</span>
                    <span class="rating-text">${professor.overallRating.toFixed(1)}</span>
                </div>
                <div class="professor-stats">
                    <div class="stat-item">
                        <div class="stat-value">${professor.overallRating.toFixed(1)}</div>
                        <div class="stat-label">総合評価</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${professor.difficulty}/5</div>
                        <div class="stat-label">楽単度</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${professor.strictness}/5</div>
                        <div class="stat-label">自由度</div>
                    </div>
                    <div class="stat-item retake-rate">
                        <div class="stat-value">${professor.retakeRate || 0}%</div>
                        <div class="stat-label">再履修希望率</div>
                    </div>
                </div>
            </div>
            
            <div class="reviews-section">
                <h3>学生のレビュー (${reviews.length}件)</h3>
                ${reviewsHtml || '<p>まだレビューがありません。</p>'}
            </div>
            
            <button class="add-review-btn" onclick="openProfessorReviewModal(${professor.id})">
                レビューを書く
            </button>
        `;

        showPage('professorDetail');
        updateBreadcrumb();
    };

    // ナビゲーション関数
    window.navigateToUniversities = function() {
        currentUniversityId = null;
        currentProfessorId = null;
        showPage('universities');
        displayUniversities(currentSearchQuery);
        updateBreadcrumb();
    };

    // 星評価生成
    function generateStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;

        return '★'.repeat(fullStars) +
            (hasHalfStar ? '☆' : '') +
            '☆'.repeat(5 - fullStars - (hasHalfStar ? 1 : 0));
    }

    // Vote tracking storage
    let userVotes = JSON.parse(localStorage.getItem('reviewVotes') || '{}');

    // Check if user has voted on a review
    function hasVoted(reviewId, voteType = null) {
        if (voteType) {
            return userVotes[reviewId] === voteType;
        }
        return reviewId in userVotes;
    }

    // Vote on a review
    window.voteReview = function(reviewId, voteType) {
        // Check if user has already voted
        if (hasVoted(reviewId)) {
            alert('既にこのレビューに投票済みです。');
            return;
        }

        // Find and update the review
        const review = reviewsData.find(r => r.id === reviewId);
        if (!review) return;

        // Update vote counts
        if (voteType === 'up') {
            review.upvotes = (review.upvotes || 0) + 1;
        } else if (voteType === 'down') {
            review.downvotes = (review.downvotes || 0) + 1;
        }

        // Record user's vote
        userVotes[reviewId] = voteType;
        localStorage.setItem('reviewVotes', JSON.stringify(userVotes));

        // Refresh the professor detail page to show updated votes
        if (currentProfessorId) {
            showProfessorDetail(currentProfessorId);
        }
    };

    // Helper function for attendance text
    function getAttendanceText(attendanceRequired) {
        switch(attendanceRequired) {
            case 'required': return '有';
            case 'none': return '無';
            default: return 'N/A';
        }
    }

    // イベントリスナー設定
    function setupEventListeners() {
        // 大学検索
        const universitySearchBtn = document.getElementById('university-search-btn');
        const universitySearchInput = document.getElementById('university-search');
        
        // 大学検索とオートサジェスト
        universitySearchInput.addEventListener('input', function() {
            const query = this.value.trim();
            if (query.length > 0) {
                showUniversitySuggestions(query);
            } else {
                hideSuggestions();
                displayUniversities();
            }
        });
        
        universitySearchInput.addEventListener('blur', function() {
            // 少し遅延させてクリックイベントを処理できるようにする
            setTimeout(() => hideSuggestions(), 200);
        });
        
        universitySearchInput.addEventListener('focus', function() {
            const query = this.value.trim();
            if (query.length > 0) {
                showUniversitySuggestions(query);
            }
        });
        
        universitySearchBtn.addEventListener('click', () => {
            displayUniversities(universitySearchInput.value);
            hideSuggestions();
        });
        
        universitySearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                displayUniversities(universitySearchInput.value);
                hideSuggestions();
            }
        });
        
        // 外部クリックでサジェストを閉じる
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.search-wrapper')) {
                hideSuggestions();
            }
        });

        // 教授検索
        const professorSearchBtn = document.getElementById('professor-search-btn');
        const professorSearchInput = document.getElementById('professor-search');
        const departmentFilter = document.getElementById('department-filter');
        
        function searchProfessors() {
            const query = professorSearchInput.value.toLowerCase();
            const selectedDepartment = departmentFilter.value;
            
            let professors = professorsData.filter(p => p.universityId === currentUniversityId);
            
            if (query) {
                professors = professors.filter(p => 
                    p.name.toLowerCase().includes(query) ||
                    p.department.toLowerCase().includes(query)
                );
            }
            
            if (selectedDepartment) {
                professors = professors.filter(p => p.department === selectedDepartment);
            }
            
            displayProfessors(professors);
        }

        professorSearchBtn.addEventListener('click', searchProfessors);
        professorSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchProfessors();
            }
        });
        departmentFilter.addEventListener('change', searchProfessors);

        const sentinel = document.getElementById('load-more-universities');
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                renderVirtualUniversities();
            }
        }, { rootMargin: '200px' });
        observer.observe(sentinel);

        window.addEventListener('scroll', throttle(renderVirtualUniversities, 100));

        // モーダル関連
        setupModalListeners();
        setupRatingInputs();
    }

    // モーダル関連
    function setupModalListeners() {
        const modals = ['university-review-modal', 'professor-review-modal'];
        
        modals.forEach(modalId => {
            const modal = document.getElementById(modalId);
            const closeBtn = modal.querySelector('.close');
            
            closeBtn.addEventListener('click', () => {
                modal.style.display = 'none';
            });
            
            window.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        });

        // フォーム送信
        document.getElementById('university-review-form').addEventListener('submit', submitUniversityReview);
        document.getElementById('professor-review-form').addEventListener('submit', submitProfessorReview);
    }

    // レビューモーダル開く
    window.openUniversityReviewModal = function(universityId) {
        currentUniversityId = universityId;
        document.getElementById('university-review-modal').style.display = 'block';
        
        // Check rate limiting and update submit button
        setTimeout(() => {
            updateSubmitButtonState('#university-review-form button[type="submit"]', 'university');
        }, 100);
    };

    window.openProfessorReviewModal = function(professorId) {
        currentProfessorId = professorId;
        document.getElementById('professor-review-modal').style.display = 'block';
        
        // Check rate limiting and update submit button
        setTimeout(() => {
            updateSubmitButtonState('#professor-review-form button[type="submit"]', 'professor');
        }, 100);
    };

    // 星評価入力システム
    function setupRatingInputs() {
        document.querySelectorAll('.rating-input').forEach(ratingContainer => {
            const stars = ratingContainer.querySelectorAll('span');
            let currentRating = 0;

            stars.forEach((star, index) => {
                star.addEventListener('click', function() {
                    currentRating = index + 1;
                    updateStars(stars, currentRating);
                    ratingContainer.dataset.value = currentRating;
                });

                star.addEventListener('mouseenter', function() {
                    updateStars(stars, index + 1);
                });
            });

            ratingContainer.addEventListener('mouseleave', function() {
                updateStars(stars, currentRating);
            });
        });

        // 再履修希望ボタンの設定
        document.querySelectorAll('.retake-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.retake-btn').forEach(b => b.classList.remove('selected'));
                this.classList.add('selected');
            });
        });


    }

    function updateStars(stars, rating) {
        stars.forEach((star, index) => {
            if (index < rating) {
                star.classList.add('active');
            } else {
                star.classList.remove('active');
            }
        });
    }

    // レビュー投稿
    async function submitUniversityReview(e) {
        e.preventDefault();

        // Check rate limiting
        if (!checkRateLimit('university')) {
            return;
        }

        const form = e.target;
        const overallRating = parseInt(form.querySelector('[data-rating="overall"]').dataset.value) || 0;
        const academicRating = parseInt(form.querySelector('[data-rating="academic"]').dataset.value) || 0;
        const facilityRating = parseInt(form.querySelector('[data-rating="facility"]').dataset.value) || 0;
        const employmentRating = parseInt(form.querySelector('[data-rating="employment"]').dataset.value) || 0;
        const faculty = document.getElementById('uni-faculty').value;
        const graduationYear = document.getElementById('graduation-year').value;
        const comment = document.getElementById('uni-comment').value;

        if (!overallRating || !academicRating || !facilityRating || !employmentRating || !faculty) {
            alert('すべての項目を入力してください。');
            return;
        }

        const newReview = {
            universityId: currentUniversityId,
            rating: overallRating,
            academicRating: academicRating,
            facilityRating: facilityRating,
            employmentRating: employmentRating,
            comment: validateAndSanitize(comment, 2000),
            faculty: validateAndSanitize(faculty, 100),
            graduationYear: parseInt(graduationYear) || new Date().getFullYear(),
            date: new Date().toISOString().split('T')[0]
        };

        try {
            await addDoc(collection(db, 'universityReviews'), newReview);
        } catch (err) {
            console.error('Failed to submit university review:', err);
            alert('レビューの送信中にエラーが発生しました');
            return;
        }

        await updateUniversityStats(currentUniversityId);

        form.reset();
        resetStarRatings();
        document.getElementById('university-review-modal').style.display = 'none';
        alert('レビューが投稿されました！');

        showUniversityDetail(currentUniversityId);
        displayUniversities();
    }

    async function submitProfessorReview(e) {
        e.preventDefault();

        // Check rate limiting
        if (!checkRateLimit('professor')) {
            return;
        }

        const form = e.target;
        const overallRating = parseInt(form.querySelector('[data-rating="overall"]').dataset.value) || 0;
        const difficulty = parseInt(form.querySelector('[data-rating="difficulty"]').dataset.value) || 0;
        const strictness = parseInt(form.querySelector('[data-rating="strictness"]').dataset.value) || 0;
        const course = document.getElementById('course').value;
        const semester = document.getElementById('semester').value;
        const comment = document.getElementById('prof-comment').value;
        const wouldRetake = document.querySelector('input[name="would-retake"]:checked')?.value;
        const attendanceRequired = document.getElementById('attendance').value;
        const grade = document.getElementById('professor-grade').value;

        if (!overallRating || !difficulty || !strictness || !course) {
            alert('すべての項目を入力してください。');
            return;
        }

        if (!wouldRetake) {
            alert('「この講義をもう一度履修したいと思いますか？」の項目を選択してください。');
            return;
        }

        if (!attendanceRequired) {
            alert('出席確認を選択してください。');
            return;
        }

        if (!grade) {
            alert('取得グレード (予想でも可) を選択してください。');
            return;
        }

        const newReview = {
            professorId: currentProfessorId,
            rating: overallRating,
            difficulty: difficulty,
            strictness: strictness,
            comment: validateAndSanitize(comment, 2000),
            course: validateAndSanitize(course, 100),
            semester: validateAndSanitize(semester, 20) || '2024年',
            wouldRetake: wouldRetake === 'yes',
            attendanceRequired: attendanceRequired,
            grade: validateAndSanitize(grade, 10),
            anonymous: true,
            date: new Date().toISOString().split('T')[0],
            upvotes: 0,
            downvotes: 0
        };

        try {
            await addDoc(collection(db, 'reviews'), newReview);
        } catch (err) {
            console.error('Failed to submit professor review:', err);
            alert('レビューの送信中にエラーが発生しました');
            return;
        }

        await updateProfessorStats(currentProfessorId);

        form.reset();
        resetStarRatings();
        document.querySelectorAll('.retake-btn').forEach(btn => btn.classList.remove('selected'));
        document.getElementById('attendance').value = '';
        document.getElementById('professor-review-modal').style.display = 'none';
        alert('レビューが投稿されました！');

        showProfessorDetail(currentProfessorId);
    }

    function resetStarRatings() {
        document.querySelectorAll('.rating-input span').forEach(star => {
            star.classList.remove('active');
        });
        document.querySelectorAll('.rating-input').forEach(container => {
            container.dataset.value = '0';
        });
    }

    // 統計更新
    async function updateUniversityStats(universityId) {
        const university = universitiesData.find(u => u.id === universityId);
        const reviews = await fetchUniversityReviews(universityId);

        if (reviews.length > 0) {
            let overall = 0, academic = 0, facility = 0, employment = 0;
            for (const r of reviews) {
                overall += r.rating;
                academic += r.academicRating;
                facility += r.facilityRating;
                employment += r.employmentRating;
            }
            university.overallRating = overall / reviews.length;
            university.academicRating = academic / reviews.length;
            university.facilityRating = facility / reviews.length;
            university.employmentRating = employment / reviews.length;
            university.reviewCount = reviews.length;
        } else {
            university.overallRating = 0;
            university.academicRating = 0;
            university.facilityRating = 0;
            university.employmentRating = 0;
            university.reviewCount = 0;
        }
    }

    async function updateProfessorStats(professorId) {
        const professor = professorsData.find(p => p.id === professorId);
        const reviews = await fetchProfessorReviews(professorId);

        if (reviews.length > 0) {
            let overall = 0, difficulty = 0, strictness = 0, retakeTotal = 0, retakeYes = 0;
            for (const r of reviews) {
                overall += r.rating;
                difficulty += r.difficulty;
                strictness += r.strictness;
                if (r.wouldRetake !== undefined) {
                    retakeTotal++;
                    if (r.wouldRetake === true) retakeYes++;
                }
            }
            professor.overallRating = overall / reviews.length;
            professor.difficulty = Math.round(difficulty / reviews.length);
            professor.strictness = Math.round(strictness / reviews.length);
            professor.reviewCount = reviews.length;
            professor.retakeRate = retakeTotal ? Math.round((retakeYes / retakeTotal) * 100) : 0;
        } else {
            professor.overallRating = 0;
            professor.difficulty = 0;
            professor.strictness = 0;
            professor.reviewCount = 0;
            professor.retakeRate = 0;
        }
    }

    // Add professor functions
    function openAddProfessorModal() {
        const modal = document.getElementById('addProfessorModal');
        if (modal && currentUniversity) {
            modal.style.display = 'block';
            
            // Check rate limiting and update submit button
            setTimeout(() => {
                updateSubmitButtonState('#addProfessorForm button[type="submit"]', 'professor_add');
            }, 100);
        } else {
            alert('大学を選択してその大学の教授一覧ページから教授を追加してください。');
        }
    }

    function openAddProfessorForUniversity(universityId, universityName, department = '') {
        console.log('Opening modal for university:', universityId, universityName, typeof universityId);
        
        const modal = document.getElementById('addProfessorModal');
        if (modal) {
            // Store university ID in a data attribute on the modal for easy access
            modal.setAttribute('data-university-id', String(universityId));
            modal.setAttribute('data-university-name', universityName || '');
            modal.style.display = 'block';
            
            // Check rate limiting and update submit button
            setTimeout(() => {
                updateSubmitButtonState('#addProfessorForm button[type="submit"]', 'professor_add');
            }, 100);
            
            // Also store in window for backup
            window.currentSelectedUniversityId = universityId;
            window.currentSelectedUniversityName = universityName;
            
            console.log('Modal opened with university ID:', universityId);
            console.log('Modal data-university-id attribute:', modal.getAttribute('data-university-id'));
        } else {
            console.error('Modal not found!');
        }
    }

    function closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    }

    async function submitProfessorData(event) {
        event.preventDefault();
        console.log('Form submitted');
        
        // Check rate limiting
        if (!checkRateLimit('add-professor')) {
            return;
        }
        
        const formData = new FormData(event.target);
        
        // Use the currently viewed university
        let universityId = null;
        let universityName = '';
        
        if (currentUniversity) {
            universityId = currentUniversity.id;
            universityName = currentUniversity.name;
            console.log('Using current university:', universityId, universityName);
        } else {
            console.error('No current university found');
        }
        
        const professorData = {
            name: validateAndSanitize(formData.get('name'), 100),
            department: validateAndSanitize(formData.get('department'), 100),
            universityId: universityId
        };
        
        console.log('Final form data:', professorData);
        
        if (!professorData.name) {
            alert('教授名を入力してください。');
            return;
        }
        

        
        if (!professorData.department) {
            alert('学部・学科を入力してください。');
            return;
        }
        
        if (!professorData.universityId) {
            alert('大学の詳細ページから教授を追加してください。');
            console.error('University ID is invalid:', professorData.universityId);
            return;
        }
        
        const university = universitiesData.find(u => u.id === professorData.universityId);
        if (!university) {
            alert('大学が見つかりません。');
            return;
        }
        
        const newId = Math.max(...professorsData.map(p => p.id), 0) + 1;

        const newProfessor = {
            id: newId,
            name: professorData.name,
            universityId: professorData.universityId,
            department: professorData.department,
            overallRating: 0,
            difficulty: 0,
            strictness: 0,
            reviewCount: 0,
            retakeRate: 0
        };
        try {
            await addProfessorToFirestore(newProfessor);
            professorsData.push(newProfessor);
            console.log('Professor added successfully:', newProfessor);
            closeModal('addProfessorModal');
            alert(`${university.name}に${professorData.name}教授を追加しました！`);
            event.target.reset();

            // Refresh the current professor list to show the new professor
            if (currentPage === 'professors' && currentUniversityId) {
                showProfessorsList(currentUniversityId);
            }
        } catch (err) {
            console.error('Failed to add professor to Firestore:', err);
            alert('教授の追加中にエラーが発生しました');
        }
    }

    // Make functions globally available
    window.openAddProfessorModal = openAddProfessorModal;
    window.openAddProfessorForUniversity = openAddProfessorForUniversity;
    window.submitProfessorData = submitProfessorData;
    window.closeModal = closeModal;
});
