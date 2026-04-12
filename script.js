// ==========================================
// 1. NAVIGATION & SMART HISTORY
// ==========================================
let pageHistory = [];
let currentPage = 'home';

function navigateTo(pageName, isBack = false) {
    // SECURITY GUARD: Check VIP pass
    if (pageName === 'admin') {
        if (localStorage.getItem('isAdminLoggedIn') !== 'true') {
            showLoginModal();
            return;
        }
    }

    // 🌟 THE MEMORY: Remember where we came from
    if (!isBack && currentPage !== pageName) {
        pageHistory.push(currentPage);
    }
    currentPage = pageName;

    // 🌟 SMART BUTTON: Show/Hide the Universal Back Button
    const backBtn = document.getElementById('universal-back-btn');
    if (backBtn) {
        if (pageName === 'home') {
            backBtn.style.display = 'none'; // Hide on home page
            pageHistory = []; // Wipe history clean
        } else {
            backBtn.style.display = 'flex'; // Show on all other pages
        }
    }

    // Hide all pages
    const pages = document.querySelectorAll('main');
    pages.forEach(page => {
        page.style.display = 'none';
        page.classList.remove('active');
    });

    // Show the target page
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

// 🌟 GO BACK LOGIC: Reads the memory and goes back one step!
function goBack() {
    if (pageHistory.length > 0) {
        const previousPage = pageHistory.pop(); // Grab the last page visited
        navigateTo(previousPage, true); // Go there, but tell it we are going backwards
    } else {
        navigateTo('home'); // If no memory exists, default to home
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
        // Ask Supabase to verify the credentials
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) throw error;

        // Success!
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
        await supabaseClient.auth.signOut(); // Tell Supabase to destroy the session
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
// 6. STARTUP INITIALIZATION (Bulletproof)
// ==========================================
function initApp() {
    navigateTo('home');
    applyLogo(localStorage.getItem('customSiteLogo')); // Loads the logo
    fetchAndDisplayMaterials(); // Loads the PDFs from database
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
let editingMaterialId = null; // 🌟 NEW: Tracks if we are editing an old file!

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

    // Only block if NO file, NO text, and NOT currently editing
    if (!file && textContent.trim() === "" && !editingMaterialId) {
        alert("Please add text content or a file!");
        return;
    }

    const btn = event.target.querySelector('button[type="submit"]');
    const originalText = btn.innerText;
    
    // Change button text based on what we are doing
    btn.innerText = editingMaterialId ? "Updating... ⏳" : "Saving... ⏳";
    btn.disabled = true;

    try {
        let finalFileUrl = "";

        // If we are editing, keep the old file link by default
        if (editingMaterialId) {
            const existingItem = allStudyMaterials.find(m => m.id === editingMaterialId);
            finalFileUrl = existingItem ? existingItem.file_url : "";
        }

        // If they selected a NEW file, upload it and overwrite the link
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

        // Data to save
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
            // 🌟 UPDATE EXISTING MATERIAL
            const { error: updateError } = await supabaseClient
                .from('study_materials')
                .update(uploadData)
                .eq('id', editingMaterialId);
            if (updateError) throw updateError;
            alert("Success! Material updated.");
        } else {
            // 🌟 CREATE NEW MATERIAL
            const { error: insertError } = await supabaseClient
                .from('study_materials')
                .insert([uploadData]);
            if (insertError) throw insertError;
            alert("Success! Material saved.");
        }

        // Reset the form so it's ready for the next one
        editingMaterialId = null; 
        event.target.reset();
        document.getElementById('file-name-display').innerText = 'Click to upload or drag & drop';
        document.getElementById('file-name-display').style.color = '#334155';
        
        fetchAndDisplayMaterials();

    } catch (error) {
        console.error("Error saving:", error);
        alert("Action failed. Error: " + error.message);
    } finally {
        btn.innerText = "Upload Material"; // Reset button text
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
    
    // Find the logo image tag
    const logoElements = document.querySelectorAll('.site-logo');
    
    // Show the image
    logoElements.forEach(img => {
        img.src = logoUrl;
        img.style.display = 'block'; 
    });
    
    // 🌟 Notice: We completely removed the code that hides the title text!
}


// ==========================================
// 10. FETCH & DISPLAY MATERIALS LOGIC
// ==========================================
let allStudyMaterials = [];

// 🌟 NEW: Fills the form so you can Edit!
// 🌟 Upgraded Edit Function (Now handles Dynamic Dropdowns)
function editMaterial(id) {
    const item = allStudyMaterials.find(m => m.id === id);
    if (!item) return;

    editingMaterialId = item.id; // Tell the app we are in Edit Mode

    const form = document.getElementById('upload-form');
    const selects = form.querySelectorAll('select');
    
    // Set the Board first
    selects[0].value = item.board; 
    
    // 🌟 THE MAGIC: Load the correct subjects based on the Board!
    updateSubjectDropdown(); 
    
    // Now set the rest of the form
    selects[1].value = item.subject;
    selects[2].value = item.class_level;
    selects[3].value = item.content_type;
    
    form.querySelector('input[type="text"]').value = item.chapter || "";
    form.querySelector('textarea').value = item.content_text || "";

    // Change the button so you know you are editing
    form.querySelector('button[type="submit"]').innerText = "Update Material";
    
    const fileDisplay = document.getElementById('file-name-display');
    if (item.file_url) {
        fileDisplay.innerText = "Current file attached. Click to replace (optional)";
        fileDisplay.style.color = '#ea580c';
    }

    // Scroll to the form
    window.scrollTo({ top: 0, behavior: 'smooth' });
}


// 🌟 BONUS: Delete Function!
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
                    
                    // Add the Edit & Delete Buttons!
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
    function drawCards(container, materials) {
        if (materials.length === 0) {
            container.innerHTML = `<p style="text-align: center; color: #94a3b8; font-size: 15px;">No content added yet for this subject.</p>`;
            return;
        }
        container.innerHTML = '';
        materials.forEach(item => {
            let linkBtn = item.file_url ? `<a href="${item.file_url}" target="_blank" style="display: inline-block; background: #2563eb; color: #ffffff; padding: 10px 20px; border-radius: 10px; text-decoration: none; font-size: 14px; font-weight: 700; margin-top: 12px;">Download PDF</a>` : '';
            let textNotes = item.content_text ? `<div style="background: #f8fafc; padding: 12px; border-radius: 8px; font-size: 14px; color: #334155; margin-top: 12px; white-space: pre-wrap;">${item.content_text}</div>` : '';

            container.innerHTML += `
                <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.02); margin-bottom: 16px;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <h4 style="color: #0f172a; font-size: 16px; font-weight: 800; margin: 0 0 4px 0;">${item.chapter}</h4>
                        <span style="background: #eff6ff; color: #2563eb; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 800;">${item.content_type}</span>
                    </div>
                    <p style="color: #64748b; font-size: 13px; margin: 0;">${item.class_level} • ${item.subject}</p>
                    ${textNotes}
                    ${linkBtn}
                </div>`;
        });
    }

    const icseContainer = document.getElementById('icse-materials-container');
    const pageNotes = document.getElementById('page-notes');
    if (icseContainer && pageNotes && pageNotes.classList.contains('active')) {
        const title = document.getElementById('dynamic-icse-title').innerText;
        const filtered = allStudyMaterials.filter(item => item.board === 'ICSE' && item.subject && title.includes(item.subject));
        drawCards(icseContainer, filtered);
    }

    const iscContainer = document.getElementById('isc-materials-container');
    const pageNotesIsc = document.getElementById('page-notes-isc');
    if (iscContainer && pageNotesIsc && pageNotesIsc.classList.contains('active')) {
        const title = document.getElementById('dynamic-isc-title').innerText;
        const filtered = allStudyMaterials.filter(item => item.board === 'ISC' && item.subject && title.includes(item.subject));
        drawCards(iscContainer, filtered);
    }
}

// ==========================================
// 11. DYNAMIC DROPDOWNS (BOARD -> SUBJECT)
// ==========================================
function updateSubjectDropdown() {
    const board = document.getElementById('admin-board-select').value;
    const subjectSelect = document.getElementById('admin-subject-select');

    // Clear out whatever is currently in the list
    subjectSelect.innerHTML = '<option value="">Select Subject</option>';

    let subjects = [];

    // Load the correct subjects based on the Board selected
    if (board === 'ICSE') {
        subjects = [
            'English', 'Mathematics', 'Science (Physics)', 'Science (Chemistry)', 
            'Science (Biology)', 'Hindi' , 'History & Civics', 
            'Geography', 'Information Technology', 'Computer Science'
        ];
    } else if (board === 'ISC') {
        subjects = [
            'English', 'Physics', 'Chemistry', 'Mathematics', 'Biology', 
            'Computer Science', 'Accounts', 'Business Studies', 'Economics', 'History'
        ];
    }

    // Add the new subjects to the dropdown
    subjects.forEach(sub => {
        const option = document.createElement('option');
        option.value = sub;
        option.innerText = sub;
        subjectSelect.appendChild(option);
    });
}

// ==========================================
// 12. AI CHAT LOGIC (Secure Backend)
// ==========================================
async function sendAIMessage() {
    const inputField = document.getElementById('ai-input');
    const chatBox = document.getElementById('chat-box');
    const userText = inputField.value.trim();

    if (!userText) return;

    // 1. Draw the student's message (Purple Bubble on the right)
    chatBox.innerHTML += `
        <div style="align-self: flex-end; background: #9333ea; color: white; padding: 14px 18px; border-radius: 20px; border-bottom-right-radius: 4px; max-width: 85%; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <p style="margin: 0; font-size: 14px; line-height: 1.5;">${userText}</p>
        </div>
    `;

    // Clear the input box and scroll to the bottom
    inputField.value = '';
    chatBox.scrollTop = chatBox.scrollHeight;

    // 2. Add a temporary "AI is typing..." bubble (White Bubble on the left)
    const typingId = "typing-" + Date.now();
    chatBox.innerHTML += `
        <div id="${typingId}" style="align-self: flex-start; background: #ffffff; border: 1px solid #e2e8f0; padding: 14px 18px; border-radius: 20px; border-bottom-left-radius: 4px; max-width: 85%;">
            <p style="margin: 0; font-size: 14px; color: #94a3b8;">AI is typing...</p>
        </div>
    `;
    chatBox.scrollTop = chatBox.scrollHeight;

    try {
        // 3. Ask your secure Netlify backend!
        const response = await fetch('/.netlify/functions/gemini', {
            method: 'POST',
            body: JSON.stringify({ prompt: userText })
        });

        if (!response.ok) throw new Error("Backend connection failed");

        const data = await response.json();
        const aiReply = data.candidates[0].content.parts[0].text;

        // 4. Remove the "typing..." bubble
        const typingBubble = document.getElementById(typingId);
        if (typingBubble) typingBubble.remove();

        // 5. Draw the real AI answer
        chatBox.innerHTML += `
            <div style="align-self: flex-start; background: #ffffff; border: 1px solid #e2e8f0; padding: 14px 18px; border-radius: 20px; border-bottom-left-radius: 4px; max-width: 85%; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                <p style="margin: 0; font-size: 14px; color: #334155; line-height: 1.5; white-space: pre-wrap;">${aiReply}</p>
            </div>
        `;
        chatBox.scrollTop = chatBox.scrollHeight;

    } catch (error) {
        console.error("AI Error:", error);
        const typingBubble = document.getElementById(typingId);
        if (typingBubble) {
            typingBubble.innerHTML = `<p style="margin: 0; font-size: 14px; color: #ef4444;">Sorry, I'm having trouble connecting right now! Check your internet or try again later.</p>`;
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

    // 🌟 THE SMART SEARCH 
    const filtered = allStudyMaterials.filter(item => {
        // 1. Safe Check: Make sure the item actually has data
        if (!item.class_level || !item.subject) return false;

        // 2. Class Match (Ignores extra words like "ICSE")
        const dbClass = item.class_level.toLowerCase();
        const searchClass = classVal.toLowerCase();
        const matchClass = dbClass.includes(searchClass) || searchClass.includes(dbClass);

        // 3. Subject Match (Finds "Physics" inside "Science (Physics)" and vice versa)
        const dbSubject = item.subject.toLowerCase();
        const searchSubject = subjectVal.toLowerCase();
        const matchSubject = dbSubject.includes(searchSubject) || searchSubject.includes(dbSubject);

        return matchClass && matchSubject;
    });

    // If nothing is found
    if (filtered.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <p style="color: #64748b; font-size: 15px; font-weight: 600;">No materials found for this selection yet.</p>
                <p style="color: #94a3b8; font-size: 13px;">Check back later or try another subject!</p>
            </div>`;
        return;
    }

    // If files are found, draw them!
    container.innerHTML = '';
    filtered.forEach(item => {
        let linkBtn = item.file_url ? `<a href="${item.file_url}" target="_blank" style="display: inline-block; background: #10b981; color: #ffffff; padding: 10px 20px; border-radius: 10px; text-decoration: none; font-size: 14px; font-weight: 700; margin-top: 12px;">Download PDF</a>` : '';
        let textNotes = item.content_text ? `<div style="background: #f8fafc; padding: 12px; border-radius: 8px; font-size: 14px; color: #334155; margin-top: 12px; white-space: pre-wrap;">${item.content_text}</div>` : '';

        container.innerHTML += `
            <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.02); margin-bottom: 16px; text-align: left;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <h4 style="color: #0f172a; font-size: 16px; font-weight: 800; margin: 0 0 4px 0;">${item.chapter}</h4>
                    <span style="background: #ecfdf5; color: #10b981; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 800;">${item.content_type}</span>
                </div>
                <p style="color: #64748b; font-size: 13px; margin: 0;">${item.board} • ${item.class_level} • ${item.subject}</p>
                ${textNotes}
                ${linkBtn}
            </div>`;
    });
}


// 🌟 NEW: Dynamic Filter Dropdown
function updateFilterSubjects() {
    const classVal = document.getElementById('filter-class').value;
    const subjectSelect = document.getElementById('filter-subject');

    // Clear the current list
    subjectSelect.innerHTML = '<option value="">Select Subject</option>';

    let subjects = [];

    // Check which class they picked and load the right subjects
    if (classVal === 'Class 9' || classVal === 'Class 10') {
        // ICSE Subjects
        subjects = [
            'English', 'Mathematics', 'Science (Physics)', 'Science (Chemistry)', 
            'Science (Biology)', 'Hindi' , 'History & Civics', 
            'Geography', 'Information Technology', 'Computer Science'
        ];
    } else if (classVal === 'Class 11' || classVal === 'Class 12') {
        // ISC Subjects
        subjects = [
            'English', 'Physics', 'Chemistry', 'Mathematics', 'Biology', 
            'Computer Science', 'Accounts', 'Business Studies', 'Economics', 'History'
        ];
    }

    // Add them to the screen
    subjects.forEach(sub => {
        const option = document.createElement('option');
        option.value = sub;
        option.innerText = sub;
        subjectSelect.appendChild(option);
    });
}
