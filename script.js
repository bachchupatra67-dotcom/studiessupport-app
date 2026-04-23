// ==========================================
// 1. NAVIGATION & SMART HISTORY
// ==========================================
let pageHistory = [];
let currentPage = 'home';
let myBackpack = JSON.parse(localStorage.getItem('studyBackpack')) || [];

function renderMath() {
    if (window.MathJax) {
        setTimeout(() => { MathJax.typesetPromise().catch((err) => console.log('MathJax error:', err)); }, 100);
    }
}

const generateCardHTML = (item) => {
    let linkBtn = item.file_url ? `<a href="${item.file_url}" target="_blank" style="display: inline-block; background: #2563eb; color: #ffffff; padding: 10px 20px; border-radius: 10px; text-decoration: none; font-size: 14px; font-weight: 700; margin-top: 12px;">Download PDF</a>` : '';

    let formattedText = item.content_text || '';
    
    // 🌟 ROBUST MATH AUTO-CORRECTOR 
    formattedText = formattedText.replace(/\\\\times|\\times/g, ' × ');
    formattedText = formattedText.replace(/\\\\div|\\div/g, ' ÷ ');
    formattedText = formattedText.replace(/\\\\rightarrow|\\rightarrow/g, ' → ');
    formattedText = formattedText.replace(/\\\\Rightarrow|\\Rightarrow/g, ' ⇒ ');
    
    formattedText = formattedText.replace(/([a-zA-Z])_([0-9a-zA-Z]+)/g, '$1<sub>$2</sub>');
    formattedText = formattedText.replace(/([a-zA-Z0-9])\^([0-9a-zA-Z]+)/g, '$1<sup>$2</sup>');
    
    formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, '<strong style="color: #0f172a; font-weight: 900;">$1</strong>');
    
    let textNotes = formattedText ? `<div style="background: #f8fafc; padding: 12px; border-radius: 8px; font-size: 14px; color: #334155; margin-top: 12px; white-space: pre-wrap; overflow-x: auto; font-family: sans-serif; line-height: 1.6;">${formattedText}</div>` : '';

    let subchapterBadge = item.subchapter ? `<span style="background: #fef3c7; color: #d97706; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 800; display: inline-block; margin-bottom: 8px; margin-left: 6px;">${item.subchapter}</span>` : '';
    let textbookDisplay = item.textbook ? `<div style="color: #64748b; font-size: 12px; margin-top: 6px; display: flex; align-items: center; gap: 4px;"><i data-lucide="book-open" style="width: 14px; height: 14px;"></i> ${item.textbook}</div>` : '';

    const isSaved = myBackpack.some(savedId => String(savedId) === String(item.id));
    const bookmarkColor = isSaved ? '#f59e0b' : '#94a3b8';
    const bookmarkFill = isSaved ? '#f59e0b' : 'none';

    return `
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.02); margin-bottom: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <h4 style="color: #0f172a; font-size: 16px; font-weight: 800; margin: 0 0 4px 0;">${item.chapter || 'Study Material'}</h4>
                <button onclick="toggleBookmark('${item.id}')" style="background: none; border: none; cursor: pointer; padding: 0;">
                    <i data-lucide="bookmark" style="color: ${bookmarkColor}; width: 24px; height: 24px;" fill="${bookmarkFill}"></i>
                </button>
            </div>
            <span style="background: #eff6ff; color: #2563eb; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 800; display: inline-block; margin-bottom: 8px;">${item.content_type}</span>
            ${subchapterBadge}
            <p style="color: #64748b; font-size: 13px; margin: 0;">${item.class_level} • ${item.subject}</p>
            ${textbookDisplay}
            ${textNotes}
            ${linkBtn}
        </div>`;
};

