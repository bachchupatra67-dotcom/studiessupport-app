// ==========================================
// 1. NAVIGATION & SMART HISTORY
// ==========================================
let pageHistory = [];
let currentPage = 'home';
let myBackpack = JSON.parse(localStorage.getItem('studyBackpack')) || [];

const generateCardHTML = (item) => {
    let linkBtn = item.file_url ? `<a href="${item.file_url}" target="_blank" style="display: inline-block; background: #2563eb; color: #ffffff; padding: 10px 20px; border-radius: 10px; text-decoration: none; font-size: 14px; font-weight: 700; margin-top: 12px;">Download PDF</a>` : '';

    let formattedText = item.content_text ? item.content_text.replace(/\*\*(.*?)\*\*/g, '<strong style="color: #0f172a; font-weight: 900;">$1</strong>') : '';
    let textNotes = formattedText ? `<div style="background: #f8fafc; padding: 12px; border-radius: 8px; font-size: 14px; color: #334155; margin-top: 12px; white-space: pre-wrap;">${formattedText}</div>` : '';

    let subchapterBadge = item.subchapter ? `<span style="background: #fef3c7; color: #d97706; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 800; display: inline-block; margin-bottom: 8px; margin-left: 6px;">${item.subchapter}</span>` : '';

    const isSaved = myBackpack.some(savedId => String(savedId) === String(item.id));
    const bookmarkColor = isSaved ? '#f59e0b' : '#94a3b8';
    const bookmarkFill = isSaved ? '#f59e0b' : 'none';

    const shareText = encodeURIComponent(`Hey! I found free notes for ${item.class_level} ${item.subject}: https://studiessupport.vercel.app`);

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
            ${textNotes}
            <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
                ${linkBtn}
                <a href="https://wa.me/?text=${shareText}" target="_blank" style="display: inline-flex; align-items: center; gap: 6px; background: #25D366; color: #ffffff; padding: 10px 16px; border-radius: 10px; text-decoration: none; font-size: 14px; font-weight: 700; margin-top: 12px;">
                    <i data-lucide="message-circle" style="width: 18px; height: 18px;"></i> Share
                </a>
            </div>
        </div>`;
};

function navigateTo(pageName, isBack = false) {
    if (pageName === 'admin') {
        if (localStorage.getItem('isAdminLoggedIn') !== 'true') {
            showLoginModal(); return;
        }
    }
    if (!isBack && currentPage !== pageName) { pageHistory.push(currentPage); }
    currentPage = pageName;

    const backBtn = document.getElementById('universal-back-btn');
    if (backBtn) {
        if (pageName === 'home') { backBtn.style.display = 'none'; pageHistory = []; } 
        else { backBtn.style.display = 'flex'; }
    }

    document.querySelectorAll('main').forEach(page => {
        page.style.display = 'none'; page.classList.remove('active');
    });

    const targetPage = document.getElementById('page-' + pageName);
    if (targetPage) {
        targetPage.style.display = 'block'; targetPage.classList.add('active');
    }

    if (pageName === 'backpack' && typeof renderBackpack === 'function') renderBackpack();
    else if (typeof renderStudentMaterials === 'function') renderStudentMaterials();

    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenu && mobileMenu.style.display === 'block') toggleMobileMenu();
    window.scrollTo(0, 0);
}

function goBack() {
    if (pageHistory.length > 0) { navigateTo(pageHistory.pop(), true); } 
    else { navigateTo('home'); }
}

function toggleMobileMenu() {
    const menu = document.getElementById('mobile-menu');
    if (menu) menu.style.display = (menu.style.display === 'block') ? 'none' : 'block';
}

function showLoginModal() {
    if (localStorage.getItem('isAdminLoggedIn') === 'true') { navigateTo('admin'); return; }
    document.getElementById('login-modal')?.classList.remove('hidden');
}

function closeLoginModal() { document.getElementById('login-modal')?.classList.add('hidden'); }

async function loginAdmin() {
    if (!supabaseClient) { alert("Database connection missing!"); return; }
    const email = document.getElementById('admin-email').value.trim();
    const password = document.getElementById('admin-password').value.trim();
    const btn = document.querySelector('button[onclick="loginAdmin()"]');

    if (!email || !password) { alert("Please enter both email and password."); return; }

    const originalText = btn.innerText; btn.innerText = "Verifying..."; btn.disabled = true;
    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) throw error;
        alert("Admin Verified! Welcome to the Dashboard.");
        localStorage.setItem('isAdminLoggedIn', 'true');
        closeLoginModal(); navigateTo('admin');
    } catch (error) { alert("Login Failed: " + error.message); } 
    finally { btn.innerText = originalText; btn.disabled = false; }
}

async function logoutAdmin() {
    if (supabaseClient) await supabaseClient.auth.signOut();
    localStorage.removeItem('isAdminLoggedIn');
    alert("Logged out successfully."); navigateTo('home');
}

function initApp() {
    navigateTo('home');
    applyLogo(localStorage.getItem('customSiteLogo'));
    fetchAndDisplayMaterials();
    if (window.lucide) lucide.createIcons();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initApp);
else initApp();

let supabaseClient = null;
let editingMaterialId = null;

try {
    if (typeof supabase !== 'undefined') {
        const supabaseUrl = 'https://gycmmdlkppyavwkqdxym.supabase.co';
        const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5Y21tZGxrcHB5YXZ3a3FkeHltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NjE3NTgsImV4cCI6MjA5MTIzNzc1OH0.REcaVfmLe6SKMrPcvo13lq90CH762AaOhNOOwRgYNSc';
        supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);
    }
} catch (error) { console.error("Supabase load error:", error); }

// ==========================================
// 🌟 NEW: ADMIN SUBJECT & FILTER LOGIC
// ==========================================
function updateSubjectDropdown() {
    const board = document.getElementById('admin-board-select').value;
    const subjectSelect = document.getElementById('admin-subject-select');
    
    let subjects = [];
    if (board === 'ICSE') {
        subjects = ['English Language', 'English Literature', 'Mathematics', 'Science (Physics)', 'Science (Chemistry)', 'Science (Biology)', 'Hindi', 'History & Civics', 'Geography', 'Computer Science'];
    } else if (board === 'ISC') {
        subjects = ['English Language', 'English Literature', 'Hindi', 'Physics', 'Chemistry', 'Mathematics', 'Biology', 'Computer Science', 'Accounts', 'Business Studies', 'Economics', 'History'];
    }

    subjectSelect.innerHTML = '<option value="">Select Subject</option>';
    subjects.forEach(sub => {
        subjectSelect.innerHTML += `<option value="${sub}">${sub}</option>`;
    });
    
    // Add the "New Subject" Button
    if (board) {
        subjectSelect.innerHTML += `<option value="CUSTOM_NEW" style="font-weight:bold; color:#2563eb;">+ Add New Subject...</option>`;
    }
    
    toggleCustomSubject(); 
}

function toggleCustomSubject() {
    const select = document.getElementById('admin-subject-select');
    const customInput = document.getElementById('admin-custom-subject');
    
    if (select.value === 'CUSTOM_NEW') {
        customInput.style.display = 'block';
        customInput.required = true;
    } else {
        customInput.style.display = 'none';
        customInput.required = false;
        customInput.value = '';
    }
}

async function handleMaterialUpload(event) {
    event.preventDefault();
    if (!supabaseClient) { alert("Upload system unavailable."); return; }

    const boardValue = document.getElementById('admin-board-select').value;
    const classValue = document.getElementById('admin-class-select').value;
    const typeValue = document.getElementById('admin-type-select').value;
    
    // 🌟 Check if they picked standard subject or typed a custom one
    let subjectValue = document.getElementById('admin-subject-select').value;
    if (subjectValue === 'CUSTOM_NEW') {
        subjectValue = document.getElementById('admin-custom-subject').value.trim();
    }
    
    const chapterValue = document.getElementById('admin-chapter-input').value.trim();
    const subchapterValue = document.getElementById('admin-subchapter-input').value.trim();
    const textContent = document.getElementById('admin-text-input').value;

    const fileInput = document.getElementById('file-upload');
    const file = fileInput.files[0];

    if (!file && textContent.trim() === "" && !editingMaterialId) {
        alert("Please add text content or a file!"); return;
    }

    const btn = event.target.querySelector('button[type="submit"]');
    const originalText = btn.innerText;
    btn.innerText = editingMaterialId ? "Updating... ⏳" : "Saving... ⏳";
    btn.disabled = true;

    try {
        let finalFileUrl = "";
        if (editingMaterialId) {
            const existingItem = allStudyMaterials.find(m => m.id === editingMaterialId);
            finalFileUrl = existingItem ? existingItem.file_url : "";
        }

        if (file) {
            const safeFileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${file.name.split('.').pop()}`;
            const { error: uploadError } = await supabaseClient.storage.from('study-materials').upload(safeFileName, await file.arrayBuffer(), { contentType: file.type });
            if (uploadError) throw uploadError;
            finalFileUrl = supabaseClient.storage.from('study-materials').getPublicUrl(safeFileName).data.publicUrl;
        }

        const uploadData = {
            board: boardValue, subject: subjectValue, class_level: classValue,
            chapter: chapterValue, subchapter: subchapterValue, content_type: typeValue,
            content_text: textContent, file_url: finalFileUrl
        };

        if (editingMaterialId) {
            const { error } = await supabaseClient.from('study_materials').update(uploadData).eq('id', editingMaterialId);
            if (error) throw error; alert("Success! Material updated.");
        } else {
            const { error } = await supabaseClient.from('study_materials').insert([uploadData]);
            if (error) throw error; alert("Success! Material saved.");
        }

        editingMaterialId = null; event.target.reset();
        toggleCustomSubject(); // Hide custom box on reset
        document.getElementById('file-name-display').innerText = 'Click to upload or drag & drop';
        document.getElementById('file-name-display').style.color = '#334155';
        fetchAndDisplayMaterials();

    } catch (error) { alert("Action failed. Error: " + error.message); } 
    finally { btn.innerText = "Upload Material"; btn.disabled = false; }
}

