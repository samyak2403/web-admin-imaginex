// Lessons Module
const Lessons = {
    lessons: [],
    currentLessonId: null,
    
    // File upload to Firebase Storage
    async uploadFile(file, folder) {
        const timestamp = Date.now();
        const fileName = `${timestamp}_${file.name}`;
        const storageRef = storage.ref(`${folder}/${fileName}`);
        
        const uploadTask = storageRef.put(file);
        
        return new Promise((resolve, reject) => {
            uploadTask.on('state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    console.log(`Upload progress: ${progress}%`);
                },
                (error) => reject(error),
                async () => {
                    const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
                    resolve(downloadURL);
                }
            );
        });
    },

    async load() {
        const section = document.getElementById('lessonsSection');
        section.innerHTML = `
            <div class="data-table-container">
                <div class="table-header">
                    <h2>Lessons & Scenarios</h2>
                    <button class="btn btn-primary" onclick="Lessons.showAddForm()">
                        <i class="fas fa-plus"></i> Add Lesson
                    </button>
                </div>
                <div id="lessonsTableBody">
                    <div class="loading"><div class="spinner"></div>Loading lessons...</div>
                </div>
            </div>
        `;

        try {
            const snapshot = await db.collection('lessons').get();
            this.lessons = [];
            
            snapshot.forEach(doc => {
                this.lessons.push({ id: doc.id, ...doc.data() });
            });

            this.render();
        } catch (error) {
            console.error('Error loading lessons:', error);
        }
    },

    render() {
        const container = document.getElementById('lessonsTableBody');

        if (this.lessons.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-book"></i>
                    <p>No lessons found. Add your first lesson!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>Type</th>
                        <th>Description</th>
                        <th>Video URL</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.lessons.map(lesson => `
                        <tr>
                            <td><strong>${lesson.title || 'Untitled'}</strong></td>
                            <td><span class="status-badge ${lesson.type === 'scenario' ? 'active' : 'pending'}">${lesson.type || 'lesson'}</span></td>
                            <td>${(lesson.description || '').substring(0, 50)}...</td>
                            <td>${lesson.videoUrl ? '<i class="fas fa-check text-success"></i>' : '<i class="fas fa-times text-danger"></i>'}</td>
                            <td>
                                <div class="action-btns">
                                    <button class="action-btn edit" onclick="Lessons.edit('${lesson.id}')">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="action-btn delete" onclick="Lessons.delete('${lesson.id}')">
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
        const formHtml = `
            <form id="addLessonForm">
                <div class="form-group">
                    <label>Title *</label>
                    <input type="text" id="lessonTitle" required>
                </div>
                <div class="form-group">
                    <label>Type *</label>
                    <select id="lessonType" required>
                        <option value="scenario">Scenario (VR)</option>
                        <option value="lesson">Lesson</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Description</label>
                    <textarea id="lessonDescription" rows="3"></textarea>
                </div>
                <div class="form-group">
                    <label>Thumbnail Image *</label>
                    <input type="file" id="lessonThumbnailFile" accept="image/*" required>
                    <small>Supported: JPG, PNG, WebP</small>
                </div>
                <div class="form-group">
                    <label>Video File *</label>
                    <input type="file" id="lessonVideoFile" accept="video/*" required>
                    <small>Supported: MP4, WebM, MOV</small>
                </div>
                <div class="form-group">
                    <label>Duration</label>
                    <input type="text" id="lessonDuration" placeholder="e.g. 5:30">
                </div>
                <div class="form-group">
                    <label>Details</label>
                    <input type="text" id="lessonDetails" placeholder="e.g. 360° VR | Immersive Experience">
                </div>
                <div id="uploadProgress" style="display:none;">
                    <div class="progress-bar">
                        <div id="progressFill" class="progress-fill"></div>
                    </div>
                    <p id="progressText">Uploading...</p>
                </div>
                <button type="submit" id="submitBtn" class="btn btn-primary btn-full">Add Lesson</button>
            </form>
        `;

        App.showModal('Add New Lesson', formHtml);

        document.getElementById('addLessonForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.add();
        });
    },

    async add() {
        const submitBtn = document.getElementById('submitBtn');
        const progressDiv = document.getElementById('uploadProgress');
        const progressText = document.getElementById('progressText');
        
        const thumbnailFile = document.getElementById('lessonThumbnailFile').files[0];
        const videoFile = document.getElementById('lessonVideoFile').files[0];
        
        if (!thumbnailFile || !videoFile) {
            alert('Please select both thumbnail and video files');
            return;
        }
        
        try {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Uploading...';
            progressDiv.style.display = 'block';
            
            // Upload thumbnail
            progressText.textContent = 'Uploading thumbnail...';
            const thumbnailUrl = await this.uploadFile(thumbnailFile, 'thumbnails');
            
            // Upload video
            progressText.textContent = 'Uploading video...';
            const videoUrl = await this.uploadFile(videoFile, 'videos');
            
            progressText.textContent = 'Saving to database...';
            
            // Save to Firestore
            await db.collection('lessons').add({
                title: document.getElementById('lessonTitle').value,
                type: document.getElementById('lessonType').value,
                description: document.getElementById('lessonDescription').value,
                thumbnailUrl: thumbnailUrl,
                videoUrl: videoUrl,
                duration: document.getElementById('lessonDuration').value,
                details: document.getElementById('lessonDetails').value,
                lessonCount: 1,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            App.closeModal();
            this.load();
            App.loadOverviewStats();
            alert('Lesson added successfully!');
        } catch (error) {
            console.error('Error adding lesson:', error);
            alert('Error adding lesson: ' + error.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Add Lesson';
        }
    },

    edit(lessonId) {
        const lesson = this.lessons.find(l => l.id === lessonId);
        this.currentLessonId = lessonId;
        
        const formHtml = `
            <form id="editLessonForm">
                <div class="form-group">
                    <label>Title *</label>
                    <input type="text" id="editLessonTitle" value="${lesson.title || ''}" required>
                </div>
                <div class="form-group">
                    <label>Type *</label>
                    <select id="editLessonType" required>
                        <option value="scenario" ${lesson.type === 'scenario' ? 'selected' : ''}>Scenario (VR)</option>
                        <option value="lesson" ${lesson.type === 'lesson' ? 'selected' : ''}>Lesson</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Description</label>
                    <textarea id="editLessonDescription" rows="3">${lesson.description || ''}</textarea>
                </div>
                <div class="form-group">
                    <label>Current Thumbnail</label>
                    ${lesson.thumbnailUrl ? `<img src="${lesson.thumbnailUrl}" style="max-width:100px;max-height:60px;display:block;margin-bottom:8px;">` : '<p>No thumbnail</p>'}
                    <label>Replace Thumbnail (optional)</label>
                    <input type="file" id="editLessonThumbnailFile" accept="image/*">
                    <small>Leave empty to keep current</small>
                </div>
                <div class="form-group">
                    <label>Current Video</label>
                    ${lesson.videoUrl ? '<p style="color:green;"><i class="fas fa-check"></i> Video uploaded</p>' : '<p>No video</p>'}
                    <label>Replace Video (optional)</label>
                    <input type="file" id="editLessonVideoFile" accept="video/*">
                    <small>Leave empty to keep current</small>
                </div>
                <div class="form-group">
                    <label>Duration</label>
                    <input type="text" id="editLessonDuration" value="${lesson.duration || ''}" placeholder="e.g. 5:30">
                </div>
                <div class="form-group">
                    <label>Details</label>
                    <input type="text" id="editLessonDetails" value="${lesson.details || ''}" placeholder="e.g. 360° VR | Immersive Experience">
                </div>
                <div id="editUploadProgress" style="display:none;">
                    <p id="editProgressText">Uploading...</p>
                </div>
                <button type="submit" id="editSubmitBtn" class="btn btn-primary btn-full">Save Changes</button>
            </form>
        `;

        App.showModal('Edit Lesson', formHtml);

        document.getElementById('editLessonForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.save(lessonId);
        });
    },

    async save(lessonId) {
        const submitBtn = document.getElementById('editSubmitBtn');
        const progressDiv = document.getElementById('editUploadProgress');
        const progressText = document.getElementById('editProgressText');
        
        const thumbnailFile = document.getElementById('editLessonThumbnailFile').files[0];
        const videoFile = document.getElementById('editLessonVideoFile').files[0];
        const lesson = this.lessons.find(l => l.id === lessonId);
        
        try {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Saving...';
            
            let thumbnailUrl = lesson.thumbnailUrl || '';
            let videoUrl = lesson.videoUrl || '';
            
            // Upload new thumbnail if selected
            if (thumbnailFile) {
                progressDiv.style.display = 'block';
                progressText.textContent = 'Uploading thumbnail...';
                thumbnailUrl = await this.uploadFile(thumbnailFile, 'thumbnails');
            }
            
            // Upload new video if selected
            if (videoFile) {
                progressDiv.style.display = 'block';
                progressText.textContent = 'Uploading video...';
                videoUrl = await this.uploadFile(videoFile, 'videos');
            }
            
            progressText.textContent = 'Saving to database...';
            
            await db.collection('lessons').doc(lessonId).update({
                title: document.getElementById('editLessonTitle').value,
                type: document.getElementById('editLessonType').value,
                description: document.getElementById('editLessonDescription').value,
                thumbnailUrl: thumbnailUrl,
                videoUrl: videoUrl,
                duration: document.getElementById('editLessonDuration').value,
                details: document.getElementById('editLessonDetails').value
            });

            App.closeModal();
            this.load();
            alert('Lesson updated successfully!');
        } catch (error) {
            console.error('Error saving lesson:', error);
            alert('Error saving lesson: ' + error.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Save Changes';
        }
    },

    async delete(lessonId) {
        if (!confirm('Are you sure you want to delete this lesson?')) return;

        try {
            await db.collection('lessons').doc(lessonId).delete();
            this.load();
            App.loadOverviewStats();
        } catch (error) {
            console.error('Error deleting lesson:', error);
            alert('Error deleting lesson');
        }
    }
};
