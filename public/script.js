// App State
const state = {
    currentUser: null,
    notes: [],
    publicNotes: [],
    bookmarks: [],
    currentView: 'dashboard',
    editingNoteId: null,
    isLoggedIn: false,
    activeTab: 'all',
    searchQuery: '',
    currentNoteDetail: null,
    currentProfile: null,
    notifications: [],
    unreadNotifications: 0,
    darkMode: localStorage.getItem('darkMode') === 'true' || false,
    adminMode: false
};

// DOM Elements
const elements = {
    // Main elements
    appContent: document.getElementById('appContent'),
    userAvatar: document.getElementById('userAvatar'),
    addNoteBtn: document.getElementById('addNoteBtn'),
    notificationBadge: document.getElementById('notificationBadge'),
    
    // Modals
    loginModal: document.getElementById('loginModal'),
    registerModal: document.getElementById('registerModal'),
    noteModal: document.getElementById('noteModal'),
    noteDetailModal: document.getElementById('noteDetailModal'),
    editProfileModal: document.getElementById('editProfileModal'),
    shareModal: document.getElementById('shareModal'),
    profileModal: document.getElementById('profileModal'),
    notificationsModal: document.getElementById('notificationsModal'),
    adminLoginModal: document.getElementById('adminLoginModal'),
    adminPanelModal: document.getElementById('adminPanelModal'),
    
    // Close buttons
    closeLoginModal: document.getElementById('closeLoginModal'),
    closeRegisterModal: document.getElementById('closeRegisterModal'),
    closeNoteModal: document.getElementById('closeNoteModal'),
    closeNoteDetailModal: document.getElementById('closeNoteDetailModal'),
    closeEditProfileModal: document.getElementById('closeEditProfileModal'),
    closeShareModal: document.getElementById('closeShareModal'),
    closeProfileModal: document.getElementById('closeProfileModal'),
    closeNotificationsModal: document.getElementById('closeNotificationsModal'),
    closeAdminLoginModal: document.getElementById('closeAdminLoginModal'),
    closeAdminPanelModal: document.getElementById('closeAdminPanelModal'),
    
    // Forms
    loginForm: document.getElementById('loginForm'),
    registerForm: document.getElementById('registerForm'),
    noteForm: document.getElementById('noteForm'),
    commentForm: document.getElementById('commentForm'),
    editProfileForm: document.getElementById('editProfileForm'),
    adminLoginForm: document.getElementById('adminLoginForm'),
    
    // Note modal elements
    noteModalTitle: document.getElementById('noteModalTitle'),
    noteId: document.getElementById('noteId'),
    noteTitle: document.getElementById('noteTitle'),
    noteContent: document.getElementById('noteContent'),
    noteImage: document.getElementById('noteImage'),
    noteImagePreview: document.getElementById('noteImagePreview'),
    removeImageBtn: document.getElementById('removeImageBtn'),
    noteIsPublic: document.getElementById('noteIsPublic'),
    saveNoteBtn: document.getElementById('saveNoteBtn'),
    
    // Note detail modal elements
    noteDetailTitle: document.getElementById('noteDetailTitle'),
    noteDetailContent: document.getElementById('noteDetailContent'),
    noteDetailImageContainer: document.getElementById('noteDetailImageContainer'),
    noteDetailAuthorAvatar: document.getElementById('noteDetailAuthorAvatar'),
    noteDetailAuthorName: document.getElementById('noteDetailAuthorName'),
    noteDetailCreatedAt: document.getElementById('noteDetailCreatedAt'),
    noteDetailViews: document.getElementById('noteDetailViews'),
    noteDetailLikes: document.getElementById('noteDetailLikes'),
    noteDetailLikeBtn: document.getElementById('noteDetailLikeBtn'),
    noteDetailBookmarkBtn: document.getElementById('noteDetailBookmarkBtn'),
    noteDetailShareBtn: document.getElementById('noteDetailShareBtn'),
    noteDetailEditBtn: document.getElementById('noteDetailEditBtn'),
    noteDetailDeleteBtn: document.getElementById('noteDetailDeleteBtn'),
    followUserBtn: document.getElementById('followUserBtn'),
    commentsList: document.getElementById('commentsList'),
    commentContent: document.getElementById('commentContent'),
    commentAttachment: document.getElementById('commentAttachment'),
    commentAttachmentPreview: document.getElementById('commentAttachmentPreview'),
    
    // Profile modal elements
    profileModalAvatar: document.getElementById('profileModalAvatar'),
    profileModalName: document.getElementById('profileModalName'),
    profileModalBio: document.getElementById('profileModalBio'),
    profileModalNotes: document.getElementById('profileModalNotes'),
    profileModalFollowers: document.getElementById('profileModalFollowers'),
    profileModalFollowing: document.getElementById('profileModalFollowing'),
    profileModalActions: document.getElementById('profileModalActions'),
    profileModalFollowBtn: document.getElementById('profileModalFollowBtn'),
    profileModalNotesGrid: document.getElementById('profileModalNotesGrid'),
    
    // Share modal elements
    shareLink: document.getElementById('shareLink'),
    copyShareLinkBtn: document.getElementById('copyShareLinkBtn'),
    shareUserSearch: document.getElementById('shareUserSearch'),
    shareUserResults: document.getElementById('shareUserResults'),
    
    // Edit profile modal elements
    editProfileName: document.getElementById('editProfileName'),
    editProfileBio: document.getElementById('editProfileBio'),
    editProfileAvatar: document.getElementById('editProfileAvatar'),
    editProfileAvatarPreview: document.getElementById('editProfileAvatarPreview'),
    removeAvatarBtn: document.getElementById('removeAvatarBtn'),
    
    // Notifications modal elements
    notificationsList: document.getElementById('notificationsList'),
    notificationsLink: document.getElementById('notificationsLink'),
    
    // Admin panel elements
    adminUsersTable: document.getElementById('adminUsersTable'),
    adminNotesTable: document.getElementById('adminNotesTable'),
    adminUserSearch: document.getElementById('adminUserSearch'),
    adminNoteSearch: document.getElementById('adminNoteSearch'),
    
    // Other UI elements
    toastContainer: document.getElementById('toastContainer'),
    navLinks: document.getElementById('navLinks'),
    authButtons: document.getElementById('authButtons'),
    userMenu: document.getElementById('userMenu'),
    loginBtn: document.getElementById('loginBtn'),
    registerBtn: document.getElementById('registerBtn'),
    mobileMenuBtn: document.getElementById('mobileMenuBtn'),
    logoutBtn: document.getElementById('logoutBtn'),
    themeToggle: document.getElementById('themeToggle'),
    showLogin: document.getElementById('showLogin'),
    showRegister: document.getElementById('showRegister')
};

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    checkAuthState();
    applyDarkMode();
    
    // Check for admin mode in URL
    if (window.location.hash === '#admin') {
        showModal('adminLoginModal');
    }
});

