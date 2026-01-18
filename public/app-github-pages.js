// ShareHub Frontend - GitHub Pages Compatible Version
class ShareHubApp {
    constructor() {
        this.files = new Map();
        this.selectedFiles = [];
        this.currentPage = 1;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadMockStats();
        this.loadMockFiles();
        this.setupDragAndDrop();
        
        // Show demo notification
        this.showNotification('Demo Mode', 'This is a demo version. File uploads are simulated for GitHub Pages.', 'info');
    }

    setupEventListeners() {
        // File input change
        document.getElementById('fileInput').addEventListener('change', (e) => {
            this.handleFileSelect(e.target.files);
        });

        document.getElementById('modalFileInput').addEventListener('change', (e) => {
            this.handleModalFileSelect(e.target.files);
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

    // File handling methods (simulated for GitHub Pages)
    handleFileSelect(files) {
        if (files.length === 0) return;
        
        this.simulateUpload(Array.from(files));
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

    async simulateUpload(files = null) {
        const filesToUpload = files || this.selectedFiles;
        if (filesToUpload.length === 0) return;

        try {
            this.showUploadProgress(true);
            
            // Simulate upload delay
            await new Promise(resolve => setTimeout(resolve, 2000));

            const uploadedFiles = filesToUpload.map(file => {
                const fileId = this.generateId();
                const fileInfo = {
                    id: fileId,
                    originalName: file.name,
                    size: file.size,
                    mimeType: file.type,
                    uploadDate: new Date(),
                    downloads: Math.floor(Math.random() * 50),
                    icon: this.getFileIcon(file.type),
                    formattedSize: this.formatFileSize(file.size)
                };
                
                this.files.set(fileId, fileInfo);
                return fileInfo;
            });

            this.showNotification('Success', `${uploadedFiles.length} file(s) uploaded successfully! (Demo Mode)`, 'success');
            this.displayUploadedFiles(uploadedFiles);
            this.loadMockStats(); // Refresh stats
            this.loadMockFiles(); // Refresh file list
            
            // Clear selected files
            this.selectedFiles = [];
            this.displaySelectedFiles();
            document.getElementById('uploadBtn').disabled = true;
            
            // Close modal if open
            this.closeModal('uploadModal');

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
                    <button onclick="app.simulateDownload('${file.id}')" title="Download (Demo)">
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

    // Mock data methods
    loadMockStats() {
        document.getElementById('totalFiles').textContent = (this.files.size + 1247).toLocaleString();
        document.getElementById('totalUsers').textContent = '892';
        document.getElementById('totalRooms').textContent = '23';
    }

    loadMockFiles() {
        // Add some demo files if none exist
        if (this.files.size === 0) {
            const demoFiles = [
                { name: 'project-presentation.pdf', size: 2456789, type: 'application/pdf' },
                { name: 'design-mockup.png', size: 1234567, type: 'image/png' },
                { name: 'demo-video.mp4', size: 15678901, type: 'video/mp4' },
                { name: 'data-analysis.xlsx', size: 987654, type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
                { name: 'meeting-notes.docx', size: 456789, type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }
            ];

            demoFiles.forEach((file, index) => {
                const fileId = this.generateId();
                const fileInfo = {
                    id: fileId,
                    originalName: file.name,
                    size: file.size,
                    mimeType: file.type,
                    uploadDate: new Date(Date.now() - (index * 24 * 60 * 60 * 1000)),
                    downloads: Math.floor(Math.random() * 100),
                    icon: this.getFileIcon(file.type),
                    formattedSize: this.formatFileSize(file.size)
                };
                
                this.files.set(fileId, fileInfo);
            });
        }

        this.displayFilesGrid(Array.from(this.files.values()));
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

    searchFiles() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        let filteredFiles = Array.from(this.files.values());
        
        if (searchTerm) {
            filteredFiles = filteredFiles.filter(file => 
                file.originalName.toLowerCase().includes(searchTerm)
            );
        }
        
        this.displayFilesGrid(filteredFiles);
    }

    refreshFiles() {
        this.loadMockFiles();
        this.showNotification('Success', 'Files refreshed!', 'success');
    }

    simulateDownload(fileId) {
        const fileInfo = this.files.get(fileId);
        if (fileInfo) {
            fileInfo.downloads++;
            this.files.set(fileId, fileInfo);
            this.showNotification('Demo', `Download started: ${fileInfo.originalName} (Demo Mode)`, 'success');
            this.loadMockFiles(); // Refresh to show updated download count
        }
    }

    previewFile(fileId) {
        const fileInfo = this.files.get(fileId);
        if (fileInfo) {
            this.showFilePreview(fileInfo);
        }
    }

    showFilePreview(fileInfo) {
        const modal = document.getElementById('previewModal');
        const title = document.getElementById('previewTitle');
        const content = document.getElementById('previewContent');
        const downloadBtn = document.getElementById('downloadBtn');

        title.textContent = fileInfo.originalName;
        downloadBtn.onclick = () => this.simulateDownload(fileInfo.id);

        // Generate preview content based on file type
        if (fileInfo.mimeType.startsWith('image/')) {
            content.innerHTML = `
                <div style="text-align: center;">
                    <div style="width: 300px; height: 200px; background: linear-gradient(45deg, #f0f0f0, #e0e0e0); border-radius: 10px; display: flex; align-items: center; justify-content: center; margin: 0 auto;">
                        <i class="fas fa-image" style="font-size: 3rem; color: #999;"></i>
                    </div>
                    <p style="margin-top: 1rem; color: #666;">Image preview (Demo Mode)</p>
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
                    <p style="margin-top: 2rem;">This is a demo version for GitHub Pages.</p>
                </div>
            `;
        }

        modal.style.display = 'block';
    }

    // Chat methods (demo mode)
    showJoinModal() {
        this.showNotification('Demo Mode', 'Chat feature is available in the full Node.js version. This is a GitHub Pages demo.', 'info');
    }

    // Modal methods
    showUploadModal() {
        document.getElementById('uploadModal').style.display = 'block';
    }

    closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
        
        // Clear form data
        if (modalId === 'uploadModal') {
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

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
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

function uploadFiles() {
    app.simulateUpload();
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

console.log('ShareHub GitHub Pages Demo Loaded! 🚀');