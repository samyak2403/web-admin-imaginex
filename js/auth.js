// Authentication Module
const Auth = {
    currentUser: null,

    init() {
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                // Check if user is admin
                const isAdmin = await this.checkAdminAccess(user);
                if (isAdmin) {
                    this.currentUser = user;
                    this.showDashboard();
                } else {
                    await auth.signOut();
                    this.showLogin();
                    document.getElementById('loginError').textContent = 'Access denied. Admin privileges required.';
                }
            } else {
                this.showLogin();
            }
        });

        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.login();
        });

        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.logout();
        });
    },

    async checkAdminAccess(user) {
        // Check if email is in ADMIN_EMAILS array
        if (ADMIN_EMAILS.includes(user.email)) {
            return true;
        }
        
        // Check if user exists in admins collection
        try {
            const adminDoc = await db.collection('admins').doc(user.uid).get();
            if (adminDoc.exists) {
                // Add to ADMIN_EMAILS for future checks
                if (!ADMIN_EMAILS.includes(user.email)) {
                    ADMIN_EMAILS.push(user.email);
                }
                return true;
            }
        } catch (error) {
            console.error('Error checking admin access:', error);
        }
        
        return false;
    },

    async login() {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('loginError');

        try {
            errorDiv.textContent = '';
            await auth.signInWithEmailAndPassword(email, password);
            // Auth state change will handle the rest
        } catch (error) {
            errorDiv.textContent = this.getErrorMessage(error.code);
        }
    },

    async logout() {
        try {
            await auth.signOut();
        } catch (error) {
            console.error('Logout error:', error);
        }
    },

    showLogin() {
        document.getElementById('loginPage').style.display = 'flex';
        document.getElementById('dashboard').style.display = 'none';
    },

    showDashboard() {
        document.getElementById('loginPage').style.display = 'none';
        document.getElementById('dashboard').style.display = 'flex';
        document.getElementById('adminEmail').textContent = this.currentUser.email;
        document.querySelector('.avatar').textContent = this.currentUser.email.charAt(0).toUpperCase();
        
        // Load initial data
        App.loadOverviewStats();
    },

    getErrorMessage(code) {
        const messages = {
            'auth/user-not-found': 'No account found with this email.',
            'auth/wrong-password': 'Incorrect password.',
            'auth/invalid-email': 'Invalid email address.',
            'auth/too-many-requests': 'Too many attempts. Please try again later.'
        };
        return messages[code] || 'An error occurred. Please try again.';
    }
};