// Setup all event listeners
function setupEventListeners() {
    // Auth buttons
    elements.loginBtn?.addEventListener('click', showLoginModal);
    elements.registerBtn?.addEventListener('click', showRegisterModal);
    elements.logoutBtn?.addEventListener('click', logout);
    
    // Modal buttons
    elements.closeLoginModal?.addEventListener('click', () => hideModal('loginModal'));
    elements.closeRegisterModal?.addEventListener('click', () => hideModal('registerModal'));
    elements.closeNoteModal?.addEventListener('click', () => hideModal('noteModal'));
    elements.closeNoteDetailModal?.addEventListener('click', () => hideModal('noteDetailModal'));
    elements.closeEditProfileModal?.addEventListener('click', () => hideModal('editProfileModal'));
    elements.closeShareModal?.addEventListener('click', () => hideModal('shareModal'));
    elements.closeProfileModal?.addEventListener('click', () => hideModal('profileModal'));
    elements.closeNotificationsModal?.addEventListener('click', () => hideModal('notificationsModal'));
    elements.closeAdminLoginModal?.addEventListener('click', () => hideModal('adminLoginModal'));
    elements.closeAdminPanelModal?.addEventListener('click', () => hideModal('adminPanelModal'));
    
    // Form submissions
    elements.loginForm?.addEventListener('submit', handleLogin);
    elements.registerForm?.addEventListener('submit', handleRegister);
    elements.noteForm?.addEventListener('submit', handleNoteSubmit);
    elements.commentForm?.addEventListener('submit', handleCommentSubmit);
    elements.editProfileForm?.addEventListener('submit', handleEditProfile);
    elements.adminLoginForm?.addEventListener('submit', handleAdminLogin);
    
    // Navigation links
    document.querySelectorAll('[data-view]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            state.currentView = e.target.getAttribute('data-view');
            renderView();
        });
    });
    
    // Add note button
    elements.addNoteBtn?.addEventListener('click', showAddNoteModal);
    
    // Mobile menu
    elements.mobileMenuBtn?.addEventListener('click', toggleMobileMenu);
    
    // User avatar dropdown
    elements.userAvatar?.addEventListener('click', toggleUserMenu);
    
    // Theme toggle
    elements.themeToggle?.addEventListener('change', toggleDarkMode);
    
    // Image upload preview
    elements.noteImage?.addEventListener('change', handleImageUpload);
    elements.removeImageBtn?.addEventListener('click', removeNoteImage);
    elements.editProfileAvatar?.addEventListener('change', handleAvatarUpload);
    elements.removeAvatarBtn?.addEventListener('click', removeAvatar);
    elements.commentAttachment?.addEventListener('change', handleCommentAttachment);
    
    // Share modal
    elements.copyShareLinkBtn?.addEventListener('click', copyShareLink);
    elements.shareUserSearch?.addEventListener('input', searchUsersToShare);
    
    // Admin panel
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            
            document.querySelectorAll('.admin-content').forEach(c => c.style.display = 'none');
            document.getElementById(`admin${e.target.getAttribute('data-tab').charAt(0).toUpperCase() + e.target.getAttribute('data-tab').slice(1)}Content`).style.display = 'block';
        });
    });
    
    elements.adminUserSearch?.addEventListener('input', searchAdminUsers);
    elements.adminNoteSearch?.addEventListener('input', searchAdminNotes);
}

// Apply dark mode based on user preference
function applyDarkMode() {
    if (state.darkMode) {
        document.body.classList.add('dark-mode');
        elements.themeToggle.checked = true;
    } else {
        document.body.classList.remove('dark-mode');
        elements.themeToggle.checked = false;
    }
}

// Toggle dark mode
function toggleDarkMode() {
    state.darkMode = !state.darkMode;
    localStorage.setItem('darkMode', state.darkMode);
    applyDarkMode();
}

// Show toast notification
function showToast(message, type = 'info', duration = 5000) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span>${message}</span>
        <button class="toast-close">&times;</button>
    `;
    
    elements.toastContainer.appendChild(toast);
    
    // Auto-remove after duration
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, duration);
    
    // Manual close
    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    });
}

// Toggle mobile menu
function toggleMobileMenu() {
    elements.navLinks.classList.toggle('active');
}

// Toggle user menu
function toggleUserMenu(e) {
    e.stopPropagation();
    const dropdown = document.querySelector('.dropdown-menu');
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
}

// Close dropdowns when clicking outside
document.addEventListener('click', () => {
    const dropdown = document.querySelector('.dropdown-menu');
    if (dropdown) dropdown.style.display = 'none';
});

// Check authentication state
async function checkAuthState() {
    const user = JSON.parse(localStorage.getItem('mynotesUser'));
    if (user) {
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: user.email,
                    password: user.password
                })
            });

            if (response.ok) {
                const data = await response.json();
                state.currentUser = data;
                state.isLoggedIn = true;
                updateUI();
                loadPublicNotes();
                loadBookmarks();
                loadNotifications();
            } else {
                localStorage.removeItem('mynotesUser');
            }
        } catch (error) {
            console.error('Error verifying user:', error);
            showToast('Error verifying user session', 'error');
        }
    }
    renderView();
}

// Update UI based on auth state
function updateUI() {
    if (state.isLoggedIn) {
        elements.authButtons.style.display = 'none';
        elements.userMenu.style.display = 'flex';
        elements.userAvatar.src = state.currentUser.avatar || 
            `https://ui-avatars.com/api/?name=${encodeURIComponent(state.currentUser.name)}&background=4a6fa5&color=fff`;
        elements.addNoteBtn.style.display = 'flex';
        
        // Update notification badge
        updateNotificationBadge();
    } else {
        elements.authButtons.style.display = 'flex';
        elements.userMenu.style.display = 'none';
        elements.addNoteBtn.style.display = 'none';
        elements.notificationBadge.style.display = 'none';
    }
}

// Load public notes
async function loadPublicNotes() {
    try {
        const response = await fetch('/api/notes/public');
        if (response.ok) {
            state.publicNotes = await response.json();
            renderView();
        } else {
            showToast('Failed to load public notes', 'error');
        }
    } catch (error) {
        console.error('Error loading public notes:', error);
        showToast('Error loading public notes', 'error');
    }
}

// Load bookmarks
async function loadBookmarks() {
    if (!state.currentUser) return;
    
    try {
        const response = await fetch(`/api/bookmarks/${state.currentUser.id}`);
        if (response.ok) {
            state.bookmarks = await response.json();
            renderView();
        } else {
            showToast('Failed to load bookmarks', 'error');
        }
    } catch (error) {
        console.error('Error loading bookmarks:', error);
        showToast('Error loading bookmarks', 'error');
    }
}

// Load notifications
async function loadNotifications() {
    if (!state.currentUser) return;
    
    try {
        const response = await fetch(`/api/notifications/${state.currentUser.id}`);
        if (response.ok) {
            state.notifications = await response.json();
            state.unreadNotifications = state.notifications.filter(n => !n.isRead).length;
            updateNotificationBadge();
            
            // If notifications modal is open, update it
            if (elements.notificationsModal.style.display === 'flex') {
                renderNotificationsModal();
            }
        }
    } catch (error) {
        console.error('Error loading notifications:', error);
    }
}

// Update notification badge
function updateNotificationBadge() {
    if (state.unreadNotifications > 0) {
        elements.notificationBadge.textContent = state.unreadNotifications;
        elements.notificationBadge.style.display = 'inline-block';
    } else {
        elements.notificationBadge.style.display = 'none';
    }
}

// Mark notification as read
async function markNotificationAsRead(notificationId) {
    try {
        const response = await fetch(`/api/notifications/read/${notificationId}`, {
            method: 'PUT'
        });
        
        if (response.ok) {
            loadNotifications();
        }
    } catch (error) {
        console.error('Error marking notification as read:', error);
    }
}

// Render the current view
function renderView() {
    if (!state.isLoggedIn) {
        renderWelcomeView();
        return;
    }

    switch (state.currentView) {
        case 'dashboard':
            renderDashboard();
            break;
        case 'explore':
            renderExplore();
            break;
        case 'bookmarks':
            renderBookmarks();
            break;
        case 'profile':
            renderProfile();
            break;
        case 'notifications':
            renderNotificationsModal();
            showModal('notificationsModal');
            break;
        case 'settings':
            renderSettings();
            break;
        default:
            renderDashboard();
    }
}

// Render welcome view for non-logged in users
function renderWelcomeView() {
    elements.appContent.innerHTML = `
        <div class="auth-container">
            <div class="auth-card">
                <h2>Selamat Datang di MyNotes</h2>
                <p>Buat, atur, dan bagikan catatan Anda dengan dunia.</p>
                <div style="margin-top: 30px; display: flex; flex-direction: column; gap: 10px;">
                    <button class="btn" onclick="showLoginModal()">Masuk</button>
                    <button class="btn btn-outline" onclick="showRegisterModal()">Daftar</button>
                </div>
            </div>
        </div>
    `;
}

