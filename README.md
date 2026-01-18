# ShareHub - Professional File Sharing Platform

A modern, fully functional file-sharing platform built with Node.js and deployed on Vercel with real upload/download capabilities.

## 🚀 Live Demo

**Platform URL**: https://share-hub-orig.vercel.app

## ✨ Features

### Core Functionality
- ✅ **Real File Upload**: Upload actual files (up to 5MB each)
- ✅ **Real File Download**: Download your uploaded files
- ✅ **Drag & Drop Interface**: Modern file upload experience
- ✅ **File Management**: Browse, search, and manage uploaded files
- ✅ **File Preview**: View file information before downloading
- ✅ **Download Counter**: Track file download statistics

### User Interface
- ✅ **Professional Design**: Modern, clean interface
- ✅ **Responsive Layout**: Works on desktop, tablet, and mobile
- ✅ **Real-time Updates**: Live statistics and file listings
- ✅ **Search & Filter**: Find files quickly
- ✅ **Progress Indicators**: Visual upload progress
- ✅ **Notifications**: User feedback for all actions

### Technical Features
- ✅ **Serverless Architecture**: Deployed on Vercel
- ✅ **RESTful API**: Clean API endpoints
- ✅ **File Type Detection**: Automatic file type icons
- ✅ **Size Validation**: Client and server-side file size checks
- ✅ **Error Handling**: Comprehensive error management
- ✅ **CORS Support**: Cross-origin resource sharing

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Node.js (Serverless Functions)
- **Deployment**: Vercel
- **Storage**: In-memory with Base64 encoding
- **Version Control**: Git + GitHub

## 📁 Project Structure

```
sharehub-fullstack/
├── api/
│   ├── server.js              # Main serverless function
│   └── server-enhanced.js     # Alternative implementation
├── public/
│   ├── index.html            # Main HTML file
│   ├── app-vercel.js         # Frontend JavaScript
│   └── styles.css            # Styling
├── vercel.json               # Vercel configuration
├── package.json              # Dependencies
├── test-upload.html          # Testing interface
└── README.md                 # This file
```

## 🚀 How It Works

### File Upload Process
1. User selects files via drag-and-drop or file picker
2. Frontend validates file sizes (5MB limit)
3. Files are sent to `/api/upload` endpoint via FormData
4. Server parses multipart data and stores files as Base64
5. Server returns file metadata to frontend
6. Frontend updates UI with uploaded files

### File Download Process
1. User clicks download button
2. Frontend requests file from `/api/download/:id`
3. Server retrieves Base64 data and converts to binary
4. Server sends file with appropriate headers
5. Browser initiates download

## 🔧 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/stats` | GET | Get platform statistics |
| `/api/files` | GET | List uploaded files (paginated) |
| `/api/file/:id` | GET | Get file metadata |
| `/api/upload` | POST | Upload files |
| `/api/download/:id` | GET | Download file |

## 📊 Current Limitations

- **File Size**: 5MB maximum per file (Vercel serverless limit)
- **Storage**: Files stored in memory (reset on deployment)
- **Persistence**: Files don't persist between server restarts

## 🔄 Future Enhancements

- **Cloud Storage**: Integrate with AWS S3 or similar
- **Database**: Add persistent file metadata storage
- **User Accounts**: User authentication and file ownership
- **File Sharing**: Generate shareable links
- **File Previews**: In-browser file previews
- **Bulk Operations**: Multiple file selection and operations

## 🧪 Testing

Visit the test interface at: `https://share-hub-orig.vercel.app/test-upload.html`

### Manual Testing Steps
1. Go to the live platform
2. Upload a small file (< 5MB)
3. Verify the file appears in the file list
4. Click download to retrieve the original file
5. Check that download counter increases

## 🚀 Deployment

The platform is automatically deployed to Vercel when changes are pushed to the main branch.

### Local Development
```bash
# Clone the repository
git clone https://github.com/JanSrii/Share-Hub.git

# Navigate to project directory
cd Share-Hub

# Install dependencies (if any)
npm install

# For local testing, you can use any static server
# The API functions are designed for Vercel's serverless environment
```

## 📈 Performance

- **Upload Speed**: Depends on file size and connection
- **Download Speed**: Fast binary delivery
- **API Response**: < 100ms for metadata operations
- **File Processing**: Real-time for files under 5MB

## 🔒 Security Features

- File size validation
- Content-Type validation
- CORS protection
- Error handling and sanitization
- No executable file execution

## 📱 Browser Compatibility

- ✅ Chrome (recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ✅ Mobile browsers

## 🤝 Contributing

This is a demonstration project. For production use, consider:
- Adding persistent storage
- Implementing user authentication
- Adding file encryption
- Implementing rate limiting
- Adding comprehensive logging

## 📄 License

MIT License - Feel free to use this code for your own projects!

## 🎯 Project Goals Achieved

- ✅ Fully functional file upload/download
- ✅ Professional user interface
- ✅ Real-time functionality
- ✅ Deployed on GitHub and Vercel
- ✅ Ready for LinkedIn showcase
- ✅ Automated deployment pipeline

---

**Built with ❤️ for modern web development**