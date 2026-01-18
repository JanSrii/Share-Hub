// ShareHub Frontend Application
class ShareHubApp {
    constructor() {
        this.socket = null;
        this.currentRoom = null;
        this.currentUser = null;
        this.selectedFiles = [];
        this.currentPage = 1;
        this.isTyping = false;
        this.typingTimeout = null;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadStats();
        this.loadFiles();
        this.setupDragAndDrop();
        
        // Initialize Socket.IO
        this.socket = io();
        this.setupSocketListeners();
    }

    setupEventListeners() {
        // File input change
        document.getElementById('fileInput').addEventListener('change', (e) => {
            this.handleFileSelect(e.target.files);
        });

        document.getElementById('modalFileInput').addEventListener('change', (e) => {
            this.handleModalFileSelect(e.target.files);
        });

        // Message input
        const messageInput = document.getElementById('messageInput');
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            } else {
                this.handleTyping();
            }
        });

        // Search input
        document.getElementById('searchInput').addEventListener('input', 
            this.debounce(() => this.searchFiles(), 300)
        );

        // Modal close on outside click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal.id);
                }
            });
        });

        // Smooth scrolling for navigation
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });
    }

    setupDragAndDrop() {
        const uploadArea = document.getElementById('uploadArea');
        const modalUploadZone = document.getElementById('modalUploadZone');

        [uploadArea, modalUploadZone].forEach(zone => {
            if (!zone) return;

            zone.addEventListener('dragover', (e) => {
                e.preventDefault();
                zone.classList.add('dragover');
            });

            zone.addEventListener('dragleave', (e) => {
                e.preventDefault();
                zone.classList.remove('dragover');
            });

            zone.addEventListener('drop', (e) => {
                e.preventDefault();
                zone.classList.remove('dragover');
                
                const files = Array.from(e.dataTransfer.files);
                if (zone === uploadArea) {
                    this.handleFileSelect(files);
                } else {
                    this.handleModalFileSelect(files);
                }
            });

            zone.addEventListener('click', () => {
                if (zone === uploadArea) {
                    document.getElementById('fileInput').click();
                } else {
                    document.getElementById('modalFileInput').click();
                }
            });
        });
    }

    setupSocketListeners() {
        this.socket.on('connect', () => {
            console.log('Connected to server');
            this.updateChatStatus('Connected');
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
            this.updateChatStatus('Disconnected');
        });

        this.socket.on('room-joined', (data) => {
            this.currentRoom = data.roomId;
            this.updateRoomInfo(data);
            this.displayMessages(data.messages);
            this.showChatContainer();
        });

        this.socket.on('user-joined', (data) => {
            this.updateUsersList(data.users);
            this.addSystemMessage(`${data.username} joined the room`);
        });

        this.socket.on('user-left', (data) => {
            this.updateUsersList(data.users);
            this.addSystemMessage(`${data.username} left the room`);
        });

        this.socket.on('new-message', (message) => {
            this.displayMessage(message);
            this.scrollToBottom();
        });

        this.socket.on('user-typing', (data) => {
            this.showTypingIndicator(data.username, data.isTyping);
        });
    }

    // File handling methods
    handleFileSelect(files) {
        if (files.length === 0) return;
        
        this.uploadFiles(Array.from(files));
    }

    handleModalFileSelect(files) {
        this.selectedFiles = Array.from(files);
        this.displaySelectedFiles();
        
        const uploadBtn = document.getElementById('uploadBtn');
        uploadBtn.disabled = this.selectedFiles.length === 0;
    }

    displaySelectedFiles() {
        const container = document.getElementById('selectedFiles');
        container.innerHTML = '';

        this.selectedFiles.forEach((file, index) => {
            const fileElement = document.createElement('div');
            fileElement.className = 'selected-file';
            fileElement.innerHTML = `
                <i class="${this.getFileIcon(file.type)} selected-file-icon"></i>
                <div class="selected-file-info">
                    <div class="selected-file-name">${file.name}</div>
                    <div class="selected-file-size">${this.formatFileSize(file.size)}</div>
                </div>
                <button class="remove-file" onclick="app.removeSelectedFile(${index})">
                    <i class="fas fa-times"></i>
                </button>
            `;
            container.appendChild(fileElement);
        });
    }

    removeSelectedFile(index) {
        this.selectedFiles.splice(index, 1);
        this.displaySelectedFiles();
        
        const uploadBtn = document.getElementById('uploadBtn');
        uploadBtn.disabled = this.selectedFiles.length === 0;
    }

    async uploadFiles(files = null) {
        const filesToUpload = files || this.selectedFiles;
        if (filesToUpload.length === 0) return;

        const formData = new FormData();
        filesToUpload.forEach(file => {
            formData.append('files', file);
        });

        try {
            this.showUploadProgress(true);
            
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                this.showNotification('Success', `${result.files.length} file(s) uploaded successfully!`, 'success');
                this.displayUploadedFiles(result.files);
                this.loadStats(); // Refresh stats
                this.loadFiles(); // Refresh file list
                
                // Clear selected files
                this.selectedFiles = [];
                this.displaySelectedFiles();
                document.getElementById('uploadBtn').disabled = true;
                
                // Close modal if open
                this.closeModal('uploadModal');
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Upload error:', error);
            this.showNotification('Error', 'Upload failed: ' + error.message, 'error');
        } finally {
            this.showUploadProgress(false);
        }
    }

    showUploadProgress(show) {
        const progressElement = document.getElementById('uploadProgress');
        if (progressElement) {
            progressElement.style.display = show ? 'block' : 'none';
            
            if (show) {
                // Simulate progress
                let progress = 0;
                const interval = setInterval(() => {
                    progress += Math.random() * 30;
                    if (progress >= 100) {
                        progress = 100;
                        clearInterval(interval);
                    }
                    
                    const progressFill = document.getElementById('progressFill');
                    const progressText = document.getElementById('progressText');
                    
                    if (progressFill) progressFill.style.width = progress + '%';
                    if (progressText) progressText.textContent = `Uploading... ${Math.round(progress)}%`;
                }, 200);
            }
        }
    }

    displayUploadedFiles(files) {
        const container = document.getElementById('uploadedFiles');
        
        files.forEach(file => {
            const fileElement = document.createElement('div');
            fileElement.className = 'file-item';
            fileElement.innerHTML = `
                <i class="${file.icon} file-icon"></i>
                <div class="file-info">
                    <div class="file-name">${file.originalName}</div>
                    <div class="file-size">${file.formattedSize}</div>
                </div>
                <div class="file-actions">
                    <button onclick="app.shareFileInChat('${file.id}')" title="Share in chat">
                        <i class="fas fa-share"></i>
                    </button>
                    <button onclick="app.downloadFile('${file.id}')" title="Download">
                        <i class="fas fa-download"></i>
                    </button>
                    <button onclick="app.previewFile('${file.id}')" title="Preview">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            `;
            container.appendChild(fileElement);
        });
    }

    // Chat methods
    showJoinModal() {
        document.getElementById('joinModal').style.display = 'block';
        document.getElementById('usernameInput').focus();
    }

    quickJoin(roomId) {
        document.getElementById('roomIdInput').value = roomId;
        this.joinRoom();
    }

    joinRoom() {
        const username = document.getElementById('usernameInput').value.trim();
        const roomId = document.getElementById('roomIdInput').value.trim() || 'global';

        if (!username) {
            this.showNotification('Error', 'Please enter your name', 'error');
            return;
        }

        this.currentUser = username;
        this.socket.emit('join-room', { roomId, username });
        this.closeModal('joinModal');
    }

    leaveRoom() {
        if (this.socket && this.currentRoom) {
            this.socket.disconnect();
            this.socket.connect();
            this.currentRoom = null;
            this.currentUser = null;
            this.hideChatContainer();
        }
    }

    sendMessage() {
        const input = document.getElementById('messageInput');
        const message = input.value.trim();

        if (!message || !this.currentRoom) return;

        this.socket.emit('send-message', {
            roomId: this.currentRoom,
            message: message
        });

        input.value = '';
        this.stopTyping();
    }

    shareFileInChat(fileId) {
        if (!this.currentRoom) {
            this.showNotification('Error', 'Please join a chat room first', 'error');
            return;
        }

        this.socket.emit('send-message', {
            roomId: this.currentRoom,
            fileId: fileId
        });

        this.showNotification('Success', 'File shared in chat!', 'success');
    }

    handleTyping() {
        if (!this.isTyping && this.currentRoom) {
            this.isTyping = true;
            this.socket.emit('typing', { roomId: this.currentRoom, isTyping: true });
        }

        clearTimeout(this.typingTimeout);
        this.typingTimeout = setTimeout(() => {
            this.stopTyping();
        }, 1000);
    }

    stopTyping() {
        if (this.isTyping && this.currentRoom) {
            this.isTyping = false;
            this.socket.emit('typing', { roomId: this.currentRoom, isTyping: false });
        }
        clearTimeout(this.typingTimeout);
    }

    updateRoomInfo(data) {
        document.getElementById('roomName').textContent = `Room: ${data.roomId}`;
        document.getElementById('chatRoomName').textContent = `Room: ${data.roomId}`;
        this.updateUsersList(data.users);
    }

    updateUsersList(users) {
        const container = document.getElementById('usersList');
        const userCount = document.getElementById('userCount');
        
        userCount.textContent = users.length;
        container.innerHTML = '';

        users.forEach(username => {
            const userElement = document.createElement('div');
            userElement.className = 'user-item';
            userElement.innerHTML = `
                <div class="user-avatar">${username.charAt(0).toUpperCase()}</div>
                <span>${username}</span>
            `;
            container.appendChild(userElement);
        });
    }

    displayMessages(messages) {
        const container = document.getElementById('chatMessages');
        container.innerHTML = '';
        
        messages.forEach(message => {
            this.displayMessage(message);
        });
        
        this.scrollToBottom();
    }

    displayMessage(message) {
        const container = document.getElementById('chatMessages');
        const messageElement = document.createElement('div');
        messageElement.className = `message ${message.username === this.currentUser ? 'own' : ''}`;

        const time = new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });

        let messageContent = '';
        
        if (message.type === 'file' && message.fileInfo) {
            messageContent = `
                <div class="message-content">
                    <div class="message-header">
                        <span class="message-username">${message.username}</span>
                        <span class="message-time">${time}</span>
                    </div>
                    <div class="file-message" onclick="app.previewFile('${message.fileInfo.id}')">
                        <i class="${message.fileInfo.icon}"></i>
                        <div class="file-info">
                            <div class="file-name">${message.fileInfo.originalName}</div>
                            <div class="file-size">${message.fileInfo.formattedSize}</div>
                        </div>
                        <button onclick="event.stopPropagation(); app.downloadFile('${message.fileInfo.id}')" class="download-btn">
                            <i class="fas fa-download"></i>
                        </button>
                    </div>
                </div>
            `;
        } else {
            messageContent = `
                <div class="message-content">
                    <div class="message-header">
                        <span class="message-username">${message.username}</span>
                        <span class="message-time">${time}</span>
                    </div>
                    <div class="message-text">${this.escapeHtml(message.message)}</div>
                </div>
            `;
        }

        if (message.username !== this.currentUser) {
            messageElement.innerHTML = `
                <div class="message-avatar">${message.username.charAt(0).toUpperCase()}</div>
                ${messageContent}
            `;
        } else {
            messageElement.innerHTML = messageContent;
        }

        container.appendChild(messageElement);
    }

    addSystemMessage(text) {
        const container = document.getElementById('chatMessages');
        const messageElement = document.createElement('div');
        messageElement.className = 'system-message';
        messageElement.innerHTML = `
            <div style="text-align: center; color: #64748b; font-style: italic; margin: 1rem 0;">
                ${text}
            </div>
        `;
        container.appendChild(messageElement);
        this.scrollToBottom();
    }

    showTypingIndicator(username, isTyping) {
        const indicator = document.getElementById('typingIndicator');
        
        if (isTyping) {
            indicator.textContent = `${username} is typing...`;
            indicator.style.display = 'block';
        } else {
            indicator.style.display = 'none';
        }
    }

    updateChatStatus(status) {
        const statusElement = document.getElementById('chatStatus');
        if (statusElement) {
            statusElement.textContent = status;
            statusElement.style.color = status === 'Connected' ? '#10b981' : '#ef4444';
        }
    }

    showChatContainer() {
        document.getElementById('chatContainer').style.display = 'flex';
        document.getElementById('joinPrompt').style.display = 'none';
    }

    hideChatContainer() {
        document.getElementById('chatContainer').style.display = 'none';
        document.getElementById('joinPrompt').style.display = 'block';
    }

    scrollToBottom() {
        const container = document.getElementById('chatMessages');
        container.scrollTop = container.scrollHeight;
    }

    // File management methods
    async loadFiles(page = 1, search = '') {
        try {
            const response = await fetch(`/api/files?page=${page}&search=${encodeURIComponent(search)}`);
            const data = await response.json();
            
            this.displayFilesGrid(data.files);
            this.updatePagination(data);
            this.currentPage = page;
        } catch (error) {
            console.error('Error loading files:', error);
            this.showNotification('Error', 'Failed to load files', 'error');
        }
    }

    displayFilesGrid(files) {
        const container = document.getElementById('filesGrid');
        
        if (files.length === 0) {
            container.innerHTML = `
                <div class="loading">
                    <i class="fas fa-folder-open"></i>
                    <p>No files found</p>
                </div>
            `;
            return;
        }

        container.innerHTML = '';
        
        files.forEach(file => {
            const fileCard = document.createElement('div');
            fileCard.className = 'file-card';
            fileCard.onclick = () => this.previewFile(file.id);
            
            const uploadDate = new Date(file.uploadDate).toLocaleDateString();
            
            fileCard.innerHTML = `
                <div class="file-card-header">
                    <i class="${file.icon} file-card-icon"></i>
                    <div class="file-card-info">
                        <h4>${file.originalName}</h4>
                        <p>${file.formattedSize}</p>
                    </div>
                </div>
                <div class="file-card-meta">
                    <span class="file-card-date">${uploadDate}</span>
                    <span class="file-card-downloads">
                        <i class="fas fa-download"></i>
                        ${file.downloads}
                    </span>
                </div>
            `;
            
            container.appendChild(fileCard);
        });
    }

    updatePagination(data) {
        const container = document.getElementById('pagination');
        container.innerHTML = '';

        if (data.totalPages <= 1) return;

        // Previous button
        const prevBtn = document.createElement('button');
        prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
        prevBtn.disabled = !data.hasPrev;
        prevBtn.onclick = () => this.loadFiles(data.currentPage - 1, document.getElementById('searchInput').value);
        container.appendChild(prevBtn);

        // Page numbers
        const startPage = Math.max(1, data.currentPage - 2);
        const endPage = Math.min(data.totalPages, data.currentPage + 2);

        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.textContent = i;
            pageBtn.className = i === data.currentPage ? 'active' : '';
            pageBtn.onclick = () => this.loadFiles(i, document.getElementById('searchInput').value);
            container.appendChild(pageBtn);
        }

        // Next button
        const nextBtn = document.createElement('button');
        nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
        nextBtn.disabled = !data.hasNext;
        nextBtn.onclick = () => this.loadFiles(data.currentPage + 1, document.getElementById('searchInput').value);
        container.appendChild(nextBtn);
    }

    searchFiles() {
        const searchTerm = document.getElementById('searchInput').value;
        this.loadFiles(1, searchTerm);
    }

    refreshFiles() {
        const searchTerm = document.getElementById('searchInput').value;
        this.loadFiles(this.currentPage, searchTerm);
        this.showNotification('Success', 'Files refreshed!', 'success');
    }

    async downloadFile(fileId) {
        try {
            const response = await fetch(`/api/download/${fileId}`);
            
            if (!response.ok) {
                throw new Error('Download failed');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || 'download';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            this.showNotification('Success', 'Download started!', 'success');
        } catch (error) {
            console.error('Download error:', error);
            this.showNotification('Error', 'Download failed', 'error');
        }
    }

    async previewFile(fileId) {
        try {
            const response = await fetch(`/api/file/${fileId}`);
            const fileInfo = await response.json();

            if (!response.ok) {
                throw new Error(fileInfo.error);
            }

            this.showFilePreview(fileInfo);
        } catch (error) {
            console.error('Preview error:', error);
            this.showNotification('Error', 'Failed to load file preview', 'error');
        }
    }

    showFilePreview(fileInfo) {
        const modal = document.getElementById('previewModal');
        const title = document.getElementById('previewTitle');
        const content = document.getElementById('previewContent');
        const downloadBtn = document.getElementById('downloadBtn');

        title.textContent = fileInfo.originalName;
        downloadBtn.onclick = () => this.downloadFile(fileInfo.id);

        // Generate preview content based on file type
        if (fileInfo.mimeType.startsWith('image/')) {
            content.innerHTML = `
                <div style="text-align: center;">
                    <img src="/uploads/${fileInfo.path.split('/').pop()}" 
                         alt="${fileInfo.originalName}" 
                         style="max-width: 100%; max-height: 500px; border-radius: 10px;">
                </div>
            `;
        } else if (fileInfo.mimeType.startsWith('video/')) {
            content.innerHTML = `
                <div style="text-align: center;">
                    <video controls style="max-width: 100%; max-height: 500px; border-radius: 10px;">
                        <source src="/uploads/${fileInfo.path.split('/').pop()}" type="${fileInfo.mimeType}">
                        Your browser does not support the video tag.
                    </video>
                </div>
            `;
        } else if (fileInfo.mimeType.startsWith('audio/')) {
            content.innerHTML = `
                <div style="text-align: center; padding: 2rem;">
                    <i class="fas fa-music" style="font-size: 4rem; color: #6366f1; margin-bottom: 1rem;"></i>
                    <audio controls style="width: 100%;">
                        <source src="/uploads/${fileInfo.path.split('/').pop()}" type="${fileInfo.mimeType}">
                        Your browser does not support the audio tag.
                    </audio>
                </div>
            `;
        } else {
            content.innerHTML = `
                <div style="text-align: center; padding: 3rem;">
                    <i class="${fileInfo.icon}" style="font-size: 4rem; color: #6366f1; margin-bottom: 1rem;"></i>
                    <h3>${fileInfo.originalName}</h3>
                    <p style="color: #64748b; margin: 1rem 0;">Size: ${fileInfo.formattedSize}</p>
                    <p style="color: #64748b;">Uploaded: ${new Date(fileInfo.uploadDate).toLocaleString()}</p>
                    <p style="color: #64748b;">Downloads: ${fileInfo.downloads}</p>
                    <p style="margin-top: 2rem;">Preview not available for this file type.</p>
                </div>
            `;
        }

        modal.style.display = 'block';
    }

    // Stats methods
    async loadStats() {
        try {
            const response = await fetch('/api/stats');
            const stats = await response.json();
            
            document.getElementById('totalFiles').textContent = stats.totalFiles.toLocaleString();
            document.getElementById('totalUsers').textContent = stats.totalUsers.toLocaleString();
            document.getElementById('totalRooms').textContent = stats.totalRooms.toLocaleString();
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    // Modal methods
    showUploadModal() {
        document.getElementById('uploadModal').style.display = 'block';
    }

    closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
        
        // Clear form data
        if (modalId === 'joinModal') {
            document.getElementById('usernameInput').value = '';
            document.getElementById('roomIdInput').value = '';
        } else if (modalId === 'uploadModal') {
            this.selectedFiles = [];
            this.displaySelectedFiles();
            document.getElementById('uploadBtn').disabled = true;
        }
    }

    // Notification methods
    showNotification(title, message, type = 'info') {
        const container = document.getElementById('notifications');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        notification.innerHTML = `
            <div class="notification-header">
                <span class="notification-title">${title}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                    &times;
                </button>
            </div>
            <div class="notification-message">${message}</div>
        `;
        
        container.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    // Utility methods
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    getFileIcon(mimeType) {
        if (mimeType.startsWith('image/')) return 'fas fa-image';
        if (mimeType.startsWith('video/')) return 'fas fa-video';
        if (mimeType.startsWith('audio/')) return 'fas fa-music';
        if (mimeType.includes('pdf')) return 'fas fa-file-pdf';
        if (mimeType.includes('word')) return 'fas fa-file-word';
        if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'fas fa-file-excel';
        if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'fas fa-file-powerpoint';
        if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('archive')) return 'fas fa-file-archive';
        if (mimeType.includes('text')) return 'fas fa-file-alt';
        return 'fas fa-file';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    toggleMobileMenu() {
        const hamburger = document.querySelector('.hamburger');
        const navMenu = document.querySelector('.nav-menu');
        
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    }
}

// Global functions for onclick handlers
function showJoinModal() {
    app.showJoinModal();
}

function showUploadModal() {
    app.showUploadModal();
}

function closeModal(modalId) {
    app.closeModal(modalId);
}

function quickJoin(roomId) {
    app.quickJoin(roomId);
}

function joinRoom() {
    app.joinRoom();
}

function leaveRoom() {
    app.leaveRoom();
}

function sendMessage() {
    app.sendMessage();
}

function uploadFiles() {
    app.uploadFiles();
}

function searchFiles() {
    app.searchFiles();
}

function refreshFiles() {
    app.refreshFiles();
}

function toggleMobileMenu() {
    app.toggleMobileMenu();
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ShareHubApp();
});

console.log('ShareHub Frontend Loaded! 🚀');