const multer = require('multer');
const path = require('path');

// Set up storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Directory to save the uploaded files
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Save file with a unique name
  }
});

// Configure multer
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // Limit file size to 10MB
});

// Export the upload middleware
module.exports = upload;
