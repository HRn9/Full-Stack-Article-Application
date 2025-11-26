const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const multer = require('multer');
const config = require('../config');
const upload = require('../middleware/upload');

const router = express.Router();

/**
 * POST /api/upload
 * Upload a file attachment
 */
router.post('/', (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      console.error('Upload error:', err);
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res
            .status(400)
            .json({ error: 'File size must be less than 10MB' });
        }
        return res.status(400).json({ error: err.message });
      }
      return res.status(400).json({ error: err.message });
    }

    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const fileInfo = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        url: `/attachments/${req.file.filename}`,
      };

      res.status(201).json(fileInfo);
    } catch (error) {
      console.error('Error uploading file:', error);
      res.status(500).json({ error: 'Failed to upload file' });
    }
  });
});

/**
 * DELETE /api/attachments/:filename
 * Delete an attachment file
 */
router.delete('/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(config.ATTACHMENTS_DIR, filename);

    await fs.unlink(filePath);
    res.status(204).send();
  } catch (err) {
    if (err.code === 'ENOENT') {
      return res.status(404).json({ error: 'Attachment not found' });
    }
    console.error('Error deleting attachment:', err);
    res.status(500).json({ error: 'Failed to delete attachment' });
  }
});

module.exports = router;