function handleLogoUpload(event) {
    const file = event.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        localStorage.setItem('customSiteLogo', e.target.result); applyLogo(e.target.result); alert("Logo updated successfully!");
    };
    reader.readAsDataURL(file);
}

function applyLogo(logoUrl) {
    if (!logoUrl) return;
    document.querySelectorAll('.site-logo').forEach(img => { img.src = logoUrl; img.style.display = 'block'; });
}

let allStudyMaterials = [];

function editMaterial(id) {
    const item = allStudyMaterials.find(m => m.id === id);
    if (!item) return;
    editingMaterialId = item.id; 

    document.getElementById('admin-board-select').value = item.board || '';
    updateSubjectDropdown(); // Set standard options based on board
    
    // Check if the item's subject exists in the dropdown
    const select = document.getElementById('admin-subject-select');
    const options = Array.from(select.options).map(opt => opt.value);
    
    if (options.includes(item.subject)) {
        select.value = item.subject;
    } else {
        // It's a custom subject! Select "Add New" and fill the hidden box
        select.value = 'CUSTOM_NEW';
        toggleCustomSubject();
        document.getElementById('admin-custom-subject').value = item.subject || '';
    }

    document.getElementById('admin-class-select').value = item.class_level || '';
    document.getElementById('admin-type-select').value = item.content_type || '';
    document.getElementById('admin-chapter-input').value = item.chapter || '';
    document.getElementById('admin-subchapter-input').value = item.subchapter || '';
    document.getElementById('admin-text-input').value = item.content_text || '';

    document.querySelector('#upload-form button[type="submit"]').innerText = "Update Material";
    if (item.file_url) {
        const fileDisplay = document.getElementById('file-name-display');
        fileDisplay.innerText = "Current file attached. Click to replace (optional)";
        fileDisplay.style.color = '#ea580c';
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function deleteMaterial(id) {
    if (!confirm("Are you sure you want to completely delete this?")) return;
    try {
        const { error } = await supabaseClient.from('study_materials').delete().eq('id', id);
        if (error) throw error; alert("Deleted successfully!"); fetchAndDisplayMaterials(); 
    } catch (error) { alert("Failed to delete. Error: " + error.message); }
}

async function fetchAndDisplayMaterials() {
    if (!supabaseClient) return;
    try {
        const { data, error } = await supabaseClient.from('study_materials').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        allStudyMaterials = data;

        // 🌟 Populate Admin Subject Filter Dropdown
        const adminSubFilter = document.getElementById('admin-filter-subject');
        if (adminSubFilter) {
            const uniqueSubjects = [...new Set(data.map(m => m.subject).filter(Boolean))].sort();
            adminSubFilter.innerHTML = '<option value="">All Subjects</option>' + uniqueSubjects.map(s => `<option value="${s}">${s}</option>`).join('');
        }

        renderAdminMaterials(); // Draw the admin list
        renderStudentMaterials();
        updateDynamicFilters('qa');
        updateDynamicFilters('sol');
        updateAdminDatalists();
        
        if (currentPage === 'backpack') {
            renderBackpack();
        }

    } catch (error) { console.error("Error fetching materials:", error); }
}

// 🌟 NEW: RENDER ADMIN MATERIALS WITH FILTERS
function renderAdminMaterials() {
    const container = document.getElementById('admin-materials-container');
    if (!container) return;

    const classFilter = document.getElementById('admin-filter-class')?.value || '';
    const subFilter = document.getElementById('admin-filter-subject')?.value || '';

    let filtered = allStudyMaterials;
    if (classFilter) filtered = filtered.filter(m => m.class_level === classFilter);
    if (subFilter) filtered = filtered.filter(m => m.subject === subFilter);

    if (filtered.length === 0) {
        container.innerHTML = `<p style="text-align: center; color: #94a3b8; font-size: 14px; margin: 40px 0;">No materials found.</p>`;
        return;
    }

    container.innerHTML = '';
    filtered.forEach(item => {
        let linkHtml = item.file_url ? `<a href="${item.file_url}" target="_blank" style="background: #eff6ff; color: #2563eb; padding: 6px 12px; border-radius: 8px; text-decoration: none; font-size: 12px; font-weight: 700;">View</a>` : '';
        let editBtn = `<button onclick="editMaterial(${item.id})" style="background: #fff7ed; color: #ea580c; border: 1px solid #fed7aa; padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 700; cursor: pointer; margin-right: 8px;">Edit</button>`;
        let deleteBtn = `<button onclick="deleteMaterial(${item.id})" style="background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 700; cursor: pointer; margin-right: 8px;">Delete</button>`;
        
        container.innerHTML += `
            <div style="background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 16px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 12px;">
                <div>
                    <h4 style="color: #0f172a; font-size: 15px; font-weight: 700; margin: 0 0 4px 0;">${item.chapter || 'Untitled'} ${item.subchapter ? `(${item.subchapter})` : ''}</h4>
                    <p style="color: #64748b; font-size: 12px; margin: 0;">${item.board} • ${item.class_level} • <span style="font-weight:600;">${item.subject}</span></p>
                </div>
                <div style="display: flex;">${deleteBtn}${editBtn}${linkHtml}</div>
            </div>`;
    });
}


function updateDynamicFilters(pagePrefix) {
    const classSelect = document.getElementById(`${pagePrefix}-filter-class`);
    const subjectSelect = document.getElementById(`${pagePrefix}-filter-subject`);
    const chapterSelect = document.getElementById(`${pagePrefix}-filter-chapter`);
    const subchapterSelect = document.getElementById(`${pagePrefix}-filter-subchapter`);
    
    if(!classSelect || !subjectSelect || !chapterSelect || !subchapterSelect) return;

    let validMaterials = allStudyMaterials;
    if(pagePrefix === 'sol') validMaterials = validMaterials.filter(m => m.content_type === 'Textbook Solutions');

    const classVal = classSelect.value;
    if (classVal) validMaterials = validMaterials.filter(m => m.class_level === classVal);

    const currentSub = subjectSelect.value;
    const subjects = [...new Set(validMaterials.map(m => m.subject).filter(Boolean))];
    subjectSelect.innerHTML = '<option value="">All Subjects</option>' + subjects.map(s => `<option value="${s}">${s}</option>`).join('');
    if (subjects.includes(currentSub)) subjectSelect.value = currentSub;

    if (subjectSelect.value) validMaterials = validMaterials.filter(m => m.subject === subjectSelect.value);
    const currentChap = chapterSelect.value;
    const chapters = [...new Set(validMaterials.map(m => m.chapter).filter(Boolean))];
    chapterSelect.innerHTML = '<option value="">All Chapters</option>' + chapters.map(c => `<option value="${c}">${c}</option>`).join('');
    if (chapters.includes(currentChap)) chapterSelect.value = currentChap;

    if (chapterSelect.value) validMaterials = validMaterials.filter(m => m.chapter === chapterSelect.value);
    const currentSubchap = subchapterSelect.value;
    const subchapters = [...new Set(validMaterials.map(m => m.subchapter).filter(Boolean))];
    subchapterSelect.innerHTML = '<option value="">All Subchapters</option>' + subchapters.map(sc => `<option value="${sc}">${sc}</option>`).join('');
    if (subchapters.includes(currentSubchap)) subchapterSelect.value = currentSubchap;
}

function updateAdminDatalists() {
    const subjects = [...new Set(allStudyMaterials.map(m => m.subject).filter(Boolean))];
    const chapters = [...new Set(allStudyMaterials.map(m => m.chapter).filter(Boolean))];
    const subchapters = [...new Set(allStudyMaterials.map(m => m.subchapter).filter(Boolean))];
    
    document.getElementById('admin-subjects-list').innerHTML = subjects.map(s => `<option value="${s}">`).join('');
    document.getElementById('admin-chapters-list').innerHTML = chapters.map(c => `<option value="${c}">`).join('');
    document.getElementById('admin-subchapters-list').innerHTML = subchapters.map(sc => `<option value="${sc}">`).join('');
}


function applyDynamicFilter(pagePrefix, containerId) {
    const classVal = document.getElementById(`${pagePrefix}-filter-class`).value;
    const subjectVal = document.getElementById(`${pagePrefix}-filter-subject`).value;
    const chapterVal = document.getElementById(`${pagePrefix}-filter-chapter`).value;
    const subchapterVal = document.getElementById(`${pagePrefix}-filter-subchapter`).value;
    const container = document.getElementById(containerId);

    if(pagePrefix === 'sol') showSkeletons(containerId);

    setTimeout(() => {
        let filtered = allStudyMaterials;
        if(pagePrefix === 'sol') filtered = filtered.filter(m => m.content_type === 'Textbook Solutions');

        if (classVal) filtered = filtered.filter(m => m.class_level === classVal);
        if (subjectVal) filtered = filtered.filter(m => m.subject === subjectVal);
        if (chapterVal) filtered = filtered.filter(m => m.chapter === chapterVal);
        if (subchapterVal) filtered = filtered.filter(m => m.subchapter === subchapterVal);

        if (filtered.length === 0) {
            container.innerHTML = `<div style="text-align: center; padding: 40px;"><p style="color: #64748b; font-size: 15px; font-weight: 600;">No materials found.</p></div>`;
            return;
        }

        container.innerHTML = '';
        filtered.forEach(item => { container.innerHTML += generateCardHTML(item); });
        if (window.lucide) lucide.createIcons();
    }, pagePrefix === 'sol' ? 500 : 0);
}

function showSkeletons(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < 3; i++) container.innerHTML += `<div class="skeleton-box" style="height: 160px; margin-bottom: 16px; border-radius: 16px; opacity: 0.6;"></div>`;
}

function renderStudentMaterials() {
    function drawCards(container, materials, boardType) {
        if (materials.length === 0) {
            container.innerHTML = `<p style="text-align: center; color: #94a3b8; font-size: 15px;">No content added yet for this subject.</p>`;
            return;
        }
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
        const title = document.getElementById('dynamic-icse-title').innerText.trim();
        drawCards(icseContainer, allStudyMaterials.filter(item => item.board === 'ICSE' && item.subject === title), 'ICSE');
    }

    const iscContainer = document.getElementById('isc-materials-container');
    if (iscContainer && document.getElementById('page-notes-isc').classList.contains('active')) {
        const title = document.getElementById('dynamic-isc-title').innerText.trim();
        drawCards(iscContainer, allStudyMaterials.filter(item => item.board === 'ISC' && item.subject === title), 'ISC');
    }
}


// ==========================================
// 12. AI CHAT LOGIC
// ==========================================
async function handleAICamera(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
        alert("File is too large! Please select a file smaller than 4MB.");
        return;
    }

    const chatBox = document.getElementById('chat-box');
    let fileIcon = file.type.includes('pdf') ? '📄' : (file.type.includes('text') ? '📝' : '📷');
    
    chatBox.innerHTML += `<div style="align-self: flex-start; background: #f1f5f9; padding: 10px 14px; border-radius: 12px; font-size: 12px; color: #64748b;">${fileIcon} Analyzing ${file.name}...</div>`;
    chatBox.scrollTop = chatBox.scrollHeight;

    const reader = new FileReader();
    reader.onload = async function(e) {
        const base64Data = e.target.result.split(',')[1];
        await sendAIMessage(base64Data, file.type);
    };
    reader.readAsDataURL(file);
}