// Render Dashboard View
function renderDashboard() {
    elements.appContent.innerHTML = `
        <div class="dashboard-header">
            <h1>Beranda</h1>
        </div>
        <div class="tabs">
            <div class="tab ${state.activeTab === 'all' ? 'active' : ''}" data-tab="all">Semua</div>
            <div class="tab ${state.activeTab === 'following' ? 'active' : ''}" data-tab="following">Mengikuti</div>
        </div>
        <div id="notesContainer">
            ${renderNotesGrid(state.activeTab === 'following' ? 
                filterFollowingNotes(state.publicNotes) : 
                state.publicNotes)}
        </div>
    `;

    setupDashboardEventListeners();
}

// Filter notes from followed users
function filterFollowingNotes(notes) {
    if (!state.currentUser?.following) return [];
    return notes.filter(note => 
        state.currentUser.following?.includes(note.userId)
    );
}

// Render Explore View
function renderExplore() {
    elements.appContent.innerHTML = `
        <div class="dashboard-header">
            <h1>Jelajahi</h1>
            <div class="search-bar">
                <input type="text" id="searchInput" placeholder="Cari catatan..." value="${state.searchQuery}">
                <button class="btn" id="searchBtn">Cari</button>
            </div>
        </div>
        <div id="notesContainer">
            ${state.publicNotes.length > 0 ? renderNotesGrid(state.publicNotes) : renderEmptyState()}
        </div>
    `;

    setupDashboardEventListeners();
}

// Render Bookmarks View
function renderBookmarks() {
    elements.appContent.innerHTML = `
        <div class="dashboard-header">
            <h1>Catatan Disimpan</h1>
        </div>
        <div id="notesContainer">
            ${state.bookmarks.length > 0 ? renderNotesGrid(state.bookmarks) : renderEmptyState('Anda belum menyimpan catatan apapun')}
        </div>
    `;

    setupDashboardEventListeners();
}

// Render empty state
function renderEmptyState(message = 'Tidak ada catatan ditemukan') {
    return `
        <div class="empty-state">
            <i class="fas fa-book-open"></i>
            <h3>${message}</h3>
            ${state.currentView === 'bookmarks' ? '' : '<p>Buat catatan pertama Anda dengan menekan tombol +</p>'}
        </div>
    `;
}

// Render notes grid
function renderNotesGrid(notes) {
    return `
        <div class="notes-grid">
            ${notes.map(note => `
                <div class="note-card" data-id="${note.id}">
                    <div class="note-card-header">
                        <div class="note-author" data-user-id="${note.userId}" style="cursor: pointer;">
                            <img src="${getUserAvatar(note.userId)}" alt="Author" class="note-author-avatar">
                            <span>${getUserName(note.userId)}</span>
                        </div>
                        <div class="note-stats">
                            <span class="note-stat"><i class="fas fa-eye"></i> ${note.views || 0}</span>
                            <span class="note-stat"><i class="fas fa-heart"></i> ${note.likes || 0}</span>
                        </div>
                    </div>
                    <h3>${note.title}</h3>
                    <p>${note.content.length > 100 ? note.content.substring(0, 100) + '...' : note.content}</p>
                    ${note.image ? `<div class="note-image-preview" style="background-image: url('${note.image}')"></div>` : ''}
                    <div class="note-meta">
                        <span>${formatDate(note.createdAt)}</span>
                        ${note.isPublic ? '<span class="note-public">Publik</span>' : ''}
                    </div>
                    <div class="note-actions">
                        <button class="btn btn-outline btn-sm view-note" data-id="${note.id}">
                            <i class="fas fa-eye"></i> Lihat
                        </button>
                        ${note.userId === state.currentUser?.id ? `
                            <button class="btn btn-outline btn-sm edit-note" data-id="${note.id}">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                        ` : ''}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Render Profile View
function renderProfile() {
    if (!state.currentUser) return;
    
    // Get user stats
    fetch(`/api/users/stats/${state.currentUser.id}`)
        .then(res => res.json())
        .then(stats => {
            elements.appContent.innerHTML = `
                <div class="profile-container">
                    <div class="profile-header">
                        <img src="${state.currentUser.avatar || 
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(state.currentUser.name)}&background=4a6fa5&color=fff`}" 
                             alt="Profile" class="profile-avatar">
                        <div class="profile-info">
                            <h2>${state.currentUser.name}</h2>
                            <p>${state.currentUser.email}</p>
                            ${state.currentUser.bio ? `<p class="profile-bio">${state.currentUser.bio}</p>` : ''}
                            <p>Anggota sejak ${formatDate(state.currentUser.createdAt)}</p>
                            <div class="profile-stats">
                                <div class="stat-item">
                                    <div class="stat-value">${stats.totalNotes}</div>
                                    <div class="stat-label">Catatan</div>
                                </div>
                                <div class="stat-item">
                                    <div class="stat-value">${stats.totalPublicNotes}</div>
                                    <div class="stat-label">Publik</div>
                                </div>
                                <div class="stat-item">
                                    <div class="stat-value">${stats.followers}</div>
                                    <div class="stat-label">Pengikut</div>
                                </div>
                                <div class="stat-item">
                                    <div class="stat-value">${stats.following}</div>
                                    <div class="stat-label">Mengikuti</div>
                                </div>
                                <div class="stat-item">
                                    <div class="stat-value">${stats.totalViews}</div>
                                    <div class="stat-label">Dilihat</div>
                                </div>
                                <div class="stat-item">
                                    <div class="stat-value">${stats.totalLikes}</div>
                                    <div class="stat-label">Suka</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="profile-actions">
                        <button class="btn" id="editProfileBtn">
                            <i class="fas fa-edit"></i> Edit Profil
                        </button>
                        <button class="btn btn-outline" id="logoutBtn">
                            <i class="fas fa-sign-out-alt"></i> Keluar
                        </button>
                        ${state.currentUser.email === 'admin@mynotes.com' ? `
                            <button class="btn btn-outline" id="adminPanelBtn">
                                <i class="fas fa-cog"></i> Admin Panel
                            </button>
                        ` : ''}
                    </div>
                    <div class="profile-public-notes">
                        <h3>Catatan Publik Saya</h3>
                        ${stats.totalPublicNotes > 0 ? 
                            `<div class="notes-grid">
                                ${state.publicNotes
                                    .filter(note => note.userId === state.currentUser.id)
                                    .slice(0, 4)
                                    .map(note => `
                                        <div class="note-card" data-id="${note.id}">
                                            <h3>${note.title}</h3>
                                            <p>${note.content.length > 100 ? note.content.substring(0, 100) + '...' : note.content}</p>
                                            <div class="note-meta">
                                                <span>${formatDate(note.createdAt)}</span>
                                            </div>
                                            <div class="note-actions">
                                                <button class="btn btn-outline btn-sm view-note" data-id="${note.id}">
                                                    <i class="fas fa-eye"></i> Lihat
                                                </button>
                                            </div>
                                        </div>
                                    `).join('')}
                            </div>
                            ${stats.totalPublicNotes > 4 ? 
                                '<a href="#" data-view="explore" class="btn btn-outline" style="margin-top: 20px;">Lihat Semua Catatan</a>' : ''}
                            ` : 
                            '<p class="empty-state">Belum ada catatan publik</p>'
                        }
                    </div>
                </div>
            `;

            // Re-attach event listeners
            document.getElementById('editProfileBtn')?.addEventListener('click', showEditProfileModal);
            document.getElementById('logoutBtn')?.addEventListener('click', logout);
            document.getElementById('adminPanelBtn')?.addEventListener('click', showAdminLoginModal);
            
            // Add view note listeners
            document.querySelectorAll('.view-note').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const noteId = e.target.closest('button').getAttribute('data-id');
                    viewNote(noteId);
                });
            });
        })
        .catch(error => {
            console.error('Error loading profile stats:', error);
            showToast('Error loading profile', 'error');
        });
}

// Render Settings View
function renderSettings() {
    elements.appContent.innerHTML = `
        <div class="settings-container">
            <h1>Pengaturan</h1>
            <div class="settings-card">
                <h2><i class="fas fa-user-cog"></i> Akun</h2>
                <button class="btn" id="editProfileBtn">
                    <i class="fas fa-edit"></i> Edit Profil
                </button>
                <button class="btn btn-outline" id="changePasswordBtn">
                    <i class="fas fa-key"></i> Ubah Password
                </button>
            </div>
            <div class="settings-card">
                <h2><i class="fas fa-bell"></i> Notifikasi</h2>
                <div class="form-group form-checkbox">
                    <input type="checkbox" id="enableNotifications" checked>
                    <label for="enableNotifications">Aktifkan Notifikasi</label>
                </div>
            </div>
            <div class="settings-card">
                <h2><i class="fas fa-palette"></i> Tampilan</h2>
                <div class="form-group">
                    <label for="themeSetting">Mode Tampilan</label>
                    <select id="themeSetting">
                        <option value="light">Terang</option>
                        <option value="dark">Gelap</option>
                        <option value="system">Sesuai Sistem</option>
                    </select>
                </div>
            </div>
            <div class="settings-card danger-zone">
                <h2><i class="fas fa-exclamation-triangle"></i> Zona Bahaya</h2>
                <button class="btn btn-outline" id="deleteAccountBtn">
                    <i class="fas fa-trash"></i> Hapus Akun
                </button>
            </div>
        </div>
    `;

    // Set current theme
    document.getElementById('themeSetting').value = 
        localStorage.getItem('themePreference') || 'system';
    
    // Add event listeners
    document.getElementById('editProfileBtn').addEventListener('click', showEditProfileModal);
    document.getElementById('changePasswordBtn').addEventListener('click', showChangePasswordModal);
    document.getElementById('deleteAccountBtn').addEventListener('click', confirmDeleteAccount);
    document.getElementById('themeSetting').addEventListener('change', (e) => {
        localStorage.setItem('themePreference', e.target.value);
        if (e.target.value === 'system') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            state.darkMode = prefersDark;
        } else {
            state.darkMode = e.target.value === 'dark';
        }
        applyDarkMode();
    });
}

// Render Notifications Modal
function renderNotificationsModal() {
    elements.notificationsList.innerHTML = state.notifications.length > 0 ? 
        state.notifications.map(notification => `
            <div class="notification ${notification.isRead ? '' : 'unread'}" data-id="${notification.id}">
                <div class="notification-content">
                    <div class="notification-message">${notification.message}</div>
                    <div class="notification-time">${formatTimeAgo(notification.createdAt)}</div>
                </div>
                ${!notification.isRead ? '<div class="notification-dot"></div>' : ''}
            </div>
        `).join('') : '<p class="empty-state">Tidak ada notifikasi</p>';
    
    // Add click listeners
    document.querySelectorAll('.notification').forEach(notification => {
        notification.addEventListener('click', (e) => {
            const notificationId = e.currentTarget.getAttribute('data-id');
            markNotificationAsRead(notificationId);
            
            // For note-related notifications, open the note
            const noteId = state.notifications.find(n => n.id === notificationId)?.noteId;
            if (noteId) {
                viewNote(noteId);
                hideModal('notificationsModal');
            }
        });
    });
}

// Format date
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
}

// Format time ago
function formatTimeAgo(dateString) {
    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return 'baru saja';
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} menit yang lalu`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} jam yang lalu`;
    
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} hari yang lalu`;
    
    return formatDate(dateString);
}

// Get user name by ID
function getUserName(userId) {
    if (state.currentUser?.id === userId) return 'Anda';
    const allUsers = [...(state.currentUser ? [state.currentUser] : []), ...state.publicNotes.map(n => n.user)];
    const user = allUsers.find(u => u?.id === userId);
    return user?.name || 'Tidak Dikenal';
}

// Get user avatar by ID
function getUserAvatar(userId) {
    const allUsers = [...(state.currentUser ? [state.currentUser] : []), ...state.publicNotes.map(n => n.user)];
    const user = allUsers.find(u => u?.id === userId);
    return user?.avatar || `https://ui-avatars.com/api/?name=Tidak+Dikenal&background=4a6fa5&color=fff`;
}

// Setup dashboard event listeners
function setupDashboardEventListeners() {
    // Tabs
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            state.activeTab = e.target.getAttribute('data-tab');
            renderView();
        });
    });

    // Search
    document.getElementById('searchBtn')?.addEventListener('click', handleSearch);
    document.getElementById('searchInput')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });

    // Note actions
    document.querySelectorAll('.view-note').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const noteId = e.target.closest('button').getAttribute('data-id');
            viewNote(noteId);
        });
    });

    document.querySelectorAll('.edit-note').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const noteId = e.target.closest('button').getAttribute('data-id');
            editNote(noteId);
        });
    });

    // User profile clicks
    document.querySelectorAll('.note-author').forEach(author => {
        author.addEventListener('click', (e) => {
            const userId = e.currentTarget.getAttribute('data-user-id');
            if (userId) viewProfile(userId);
        });
    });
}

