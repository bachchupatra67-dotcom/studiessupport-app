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

    // 🌟 PRO UPGRADE: Bookmarks & WhatsApp
    const isSaved = myBackpack.includes(item.id);
    const bookmarkColor = isSaved ? '#f59e0b' : '#94a3b8';
    const bookmarkFill = isSaved ? '#f59e0b' : 'none';

    const shareText = encodeURIComponent(`Hey! I found free notes for ${item.class_level} ${item.subject}: https://studiessupport.vercel.app`);

    return `
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.02); margin-bottom: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <h4 style="color: #0f172a; font-size: 16px; font-weight: 800; margin: 0 0 4px 0;">${item.chapter}</h4>
                <button onclick="toggleBookmark(${item.id})" style="background: none; border: none; cursor: pointer; padding: 0;">
                    <i data-lucide="bookmark" style="color: ${bookmarkColor}; width: 24px; height: 24px;" fill="${bookmarkFill}"></i>
                </button>
            </div>
            <span style="background: #eff6ff; color: #2563eb; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 800; display: inline-block; margin-bottom: 8px;">${item.content_type}</span>
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
            showLoginModal();
            return;
        }
    }

    if (!isBack && currentPage !== pageName) {
        pageHistory.push(currentPage);
    }
    currentPage = pageName;

    const backBtn = document.getElementById('universal-back-btn');
    if (backBtn) {
        if (pageName === 'home') {
            backBtn.style.display = 'none';
            pageHistory = [];
        } else {
            backBtn.style.display = 'flex';
        }
    }

    const pages = document.querySelectorAll('main');
    pages.forEach(page => {
        page.style.display = 'none';
        page.classList.remove('active');
    });

    const targetPage = document.getElementById('page-' + pageName);
    if (targetPage) {
        targetPage.style.display = 'block';
        targetPage.classList.add('active');
    }

    if (typeof renderStudentMaterials === 'function') {
        renderStudentMaterials();
    }

    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenu && mobileMenu.style.display === 'block') {
        toggleMobileMenu();
    }

    window.scrollTo(0, 0);
}

function goBack() {
    if (pageHistory.length > 0) {
        const previousPage = pageHistory.pop();
        navigateTo(previousPage, true);
    } else {
        navigateTo('home');
    }
}

// ==========================================
// 2. MOBILE MENU
// ==========================================
function toggleMobileMenu() {
    const menu = document.getElementById('mobile-menu');
    if (menu) {
        menu.style.display = (menu.style.display === 'block') ? 'none' : 'block';
    }
}

// ==========================================
// 3. PRO ADMIN AUTHENTICATION (SUPABASE)
// ==========================================
function showLoginModal() {
    if (localStorage.getItem('isAdminLoggedIn') === 'true') {
        navigateTo('admin');
        return;
    }
    const modal = document.getElementById('login-modal');
    if (modal) modal.classList.remove('hidden');
}

function closeLoginModal() {
    const modal = document.getElementById('login-modal');
    if (modal) modal.classList.add('hidden');
}

async function loginAdmin() {
    if (!supabaseClient) {
        alert("Database connection missing!");
        return;
    }

    const email = document.getElementById('admin-email').value.trim();
    const password = document.getElementById('admin-password').value.trim();
    const btn = document.querySelector('button[onclick="loginAdmin()"]');

    if (!email || !password) {
        alert("Please enter both email and password.");
        return;
    }

    const originalText = btn.innerText;
    btn.innerText = "Verifying...";
    btn.disabled = true;

    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) throw error;

        alert("Admin Verified! Welcome to the Dashboard.");
        localStorage.setItem('isAdminLoggedIn', 'true');
        closeLoginModal();
        navigateTo('admin');

    } catch (error) {
        alert("Login Failed: " + error.message);
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
}

async function logoutAdmin() {
    if (supabaseClient) {
        await supabaseClient.auth.signOut();
    }
    localStorage.removeItem('isAdminLoggedIn');
    alert("Logged out successfully.");
    navigateTo('home');
}

// ==========================================
// 5. THEMES
// ==========================================
function toggleThemeMenu() {
    const menu = document.getElementById('theme-menu');
    if (menu) menu.style.display = (menu.style.display === 'block') ? 'none' : 'block';
}

function switchTheme(theme) {
    const themeLabel = document.getElementById('theme-label');
    if (themeLabel) themeLabel.innerText = theme.charAt(0).toUpperCase() + theme.slice(1);
    const menu = document.getElementById('theme-menu');
    if (menu) menu.style.display = 'none';
    document.body.classList.remove('dark-theme', 'sepia-theme');
    if (theme === 'dark') document.body.classList.add('dark-theme');
    else if (theme === 'sepia') document.body.classList.add('sepia-theme');
}

// ==========================================
// 6. STARTUP INITIALIZATION
// ==========================================
function initApp() {
    navigateTo('home');
    applyLogo(localStorage.getItem('customSiteLogo'));
    fetchAndDisplayMaterials();
    if (window.lucide) {
        lucide.createIcons();
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// ==========================================
// 8. SUPABASE UPLOAD LOGIC
// ==========================================
let supabaseClient = null;
let editingMaterialId = null;

try {
    if (typeof supabase !== 'undefined') {
        const supabaseUrl = 'https://gycmmdlkppyavwkqdxym.supabase.co';
        const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5Y21tZGxrcHB5YXZ3a3FkeHltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NjE3NTgsImV4cCI6MjA5MTIzNzc1OH0.REcaVfmLe6SKMrPcvo13lq90CH762AaOhNOOwRgYNSc';
        supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);
    }
} catch (error) {
    console.error("Supabase load error:", error);
}

async function handleMaterialUpload(event) {
    event.preventDefault();

    if (!supabaseClient) {
        alert("Upload system unavailable. Check connection.");
        return;
    }

    const selects = event.target.querySelectorAll('select');
    const boardValue = selects[0].value;
    const subjectValue = selects[1].value;
    const classValue = selects[2].value;
    const typeValue = selects[3].value;
    const chapterValue = event.target.querySelector('input[type="text"]').value;
    const textContent = event.target.querySelector('textarea').value;

    const fileInput = document.getElementById('file-upload');
    const file = fileInput.files[0];

    if (!file && textContent.trim() === "" && !editingMaterialId) {
        alert("Please add text content or a file!");
        return;
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
            const fileExt = file.name.split('.').pop();
            const safeFileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
            const fileBuffer = await file.arrayBuffer();

            const { error: uploadError } = await supabaseClient.storage
                .from('study-materials')
                .upload(safeFileName, fileBuffer, { contentType: file.type });

            if (uploadError) throw uploadError;

            const { data: publicUrlData } = supabaseClient.storage
                .from('study-materials')
                .getPublicUrl(safeFileName);

            finalFileUrl = publicUrlData.publicUrl;
        }

        const uploadData = {
            board: boardValue,
            subject: subjectValue,
            class_level: classValue,
            chapter: chapterValue,
            content_type: typeValue,
            content_text: textContent,
            file_url: finalFileUrl
        };

        if (editingMaterialId) {
            const { error: updateError } = await supabaseClient
                .from('study_materials')
                .update(uploadData)
                .eq('id', editingMaterialId);
            if (updateError) throw updateError;
            alert("Success! Material updated.");
        } else {
            const { error: insertError } = await supabaseClient
                .from('study_materials')
                .insert([uploadData]);
            if (insertError) throw insertError;
            alert("Success! Material saved.");
        }

        editingMaterialId = null; 
        event.target.reset();
        document.getElementById('file-name-display').innerText = 'Click to upload or drag & drop';
        document.getElementById('file-name-display').style.color = '#334155';

        fetchAndDisplayMaterials();

    } catch (error) {
        console.error("Error saving:", error);
        alert("Action failed. Error: " + error.message);
    } finally {
        btn.innerText = "Upload Material";
        btn.disabled = false;
    }
}

// ==========================================
// 9. LOGO UPLOAD & DISPLAY LOGIC
// ==========================================
function handleLogoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        const newLogoUrl = e.target.result;
        localStorage.setItem('customSiteLogo', newLogoUrl);
        applyLogo(newLogoUrl);
        alert("Logo updated successfully!");
    };
    reader.readAsDataURL(file);
}

function applyLogo(logoUrl) {
    if (!logoUrl) return;
    const logoElements = document.querySelectorAll('.site-logo');
    logoElements.forEach(img => {
        img.src = logoUrl;
        img.style.display = 'block'; 
    });
}

// ==========================================
// 10. FETCH & DISPLAY MATERIALS LOGIC
// ==========================================
let allStudyMaterials = [];

function editMaterial(id) {
    const item = allStudyMaterials.find(m => m.id === id);
    if (!item) return;

    editingMaterialId = item.id; 

    const form = document.getElementById('upload-form');
    const selects = form.querySelectorAll('select');

    selects[0].value = item.board; 
    updateSubjectDropdown(); 

    selects[1].value = item.subject;
    selects[2].value = item.class_level;
    selects[3].value = item.content_type;

    form.querySelector('input[type="text"]').value = item.chapter || "";
    form.querySelector('textarea').value = item.content_text || "";

    form.querySelector('button[type="submit"]').innerText = "Update Material";

    const fileDisplay = document.getElementById('file-name-display');
    if (item.file_url) {
        fileDisplay.innerText = "Current file attached. Click to replace (optional)";
        fileDisplay.style.color = '#ea580c';
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function deleteMaterial(id) {
    if (!confirm("Are you sure you want to completely delete this?")) return;

    try {
        const { error } = await supabaseClient.from('study_materials').delete().eq('id', id);
        if (error) throw error;
        alert("Deleted successfully!");
        fetchAndDisplayMaterials(); 
    } catch (error) {
        alert("Failed to delete. Error: " + error.message);
    }
}

async function fetchAndDisplayMaterials() {
    if (!supabaseClient) return;
    try {
        const { data, error } = await supabaseClient
            .from('study_materials')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        allStudyMaterials = data;

        const adminContainer = document.getElementById('admin-materials-container');
        if (adminContainer) {
            if (data.length === 0) {
                adminContainer.innerHTML = `<p style="text-align: center; color: #94a3b8; font-size: 14px; margin: 40px 0;">No content added yet.</p>`;
            } else {
                adminContainer.innerHTML = '';
                data.forEach(item => {
                    let linkHtml = item.file_url ? `<a href="${item.file_url}" target="_blank" style="background: #eff6ff; color: #2563eb; padding: 6px 12px; border-radius: 8px; text-decoration: none; font-size: 12px; font-weight: 700;">View</a>` : '';
                    let editBtn = `<button onclick="editMaterial(${item.id})" style="background: #fff7ed; color: #ea580c; border: 1px solid #fed7aa; padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 700; cursor: pointer; margin-right: 8px;">Edit</button>`;
                    let deleteBtn = `<button onclick="deleteMaterial(${item.id})" style="background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 700; cursor: pointer; margin-right: 8px;">Delete</button>`;

                    adminContainer.innerHTML += `
                        <div style="background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 16px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 12px;">
                            <div>
                                <h4 style="color: #0f172a; font-size: 15px; font-weight: 700; margin: 0 0 4px 0;">${item.chapter}</h4>
                                <p style="color: #64748b; font-size: 12px; margin: 0;">${item.board} • ${item.class_level} • ${item.subject}</p>
                            </div>
                            <div style="display: flex;">${deleteBtn}${editBtn}${linkHtml}</div>
                        </div>`;
                });
            }
        }
        renderStudentMaterials();
    } catch (error) {
        console.error("Error fetching materials:", error);
    }
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
    const pageNotes = document.getElementById('page-notes');
    if (icseContainer && pageNotes && pageNotes.classList.contains('active')) {
        const title = document.getElementById('dynamic-icse-title').innerText.trim();
        const filterElement = document.getElementById('icse-class-filter');
        const classFilter = filterElement ? filterElement.value : 'all';

        let filtered = allStudyMaterials.filter(item => 
            item.board === 'ICSE' && item.subject && item.subject.trim() === title
        );

        if (classFilter !== 'all') {
            filtered = filtered.filter(item => item.class_level === classFilter);
        }

        drawCards(icseContainer, filtered, 'ICSE');
    }

    const iscContainer = document.getElementById('isc-materials-container');
    const pageNotesIsc = document.getElementById('page-notes-isc');
    if (iscContainer && pageNotesIsc && pageNotesIsc.classList.contains('active')) {
        const title = document.getElementById('dynamic-isc-title').innerText.trim();
        const filterElement = document.getElementById('isc-class-filter');
        const classFilter = filterElement ? filterElement.value : 'all';

        let filtered = allStudyMaterials.filter(item => 
            item.board === 'ISC' && item.subject && item.subject.trim() === title
        );

        if (classFilter !== 'all') {
            filtered = filtered.filter(item => item.class_level === classFilter);
        }

        drawCards(iscContainer, filtered, 'ISC');
    }
}

// ==========================================
// 11. DYNAMIC DROPDOWNS (BOARD -> SUBJECT)
// ==========================================
function updateSubjectDropdown() {
    const board = document.getElementById('admin-board-select').value;
    const subjectSelect = document.getElementById('admin-subject-select');

    subjectSelect.innerHTML = '<option value="">Select Subject</option>';

    let subjects = [];

    if (board === 'ICSE') {
        subjects = [
            'English Language', 'English Literature', 'Mathematics', 'Science (Physics)', 'Science (Chemistry)', 
            'Science (Biology)', 'Hindi' , 'History & Civics', 'Geography', 'Computer Science'
        ];
    } else if (board === 'ISC') {
        subjects = [
            'English Language', 'English Literature', 'Hindi' , 'Physics', 'Chemistry', 'Mathematics', 'Biology', 
            'Computer Science', 'Accounts', 'Business Studies', 'Economics', 'History'
        ];
    }

    subjects.forEach(sub => {
        const option = document.createElement('option');
        option.value = sub;
        option.innerText = sub;
        subjectSelect.appendChild(option);
    });
}

// ==========================================
// 12. AI CHAT LOGIC (Snap & Solve Camera Added)
// ==========================================
async function handleAICamera(event) {
    const file = event.target.files[0];
    if (!file) return;

    const chatBox = document.getElementById('chat-box');
    chatBox.innerHTML += `<div style="align-self: flex-start; background: #f1f5f9; padding: 10px 14px; border-radius: 12px; font-size: 12px; color: #64748b;">📷 Analyzing image...</div>`;
    chatBox.scrollTop = chatBox.scrollHeight;

    const reader = new FileReader();
    reader.onload = async function(e) {
        const base64Image = e.target.result.split(',')[1];
        await sendAIMessage(base64Image, true);
    };
    reader.readAsDataURL(file);
}

async function sendAIMessage(imageData = null, isImage = false) {
    const inputField = document.getElementById('ai-input');
    const chatBox = document.getElementById('chat-box');
    const userText = inputField ? inputField.value.trim() : '';

    if (!userText && !isImage) return;

    if (!isImage) {
        chatBox.innerHTML += `
            <div style="align-self: flex-end; background: #9333ea; color: white; padding: 14px 18px; border-radius: 20px; border-bottom-right-radius: 4px; max-width: 85%; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <p style="margin: 0; font-size: 14px; line-height: 1.5;">${userText}</p>
            </div>
        `;
        inputField.value = '';
    }

    const typingId = "typing-" + Date.now();
    chatBox.innerHTML += `
        <div id="${typingId}" style="align-self: flex-start; background: #ffffff; border: 1px solid #e2e8f0; padding: 14px 18px; border-radius: 20px; border-bottom-left-radius: 4px; max-width: 85%;">
            <p style="margin: 0; font-size: 14px; color: #94a3b8;">AI is processing...</p>
        </div>
    `;
    chatBox.scrollTop = chatBox.scrollHeight;

    try {
        const payload = isImage ? { image: imageData, prompt: userText || "Solve this step by step." } : { prompt: userText };

        const response = await fetch('/api/gemini', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error("Backend connection failed");

        const data = await response.json();
        const aiReply = data.candidates[0].content.parts[0].text;

        const typingBubble = document.getElementById(typingId);
        if (typingBubble) typingBubble.remove();

        let formattedReply = aiReply ? aiReply.replace(/\*\*(.*?)\*\*/g, '<strong style="color: #0f172a; font-weight: 900;">$1</strong>') : '';

        chatBox.innerHTML += `
            <div style="align-self: flex-start; background: #ffffff; border: 1px solid #e2e8f0; padding: 14px 18px; border-radius: 20px; border-bottom-left-radius: 4px; max-width: 85%; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                <p style="margin: 0; font-size: 14px; color: #334155; line-height: 1.5; white-space: pre-wrap;">${formattedReply}</p>
            </div>
        `;
        chatBox.scrollTop = chatBox.scrollHeight;

    } catch (error) {
        console.error("AI Error:", error);
        const typingBubble = document.getElementById(typingId);
        if (typingBubble) {
            typingBubble.innerHTML = `<p style="margin: 0; font-size: 14px; color: #ef4444;">Sorry, I'm having trouble connecting right now! Make sure your Vercel backend is updated.</p>`;
        }
    }
}