async function sendAIMessage(fileData = null, mimeType = null) {
    const inputField = document.getElementById('ai-input');
    const chatBox = document.getElementById('chat-box');
    const userText = inputField ? inputField.value.trim() : '';

    if (!userText && !fileData) return;

    if (!fileData) {
        chatBox.innerHTML += `<div style="align-self: flex-end; background: #9333ea; color: white; padding: 14px 18px; border-radius: 20px; border-bottom-right-radius: 4px; max-width: 85%; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"><p style="margin: 0; font-size: 14px; line-height: 1.5;">${userText}</p></div>`;
        inputField.value = '';
    }

    const typingId = "typing-" + Date.now();
    chatBox.innerHTML += `<div id="${typingId}" style="align-self: flex-start; background: #ffffff; border: 1px solid #e2e8f0; padding: 14px 18px; border-radius: 20px; border-bottom-left-radius: 4px; max-width: 85%;"><p style="margin: 0; font-size: 14px; color: #94a3b8;">AI is processing...</p></div>`;
    chatBox.scrollTop = chatBox.scrollHeight;

    try {
        const payload = fileData 
            ? { fileData: fileData, mimeType: mimeType, prompt: userText || "Please read this file and explain it simply." } 
            : { prompt: userText };

        const response = await fetch('/api/gemini', { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify(payload) 
        });
        
        if (!response.ok) throw new Error("Backend connection failed");

        const data = await response.json();
        const aiReply = data.candidates[0].content.parts[0].text;
        document.getElementById(typingId)?.remove();

        let formattedReply = aiReply ? aiReply.replace(/\*\*(.*?)\*\*/g, '<strong style="color: #0f172a; font-weight: 900;">$1</strong>') : '';
        chatBox.innerHTML += `<div style="align-self: flex-start; background: #ffffff; border: 1px solid #e2e8f0; padding: 14px 18px; border-radius: 20px; border-bottom-left-radius: 4px; max-width: 85%; box-shadow: 0 2px 4px rgba(0,0,0,0.02);"><p style="margin: 0; font-size: 14px; color: #334155; line-height: 1.5; white-space: pre-wrap;">${formattedReply}</p></div>`;
        chatBox.scrollTop = chatBox.scrollHeight;
    } catch (error) {
        console.error("AI Error:", error);
        const typingBubble = document.getElementById(typingId);
        if (typingBubble) typingBubble.innerHTML = `<p style="margin: 0; font-size: 14px; color: #ef4444;">Sorry, connection failed! Make sure Vercel backend is updated.</p>`;
    }
}

// ==========================================
// 15. THE BACKPACK ENGINE
// ==========================================
function toggleBookmark(itemId) {
    const id = String(itemId);
    const exists = myBackpack.some(savedId => String(savedId) === id);
    if (exists) { myBackpack = myBackpack.filter(savedId => String(savedId) !== id); } 
    else { myBackpack.push(id); }
    localStorage.setItem('studyBackpack', JSON.stringify(myBackpack));
    renderStudentMaterials();
    if (currentPage === 'backpack') renderBackpack();
}

function renderBackpack() {
    const container = document.getElementById('backpack-materials-container');
    if (!container) return;

    if (myBackpack.length === 0) {
        container.innerHTML = `<div style="text-align: center; padding: 40px; color: #94a3b8; border: 1px dashed #cbd5e1; border-radius: 20px;">Your backpack is empty.</div>`;
        return;
    }

    const savedItems = allStudyMaterials.filter(item => myBackpack.some(savedId => String(savedId) === String(item.id)));
    container.innerHTML = '';
    savedItems.forEach(item => { container.innerHTML += generateCardHTML(item); });
    if (window.lucide) lucide.createIcons();
}