// Handle search
function handleSearch() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        state.searchQuery = searchInput.value.trim();
        renderView();
    }
}

// View note details
async function viewNote(noteId) {
    try {
        // Track view
        if (state.currentUser) {
            await fetch(`/api/notes/view/${noteId}?userId=${state.currentUser.id}`);
        } else {
            await fetch(`/api/notes/view/${noteId}`);
        }

        // Get note details
        const allNotes = [...state.publicNotes];
        const note = allNotes.find(n => n.id === noteId);
        
        if (!note) {
            showToast('Catatan tidak ditemukan', 'error');
            return;
        }

        state.currentNoteDetail = note;

        // Get author info
        const authorResponse = await fetch(`/api/users/${note.userId}`);
        const author = await authorResponse.json();

        // Get stats
        const viewsResponse = await fetch(`/api/notes/views/${noteId}`);
        const viewsData = await viewsResponse.json();
        
        const likesResponse = await fetch(`/api/notes/likes/${noteId}`);
        const likesData = await likesResponse.json();

        // Check if current user liked/bookmarked/followed
        let userLiked = false;
        let userBookmarked = false;
        let userFollowing = false;
        
        if (state.currentUser) {
            const likedResponse = await fetch(`/api/notes/like/${noteId}?userId=${state.currentUser.id}`);
            const likedData = await likedResponse.json();
            userLiked = likedData.liked;
            
            const bookmarkedResponse = await fetch(`/api/notes/bookmark/${noteId}?userId=${state.currentUser.id}`);
            const bookmarkedData = await bookmarkedResponse.json();
            userBookmarked = bookmarkedData.bookmarked;
            
            const followingResponse = await fetch(`/api/users/is-following/${author.id}?followerId=${state.currentUser.id}`);
            const followingData = await followingResponse.json();
            userFollowing = followingData.isFollowing;
        }

        // Get comments
        const commentsResponse = await fetch(`/api/notes/comments/${noteId}`);
        const comments = await commentsResponse.json();

        // Update modal content
        elements.noteDetailTitle.textContent = note.title;
        elements.noteDetailContent.textContent = note.content;
        elements.noteDetailAuthorName.textContent = author?.name || 'Tidak Dikenal';
        elements.noteDetailAuthorAvatar.src = author?.avatar || `https://ui-avatars.com/api/?name=Tidak+Dikenal&background=4a6fa5&color=fff`;
        elements.noteDetailCreatedAt.textContent = formatDate(note.createdAt);
        elements.noteDetailViews.querySelector('span').textContent = viewsData.count;
        elements.noteDetailLikes.querySelector('span').textContent = likesData.count;
        
        // Update image
        elements.noteDetailImageContainer.innerHTML = note.image ? 
            `<img src="${note.image}" alt="Note Image" class="note-detail-image">` : '';
        
        // Update like button
        if (userLiked) {
            elements.noteDetailLikeBtn.innerHTML = '<i class="fas fa-heart"></i> Disukai';
            elements.noteDetailLikeBtn.classList.add('liked');
        } else {
            elements.noteDetailLikeBtn.innerHTML = '<i class="far fa-heart"></i> Suka';
            elements.noteDetailLikeBtn.classList.remove('liked');
        }
        
        // Update bookmark button
        if (userBookmarked) {
            elements.noteDetailBookmarkBtn.innerHTML = '<i class="fas fa-bookmark"></i> Disimpan';
            elements.noteDetailBookmarkBtn.classList.add('bookmarked');
        } else {
            elements.noteDetailBookmarkBtn.innerHTML = '<i class="far fa-bookmark"></i> Simpan';
            elements.noteDetailBookmarkBtn.classList.remove('bookmarked');
        }
        
        // Update follow button
        if (state.currentUser?.id === author.id) {
            elements.followUserBtn.style.display = 'none';
        } else {
            elements.followUserBtn.style.display = 'block';
            if (userFollowing) {
                elements.followUserBtn.innerHTML = '<i class="fas fa-user-check"></i> Mengikuti';
                elements.followUserBtn.classList.add('following');
            } else {
                elements.followUserBtn.innerHTML = '<i class="fas fa-user-plus"></i> Ikuti';
                elements.followUserBtn.classList.remove('following');
            }
        }
        
        // Update edit/delete buttons
        if (state.currentUser?.id === note.userId) {
            elements.noteDetailEditBtn.style.display = 'inline-block';
            elements.noteDetailDeleteBtn.style.display = 'inline-block';
        } else {
            elements.noteDetailEditBtn.style.display = 'none';
            elements.noteDetailDeleteBtn.style.display = 'none';
        }
        
        // Render comments
        renderComments(comments);
        
        // Setup event listeners
        setupNoteDetailEventListeners(noteId, author.id);
        
        // Show the modal
        showModal('noteDetailModal');
    } catch (error) {
        console.error('Error viewing note:', error);
        showToast('Error loading note details', 'error');
    }
}

