// ShareHub Frontend - Vercel Optimized Version
class ShareHubApp {
    constructor() {
        this.selectedFiles = [];
        this.currentPage = 1;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadStats();
        this.loadFiles();
        this.setupDragAndDrop();
        
        // Show real functionality notification with limitations
        this.showNotification('Platform Ready!', 'ShareHub now supports real file uploads! Note: 5MB file size limit due to serverless constraints.', 'success');
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

    // File handling methods
    handleFileSelect(files) {
        if (files.length === 0) return;
        
        // Check file sizes
        const maxSize = 5 * 1024 * 1024; // 5MB
        const oversizedFiles = files.filter(file => file.size > maxSize);
        
        if (oversizedFiles.length > 0) {
            this.showNotification('File Too Large', 
                `The following files exceed the 5MB limit: ${oversizedFiles.map(f => f.name).join(', ')}`, 
                'error');
            return;
        }
        
        this.uploadFiles(Array.from(files));
    }

    handleModalFileSelect(files) {
        // Check file sizes
        const maxSize = 5 * 1024 * 1024; // 5MB
        const validFiles = [];
        const oversizedFiles = [];
        
        Array.from(files).forEach(file => {
            if (file.size > maxSize) {
                oversizedFiles.push(file);
            } else {
                validFiles.push(file);
            }
        });
        
        if (oversizedFiles.length > 0) {
            this.showNotification('Some Files Too Large', 
                `${oversizedFiles.length} file(s) exceed the 5MB limit and were skipped.`, 
                'warning');
        }
        
        this.selectedFiles = validFiles;
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

        try {
            this.showUploadProgress(true);
            
            // Create FormData for real file upload
            const formData = new FormData();
            
            // Add each file to FormData
            filesToUpload.forEach((file, index) => {
                formData.append('files', file);
            });

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData // Send FormData directly, don't set Content-Type header
            });

            const result = await response.json();

            if (result.success) {
                this.showNotification('Success', result.message, 'success');
                this.displayUploadedFiles(result.files);
                this.loadStats(); // Refresh stats
                this.loadFiles(); // Refresh file list
                
                // Clear selected files
                this.selectedFiles = [];
                this.displaySelectedFiles();
                document.getElementById('uploadBtn').disabled = true;
                
                // Clear file inputs
                document.getElementById('fileInput').value = '';
                document.getElementById('modalFileInput').value = '';
                
                // Close modal if open
                this.closeModal('uploadModal');
            } else {
                throw new Error(result.error || 'Upload failed');
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
                // Show real upload progress
                const progressFill = document.getElementById('progressFill');
                const progressText = document.getElementById('progressText');
                
                if (progressFill) progressFill.style.width = '0%';
                if (progressText) progressText.textContent = 'Preparing upload...';
                
                // Simulate realistic progress
                let progress = 0;
                const interval = setInterval(() => {
                    progress += Math.random() * 15 + 5; // More realistic increments
                    if (progress >= 95) {
                        progress = 95;
                        if (progressText) progressText.textContent = 'Processing files...';
                    }
                    
                    if (progressFill) progressFill.style.width = progress + '%';
                    if (progress < 95 && progressText) {
                        progressText.textContent = `Uploading... ${Math.round(progress)}%`;
                    }
                }, 100);
                
                // Store interval to clear it later
                this.uploadInterval = interval;
            } else {
                // Complete the progress
                if (this.uploadInterval) {
                    clearInterval(this.uploadInterval);
                }
                
                const progressFill = document.getElementById('progressFill');
                const progressText = document.getElementById('progressText');
                
                if (progressFill) progressFill.style.width = '100%';
                if (progressText) progressText.textContent = 'Upload complete!';
                
                // Hide after a short delay
                setTimeout(() => {
                    progressElement.style.display = 'none';
                }, 1000);
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

    // API methods
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
            this.loadFiles(); // Refresh to show updated download count
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

        content.innerHTML = `
            <div style="text-align: center; padding: 3rem;">
                <i class="${fileInfo.icon}" style="font-size: 4rem; color: #6366f1; margin-bottom: 1rem;"></i>
                <h3>${fileInfo.originalName}</h3>
                <p style="color: #64748b; margin: 1rem 0;">Size: ${fileInfo.formattedSize}</p>
                <p style="color: #64748b;">Uploaded: ${new Date(fileInfo.uploadDate).toLocaleString()}</p>
                <p style="color: #64748b;">Downloads: ${fileInfo.downloads}</p>
                <p style="margin-top: 2rem; color: #10b981;">✅ Real file - Ready to download!</p>
                <button onclick="app.downloadFile('${fileInfo.id}')" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #6366f1; color: white; border: none; border-radius: 0.5rem; cursor: pointer;">
                    <i class="fas fa-download"></i> Download Now
                </button>
            </div>
        `;

        modal.style.display = 'block';
    }

    // Chat methods (demo mode for Vercel)
    showJoinModal() {
        this.showNotification('Demo Mode', 'Chat feature available in full Node.js deployment. This Vercel version focuses on file operations.', 'info');
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

console.log('ShareHub Vercel Deployment Loaded! 🚀');