function navigateTo(pageName, isBack = false) {
    if (pageName === 'admin' && localStorage.getItem('isAdminLoggedIn') !== 'true') { showLoginModal(); return; }
    if (!isBack && currentPage !== pageName) { pageHistory.push(currentPage); }
    currentPage = pageName;

    const backBtn = document.getElementById('universal-back-btn');
    if (backBtn) backBtn.style.display = (pageName === 'home') ? 'none' : 'flex';
    if (pageName === 'home') pageHistory = [];

    document.querySelectorAll('main').forEach(page => { page.style.display = 'none'; page.classList.remove('active'); });

    const targetPage = document.getElementById('page-' + pageName);
    if (targetPage) { targetPage.style.display = 'block'; targetPage.classList.add('active'); }

    if (pageName === 'backpack') renderBackpack();
    else if (pageName === 'solutions') updateSolutionsSubjectDropdown();
    else renderStudentMaterials();

    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenu && mobileMenu.style.display === 'block') toggleMobileMenu();
    window.scrollTo(0, 0);
}

function goBack() { if (pageHistory.length > 0) { navigateTo(pageHistory.pop(), true); } else { navigateTo('home'); } }
function toggleMobileMenu() { const menu = document.getElementById('mobile-menu'); if (menu) menu.style.display = (menu.style.display === 'block') ? 'none' : 'block'; }
function showLoginModal() { document.getElementById('login-modal')?.classList.remove('hidden'); }
function closeLoginModal() { document.getElementById('login-modal')?.classList.add('hidden'); }

// ==========================================
// 2. SUPABASE INITIALIZATION
// ==========================================
let supabaseClient = null;
let editingMaterialId = null;
let allStudyMaterials = [];

try {
    if (typeof supabase !== 'undefined') {
        const supabaseUrl = 'https://gycmmdlkppyavwkqdxym.supabase.co';
        const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5Y21tZGxrcHB5YXZ3a3FkeHltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NjE3NTgsImV4cCI6MjA5MTIzNzc1OH0.REcaVfmLe6SKMrPcvo13lq90CH762AaOhNOOwRgYNSc';
        supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);
    }
} catch (error) { console.error("Supabase error:", error); }

function initApp() {
    navigateTo('home'); applyLogo(localStorage.getItem('customSiteLogo')); fetchAndDisplayMaterials();
    if (window.lucide) lucide.createIcons();
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initApp); else initApp();

// ==========================================
// 3. ADMIN PANEL LOGIC
// ==========================================
async function loginAdmin() {
    const email = document.getElementById('admin-email').value.trim();
    const password = document.getElementById('admin-password').value.trim();
    if (!email || !password) return alert("Please enter both email and password.");
    try {
        const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) throw error;
        localStorage.setItem('isAdminLoggedIn', 'true');
        closeLoginModal(); navigateTo('admin');
    } catch (error) { alert("Login Failed: " + error.message); } 
}

async function logoutAdmin() {
    if (supabaseClient) await supabaseClient.auth.signOut();
    localStorage.removeItem('isAdminLoggedIn');
    alert("Logged out successfully."); navigateTo('home');
}

function updateSubjectDropdown() {
    const board = document.getElementById('admin-board-select').value;
    const subjectSelect = document.getElementById('admin-subject-select');
    
    let standardSubjects = board === 'ICSE' 
        ? ['English Language', 'English Literature', 'Mathematics', 'Science (Physics)', 'Science (Chemistry)', 'Science (Biology)', 'Hindi', 'History & Civics', 'Geography', 'Computer Science']
        : ['English Language', 'English Literature', 'Hindi', 'Physics', 'Chemistry', 'Mathematics', 'Biology', 'Computer Science', 'Accounts', 'Business Studies', 'Economics', 'History'];

    const dbSubjects = allStudyMaterials.filter(m => m.board === board).map(m => m.subject).filter(Boolean);
    const allSubjects = [...new Set([...standardSubjects, ...dbSubjects])].sort();

    subjectSelect.innerHTML = '<option value="">Select Subject</option>' + allSubjects.map(sub => `<option value="${sub}">${sub}</option>`).join('');
    if (board) subjectSelect.innerHTML += `<option value="CUSTOM_NEW" style="font-weight:bold; color:#2563eb;">+ Add New Subject...</option>`;
    toggleCustomSubject(); 
}