// Render comments
function renderComments(comments) {
    elements.commentsList.innerHTML = comments.length > 0 ? 
        renderCommentTree(comments) : '<p class="no-comments">Belum ada komentar. Jadilah yang pertama berkomentar!</p>';
}

// Render comment tree
function renderCommentTree(comments) {
    return comments.map(comment => `
        <div class="comment" data-id="${comment.id}">
            <div class="comment-author">
                <img src="${comment.userAvatar}" alt="${comment.userName}" class="comment-avatar">
                <div>
                    <strong>${comment.userName}</strong>
                    <small>${formatTimeAgo(comment.createdAt)}</small>
                </div>
            </div>
            <div class="comment-content">${comment.content}</div>
            ${comment.attachment ? `
                <div class="comment-attachment">
                    ${comment.attachment.endsWith('.mp3') ? `
                        <audio controls>
                            <source src="${comment.attachment}" type="audio/mpeg">
                            Browser Anda tidak mendukung audio.
                        </audio>
                    ` : `
                        <img src="${comment.attachment}" alt="Attachment" class="comment-image">
                    `}
                </div>
            ` : ''}
            <button class="btn btn-outline btn-sm reply-comment" data-id="${comment.id}">
                <i class="fas fa-reply"></i> Balas
            </button>
            ${comment.replies?.length > 0 ? `
                <div class="comment-replies">
                    ${renderCommentTree(comment.replies)}
                </div>
            ` : ''}
        </div>
    `).join('');
}

// Setup note detail event listeners
function setupNoteDetailEventListeners(noteId, authorId) {
    // Like button
    elements.noteDetailLikeBtn.onclick = async () => {
        if (!state.currentUser) {
            showLoginModal();
            showToast('Silakan masuk untuk menyukai catatan', 'warning');
            return;
        }
        
        try {
            const response = await fetch(`/api/notes/like/${noteId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: state.currentUser.id
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                const likesResponse = await fetch(`/api/notes/likes/${noteId}`);
                const likesData = await likesResponse.json();
                
                elements.noteDetailLikes.querySelector('span').textContent = likesData.count;
                
                if (result.liked) {
                    elements.noteDetailLikeBtn.innerHTML = '<i class="fas fa-heart"></i> Disukai';
                    elements.noteDetailLikeBtn.classList.add('liked');
                    showToast('Catatan disukai', 'success');
                } else {
                    elements.noteDetailLikeBtn.innerHTML = '<i class="far fa-heart"></i> Suka';
                    elements.noteDetailLikeBtn.classList.remove('liked');
                    showToast('Batal menyukai catatan', 'info');
                }
            }
        } catch (error) {
            console.error('Error liking note:', error);
            showToast('Error menyukai catatan', 'error');
        }
    };
    
    // Bookmark button
    elements.noteDetailBookmarkBtn.onclick = async () => {
        if (!state.currentUser) {
            showLoginModal();
            showToast('Silakan masuk untuk menyimpan catatan', 'warning');
            return;
        }
        
        try {
            const response = await fetch(`/api/notes/bookmark/${noteId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: state.currentUser.id
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                
                if (result.bookmarked) {
                    elements.noteDetailBookmarkBtn.innerHTML = '<i class="fas fa-bookmark"></i> Disimpan';
                    elements.noteDetailBookmarkBtn.classList.add('bookmarked');
                    showToast('Catatan disimpan', 'success');
                } else {
                    elements.noteDetailBookmarkBtn.innerHTML = '<i class="far fa-bookmark"></i> Simpan';
                    elements.noteDetailBookmarkBtn.classList.remove('bookmarked');
                    showToast('Catatan dihapus dari simpan', 'info');
                }
                
                // Update bookmarks list if we're on the bookmarks view
                if (state.currentView === 'bookmarks') {
                    loadBookmarks();
                }
            }
        } catch (error) {
            console.error('Error bookmarking note:', error);
            showToast('Error menyimpan catatan', 'error');
        }
    };
    
    // Share button
    elements.noteDetailShareBtn.onclick = () => {
        showShareModal(noteId);
    };
    
    // Edit button
    elements.noteDetailEditBtn.onclick = () => {
        editNote(noteId);
        hideModal('noteDetailModal');
    };
    
    // Delete button
    elements.noteDetailDeleteBtn.onclick = () => {
        if (confirm('Apakah Anda yakin ingin menghapus catatan ini?')) {
            deleteNote(noteId);
            hideModal('noteDetailModal');
        }
    };
    
    // Follow button
    elements.followUserBtn.onclick = async () => {
        if (!state.currentUser) {
            showLoginModal();
            showToast('Silakan masuk untuk mengikuti pengguna', 'warning');
            return;
        }
        
        try {
            const response = await fetch(`/api/users/follow/${authorId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    followerId: state.currentUser.id
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                
                if (result.following) {
                    elements.followUserBtn.innerHTML = '<i class="fas fa-user-check"></i> Mengikuti';
                    elements.followUserBtn.classList.add('following');
                    showToast('Anda mulai mengikuti pengguna ini', 'success');
                } else {
                    elements.followUserBtn.innerHTML = '<i class="fas fa-user-plus"></i> Ikuti';
                    elements.followUserBtn.classList.remove('following');
                    showToast('Anda berhenti mengikuti pengguna ini', 'info');
                }
            }
        } catch (error) {
            console.error('Error following user:', error);
            showToast('Error mengikuti pengguna', 'error');
        }
    };
    
    // Reply buttons
    document.querySelectorAll('.reply-comment').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const commentId = e.target.closest('button').getAttribute('data-id');
            const commentElement = e.target.closest('.comment');
            
            // Highlight the comment being replied to
            document.querySelectorAll('.comment').forEach(c => c.classList.remove('replying-to'));
            commentElement.classList.add('replying-to');
            
            // Update comment form
            elements.commentContent.placeholder = `Balas komentar ${commentElement.querySelector('.comment-author strong').textContent}...`;
            elements.commentForm.dataset.parentCommentId = commentId;
            elements.commentContent.focus();
        });
    });
}

// Show share modal
function showShareModal(noteId) {
    elements.shareLink.value = `${window.location.origin}?note=${noteId}`;
    showModal('shareModal');
}

// Copy share link
function copyShareLink() {
    elements.shareLink.select();
    document.execCommand('copy');
    showToast('Link berhasil disalin', 'success');
}

// Search users to share with
function searchUsersToShare() {
    const query = elements.shareUserSearch.value.trim().toLowerCase();
    if (!query) {
        elements.shareUserResults.innerHTML = '';
        return;
    }
    
    fetch('/api/users')
        .then(res => res.json())
        .then(users => {
            const filteredUsers = users.filter(user => 
                user.id !== state.currentUser?.id &&
                user.name.toLowerCase().includes(query)
            );
            
            elements.shareUserResults.innerHTML = filteredUsers.length > 0 ? 
                filteredUsers.map(user => `
                    <div class="user-result" data-id="${user.id}">
                        <img src="${user.avatar}" alt="${user.name}" class="user-avatar">
                        <div class="user-info">
                            <strong>${user.name}</strong>
                            <small>${user.email}</small>
                        </div>
                        <button class="btn btn-outline btn-sm share-user-btn">
                            <i class="fas fa-share"></i> Bagikan
                        </button>
                    </div>
                `).join('') : '<p class="no-results">Tidak ada pengguna ditemukan</p>';
            
            // Add share button listeners
            document.querySelectorAll('.share-user-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const userId = e.target.closest('.user-result').getAttribute('data-id');
                    shareNoteWithUser(userId);
                });
            });
        })
        .catch(error => {
            console.error('Error searching users:', error);
            elements.shareUserResults.innerHTML = '<p class="error">Error mencari pengguna</p>';
        });
}

// Share note with user
function shareNoteWithUser(userId) {
    if (!state.currentNoteDetail) return;
    
    fetch(`/api/notes/share/${state.currentNoteDetail.id}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            userId: state.currentUser.id,
            sharedWithId: userId
        })
    })
    .then(res => res.json())
    .then(() => {
        showToast('Catatan berhasil dibagikan', 'success');
        hideModal('shareModal');
    })
    .catch(error => {
        console.error('Error sharing note:', error);
        showToast('Error membagikan catatan', 'error');
    });
}

