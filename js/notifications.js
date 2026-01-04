// Notifications Module
const Notifications = {
    async load() {
        const section = document.getElementById('notificationsSection');
        section.innerHTML = `
            <div class="data-table-container">
                <div class="table-header">
                    <h2>Send Notifications</h2>
                </div>
                <div style="padding: 24px;">
                    <form id="sendNotificationForm">
                        <div class="form-group">
                            <label>Send To *</label>
                            <select id="notificationTarget" required>
                                <option value="all">All Students</option>
                                <option value="specific">Specific Student</option>
                            </select>
                        </div>
                        <div class="form-group" id="studentSelectGroup" style="display: none;">
                            <label>Select Student</label>
                            <select id="notificationStudent">
                                <option value="">Loading students...</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Title *</label>
                            <input type="text" id="notificationTitle" required>
                        </div>
                        <div class="form-group">
                            <label>Message *</label>
                            <textarea id="notificationMessage" rows="4" required></textarea>
                        </div>
                        <div class="form-group">
                            <label>Type</label>
                            <select id="notificationType">
                                <option value="info">Info</option>
                                <option value="success">Success</option>
                                <option value="warning">Warning</option>
                                <option value="error">Error</option>
                            </select>
                        </div>
                        <button type="submit" class="btn btn-primary">
                            <i class="fas fa-paper-plane"></i> Send Notification
                        </button>
                    </form>
                </div>
            </div>

            <div class="data-table-container" style="margin-top: 24px;">
                <div class="table-header">
                    <h2>Recent Notifications</h2>
                </div>
                <div id="recentNotifications">
                    <div class="loading"><div class="spinner"></div>Loading...</div>
                </div>
            </div>
        `;

        this.setupForm();
        this.loadStudents();
        this.loadRecent();
    },

    setupForm() {
        document.getElementById('notificationTarget').addEventListener('change', (e) => {
            document.getElementById('studentSelectGroup').style.display = 
                e.target.value === 'specific' ? 'block' : 'none';
        });

        document.getElementById('sendNotificationForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.send();
        });
    },

    async loadStudents() {
        try {
            const snapshot = await db.collection('users').get();
            const select = document.getElementById('notificationStudent');
            select.innerHTML = '<option value="">Select a student</option>';
            
            snapshot.forEach(doc => {
                const data = doc.data();
                select.innerHTML += `<option value="${doc.id}">${data.name || data.email || doc.id}</option>`;
            });
        } catch (error) {
            console.error('Error loading students:', error);
        }
    },

    async loadRecent() {
        try {
            const snapshot = await db.collection('notifications')
                .orderBy('timestamp', 'desc')
                .limit(20)
                .get();

            const container = document.getElementById('recentNotifications');

            if (snapshot.empty) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-bell"></i>
                        <p>No notifications sent yet</p>
                    </div>
                `;
                return;
            }

            let html = `
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Title</th>
                            <th>Message</th>
                            <th>Type</th>
                            <th>Sent To</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            snapshot.forEach(doc => {
                const data = doc.data();
                const date = data.timestamp ? data.timestamp.toDate().toLocaleDateString() : 'N/A';
                html += `
                    <tr>
                        <td><strong>${data.title || 'N/A'}</strong></td>
                        <td>${(data.message || '').substring(0, 50)}...</td>
                        <td><span class="status-badge ${data.type === 'success' ? 'active' : data.type === 'error' ? 'inactive' : 'pending'}">${data.type || 'info'}</span></td>
                        <td>${data.userId === 'all' ? 'All Students' : 'Individual'}</td>
                        <td>${date}</td>
                    </tr>
                `;
            });

            html += '</tbody></table>';
            container.innerHTML = html;
        } catch (error) {
            console.error('Error loading notifications:', error);
            // Try without ordering
            this.loadRecentWithoutOrder();
        }
    },

    async loadRecentWithoutOrder() {
        try {
            const snapshot = await db.collection('notifications').limit(20).get();
            const container = document.getElementById('recentNotifications');

            if (snapshot.empty) {
                container.innerHTML = '<div class="empty-state"><p>No notifications</p></div>';
                return;
            }

            // Process and display
            container.innerHTML = '<p style="padding: 20px;">Notifications loaded</p>';
        } catch (error) {
            console.error('Error:', error);
        }
    },

    async send() {
        const target = document.getElementById('notificationTarget').value;
        const title = document.getElementById('notificationTitle').value;
        const message = document.getElementById('notificationMessage').value;
        const type = document.getElementById('notificationType').value;

        try {
            if (target === 'all') {
                // Send to all students
                const usersSnapshot = await db.collection('users').get();
                const batch = db.batch();

                usersSnapshot.forEach(doc => {
                    const notifRef = db.collection('notifications').doc();
                    batch.set(notifRef, {
                        userId: doc.id,
                        title,
                        message,
                        type,
                        isRead: false,
                        timestamp: firebase.firestore.FieldValue.serverTimestamp()
                    });
                });

                await batch.commit();
                alert(`Notification sent to ${usersSnapshot.size} students!`);
            } else {
                // Send to specific student
                const studentId = document.getElementById('notificationStudent').value;
                if (!studentId) {
                    alert('Please select a student');
                    return;
                }

                await db.collection('notifications').add({
                    userId: studentId,
                    title,
                    message,
                    type,
                    isRead: false,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });

                alert('Notification sent!');
            }

            // Reset form
            document.getElementById('sendNotificationForm').reset();
            this.loadRecent();
        } catch (error) {
            console.error('Error sending notification:', error);
            alert('Error sending notification');
        }
    }
};
