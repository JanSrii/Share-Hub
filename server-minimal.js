// ShareHub - Minimal Working Server
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const querystring = require('querystring');

// Simple file storage
let files = new Map();
let rooms = new Map();
let messages = new Map();

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

// Create directories
const createDirectories = () => {
    const dirs = ['uploads', 'uploads/files', 'uploads/images'];
    dirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    });
};
createDirectories();

// MIME types
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.woff': 'application/font-woff',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf',
    '.wasm': 'application/wasm'
};

// Simple multipart parser
const parseMultipart = (data, boundary) => {
    const parts = [];
    const boundaryBuffer = Buffer.from('--' + boundary);
    let start = 0;
    
    while (true) {
        const boundaryIndex = data.indexOf(boundaryBuffer, start);
        if (boundaryIndex === -1) break;
        
        const nextBoundaryIndex = data.indexOf(boundaryBuffer, boundaryIndex + boundaryBuffer.length);
        if (nextBoundaryIndex === -1) break;
        
        const partData = data.slice(boundaryIndex + boundaryBuffer.length, nextBoundaryIndex);
        const headerEndIndex = partData.indexOf('\r\n\r\n');
        
        if (headerEndIndex !== -1) {
            const headers = partData.slice(0, headerEndIndex).toString();
            const content = partData.slice(headerEndIndex + 4);
            
            const nameMatch = headers.match(/name="([^"]+)"/);
            const filenameMatch = headers.match(/filename="([^"]+)"/);
            
            if (nameMatch) {
                parts.push({
                    name: nameMatch[1],
                    filename: filenameMatch ? filenameMatch[1] : null,
                    data: content
                });
            }
        }
        
        start = nextBoundaryIndex;
    }
    
    return parts;
};

// Create HTTP server
const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    // API Routes
    if (pathname === '/api/stats') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            totalFiles: files.size,
            totalUsers: 0,
            totalRooms: rooms.size,
            uptime: process.uptime()
        }));
        return;
    }
    
    if (pathname === '/api/upload' && req.method === 'POST') {
        let body = Buffer.alloc(0);
        
        req.on('data', chunk => {
            body = Buffer.concat([body, chunk]);
        });
        
        req.on('end', () => {
            try {
                const contentType = req.headers['content-type'];
                if (!contentType || !contentType.includes('multipart/form-data')) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Invalid content type' }));
                    return;
                }
                
                const boundary = contentType.split('boundary=')[1];
                const parts = parseMultipart(body, boundary);
                const uploadedFiles = [];
                
                parts.forEach(part => {
                    if (part.filename) {
                        const fileId = generateId();
                        const filename = `${fileId}-${part.filename}`;
                        const filepath = path.join('uploads/files', filename);
                        
                        // Remove the trailing \r\n from file data
                        const fileData = part.data.slice(0, -2);
                        fs.writeFileSync(filepath, fileData);
                        
                        const fileInfo = {
                            id: fileId,
                            originalName: part.filename,
                            filename: filename,
                            path: filepath,
                            size: fileData.length,
                            uploadDate: new Date(),
                            downloads: 0,
                            icon: getFileIcon(part.filename),
                            formattedSize: formatFileSize(fileData.length)
                        };
                        
                        files.set(fileId, fileInfo);
                        uploadedFiles.push(fileInfo);
                    }
                });
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    files: uploadedFiles,
                    message: `${uploadedFiles.length} file(s) uploaded successfully`
                }));
                
            } catch (error) {
                console.error('Upload error:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Upload failed' }));
            }
        });
        return;
    }
    
    if (pathname.startsWith('/api/download/')) {
        const fileId = pathname.split('/api/download/')[1];
        const fileInfo = files.get(fileId);
        
        if (!fileInfo || !fs.existsSync(fileInfo.path)) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'File not found' }));
            return;
        }
        
        fileInfo.downloads++;
        files.set(fileId, fileInfo);
        
        res.writeHead(200, {
            'Content-Type': 'application/octet-stream',
            'Content-Disposition': `attachment; filename="${fileInfo.originalName}"`
        });
        
        const fileStream = fs.createReadStream(fileInfo.path);
        fileStream.pipe(res);
        return;
    }
    
    if (pathname.startsWith('/api/file/')) {
        const fileId = pathname.split('/api/file/')[1];
        const fileInfo = files.get(fileId);
        
        if (!fileInfo) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'File not found' }));
            return;
        }
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(fileInfo));
        return;
    }
    
    if (pathname === '/api/files') {
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
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            files: paginatedFiles,
            totalFiles: fileList.length,
            currentPage: page,
            totalPages: Math.ceil(fileList.length / limit),
            hasNext: endIndex < fileList.length,
            hasPrev: startIndex > 0
        }));
        return;
    }
    
    // Serve static files
    let filePath = pathname === '/' ? '/index.html' : pathname;
    filePath = path.join('public', filePath);
    
    // Security check
    if (filePath.includes('..')) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }
    
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404);
            res.end('File not found');
            return;
        }
        
        const ext = path.extname(filePath);
        const contentType = mimeTypes[ext] || 'application/octet-stream';
        
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log('🚀 ShareHub Server Started!');
    console.log('================================');
    console.log(`📡 Server running on: http://localhost:${PORT}`);
    console.log('📁 File upload/download: Working');
    console.log('🔒 Security: Basic protection enabled');
    console.log('📱 Mobile responsive: Ready');
    console.log('');
    console.log('✅ Features Available:');
    console.log('   • File upload (drag & drop)');
    console.log('   • File download');
    console.log('   • File browsing with search');
    console.log('   • Professional UI');
    console.log('   • Mobile responsive design');
    console.log('');
    console.log('🌐 Open http://localhost:3000 in your browser!');
    console.log('');
    console.log('Note: This is a simplified version without Socket.IO');
    console.log('All file operations work perfectly!');
});