// View user profile
function viewProfile(userId) {
    fetch(`/api/users/${userId}`)
        .then(res => res.json())
        .then(user => {
            state.currentProfile = user;
            
            // Update profile modal
            elements.profileModalAvatar.src = user.avatar || 
                `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=4a6fa5&color=fff`;
            elements.profileModalName.textContent = user.name;
            elements.profileModalBio.textContent = user.bio || '';
            
            // Check if current user is viewing their own profile
            if (state.currentUser?.id === user.id) {
                elements.profileModalActions.innerHTML = `
                    <button class="btn" id="profileModalEditBtn">
                        <i class="fas fa-edit"></i> Edit Profil
                    </button>
                `;
                document.getElementById('profileModalEditBtn').addEventListener('click', showEditProfileModal);
            } else {
                // Check if current user is following this user
                if (state.currentUser) {
                    fetch(`/api/users/is-following/${user.id}?followerId=${state.currentUser.id}`)
                        .then(res => res.json())
                        .then(data => {
                            if (data.isFollowing) {
                                elements.profileModalFollowBtn.innerHTML = '<i class="fas fa-user-check"></i> Mengikuti';
                                elements.profileModalFollowBtn.classList.add('following');
                            } else {
                                elements.profileModalFollowBtn.innerHTML = '<i class="fas fa-user-plus"></i> Ikuti';
                                elements.profileModalFollowBtn.classList.remove('following');
                            }
                            
                            elements.profileModalActions.innerHTML = '';
                            elements.profileModalActions.appendChild(elements.profileModalFollowBtn);
                            
                            // Add follow button listener
                            elements.profileModalFollowBtn.onclick = () => {
                                toggleFollowUser(user.id);
                            };
                        });
                } else {
                    elements.profileModalActions.innerHTML = `
                        <button class="btn" onclick="showLoginModal()">
                            <i class="fas fa-user-plus"></i> Ikuti
                        </button>
                    `;
                }
            }
            
            // Load user stats
            fetch(`/api/users/stats/${user.id}`)
                .then(res => res.json())
                .then(stats => {
                    elements.profileModalNotes.textContent = stats.totalNotes;
                    elements.profileModalFollowers.textContent = stats.followers;
                    elements.profileModalFollowing.textContent = stats.following;
                });
            
            // Load user's public notes
            fetch(`/api/notes/user/${user.id}`)
                .then(res => res.json())
                .then(notes => {
                    const publicNotes = notes.filter(note => note.isPublic);
                    elements.profileModalNotesGrid.innerHTML = publicNotes.length > 0 ? 
                        publicNotes.map(note => `
                            <div class="note-card" data-id="${note.id}">
                                <h3>${note.title}</h3>
                                <p>${note.content.length > 100 ? note.content.substring(0, 100) + '...' : note.content}</p>
                                ${note.image ? `<div class="note-image-preview" style="background-image: url('${note.image}')"></div>` : ''}
                                <div class="note-meta">
                                    <span>${formatDate(note.createdAt)}</span>
                                </div>
                                <div class="note-actions">
                                    <button class="btn btn-outline btn-sm view-note" data-id="${note.id}">
                                        <i class="fas fa-eye"></i> Lihat
                                    </button>
                                </div>
                            </div>
                        `).join('') : '<p class="empty-state">Belum ada catatan publik</p>';
                    
                    // Add view note listeners
                    document.querySelectorAll('.view-note').forEach(btn => {
                        btn.addEventListener('click', (e) => {
                            const noteId = e.target.closest('button').getAttribute('data-id');
                            viewNote(noteId);
                            hideModal('profileModal');
                        });
                    });
                });
            
            showModal('profileModal');
        })
        .catch(error => {
            console.error('Error loading profile:', error);
            showToast('Error memuat profil', 'error');
        });
}

