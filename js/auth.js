// Initialize Supabase client
const SUPABASE_URL = 'https://vrzsuleuemufvibsrklz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyenN1bGV1ZW11ZnZpYnNya2x6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyNjQ0MzMsImV4cCI6MjA2ODg0MDQzM30.2PHSqbeEAa8yobgeT6wcU87BCyLdp1N40Kp80lwylGU';
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM Elements
const loginBtn = document.getElementById('loginBtn');
const loginModal = document.getElementById('loginModal');
const closeLoginModal = document.querySelector('.close-login-modal');
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('loginEmail');
const passwordInput = document.getElementById('loginPassword');
const loginError = document.getElementById('loginError');
const adminSection = document.getElementById('admin');

// Show login modal
function showLoginModal() {
    if (loginModal) {
        loginModal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

// Hide login modal
function hideLoginModal() {
    if (loginModal) {
        loginModal.classList.remove('show');
        document.body.style.overflow = '';
        if (loginForm) loginForm.reset();
        if (loginError) loginError.textContent = '';
    }
}

// Handle login form submission
async function handleLogin(e) {
    e.preventDefault();
    
    if (!emailInput || !passwordInput || !loginError) return;
    
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    if (!email || !password) {
        loginError.textContent = 'Please enter both email and password';
        return;
    }
    
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) throw error;
        
        // Login successful
        hideLoginModal();
        showAdminSection();
    } catch (error) {
        console.error('Login error:', error);
        if (loginError) {
            loginError.textContent = error.message || 'Login failed. Please check your credentials.';
        }
    }
}

// Show admin section and update UI for logged-in users
function showAdminSection() {
    // Show admin section
    if (adminSection) adminSection.style.display = 'block';
    
    // Update login button to show admin dashboard
    if (loginBtn) {
        loginBtn.textContent = 'Admin';
        loginBtn.href = '#';
        loginBtn.onclick = (e) => {
            e.preventDefault();
            window.location.href = '#admin';
            window.scrollTo(0, 0);
        };
    }
    
    // Add logout button if not already present
    const navMenu = document.querySelector('.nav-menu');
    if (navMenu && !document.getElementById('logoutNavItem')) {
        const logoutItem = document.createElement('li');
        logoutItem.id = 'logoutNavItem';
        logoutItem.innerHTML = `
            <a href="#" id="logoutNavBtn" class="nav-link">
                <span data-en="Logout" data-de="Abmelden">Logout</span>
            </a>
        `;
        navMenu.insertBefore(logoutItem, loginBtn.parentElement.nextSibling);
        
        // Add logout handler
        document.getElementById('logoutNavBtn').addEventListener('click', handleLogout);
    }
}

// Handle logout
async function handleLogout(e) {
    if (e) e.preventDefault();
    
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        
        // Hide admin section
        if (adminSection) adminSection.style.display = 'none';
        
        // Reset login button
        if (loginBtn) {
            loginBtn.textContent = 'Login';
            loginBtn.href = '#';
            loginBtn.onclick = showLoginModal;
        }
        
        // Remove logout button
        const logoutNavItem = document.getElementById('logoutNavItem');
        if (logoutNavItem) {
            logoutNavItem.remove();
        }
        
        // Redirect to home
        window.location.href = '#';
    } catch (error) {
        console.error('Logout error:', error);
        alert('Error logging out. Please try again.');
    }
}

// Check auth state on page load
async function checkAuthState() {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
            showAdminSection();
        }
    } catch (error) {
        console.error('Auth state check error:', error);
    }
}

// Initialize event listeners
function initAuth() {
    // Login button
    if (loginBtn) {
        loginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showLoginModal();
        });
    }
    
    // Close modal button
    if (closeLoginModal) {
        closeLoginModal.addEventListener('click', hideLoginModal);
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === loginModal) {
            hideLoginModal();
        }
    });
    
    // Login form submission
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Check auth state on page load
    document.addEventListener('DOMContentLoaded', checkAuthState);
}

// Initialize auth module when DOM is fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuth);
} else {
    initAuth();
}

// Make functions available globally for testing
document.showLoginModal = showLoginModal;
document.hideLoginModal = hideLoginModal;
document.handleLogin = handleLogin;
document.handleLogout = handleLogout;