// ==========================================
// 13. NOTES & Q&A FILTER LOGIC
// ==========================================
function applyNotesFilter() {
    const classVal = document.getElementById('filter-class').value;
    const subjectVal = document.getElementById('filter-subject').value;
    const container = document.getElementById('filtered-materials-container');

    if (!classVal || !subjectVal) {
        alert("Please select both a class and a subject!");
        return;
    }

    const filtered = allStudyMaterials.filter(item => {
        if (!item.class_level || !item.subject) return false;
        const dbClass = item.class_level.toLowerCase();
        const searchClass = classVal.toLowerCase();
        const matchClass = dbClass.includes(searchClass) || searchClass.includes(dbClass);
        const dbSubject = item.subject.toLowerCase();
        const searchSubject = subjectVal.toLowerCase();
        const matchSubject = dbSubject.includes(searchSubject) || searchSubject.includes(dbSubject);
        return matchClass && matchSubject;
    });

    if (filtered.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <p style="color: #64748b; font-size: 15px; font-weight: 600;">No materials found for this selection yet.</p>
                <p style="color: #94a3b8; font-size: 13px;">Check back later or try another subject!</p>
            </div>`;
        return;
    }

    // 🌟 SMART DRAW: Now uses the global card generator so Bold text works!
    container.innerHTML = '';
    filtered.forEach(item => {
        container.innerHTML += generateCardHTML(item);
    });
    
    if (window.lucide) lucide.createIcons();
}


function updateFilterSubjects() {
    const classVal = document.getElementById('filter-class').value;
    const subjectSelect = document.getElementById('filter-subject');
    subjectSelect.innerHTML = '<option value="">Select Subject</option>';

    let subjects = [];

    if (classVal === 'Class 9' || classVal === 'Class 10') {
        subjects = [
            'English Language', 'English Literature' , 'Mathematics', 'Science (Physics)', 'Science (Chemistry)', 
            'Science (Biology)', 'Hindi' , 'History & Civics', 'Geography', 'Computer Science'
        ];
    } else if (classVal === 'Class 11' || classVal === 'Class 12') {
        subjects = [
            'English Language', 'English Literature', 'Hindi' , 'Physics', 'Chemistry', 'Mathematics', 'Biology', 
            'Computer Science', 'Accounts', 'Business Studies', 'Economics', 'History'
        ];
    }

    subjects.forEach(sub => {
        const option = document.createElement('option');
        option.value = sub;
        option.innerText = sub;
        subjectSelect.appendChild(option);
    });
}

// ==========================================
// 14. TEXTBOOK SOLUTIONS & SKELETONS
// ==========================================
function showSkeletons(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < 3; i++) {
        container.innerHTML += `
            <div class="skeleton-box" style="height: 160px; margin-bottom: 16px; border-radius: 16px; opacity: 0.6;"></div>
        `;
    }
}

function updateSolFilterSubjects() {
    const classVal = document.getElementById('sol-filter-class').value;
    const subjectSelect = document.getElementById('sol-filter-subject');
    subjectSelect.innerHTML = '<option value="">Select Subject</option>';
    let subjects = [];
    if (classVal === 'Class 9' || classVal === 'Class 10') {
        subjects = ['English Language', 'English Literature', 'Mathematics', 'Science (Physics)', 'Science (Chemistry)', 'Science (Biology)', 'Hindi', 'History & Civics', 'Geography', 'Computer Science'];
    } else if (classVal === 'Class 11' || classVal === 'Class 12') {
        subjects = ['English Language', 'English Literature', 'Hindi', 'Physics', 'Chemistry', 'Mathematics', 'Biology', 'Computer Science', 'Accounts', 'Business Studies', 'Economics', 'History'];
    }
    subjects.forEach(sub => {
        const option = document.createElement('option');
        option.value = sub;
        option.innerText = sub;
        subjectSelect.appendChild(option);
    });
}

async function applySolutionsFilter() {
    const classVal = document.getElementById('sol-filter-class').value;
    const subjectVal = document.getElementById('sol-filter-subject').value;
    const container = document.getElementById('solutions-materials-container');

    if (!classVal || !subjectVal) {
        alert("Please select both a class and a subject!");
        return;
    }

    showSkeletons('solutions-materials-container');

    setTimeout(() => {
        const filtered = allStudyMaterials.filter(item => {
            if (!item.class_level || !item.subject || item.content_type !== 'Textbook Solutions') return false;
            return item.class_level.trim() === classVal.trim() && item.subject.trim() === subjectVal.trim();
        });

        if (filtered.length === 0) {
            container.innerHTML = `<p style="text-align: center; color: #64748b; padding: 40px;">No solutions found for this subject yet.</p>`;
            return;
        }

        container.innerHTML = '';
        filtered.forEach(item => {
            container.innerHTML += generateCardHTML(item); 
        });

        if (window.lucide) lucide.createIcons();
    }, 500);
}

// ==========================================
// 15. THE BACKPACK ENGINE
// ==========================================
function toggleBookmark(itemId) {
    const id = Number(itemId);
    if (myBackpack.includes(id)) {
        myBackpack = myBackpack.filter(bid => bid !== id);
    } else {
        myBackpack.push(id);
    }
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

    const savedItems = allStudyMaterials.filter(item => myBackpack.includes(Number(item.id)));
    container.innerHTML = '';
    savedItems.forEach(item => {
        container.innerHTML += generateCardHTML(item);
    });
    if (window.lucide) lucide.createIcons();
}