// Toggle follow user
function toggleFollowUser(userId) {
    if (!state.currentUser) {
        showLoginModal();
        showToast('Silakan masuk untuk mengikuti pengguna', 'warning');
        return;
    }
    
    fetch(`/api/users/follow/${userId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            followerId: state.currentUser.id
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.following) {
            showToast('Anda mulai mengikuti pengguna ini', 'success');
            elements.profileModalFollowBtn.innerHTML = '<i class="fas fa-user-check"></i> Mengikuti';
            elements.profileModalFollowBtn.classList.add('following');
        } else {
            showToast('Anda berhenti mengikuti pengguna ini', 'info');
            elements.profileModalFollowBtn.innerHTML = '<i class="fas fa-user-plus"></i> Ikuti';
            elements.profileModalFollowBtn.classList.remove('following');
        }
        
        // Update followers count
        const followersCount = parseInt(elements.profileModalFollowers.textContent);
        elements.profileModalFollowers.textContent = data.following ? followersCount + 1 : followersCount - 1;
    })
    .catch(error => {
        console.error('Error following user:', error);
        showToast('Error mengikuti pengguna', 'error');
    });
}

// Handle comment submission
async function handleCommentSubmit(e) {
    e.preventDefault();
    const content = elements.commentContent.value.trim();
    const parentCommentId = elements.commentForm.dataset.parentCommentId;
    
    if (!content) {
        showToast('Komentar tidak boleh kosong', 'error');
        return;
    }
    
    if (!state.currentUser) {
        showLoginModal();
        showToast('Silakan masuk untuk berkomentar', 'warning');
        return;
    }
    
    if (!state.currentNoteDetail) {
        showToast('Tidak ada catatan yang dipilih', 'error');
        return;
    }
    
    try {
        const formData = new FormData();
        formData.append('userId', state.currentUser.id);
        formData.append('content', content);
        if (parentCommentId) formData.append('parentCommentId', parentCommentId);
        
        // Add attachment if exists
        if (elements.commentAttachment.files[0]) {
            formData.append('attachment', elements.commentAttachment.files[0]);
        }
        
        const response = await fetch(`/api/notes/comment/${state.currentNoteDetail.id}`, {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            const comment = await response.json();
            showToast('Komentar berhasil diposting', 'success');
            
            // Reset form
            elements.commentContent.value = '';
            elements.commentAttachment.value = '';
            elements.commentAttachmentPreview.innerHTML = '';
            delete elements.commentForm.dataset.parentCommentId;
            elements.commentContent.placeholder = 'Tulis komentar Anda...';
            
            // Remove replying highlight
            document.querySelectorAll('.comment').forEach(c => c.classList.remove('replying-to'));
            
            // Refresh comments
            const commentsResponse = await fetch(`/api/notes/comments/${state.currentNoteDetail.id}`);
            const comments = await commentsResponse.json();
            renderComments(comments);
            
            // Setup reply buttons
            document.querySelectorAll('.reply-comment').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const commentId = e.target.closest('button').getAttribute('data-id');
                    const commentElement = e.target.closest('.comment');
                    
                    document.querySelectorAll('.comment').forEach(c => c.classList.remove('replying-to'));
                    commentElement.classList.add('replying-to');
                    
                    elements.commentContent.placeholder = `Balas komentar ${commentElement.querySelector('.comment-author strong').textContent}...`;
                    elements.commentForm.dataset.parentCommentId = commentId;
                    elements.commentContent.focus();
                });
            });
        } else {
            showToast('Gagal memposting komentar', 'error');
        }
    } catch (error) {
        console.error('Error posting comment:', error);
        showToast('Error memposting komentar', 'error');
    }
}

// Handle comment attachment
function handleCommentAttachment() {
    const file = elements.commentAttachment.files[0];
    if (!file) return;
    
    elements.commentAttachmentPreview.innerHTML = `
        <div class="attachment-preview-item">
            <span>${file.name}</span>
            <button type="button" class="btn btn-outline btn-sm remove-attachment">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    // Add remove attachment listener
    document.querySelector('.remove-attachment').addEventListener('click', () => {
        elements.commentAttachment.value = '';
        elements.commentAttachmentPreview.innerHTML = '';
    });
}

// Show edit profile modal
function showEditProfileModal() {
    if (!state.currentUser) return;
    
    elements.editProfileName.value = state.currentUser.name;
    elements.editProfileBio.value = state.currentUser.bio || '';
    
    // Show current avatar
    elements.editProfileAvatarPreview.innerHTML = state.currentUser.avatar ? 
        `<img src="${state.currentUser.avatar}" alt="Current Avatar" class="avatar-preview-image">` : 
        `<div class="avatar-preview-initials">${state.currentUser.name.charAt(0)}</div>`;
    
    showModal('editProfileModal');
}

// Handle avatar upload
function handleAvatarUpload() {
    const file = elements.editProfileAvatar.files[0];
    if (!file) return;
    
    if (!file.type.match('image.*')) {
        showToast('Hanya file gambar yang diperbolehkan', 'error');
        elements.editProfileAvatar.value = '';
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        elements.editProfileAvatarPreview.innerHTML = `
            <img src="${e.target.result}" alt="Avatar Preview" class="avatar-preview-image">
        `;
    };
    reader.readAsDataURL(file);
}

// Remove avatar
function removeAvatar() {
    elements.editProfileAvatar.value = '';
    elements.editProfileAvatarPreview.innerHTML = `
        <div class="avatar-preview-initials">${state.currentUser.name.charAt(0)}</div>
    `;
}

// Handle edit profile
async function handleEditProfile(e) {
    e.preventDefault();
    const name = elements.editProfileName.value.trim();
    const bio = elements.editProfileBio.value.trim();
    
    if (!name) {
        showToast('Nama wajib diisi', 'error');
        return;
    }
    
    try {
        const formData = new FormData();
        formData.append('name', name);
        formData.append('bio', bio);
        
        // Add avatar if exists
        if (elements.editProfileAvatar.files[0]) {
            formData.append('avatar', elements.editProfileAvatar.files[0]);
        } else if (elements.editProfileAvatarPreview.querySelector('.avatar-preview-initials')) {
            formData.append('removeAvatar', 'true');
        }
        
        const response = await fetch(`/api/users/${state.currentUser.id}`, {
            method: 'PUT',
            body: formData
        });
        
        if (response.ok) {
            const updatedUser = await response.json();
            state.currentUser = updatedUser;
            
            // Update localStorage
            const storedUser = JSON.parse(localStorage.getItem('mynotesUser'));
            if (storedUser) {
                storedUser.name = name;
                localStorage.setItem('mynotesUser', JSON.stringify(storedUser));
            }
            
            hideModal('editProfileModal');
            renderProfile();
            updateUI();
            showToast('Profil berhasil diperbarui', 'success');
        } else {
            showToast('Gagal memperbarui profil', 'error');
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        showToast('Error memperbarui profil', 'error');
    }
}

// Show change password modal
function showChangePasswordModal() {
    // Implement password change functionality
    showToast('Fitur ubah password akan segera hadir', 'info');
}

// Confirm account deletion
function confirmDeleteAccount() {
    if (confirm('Apakah Anda yakin ingin menghapus akun Anda? Semua data akan hilang secara permanen.')) {
        showToast('Fitur hapus akun akan segera hadir', 'info');
    }
}

// Show modal
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

// Hide modal
function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Show login modal
function showLoginModal() {
    showModal('loginModal');
    document.getElementById('loginEmail')?.focus();
}

// Show register modal
function showRegisterModal() {
    showModal('registerModal');
    document.getElementById('registerName')?.focus();
}

// Show admin login modal
function showAdminLoginModal() {
    showModal('adminLoginModal');
    document.getElementById('adminEmail')?.focus();
}

// Handle admin login
async function handleAdminLogin(e) {
    e.preventDefault();
    const email = document.getElementById('adminEmail').value;
    const password = document.getElementById('adminPassword').value;

    if (!email || !password) {
        showToast('Email dan password wajib diisi', 'error');
        return;
    }

    try {
        const response = await fetch('/api/admin/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        if (response.ok) {
            const data = await response.json();
            state.adminMode = true;
            hideModal('adminLoginModal');
            showAdminPanel();
        } else {
            showToast('Email atau password admin salah', 'error');
        }
    } catch (error) {
        console.error('Admin login error:', error);
        showToast('Error masuk sebagai admin', 'error');
    }
}

// Show admin panel
function showAdminPanel() {
    // Load users
    fetch('/api/admin/users')
        .then(res => res.json())
        .then(users => {
            elements.adminUsersTable.innerHTML = users.map(user => `
                <tr>
                    <td>${user.name}</td>
                    <td>${user.email}</td>
                    <td>${formatDate(user.createdAt)}</td>
                    <td>${user.notesCount}</td>
                    <td>
                        <button class="btn btn-outline btn-sm ${user.isSuspended ? 'unsuspend-user' : 'suspend-user'}" data-id="${user.id}">
                            <i class="fas fa-${user.isSuspended ? 'user-check' : 'user-slash'}"></i> ${user.isSuspended ? 'Aktifkan' : 'Tangguhkan'}
                        </button>
                    </td>
                </tr>
            `).join('');
            
            // Add suspend/unsuspend listeners
            document.querySelectorAll('.suspend-user, .unsuspend-user').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const userId = e.target.closest('button').getAttribute('data-id');
                    const suspend = e.target.closest('button').classList.contains('suspend-user');
                    toggleSuspendUser(userId, suspend);
                });
            });
        });
    
    // Load notes
    fetch('/api/notes/public')
        .then(res => res.json())
        .then(notes => {
            elements.adminNotesTable.innerHTML = notes.map(note => `
                <tr>
                    <td>${note.title}</td>
                    <td>${getUserName(note.userId)}</td>
                    <td>${formatDate(note.createdAt)}</td>
                    <td>${note.isPublic ? 'Ya' : 'Tidak'}</td>
                    <td>
                        <button class="btn btn-outline btn-sm delete-note" data-id="${note.id}">
                            <i class="fas fa-trash"></i> Hapus
                        </button>
                    </td>
                </tr>
            `).join('');
            
            // Add delete note listeners
            document.querySelectorAll('.delete-note').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const noteId = e.target.closest('button').getAttribute('data-id');
                    if (confirm('Apakah Anda yakin ingin menghapus catatan ini?')) {
                        deleteNoteAsAdmin(noteId);
                    }
                });
            });
        });
    
    showModal('adminPanelModal');
}