function toggleCustomSubject() {
    const select = document.getElementById('admin-subject-select');
    const customInput = document.getElementById('admin-custom-subject');
    if (select.value === 'CUSTOM_NEW') { customInput.style.display = 'block'; customInput.required = true; } 
    else { customInput.style.display = 'none'; customInput.required = false; customInput.value = ''; }
}

async function handleMaterialUpload(event) {
    event.preventDefault();
    if (!supabaseClient) return alert("Upload system unavailable.");

    const boardValue = document.getElementById('admin-board-select').value;
    const classValue = document.getElementById('admin-class-select').value;
    const typeValue = document.getElementById('admin-type-select').value;
    let subjectValue = document.getElementById('admin-subject-select').value;
    if (subjectValue === 'CUSTOM_NEW') subjectValue = document.getElementById('admin-custom-subject').value.trim();
    
    const chapterValue = document.getElementById('admin-chapter-input').value.trim();
    const subchapterValue = document.getElementById('admin-subchapter-input').value.trim();
    const textbookValue = document.getElementById('admin-textbook-input').value.trim();
    const textContent = document.getElementById('admin-text-input').value;
    const isBulk = document.getElementById('admin-bulk-checkbox')?.checked;
    
    const file = document.getElementById('file-upload').files[0];
    if (!file && textContent.trim() === "" && !editingMaterialId) return alert("Please add text content or a file!");

    const btn = event.target.querySelector('button[type="submit"]');
    btn.innerText = "Saving... ⏳"; btn.disabled = true;

    try {
        let finalFileUrl = editingMaterialId ? (allStudyMaterials.find(m => m.id === editingMaterialId)?.file_url || "") : "";
        if (file) {
            const safeFileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${file.name.split('.').pop()}`;
            const { error: uploadError } = await supabaseClient.storage.from('study-materials').upload(safeFileName, await file.arrayBuffer(), { contentType: file.type });
            if (uploadError) throw uploadError;
            finalFileUrl = supabaseClient.storage.from('study-materials').getPublicUrl(safeFileName).data.publicUrl;
        }

        if (isBulk && textContent && !editingMaterialId) {
            // 🌟 FIXED BULK SPLITTER: Handles Gemini's bold stars, spaces, etc.
            const blocks = textContent.split(/(?=(?:\*\*|\s)*(?:Q|Question)\.?\s*\d+)/i).filter(t => t.trim() !== "");
            const uploadPromises = blocks.map(block => supabaseClient.from('study_materials').insert([{
                board: boardValue, subject: subjectValue, class_level: classValue, chapter: chapterValue, subchapter: subchapterValue, textbook: textbookValue, content_type: typeValue, content_text: block.trim(), file_url: finalFileUrl
            }]));
            await Promise.all(uploadPromises);
            alert(`Success! Saved ${blocks.length} individual questions.`);
        } else {
            const uploadData = { board: boardValue, subject: subjectValue, class_level: classValue, chapter: chapterValue, subchapter: subchapterValue, textbook: textbookValue, content_type: typeValue, content_text: textContent, file_url: finalFileUrl };
            if (editingMaterialId) await supabaseClient.from('study_materials').update(uploadData).eq('id', editingMaterialId);
            else await supabaseClient.from('study_materials').insert([uploadData]);
            alert("Success!");
        }

        editingMaterialId = null; event.target.reset(); toggleCustomSubject(); fetchAndDisplayMaterials();
    } catch (error) { alert("Error: " + error.message); } 
    finally { btn.innerText = "Upload Material"; btn.disabled = false; }
}

function handleLogoUpload(event) {
    const file = event.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = e => { localStorage.setItem('customSiteLogo', e.target.result); applyLogo(e.target.result); };
    reader.readAsDataURL(file);
}
function applyLogo(logoUrl) { if (logoUrl) document.querySelectorAll('.site-logo').forEach(img => { img.src = logoUrl; img.style.display = 'block'; }); }

async function deleteMaterial(id) {
    if (!confirm("Delete this?")) return;
    await supabaseClient.from('study_materials').delete().eq('id', id); fetchAndDisplayMaterials(); 
}

function editMaterial(id) {
    const item = allStudyMaterials.find(m => m.id === id);
    if (!item) return;
    editingMaterialId = item.id; 

    document.getElementById('admin-board-select').value = item.board || '';
    updateSubjectDropdown(); 
    
    const select = document.getElementById('admin-subject-select');
    const options = Array.from(select.options).map(opt => opt.value);
    
    if (options.includes(item.subject)) { select.value = item.subject; } 
    else { select.value = 'CUSTOM_NEW'; toggleCustomSubject(); document.getElementById('admin-custom-subject').value = item.subject || ''; }

    document.getElementById('admin-class-select').value = item.class_level || '';
    document.getElementById('admin-type-select').value = item.content_type || '';
    document.getElementById('admin-chapter-input').value = item.chapter || '';
    document.getElementById('admin-subchapter-input').value = item.subchapter || '';
    const textbookInput = document.getElementById('admin-textbook-input');
    if(textbookInput) textbookInput.value = item.textbook || '';
    document.getElementById('admin-text-input').value = item.content_text || '';

    document.querySelector('#upload-form button[type="submit"]').innerText = "Update Material";
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function fetchAndDisplayMaterials() {
    if (!supabaseClient) return;
    try {
        const { data, error } = await supabaseClient.from('study_materials').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        allStudyMaterials = data;
        renderAdminMaterials(); renderStudentMaterials(); updateAdminDatalists(); updateSolutionsSubjectDropdown();
        if (currentPage === 'backpack') renderBackpack();
    } catch (error) { console.error(error); }
}

function renderAdminMaterials() {
    const container = document.getElementById('admin-materials-container');
    if (!container) return;
    const classFilter = document.getElementById('admin-filter-class')?.value || '';
    const subFilter = document.getElementById('admin-filter-subject')?.value || '';

    let filtered = allStudyMaterials;
    if (classFilter) filtered = filtered.filter(m => m.class_level === classFilter);
    if (subFilter) filtered = filtered.filter(m => m.subject === subFilter);

    container.innerHTML = filtered.length === 0 ? `<p style="text-align: center; margin:40px 0;">No materials found.</p>` : filtered.map(item => `
        <div style="background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 16px; margin-bottom: 12px; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
            <div><h4 style="font-size: 15px; font-weight: 700; margin: 0;">${item.chapter} ${item.subchapter ? `(${item.subchapter})` : ''}</h4>
            <p style="font-size: 12px; color: #64748b; margin: 0;">${item.class_level} • ${item.subject}</p></div>
            <div style="display:flex;">
                <button onclick="deleteMaterial(${item.id})" style="background:#fef2f2; color:red; border:1px solid #fecaca; padding:6px 12px; border-radius:8px; font-weight:700; margin-right:8px;">Delete</button>
                <button onclick="editMaterial(${item.id})" style="background:#fff7ed; color:#ea580c; border:1px solid #fed7aa; padding:6px 12px; border-radius:8px; font-weight:700;">Edit</button>
            </div>
        </div>`).join('');
    renderMath();
}

function updateAdminDatalists() {
    document.getElementById('admin-chapters-list').innerHTML = [...new Set(allStudyMaterials.map(m => m.chapter).filter(Boolean))].map(c => `<option value="${c}">`).join('');
    document.getElementById('admin-subchapters-list').innerHTML = [...new Set(allStudyMaterials.map(m => m.subchapter).filter(Boolean))].map(sc => `<option value="${sc}">`).join('');
}


// ==========================================
// 4. KNOWLEDGEBOAT SOLUTIONS UI LOGIC
// ==========================================
let currentSolutionChapter = '';
let activeSolTab = 'exercise';
let activeSolSubchapter = '';
let activeSolQuestion = 'all';

function updateSolutionsSubjectDropdown() {
    const classSelect = document.getElementById('sol-filter-class');
    const subjectSelect = document.getElementById('sol-filter-subject');
    if (!classSelect || !subjectSelect) return;

    let validMaterials = allStudyMaterials.filter(m => m.content_type === 'Textbook Solutions');
    if (classSelect.value) validMaterials = validMaterials.filter(m => m.class_level === classSelect.value);

    const currentSub = subjectSelect.value;
    const subjects = [...new Set(validMaterials.map(m => m.subject).filter(Boolean))].sort();
    subjectSelect.innerHTML = '<option value="">Select Subject...</option>' + subjects.map(s => `<option value="${s}">${s}</option>`).join('');
    if (subjects.includes(currentSub)) subjectSelect.value = currentSub;
}

function renderSolutionsChapters() {
    updateSolutionsSubjectDropdown();
    
    const classVal = document.getElementById('sol-filter-class').value;
    const subjectVal = document.getElementById('sol-filter-subject').value;
    const chapterList = document.getElementById('solutions-chapter-list');
    const cardsContainer = document.getElementById('solutions-materials-container');
    
    cardsContainer.style.display = 'none';
    chapterList.style.display = 'flex';

    if (!classVal || !subjectVal) {
        chapterList.innerHTML = `<div style="text-align: center; padding: 40px; border: 1px dashed #cbd5e1; border-radius: 16px;"><p style="color: #64748b; font-size: 14px; font-weight: 500;">Select a Class and Subject above to view chapters.</p></div>`;
        return;
    }

    const filtered = allStudyMaterials.filter(m => m.content_type === 'Textbook Solutions' && m.class_level === classVal && m.subject === subjectVal);
    const chapters = [...new Set(filtered.map(m => m.chapter).filter(Boolean))];

    if (chapters.length === 0) {
        chapterList.innerHTML = `<div style="text-align: center; padding: 40px; background: #f8fafc; border-radius: 16px;"><p style="color: #64748b; font-size: 14px; font-weight: 500;">No textbook solutions found for this subject.</p></div>`;
        return;
    }

    chapterList.innerHTML = chapters.map((chap, index) => {
        const num = String(index + 1).padStart(2, '0');
        return `
        <div onclick="openSolutionsModal('${chap.replace(/'/g, "\\'")}')" style="display: flex; align-items: center; gap: 16px; padding: 20px 16px; border-bottom: 1px solid #f1f5f9; cursor: pointer; transition: background 0.2s;">
            <span style="font-size: 16px; font-weight: 800; color: #f472b6;">${num}</span>
            <span style="font-size: 15px; font-weight: 700; color: #334155; flex: 1;">${chap}</span>
        </div>`;
    }).join('');
}

function openSolutionsModal(chapterName) {
    currentSolutionChapter = chapterName;
    activeSolTab = 'exercise';
    
    const classVal = document.getElementById('sol-filter-class').value;
    const subjectVal = document.getElementById('sol-filter-subject').value;
    
    const subchapters = [...new Set(allStudyMaterials.filter(m => 
        m.content_type === 'Textbook Solutions' && m.class_level === classVal && m.subject === subjectVal && m.chapter === currentSolutionChapter
    ).map(m => m.subchapter).filter(Boolean))].sort();

    activeSolSubchapter = subchapters.length > 0 ? subchapters[0] : '';
    activeSolQuestion = 'all'; 

    document.getElementById('solutions-modal').style.display = 'flex';
    renderSolutionsModalContent();
}

function switchSolutionsTab(tabName) {
    activeSolTab = tabName;
    renderSolutionsModalContent();
}

function renderSolutionsModalContent() {
    const tabEx = document.getElementById('tab-exercise');
    const tabQ = document.getElementById('tab-questions');
    const listContainer = document.getElementById('solutions-exercise-list');

    if (activeSolTab === 'exercise') {
        tabEx.style.color = '#0f8368'; tabEx.style.borderBottom = '2px solid #0f8368'; tabEx.style.background = 'white'; tabEx.style.fontWeight = '800';
        tabQ.style.color = '#64748b'; tabQ.style.borderBottom = 'none'; tabQ.style.background = 'transparent'; tabQ.style.fontWeight = '600';
    } else {
        tabQ.style.color = '#0f8368'; tabQ.style.borderBottom = '2px solid #0f8368'; tabQ.style.background = 'white'; tabQ.style.fontWeight = '800';
        tabEx.style.color = '#64748b'; tabEx.style.borderBottom = 'none'; tabEx.style.background = 'transparent'; tabEx.style.fontWeight = '600';
    }

    const classVal = document.getElementById('sol-filter-class').value;
    const subjectVal = document.getElementById('sol-filter-subject').value;
    
    let chapterMaterials = allStudyMaterials.filter(m => 
        m.content_type === 'Textbook Solutions' && m.class_level === classVal && m.subject === subjectVal && m.chapter === currentSolutionChapter
    );

    if (activeSolTab === 'exercise') {
        const subchapters = [...new Set(chapterMaterials.map(m => m.subchapter).filter(Boolean))].sort();
        if (subchapters.length === 0) {
            listContainer.innerHTML = '<p style="padding: 20px; color:#64748b; font-size: 14px; text-align: center;">No specific exercises categorized. Just click APPLY.</p>';
        } else {
            listContainer.innerHTML = subchapters.map(sc => `
                <label class="sol-radio-container" onclick="activeSolSubchapter='${sc.replace(/'/g, "\\'")}'; activeSolQuestion='all'; renderSolutionsModalContent();">
                    <input type="radio" name="sol-exercise-radio" value="${sc}" ${activeSolSubchapter === sc ? 'checked' : ''} class="sol-radio-input">
                    <span style="font-size: 14px; font-weight: 600; color: #334155;">${sc}</span>
                </label>
            `).join('');
        }
    } else {
        if (activeSolSubchapter) chapterMaterials = chapterMaterials.filter(m => m.subchapter === activeSolSubchapter);

        // 🌟 FIXED: Find questions accurately even if bolded by Gemini
        let questions = chapterMaterials.map(m => {
            const match = (m.content_text || '').match(/(?:\*\*|\s)*(Q\.?\s*\d+|Question\s*\d+)/i);
            return match ? match[1].trim().toUpperCase() : 'Unnumbered';
        });
        questions = [...new Set(questions)].filter(q => q !== 'Unnumbered');

        let html = `
            <label class="sol-radio-container" onclick="activeSolQuestion='all'; renderSolutionsModalContent();">
                <input type="radio" name="sol-question-radio" value="all" ${activeSolQuestion === 'all' ? 'checked' : ''} class="sol-radio-input">
                <span style="font-size: 14px; font-weight: 600; color: #334155;">All Questions</span>
            </label>
        `;

        if (questions.length === 0) {
            html += '<p style="padding: 20px; color:#64748b; font-size: 14px; text-align:center;">Questions are not numbered in standard format (e.g., Q.1). Click APPLY to read all.</p>';
        } else {
            html += questions.map(q => `
                <label class="sol-radio-container" onclick="activeSolQuestion='${q}'; renderSolutionsModalContent();">
                    <input type="radio" name="sol-question-radio" value="${q}" ${activeSolQuestion === q ? 'checked' : ''} class="sol-radio-input">
                    <span style="font-size: 14px; font-weight: 600; color: #334155;">${q}</span>
                </label>
            `).join('');
        }
        listContainer.innerHTML = html;
    }
}

function closeSolutionsModal() { document.getElementById('solutions-modal').style.display = 'none'; }

function applySolutionsFilter() {
    closeSolutionsModal();
    const chapterList = document.getElementById('solutions-chapter-list');
    const container = document.getElementById('solutions-materials-container');
    
    chapterList.style.display = 'none';
    container.style.display = 'flex';
    container.innerHTML = '';
    
    const classVal = document.getElementById('sol-filter-class').value;
    const subjectVal = document.getElementById('sol-filter-subject').value;

    let filtered = allStudyMaterials.filter(m => 
        m.content_type === 'Textbook Solutions' && m.class_level === classVal && m.subject === subjectVal && m.chapter === currentSolutionChapter
    );

    if (activeSolSubchapter) filtered = filtered.filter(m => m.subchapter === activeSolSubchapter); 
    
    if (activeSolQuestion !== 'all') {
        filtered = filtered.filter(m => {
            const cleanText = (m.content_text || '').replace(/\*\*/g, '').trim();
            return cleanText.toUpperCase().startsWith(activeSolQuestion);
        });
    }

    container.innerHTML += `<button onclick="renderSolutionsChapters()" style="background: #f1f5f9; border: none; padding: 10px 16px; border-radius: 10px; display: inline-flex; align-items: center; gap: 8px; font-weight: 700; color: #334155; cursor: pointer; align-self: flex-start; margin-bottom: 8px;"><i data-lucide="arrow-left" style="width: 16px; height: 16px;"></i> Back to Chapters</button>`;
    
    let headerTitle = `${currentSolutionChapter}`;
    if (activeSolSubchapter) headerTitle += ` — ${activeSolSubchapter}`;
    if (activeSolQuestion !== 'all') headerTitle += ` (${activeSolQuestion})`;
    
    container.innerHTML += `<h3 style="font-size: 18px; font-weight: 800; color: #0f172a; margin-bottom: 8px;">${headerTitle}</h3>`;

    if (filtered.length === 0) container.innerHTML += `<div style="text-align: center; padding: 40px;"><p style="color: #64748b; font-size: 15px; font-weight: 600;">No materials found.</p></div>`;
    else filtered.forEach(item => { container.innerHTML += generateCardHTML(item); });
    
    if (window.lucide) lucide.createIcons();
    renderMath();
}

function renderStudentMaterials() {
    function drawCards(container, materials, boardType) {
        if (materials.length === 0) return container.innerHTML = `<p style="text-align: center; color: #94a3b8;">No content added yet.</p>`;
        container.innerHTML = '';
        const topClass = boardType === 'ICSE' ? 'Class 10' : 'Class 12';
        const bottomClass = boardType === 'ICSE' ? 'Class 9' : 'Class 11';

        const topMaterials = materials.filter(item => item.class_level === topClass);
        const bottomMaterials = materials.filter(item => item.class_level === bottomClass);
        const otherMaterials = materials.filter(item => item.class_level !== topClass && item.class_level !== bottomClass);

        if (topMaterials.length > 0) {
            container.innerHTML += `<div style="margin-bottom: 16px; display: inline-flex; align-items: center; gap: 8px; background: #fee2e2; color: #991b1b; padding: 8px 16px; border-radius: 12px; font-weight: 800; font-size: 14px;"><i data-lucide="flame" style="width: 18px; height: 18px;"></i> ${topClass} (Board Exams)</div>`;
            topMaterials.forEach(item => { container.innerHTML += generateCardHTML(item); });
        }
        if (bottomMaterials.length > 0) {
            container.innerHTML += `<div style="margin-top: 24px; margin-bottom: 16px; display: inline-flex; align-items: center; gap: 8px; background: #f1f5f9; color: #475569; padding: 8px 16px; border-radius: 12px; font-weight: 800; font-size: 14px;"><i data-lucide="book" style="width: 18px; height: 18px;"></i> ${bottomClass}</div>`;
            bottomMaterials.forEach(item => { container.innerHTML += generateCardHTML(item); });
        }
        if (otherMaterials.length > 0) {
            otherMaterials.forEach(item => { container.innerHTML += generateCardHTML(item); });
        }
        if (window.lucide) lucide.createIcons();
    }
    const icseContainer = document.getElementById('icse-materials-container');
    if (icseContainer && document.getElementById('page-notes').classList.contains('active')) {
        drawCards(icseContainer, allStudyMaterials.filter(item => item.board === 'ICSE' && item.subject === document.getElementById('dynamic-icse-title').innerText.trim()), 'ICSE');
    }
    const iscContainer = document.getElementById('isc-materials-container');
    if (iscContainer && document.getElementById('page-notes-isc').classList.contains('active')) {
        drawCards(iscContainer, allStudyMaterials.filter(item => item.board === 'ISC' && item.subject === document.getElementById('dynamic-isc-title').innerText.trim()), 'ISC');
    }
    renderMath();
}

async function handleAICamera(event) {
    const file = event.target.files[0];
    if (!file) return;
    const chatBox = document.getElementById('chat-box');
    chatBox.innerHTML += `<div style="align-self: flex-start; background: #f1f5f9; padding: 10px 14px; border-radius: 12px; font-size: 12px; color: #64748b;">📷 Analyzing ${file.name}...</div>`;
    chatBox.scrollTop = chatBox.scrollHeight;
    const reader = new FileReader();
    reader.onload = async e => { await sendAIMessage(e.target.result.split(',')[1], file.type); };
    reader.readAsDataURL(file);
}

async function sendAIMessage(fileData = null, mimeType = null) {
    const inputField = document.getElementById('ai-input');
    const chatBox = document.getElementById('chat-box');
    const userText = inputField ? inputField.value.trim() : '';

    if (!userText && !fileData) return;
    if (!fileData) { chatBox.innerHTML += `<div style="align-self: flex-end; background: #9333ea; color: white; padding: 14px 18px; border-radius: 20px; border-bottom-right-radius: 4px; max-width: 85%;"><p style="margin: 0; font-size: 14px;">${userText}</p></div>`; inputField.value = ''; }

    const typingId = "typing-" + Date.now();
    chatBox.innerHTML += `<div id="${typingId}" style="align-self: flex-start; background: #ffffff; border: 1px solid #e2e8f0; padding: 14px 18px; border-radius: 20px; border-bottom-left-radius: 4px;"><p style="margin: 0; font-size: 14px; color: #94a3b8;">AI is processing...</p></div>`;
    chatBox.scrollTop = chatBox.scrollHeight;

    try {
        const payload = fileData ? { fileData, mimeType, prompt: userText || "Read and explain." } : { prompt: userText };
        const response = await fetch('/api/gemini', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!response.ok) throw new Error("Backend failed");
        
        const data = await response.json();
        let aiReply = data.candidates[0].content.parts[0].text;
        document.getElementById(typingId)?.remove();
        
        aiReply = aiReply.replace(/\\\\times|\\times/g, ' × ').replace(/\\\\div|\\div/g, ' ÷ ').replace(/\\\\rightarrow|\\rightarrow/g, ' → ');
        aiReply = aiReply.replace(/([a-zA-Z])_([0-9a-zA-Z]+)/g, '$1<sub>$2</sub>');
        aiReply = aiReply.replace(/([a-zA-Z0-9])\^([0-9a-zA-Z]+)/g, '$1<sup>$2</sup>');
        aiReply = aiReply.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        chatBox.innerHTML += `<div style="align-self: flex-start; background: #ffffff; border: 1px solid #e2e8f0; padding: 14px 18px; border-radius: 20px; border-bottom-left-radius: 4px; max-width: 85%;"><p style="margin: 0; font-size: 14px; white-space: pre-wrap;">${aiReply}</p></div>`;
        chatBox.scrollTop = chatBox.scrollHeight;
        renderMath();
    } catch (error) { document.getElementById(typingId).innerHTML = `<p style="margin: 0; color: red;">Error.</p>`; }
}

function toggleBookmark(itemId) {
    const id = String(itemId);
    if (myBackpack.some(savedId => String(savedId) === id)) { myBackpack = myBackpack.filter(savedId => String(savedId) !== id); } else { myBackpack.push(id); }
    localStorage.setItem('studyBackpack', JSON.stringify(myBackpack));
    renderStudentMaterials(); if (currentPage === 'backpack') renderBackpack();
}
function renderBackpack() {
    const container = document.getElementById('backpack-materials-container');
    if (!container) return;
    if (myBackpack.length === 0) return container.innerHTML = `<div style="text-align: center; padding: 40px;">Backpack is empty.</div>`;
    const savedItems = allStudyMaterials.filter(item => myBackpack.some(savedId => String(savedId) === String(item.id)));
    container.innerHTML = ''; savedItems.forEach(item => { container.innerHTML += generateCardHTML(item); });
    if (window.lucide) lucide.createIcons(); renderMath();
}
