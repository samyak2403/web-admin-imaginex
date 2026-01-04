// Assessments Module
const Assessments = {
    assessments: [],

    async load() {
        const section = document.getElementById('assessmentsSection');
        section.innerHTML = `
            <div class="data-table-container">
                <div class="table-header">
                    <h2>Assessments</h2>
                    <button class="btn btn-primary" onclick="Assessments.showAddForm()">
                        <i class="fas fa-plus"></i> Add Assessment
                    </button>
                </div>
                <div id="assessmentsTableBody">
                    <div class="loading"><div class="spinner"></div>Loading assessments...</div>
                </div>
            </div>
        `;

        try {
            const snapshot = await db.collection('assessments').orderBy('levelNumber').get();
            this.assessments = [];
            
            snapshot.forEach(doc => {
                this.assessments.push({ id: doc.id, ...doc.data() });
            });

            this.render();
        } catch (error) {
            console.error('Error loading assessments:', error);
            // Try without ordering
            this.loadWithoutOrder();
        }
    },

    async loadWithoutOrder() {
        try {
            const snapshot = await db.collection('assessments').get();
            this.assessments = [];
            
            snapshot.forEach(doc => {
                this.assessments.push({ id: doc.id, ...doc.data() });
            });

            this.assessments.sort((a, b) => (a.levelNumber || 0) - (b.levelNumber || 0));
            this.render();
        } catch (error) {
            console.error('Error loading assessments:', error);
        }
    },

    render() {
        const container = document.getElementById('assessmentsTableBody');

        if (this.assessments.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-tasks"></i>
                    <p>No assessments found. Add your first assessment!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Level</th>
                        <th>Title</th>
                        <th>Description</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.assessments.map(assessment => `
                        <tr>
                            <td><strong>Level ${assessment.levelNumber || '?'}</strong></td>
                            <td>${assessment.title || 'Untitled'}</td>
                            <td>${(assessment.description || '').substring(0, 40)}...</td>
                            <td><span class="status-badge ${assessment.isLocked ? 'inactive' : 'active'}">${assessment.isLocked ? 'Locked' : 'Active'}</span></td>
                            <td>
                                <div class="action-btns">
                                    <button class="action-btn edit" onclick="Assessments.edit('${assessment.id}')">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="action-btn delete" onclick="Assessments.delete('${assessment.id}')">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    },

    showAddForm() {
        const nextLevel = this.assessments.length > 0 
            ? Math.max(...this.assessments.map(a => a.levelNumber || 0)) + 1 
            : 1;

        const formHtml = `
            <form id="addAssessmentForm">
                <div class="form-group">
                    <label>Level Number *</label>
                    <input type="number" id="assessmentLevel" value="${nextLevel}" min="1" required>
                </div>
                <div class="form-group">
                    <label>Title *</label>
                    <input type="text" id="assessmentTitle" required>
                </div>
                <div class="form-group">
                    <label>Description</label>
                    <textarea id="assessmentDescription" rows="3"></textarea>
                </div>
                <div class="form-group">
                    <label>Thumbnail URL</label>
                    <input type="url" id="assessmentThumbnailUrl" placeholder="https://...">
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="assessmentLocked"> Locked (requires previous level completion)
                    </label>
                </div>
                <button type="submit" class="btn btn-primary btn-full">Add Assessment</button>
            </form>
        `;

        App.showModal('Add New Assessment', formHtml);

        document.getElementById('addAssessmentForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.add();
        });
    },

    async add() {
        try {
            await db.collection('assessments').add({
                levelNumber: parseInt(document.getElementById('assessmentLevel').value),
                title: document.getElementById('assessmentTitle').value,
                description: document.getElementById('assessmentDescription').value,
                thumbnailUrl: document.getElementById('assessmentThumbnailUrl').value,
                isLocked: document.getElementById('assessmentLocked').checked,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            App.closeModal();
            this.load();
            App.loadOverviewStats();
        } catch (error) {
            console.error('Error adding assessment:', error);
            alert('Error adding assessment');
        }
    },

    edit(assessmentId) {
        const assessment = this.assessments.find(a => a.id === assessmentId);
        
        const formHtml = `
            <form id="editAssessmentForm">
                <div class="form-group">
                    <label>Level Number *</label>
                    <input type="number" id="editAssessmentLevel" value="${assessment.levelNumber || 1}" min="1" required>
                </div>
                <div class="form-group">
                    <label>Title *</label>
                    <input type="text" id="editAssessmentTitle" value="${assessment.title || ''}" required>
                </div>
                <div class="form-group">
                    <label>Description</label>
                    <textarea id="editAssessmentDescription" rows="3">${assessment.description || ''}</textarea>
                </div>
                <div class="form-group">
                    <label>Thumbnail URL</label>
                    <input type="url" id="editAssessmentThumbnailUrl" value="${assessment.thumbnailUrl || ''}">
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="editAssessmentLocked" ${assessment.isLocked ? 'checked' : ''}> Locked
                    </label>
                </div>
                <button type="submit" class="btn btn-primary btn-full">Save Changes</button>
            </form>
        `;

        App.showModal('Edit Assessment', formHtml);

        document.getElementById('editAssessmentForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.save(assessmentId);
        });
    },

    async save(assessmentId) {
        try {
            await db.collection('assessments').doc(assessmentId).update({
                levelNumber: parseInt(document.getElementById('editAssessmentLevel').value),
                title: document.getElementById('editAssessmentTitle').value,
                description: document.getElementById('editAssessmentDescription').value,
                thumbnailUrl: document.getElementById('editAssessmentThumbnailUrl').value,
                isLocked: document.getElementById('editAssessmentLocked').checked
            });

            App.closeModal();
            this.load();
        } catch (error) {
            console.error('Error saving assessment:', error);
            alert('Error saving assessment');
        }
    },

    async delete(assessmentId) {
        if (!confirm('Are you sure you want to delete this assessment?')) return;

        try {
            await db.collection('assessments').doc(assessmentId).delete();
            this.load();
            App.loadOverviewStats();
        } catch (error) {
            console.error('Error deleting assessment:', error);
            alert('Error deleting assessment');
        }
    }
};
