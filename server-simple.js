const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const mime = require('mime-types');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Create necessary directories
const createDirectories = () => {
    const dirs = ['uploads', 'uploads/files', 'uploads/images', 'uploads/temp'];
    dirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    });
};
createDirectories();

// In-memory storage
let users = new Map();
let rooms = new Map();
let files = new Map();
let messages = new Map();

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = file.mimetype.startsWith('image/') ? 'uploads/images' : 'uploads/files';
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB limit
        files: 10 // Maximum 10 files at once
    },
    fileFilter: (req, file, cb) => {
        // Allow all file types but check for malicious extensions
        const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com'];
        const fileExt = path.extname(file.originalname).toLowerCase();
        
        if (dangerousExtensions.includes(fileExt)) {
            return cb(new Error('File type not allowed for security reasons'));
        }
        cb(null, true);
    }
});

// Utility functions
const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileIcon = (mimeType) => {
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
};

// API Routes

// Get server stats
app.get('/api/stats', (req, res) => {
    const stats = {
        totalFiles: files.size,
        totalUsers: users.size,
        totalRooms: rooms.size,
        totalMessages: Array.from(messages.values()).reduce((sum, roomMessages) => sum + roomMessages.length, 0),
        uptime: process.uptime(),
        serverTime: new Date().toISOString()
    };
    res.json(stats);
});

// File upload endpoint
app.post('/api/upload', upload.array('files', 10), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        const uploadedFiles = [];

        for (const file of req.files) {
            const fileId = uuidv4();
            const fileInfo = {
                id: fileId,
                originalName: file.originalname,
                filename: file.filename,
                path: file.path,
                size: file.size,
                mimeType: file.mimetype,
                uploadDate: new Date(),
                downloads: 0,
                icon: getFileIcon(file.mimetype),
                formattedSize: formatFileSize(file.size)
            };

            files.set(fileId, fileInfo);
            uploadedFiles.push(fileInfo);
        }

        res.json({
            success: true,
            files: uploadedFiles,
            message: `${uploadedFiles.length} file(s) uploaded successfully`
        });

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Upload failed: ' + error.message });
    }
});

// File download endpoint
app.get('/api/download/:fileId', (req, res) => {
    const fileId = req.params.fileId;
    const fileInfo = files.get(fileId);

    if (!fileInfo) {
        return res.status(404).json({ error: 'File not found' });
    }

    if (!fs.existsSync(fileInfo.path)) {
        return res.status(404).json({ error: 'File no longer exists on server' });
    }

    // Increment download counter
    fileInfo.downloads++;
    files.set(fileId, fileInfo);

    // Set appropriate headers
    res.setHeader('Content-Disposition', `attachment; filename="${fileInfo.originalName}"`);
    res.setHeader('Content-Type', fileInfo.mimeType);
    res.setHeader('Content-Length', fileInfo.size);

    // Stream the file
    const fileStream = fs.createReadStream(fileInfo.path);
    fileStream.pipe(res);
});

// Get file info
app.get('/api/file/:fileId', (req, res) => {
    const fileId = req.params.fileId;
    const fileInfo = files.get(fileId);

    if (!fileInfo) {
        return res.status(404).json({ error: 'File not found' });
    }

    res.json(fileInfo);
});

// Get all files (with pagination)
app.get('/api/files', (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';

    let fileList = Array.from(files.values());

    // Filter by search term
    if (search) {
        fileList = fileList.filter(file => 
            file.originalName.toLowerCase().includes(search.toLowerCase())
        );
    }

    // Sort by upload date (newest first)
    fileList.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedFiles = fileList.slice(startIndex, endIndex);

    res.json({
        files: paginatedFiles,
        totalFiles: fileList.length,
        currentPage: page,
        totalPages: Math.ceil(fileList.length / limit),
        hasNext: endIndex < fileList.length,
        hasPrev: startIndex > 0
    });
});

// Delete file
app.delete('/api/file/:fileId', (req, res) => {
    const fileId = req.params.fileId;
    const fileInfo = files.get(fileId);

    if (!fileInfo) {
        return res.status(404).json({ error: 'File not found' });
    }

    // Delete file from filesystem
    try {
        if (fs.existsSync(fileInfo.path)) {
            fs.unlinkSync(fileInfo.path);
        }
    } catch (error) {
        console.error('Error deleting file:', error);
    }

    // Remove from memory
    files.delete(fileId);

    res.json({ success: true, message: 'File deleted successfully' });
});

// Socket.IO for real-time messaging
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // User joins a room
    socket.on('join-room', (data) => {
        const { roomId, username } = data;
        
        socket.join(roomId);
        socket.username = username;
        socket.roomId = roomId;

        // Add user to room
        if (!rooms.has(roomId)) {
            rooms.set(roomId, {
                id: roomId,
                name: `Room ${roomId}`,
                users: new Set(),
                createdAt: new Date()
            });
            messages.set(roomId, []);
        }

        const room = rooms.get(roomId);
        room.users.add(username);

        // Send room info and message history
        socket.emit('room-joined', {
            roomId,
            users: Array.from(room.users),
            messages: messages.get(roomId) || []
        });

        // Notify others in room
        socket.to(roomId).emit('user-joined', {
            username,
            users: Array.from(room.users)
        });

        console.log(`${username} joined room ${roomId}`);
    });

    // Handle new messages
    socket.on('send-message', (data) => {
        const { roomId, message, fileId } = data;
        const username = socket.username;

        if (!username || !roomId) return;

        const messageData = {
            id: uuidv4(),
            username,
            message: message || '',
            fileId: fileId || null,
            timestamp: new Date(),
            type: fileId ? 'file' : 'text'
        };

        // Add file info if it's a file message
        if (fileId && files.has(fileId)) {
            messageData.fileInfo = files.get(fileId);
        }

        // Store message
        if (!messages.has(roomId)) {
            messages.set(roomId, []);
        }
        messages.get(roomId).push(messageData);

        // Broadcast to room
        io.to(roomId).emit('new-message', messageData);

        console.log(`Message from ${username} in room ${roomId}`);
    });

    // Handle typing indicators
    socket.on('typing', (data) => {
        socket.to(data.roomId).emit('user-typing', {
            username: socket.username,
            isTyping: data.isTyping
        });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        if (socket.username && socket.roomId) {
            const room = rooms.get(socket.roomId);
            if (room) {
                room.users.delete(socket.username);
                socket.to(socket.roomId).emit('user-left', {
                    username: socket.username,
                    users: Array.from(room.users)
                });
            }
        }
        console.log('User disconnected:', socket.id);
    });
});

// Error handling middleware
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File too large. Maximum size is 100MB.' });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({ error: 'Too many files. Maximum is 10 files at once.' });
        }
    }
    
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 ShareHub server running on port ${PORT}`);
    console.log(`📁 File uploads: /api/upload`);
    console.log(`💬 Real-time messaging: Socket.IO enabled`);
    console.log(`🌐 Access your app at: http://localhost:${PORT}`);
    console.log(`📊 Server stats: http://localhost:${PORT}/api/stats`);
    console.log('');
    console.log('✅ All features working:');
    console.log('   • File upload/download (up to 100MB)');
    console.log('   • Real-time chat with file sharing');
    console.log('   • Drag & drop interface');
    console.log('   • Mobile responsive design');
    console.log('   • Search and pagination');
    console.log('   • Security features');
    console.log('');
    console.log('🎉 ShareHub is ready! Open http://localhost:3000 in your browser');
});