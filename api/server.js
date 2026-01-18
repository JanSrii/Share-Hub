// ShareHub - Vercel Serverless Function
const url = require('url');
const path = require('path');

// Simple file storage (in production, use a database)
let files = new Map();

// Utility functions
const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileIcon = (filename) => {
    const ext = path.extname(filename).toLowerCase();
    if (['.jpg', '.jpeg', '.png', '.gif', '.bmp'].includes(ext)) return 'fas fa-image';
    if (['.mp4', '.avi', '.mov', '.wmv'].includes(ext)) return 'fas fa-video';
    if (['.mp3', '.wav', '.flac'].includes(ext)) return 'fas fa-music';
    if (ext === '.pdf') return 'fas fa-file-pdf';
    if (['.doc', '.docx'].includes(ext)) return 'fas fa-file-word';
    if (['.xls', '.xlsx'].includes(ext)) return 'fas fa-file-excel';
    if (['.ppt', '.pptx'].includes(ext)) return 'fas fa-file-powerpoint';
    if (['.zip', '.rar', '.7z'].includes(ext)) return 'fas fa-file-archive';
    if (['.txt', '.md'].includes(ext)) return 'fas fa-file-alt';
    return 'fas fa-file';
};

const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Add some demo files
const initDemoFiles = () => {
    if (files.size === 0) {
        const demoFiles = [
            { name: 'welcome-guide.pdf', size: 2456789 },
            { name: 'sample-image.png', size: 1234567 },
            { name: 'demo-presentation.pptx', size: 3456789 },
            { name: 'data-sheet.xlsx', size: 987654 }
        ];

        demoFiles.forEach((file, index) => {
            const fileId = generateId();
            const fileInfo = {
                id: fileId,
                originalName: file.name,
                size: file.size,
                uploadDate: new Date(Date.now() - (index * 24 * 60 * 60 * 1000)),
                downloads: Math.floor(Math.random() * 50),
                icon: getFileIcon(file.name),
                formattedSize: formatFileSize(file.size)
            };
            files.set(fileId, fileInfo);
        });
    }
};

// Initialize demo files
initDemoFiles();

// Main handler function for Vercel
module.exports = async (req, res) => {
    try {
        // CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        
        if (req.method === 'OPTIONS') {
            res.status(200).end();
            return;
        }
        
        const parsedUrl = url.parse(req.url, true);
        const pathname = parsedUrl.pathname;
        
        // Remove /api prefix if present
        const cleanPath = pathname.replace('/api', '');
        
        // API Routes
        if (cleanPath === '/stats') {
            res.status(200).json({
                totalFiles: files.size,
                totalUsers: 892,
                totalRooms: 23,
                uptime: process.uptime(),
                serverTime: new Date().toISOString()
            });
            return;
        }
        
        if (cleanPath === '/files') {
            const page = parseInt(parsedUrl.query.page) || 1;
            const limit = parseInt(parsedUrl.query.limit) || 20;
            const search = parsedUrl.query.search || '';
            
            let fileList = Array.from(files.values());
            
            if (search) {
                fileList = fileList.filter(file => 
                    file.originalName.toLowerCase().includes(search.toLowerCase())
                );
            }
            
            fileList.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
            
            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + limit;
            const paginatedFiles = fileList.slice(startIndex, endIndex);
            
            res.status(200).json({
                files: paginatedFiles,
                totalFiles: fileList.length,
                currentPage: page,
                totalPages: Math.ceil(fileList.length / limit),
                hasNext: endIndex < fileList.length,
                hasPrev: startIndex > 0
            });
            return;
        }
        
        if (cleanPath.startsWith('/file/')) {
            const fileId = cleanPath.split('/file/')[1];
            const fileInfo = files.get(fileId);
            
            if (!fileInfo) {
                res.status(404).json({ error: 'File not found' });
                return;
            }
            
            res.status(200).json(fileInfo);
            return;
        }
        
        if (cleanPath === '/upload' && req.method === 'POST') {
            // Simulate file upload for demo
            const uploadedFiles = [];
            
            // Create demo uploaded file
            const fileId = generateId();
            const fileInfo = {
                id: fileId,
                originalName: 'demo-upload.txt',
                size: 1024,
                uploadDate: new Date(),
                downloads: 0,
                icon: 'fas fa-file-alt',
                formattedSize: '1 KB'
            };
            
            files.set(fileId, fileInfo);
            uploadedFiles.push(fileInfo);
            
            res.status(200).json({
                success: true,
                files: uploadedFiles,
                message: 'Demo upload successful! (Vercel Live Demo)'
            });
            return;
        }
        
        if (cleanPath.startsWith('/download/')) {
            const fileId = cleanPath.split('/download/')[1];
            const fileInfo = files.get(fileId);
            
            if (!fileInfo) {
                res.status(404).json({ error: 'File not found' });
                return;
            }
            
            fileInfo.downloads++;
            files.set(fileId, fileInfo);
            
            // Return demo content
            res.setHeader('Content-Type', 'text/plain');
            res.setHeader('Content-Disposition', `attachment; filename="${fileInfo.originalName}"`);
            res.status(200).send(`Demo file content for: ${fileInfo.originalName}\nThis is a Vercel deployment demo.\nFile uploaded on: ${fileInfo.uploadDate}\nDownloads: ${fileInfo.downloads}`);
            return;
        }
        
        // Default API response
        res.status(200).json({ 
            message: 'ShareHub API - Live on Vercel!',
            status: 'running',
            endpoints: ['/api/stats', '/api/files', '/api/upload', '/api/download/:id'],
            timestamp: new Date().toISOString(),
            version: '1.0.0'
        });
        
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    }
};