// Toggle user suspension
function toggleSuspendUser(userId, suspend) {
    fetch(`/api/admin/users/suspend/${userId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ suspend })
    })
    .then(res => res.json())
    .then(() => {
        showToast(`Pengguna berhasil ${suspend ? 'ditangguhkan' : 'diaktifkan'}`, 'success');
        showAdminPanel();
    })
    .catch(error => {
        console.error('Error suspending user:', error);
        showToast(`Gagal ${suspend ? 'menangguhkan' : 'mengaktifkan'} pengguna`, 'error');
    });
}

// Delete note as admin
function deleteNoteAsAdmin(noteId) {
    fetch(`/api/admin/notes/${noteId}`, {
        method: 'DELETE'
    })
    .then(res => res.json())
    .then(() => {
        showToast('Catatan berhasil dihapus', 'success');
        showAdminPanel();
    })
    .catch(error => {
        console.error('Error deleting note:', error);
        showToast('Gagal menghapus catatan', 'error');
    });
}

// Search admin users
function searchAdminUsers() {
    const query = elements.adminUserSearch.value.trim().toLowerCase();
    const rows = elements.adminUsersTable.querySelectorAll('tr');
    
    rows.forEach(row => {
        const name = row.cells[0].textContent.toLowerCase();
        const email = row.cells[1].textContent.toLowerCase();
        if (name.includes(query) || email.includes(query)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Search admin notes
function searchAdminNotes() {
    const query = elements.adminNoteSearch.value.trim().toLowerCase();
    const rows = elements.adminNotesTable.querySelectorAll('tr');
    
    rows.forEach(row => {
        const title = row.cells[0].textContent.toLowerCase();
        const author = row.cells[1].textContent.toLowerCase();
        if (title.includes(query) || author.includes(query)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Show add/edit note modal
function showAddNoteModal() {
    if (!state.isLoggedIn) {
        showLoginModal();
        showToast('Silakan masuk untuk membuat catatan', 'warning');
        return;
    }

    state.editingNoteId = null;
    elements.noteModalTitle.textContent = 'Buat Catatan Baru';
    elements.noteId.value = '';
    elements.noteTitle.value = '';
    elements.noteContent.value = '';
    elements.noteImage.value = '';
    elements.noteImagePreview.innerHTML = '';
    elements.removeImageBtn.style.display = 'none';
    elements.noteIsPublic.checked = false;
    showModal('noteModal');
    elements.noteTitle.focus();
}

// Handle image upload
function handleImageUpload() {
    const file = elements.noteImage.files[0];
    if (!file) return;
    
    if (!file.type.match('image.*')) {
        showToast('Hanya file gambar yang diperbolehkan', 'error');
        elements.noteImage.value = '';
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        elements.noteImagePreview.innerHTML = `
            <img src="${e.target.result}" alt="Image Preview" class="image-preview-image">
        `;
        elements.removeImageBtn.style.display = 'block';
    };
    reader.readAsDataURL(file);
}

// Remove note image
function removeNoteImage() {
    elements.noteImage.value = '';
    elements.noteImagePreview.innerHTML = '';
    elements.removeImageBtn.style.display = 'none';
}

// Edit note
async function editNote(noteId) {
    const allNotes = [...state.publicNotes];
    const note = allNotes.find(n => n.id === noteId);
    if (note) {
        state.editingNoteId = noteId;
        elements.noteModalTitle.textContent = 'Edit Catatan';
        elements.noteId.value = note.id;
        elements.noteTitle.value = note.title;
        elements.noteContent.value = note.content;
        elements.noteIsPublic.checked = note.isPublic || false;
        
        // Show current image if exists
        if (note.image) {
            elements.noteImagePreview.innerHTML = `
                <img src="${note.image}" alt="Current Image" class="image-preview-image">
            `;
            elements.removeImageBtn.style.display = 'block';
        } else {
            elements.noteImagePreview.innerHTML = '';
            elements.removeImageBtn.style.display = 'none';
        }
        
        showModal('noteModal');
    }
}

// Delete note
async function deleteNote(noteId) {
    if (!confirm('Apakah Anda yakin ingin menghapus catatan ini?')) return;
    
    try {
        const response = await fetch(`/api/notes/${noteId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            showToast('Catatan berhasil dihapus', 'success');
            loadPublicNotes();
            loadBookmarks();
        } else {
            showToast('Gagal menghapus catatan', 'error');
        }
    } catch (error) {
        console.error('Error deleting note:', error);
        showToast('Error menghapus catatan', 'error');
    }
}

// Handle note submission
async function handleNoteSubmit(e) {
    e.preventDefault();
    const title = elements.noteTitle.value;
    const content = elements.noteContent.value;
    const isPublic = elements.noteIsPublic.checked;

    if (!title || !content) {
        showToast('Judul dan isi wajib diisi', 'error');
        return;
    }

    try {
        const formData = new FormData();
        formData.append('title', title);
        formData.append('content', content);
        formData.append('userId', state.currentUser.id);
        formData.append('isPublic', isPublic);
        
        // Add image if exists
        if (elements.noteImage.files[0]) {
            formData.append('image', elements.noteImage.files[0]);
        } else if (elements.noteImagePreview.innerHTML === '' && state.editingNoteId) {
            formData.append('removeImage', 'true');
        }

        let response;
        if (state.editingNoteId) {
            // Update existing note
            response = await fetch(`/api/notes/${state.editingNoteId}`, {
                method: 'PUT',
                body: formData
            });
        } else {
            // Create new note
            response = await fetch('/api/notes', {
                method: 'POST',
                body: formData
            });
        }

        if (response.ok) {
            const note = await response.json();
            showToast(
                state.editingNoteId ? 'Catatan berhasil diperbarui' : 'Catatan berhasil dibuat', 
                'success'
            );
            hideModal('noteModal');
            loadPublicNotes();
            loadBookmarks();
        } else {
            showToast('Gagal menyimpan catatan', 'error');
        }
    } catch (error) {
        console.error('Error saving note:', error);
        showToast('Error menyimpan catatan', 'error');
    }
}

// Handle login
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        showToast('Email dan password wajib diisi', 'error');
        return;
    }

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        if (response.ok) {
            const user = await response.json();
            state.currentUser = user;
            state.isLoggedIn = true;
            
            // Store user credentials (without password in production)
            localStorage.setItem('mynotesUser', JSON.stringify({
                email: user.email,
                password: password, // Note: In production, store only a token
                name: user.name
            }));
            
            hideModal('loginModal');
            updateUI();
            loadPublicNotes();
            loadBookmarks();
            loadNotifications();
            showToast('Login berhasil!', 'success');
        } else {
            const error = await response.json();
            showToast(error.error || 'Email atau password salah', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showToast('Error saat login', 'error');
    }
}

// Handle register
async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;
    const bio = document.getElementById('registerBio').value;

    if (!name || !email || !password || !confirmPassword) {
        showToast('Semua field wajib diisi', 'error');
        return;
    }

    if (password.length < 6) {
        showToast('Password minimal 6 karakter', 'error');
        return;
    }

    if (password !== confirmPassword) {
        showToast('Password tidak cocok', 'error');
        return;
    }

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, password, bio })
        });

        if (response.ok) {
            const user = await response.json();
            state.currentUser = user;
            state.isLoggedIn = true;
            
            // Store user credentials (without password in production)
            localStorage.setItem('mynotesUser', JSON.stringify({
                email: user.email,
                password: password, // Note: In production, store only a token
                name: user.name
            }));
            
            hideModal('registerModal');
            updateUI();
            loadPublicNotes();
            loadBookmarks();
            loadNotifications();
            showToast('Registrasi berhasil!', 'success');
        } else {
            const error = await response.json();
            showToast(error.error || 'Registrasi gagal', 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showToast('Error saat registrasi', 'error');
    }
}

// Logout function
function logout() {
    localStorage.removeItem('mynotesUser');
    state.currentUser = null;
    state.isLoggedIn = false;
    state.publicNotes = [];
    state.bookmarks = [];
    state.notifications = [];
    state.unreadNotifications = 0;
    updateUI();
    renderView();
    showToast('Anda telah keluar', 'success');
}

// Global functions for HTML onclick
window.showLoginModal = showLoginModal;
window.showRegisterModal = showRegisterModal;