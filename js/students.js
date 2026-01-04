// Students Module
const Students = {
    students: [],

    async load() {
        const section = document.getElementById('studentsSection');
        section.innerHTML = `
            <div class="data-table-container">
                <div class="table-header">
                    <h2>Students</h2>
                    <div class="search-box">
                        <input type="text" id="studentSearch" placeholder="Search students...">
                    </div>
                </div>
                <div id="studentsTableBody">
                    <div class="loading"><div class="spinner"></div>Loading students...</div>
                </div>
            </div>
        `;

        try {
            const snapshot = await db.collection('users').get();
            this.students = [];
            
            snapshot.forEach(doc => {
                this.students.push({ id: doc.id, ...doc.data() });
            });

            this.render();
            this.setupSearch();
        } catch (error) {
            console.error('Error loading students:', error);
            document.getElementById('studentsTableBody').innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Error loading students</p>
                </div>
            `;
        }
    },

    render(filteredStudents = null) {
        const data = filteredStudents || this.students;
        const container = document.getElementById('studentsTableBody');

        if (data.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-users"></i>
                    <p>No students found</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Class</th>
                        <th>Phone</th>
                        <th>Role</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.map(student => `
                        <tr>
                            <td><strong>${student.name || 'N/A'}</strong></td>
                            <td>${student.email || 'N/A'}</td>
                            <td>${student.class || 'N/A'}</td>
                            <td>${student.phone || 'N/A'}</td>
                            <td><span class="status-badge active">${student.role || 'Student'}</span></td>
                            <td>
                                <div class="action-btns">
                                    <button class="action-btn edit" onclick="Students.viewProgress('${student.id}')">
                                        <i class="fas fa-chart-line"></i>
                                    </button>
                                    <button class="action-btn edit" onclick="Students.edit('${student.id}')">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    },

    setupSearch() {
        document.getElementById('studentSearch').addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const filtered = this.students.filter(s => 
                (s.name && s.name.toLowerCase().includes(query)) ||
                (s.email && s.email.toLowerCase().includes(query)) ||
                (s.class && s.class.toLowerCase().includes(query))
            );
            this.render(filtered);
        });
    },

    async viewProgress(studentId) {
        const student = this.students.find(s => s.id === studentId);
        
        try {
            const progressSnapshot = await db.collection('student_progress')
                .where('studentId', '==', studentId)
                .get();

            let progressHtml = '<div class="empty-state"><p>No progress data available</p></div>';
            
            if (!progressSnapshot.empty) {
                const progressData = [];
                progressSnapshot.forEach(doc => progressData.push(doc.data()));
                
                progressHtml = `
                    <table class="data-table">
                        <thead>
                            <tr><th>Lesson</th><th>Status</th><th>Score</th></tr>
                        </thead>
                        <tbody>
                            ${progressData.map(p => `
                                <tr>
                                    <td>${p.lessonTitle || 'Unknown'}</td>
                                    <td><span class="status-badge ${p.status === 'completed' ? 'active' : 'pending'}">${p.status || 'N/A'}</span></td>
                                    <td>${p.score || 0}%</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                `;
            }

            App.showModal(`Progress: ${student.name || 'Student'}`, progressHtml);
        } catch (error) {
            console.error('Error loading progress:', error);
        }
    },

    edit(studentId) {
        const student = this.students.find(s => s.id === studentId);
        
        const formHtml = `
            <form id="editStudentForm">
                <div class="form-group">
                    <label>Name</label>
                    <input type="text" id="editName" value="${student.name || ''}" required>
                </div>
                <div class="form-group">
                    <label>Class</label>
                    <input type="text" id="editClass" value="${student.class || ''}">
                </div>
                <div class="form-group">
                    <label>Phone</label>
                    <input type="text" id="editPhone" value="${student.phone || ''}">
                </div>
                <div class="form-group">
                    <label>Role</label>
                    <select id="editRole">
                        <option value="Student" ${student.role === 'Student' ? 'selected' : ''}>Student</option>
                        <option value="Parent" ${student.role === 'Parent' ? 'selected' : ''}>Parent</option>
                        <option value="Teacher" ${student.role === 'Teacher' ? 'selected' : ''}>Teacher</option>
                    </select>
                </div>
                <button type="submit" class="btn btn-primary btn-full">Save Changes</button>
            </form>
        `;

        App.showModal('Edit Student', formHtml);

        document.getElementById('editStudentForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.saveStudent(studentId);
        });
    },

    async saveStudent(studentId) {
        try {
            await db.collection('users').doc(studentId).update({
                name: document.getElementById('editName').value,
                class: document.getElementById('editClass').value,
                phone: document.getElementById('editPhone').value,
                role: document.getElementById('editRole').value
            });

            App.closeModal();
            this.load();
        } catch (error) {
            console.error('Error saving student:', error);
            alert('Error saving student');
        }
    }
};
