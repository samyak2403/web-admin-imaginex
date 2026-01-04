// Main App Module
const App = {
    currentSection: 'overview',

    init() {
        Auth.init();
        this.setupNavigation();
        this.setupModal();
    },

    setupNavigation() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.dataset.section;
                this.navigateTo(section);
            });
        });
    },

    navigateTo(section) {
        // Update active nav item
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.section === section) {
                item.classList.add('active');
            }
        });

        // Hide all sections
        document.querySelectorAll('.content-section').forEach(s => {
            s.style.display = 'none';
        });

        // Show selected section
        const sectionElement = document.getElementById(`${section}Section`);
        if (sectionElement) {
            sectionElement.style.display = 'block';
        }

        // Update page title
        const titles = {
            overview: 'Overview',
            students: 'Students',
            lessons: 'Lessons & Scenarios',
            assessments: 'Assessments',
            notifications: 'Notifications'
        };
        document.getElementById('pageTitle').textContent = titles[section] || section;

        // Load section data
        this.loadSectionData(section);
        this.currentSection = section;
    },

    loadSectionData(section) {
        switch (section) {
            case 'overview':
                this.loadOverviewStats();
                break;
            case 'students':
                Students.load();
                break;
            case 'lessons':
                Lessons.load();
                break;
            case 'assessments':
                Assessments.load();
                break;
            case 'notifications':
                Notifications.load();
                break;
        }
    },

    async loadOverviewStats() {
        try {
            // Get total students
            const usersSnapshot = await db.collection('users').get();
            document.getElementById('totalStudents').textContent = usersSnapshot.size;

            // Get total lessons
            const lessonsSnapshot = await db.collection('lessons').get();
            document.getElementById('totalLessons').textContent = lessonsSnapshot.size;

            // Get total assessments
            const assessmentsSnapshot = await db.collection('assessments').get();
            document.getElementById('totalAssessments').textContent = assessmentsSnapshot.size;

            // Calculate average progress
            const progressSnapshot = await db.collection('student_progress').get();
            let totalScore = 0;
            let count = 0;
            
            progressSnapshot.forEach(doc => {
                const data = doc.data();
                if (data.score) {
                    totalScore += data.score;
                    count++;
                }
            });

            const avgProgress = count > 0 ? Math.round(totalScore / count) : 0;
            document.getElementById('avgProgress').textContent = avgProgress + '%';
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    },

    setupModal() {
        const modal = document.getElementById('modal');
        
        modal.querySelector('.modal-close').addEventListener('click', () => {
            this.closeModal();
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal();
            }
        });
    },

    showModal(title, content) {
        document.getElementById('modalTitle').textContent = title;
        document.getElementById('modalBody').innerHTML = content;
        document.getElementById('modal').classList.add('active');
    },

    closeModal() {
        document.getElementById('modal').classList.remove('active');
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
