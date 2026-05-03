const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { GridFSBucket, ObjectId } = require('mongodb');
const upload = require('../config/gridfs');
const { protect } = require('../middleware/authMiddleware');

let gfsBucket;

// Initialize GridFS bucket when MongoDB connects
mongoose.connection.on('connected', () => {
  gfsBucket = new GridFSBucket(mongoose.connection.db, {
    bucketName: 'rentcare_files'
  });
});

// POST /api/files/upload
router.post('/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    if (!gfsBucket) {
      return res.status(500).json({ message: 'GridFS not ready' });
    }

    const filename = `${Date.now()}-${req.file.originalname}`;
    const fileId = new ObjectId();

    // Upload file buffer to GridFS with custom ID
    const uploadStream = gfsBucket.openUploadStreamWithId(
      fileId,
      filename,
      {
        metadata: {
          originalName: req.file.originalname,
          mimeType: req.file.mimetype,
          uploadDate: new Date(),
        }
      }
    );

    uploadStream.on('finish', () => {
      res.status(201).json({
        message: 'File uploaded successfully',
        fileId: fileId.toString(),
        filename: filename,
        originalName: req.file.originalname
      });
    });

    uploadStream.on('error', (err) => {
      res.status(500).json({ message: 'Upload failed', error: err.message });
    });

    uploadStream.end(req.file.buffer);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/files/:id
router.get('/:id', protect, async (req, res) => {
  try {
    if (!gfsBucket) {
      return res.status(500).json({ message: 'GridFS not initialized' });
    }

    const fileId = new mongoose.Types.ObjectId(req.params.id);
    
    // Check if file exists
    const files = await mongoose.connection.db.collection('rentcare_files.files').findOne({ _id: fileId });
    
    if (!files) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Set content type and download headers
    res.set('Content-Type', files.metadata?.mimeType || 'application/octet-stream');
    res.set('Content-Disposition', `attachment; filename="${files.filename}"`);

    const downloadStream = gfsBucket.openDownloadStream(fileId);
    
    downloadStream.on('error', (err) => {
      return res.status(404).json({ message: 'Error downloading file', error: err.message });
    });

    downloadStream.pipe(res);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// DELETE /api/files/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    if (!gfsBucket) {
      return res.status(500).json({ message: 'GridFS not initialized' });
    }

    const fileId = new mongoose.Types.ObjectId(req.params.id);
    await gfsBucket.delete(fileId);
    
    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;