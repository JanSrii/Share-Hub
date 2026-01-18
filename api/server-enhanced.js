// ShareHub - Enhanced Vercel Serverless Function with Base64 Storage
const url = require('url');
const path = require('path');

// In-memory storage with base64 encoding for small files
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

// Parse multipart form data manually for Vercel
const parseMultipartData = (body, boundary) => {
    const parts = body.split(`--${boundary}`);
    const files = [];
    
    for (const part of parts) {
        if (part.includes('Content-Disposition: form-data')) {
            const nameMatch = part.match(/name="([^"]+)"/);
            const filenameMatch = part.match(/filename="([^"]+)"/);
            
            if (filenameMatch && nameMatch) {
                const filename = filenameMatch[1];
                const fieldName = nameMatch[1];
                
                // Extract file content (after double CRLF)
                const contentStart = part.indexOf('\r\n\r\n') + 4;
                const contentEnd = part.lastIndexOf('\r\n');
                
                if (contentStart > 3 && contentEnd > contentStart) {
                    const content = part.substring(contentStart, contentEnd);
                    files.push({
                        fieldName,
                        filename,
                        content,
                        size: content.length
                    });
                }
            }
        }
    }
    
    return files;
};

// Add some demo files
const initDemoFiles = () => {
    if (files.size === 0) {
        const demoFiles = [
            { name: 'welcome-guide.pdf', size: 2456789, content: 'Welcome to ShareHub! This is a demo PDF file.' },
            { name: 'sample-image.png', size: 1234567, content: 'Sample image content (base64 would go here)' },
            { name: 'demo-presentation.pptx', size: 3456789, content: 'Demo presentation content' },
            { name: 'data-sheet.xlsx', size: 987654, content: 'Sample spreadsheet data' }
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
                formattedSize: formatFileSize(file.size),
                content: Buffer.from(file.content).toString('base64'),
                mimeType: 'application/octet-stream'
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
            
            let fileList = Array.from(files.values()).map(file => ({
                id: file.id,
                originalName: file.originalName,
                size: file.size,
                uploadDate: file.uploadDate,
                downloads: file.downloads,
                icon: file.icon,
                formattedSize: file.formattedSize
            }));
            
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
            
            // Return file info without content
            const { content, ...fileInfoWithoutContent } = fileInfo;
            res.status(200).json(fileInfoWithoutContent);
            return;
        }
        
        if (cleanPath === '/upload' && req.method === 'POST') {
            try {
                let body = '';
                
                // Read the request body
                for await (const chunk of req) {
                    body += chunk.toString();
                }
                
                const contentType = req.headers['content-type'] || '';
                
                if (contentType.includes('multipart/form-data')) {
                    const boundary = contentType.split('boundary=')[1];
                    if (!boundary) {
                        throw new Error('No boundary found in multipart data');
                    }
                    
                    const uploadedFiles = parseMultipartData(body, boundary);
                    const uploadedFilesList = [];
                    
                    for (const file of uploadedFiles) {
                        if (file.size > 1024 * 1024) { // 1MB limit for base64 storage
                            throw new Error(`File ${file.filename} is too large (max 1MB)`);
                        }
                        
                        const fileId = generateId();
                        const fileInfo = {
                            id: fileId,
                            originalName: file.filename,
                            size: file.size,
                            uploadDate: new Date(),
                            downloads: 0,
                            icon: getFileIcon(file.filename),
                            formattedSize: formatFileSize(file.size),
                            content: Buffer.from(file.content).toString('base64'),
                            mimeType: 'application/octet-stream'
                        };
                        
                        files.set(fileId, fileInfo);
                        
                        // Return file info without content
                        const { content, ...fileInfoWithoutContent } = fileInfo;
                        uploadedFilesList.push(fileInfoWithoutContent);
                    }
                    
                    res.status(200).json({
                        success: true,
                        files: uploadedFilesList,
                        message: `Successfully uploaded ${uploadedFilesList.length} file(s)`
                    });
                    return;
                } else {
                    throw new Error('Invalid content type. Expected multipart/form-data');
                }
                
            } catch (error) {
                console.error('Upload error:', error);
                res.status(500).json({
                    success: false,
                    error: 'Upload failed: ' + error.message
                });
                return;
            }
        }
        
        if (cleanPath.startsWith('/download/')) {
            const fileId = cleanPath.split('/download/')[1];
            const fileInfo = files.get(fileId);
            
            if (!fileInfo) {
                res.status(404).json({ error: 'File not found' });
                return;
            }

            try {
                // Update download count
                fileInfo.downloads++;
                files.set(fileId, fileInfo);

                // Decode base64 content
                const fileBuffer = Buffer.from(fileInfo.content, 'base64');

                // Set appropriate headers
                res.setHeader('Content-Type', fileInfo.mimeType || 'application/octet-stream');
                res.setHeader('Content-Disposition', `attachment; filename="${fileInfo.originalName}"`);
                res.setHeader('Content-Length', fileBuffer.length);
                
                res.status(200).send(fileBuffer);
                return;

            } catch (error) {
                console.error('Download error:', error);
                res.status(500).json({ error: 'Download failed: ' + error.message });
                return;
            }
        }
        
        // Default API response
        res.status(200).json({ 
            message: 'ShareHub API - Enhanced with Real File Support!',
            status: 'running',
            endpoints: ['/api/stats', '/api/files', '/api/upload', '/api/download/:id'],
            features: ['Real file upload/download', 'Base64 storage', '1MB file limit'],
            timestamp: new Date().toISOString(),
            version: '2.0.0'
        });
        
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    }
};