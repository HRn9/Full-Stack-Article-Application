const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const validateArticle = require('./validateArticle');
const multer = require('multer');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = 5001;
const DATA_DIR = path.join(__dirname, 'data');
const ATTACHMENTS_DIR = path.join(__dirname, 'attachments');

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/attachments', express.static(ATTACHMENTS_DIR));

const clients = new Set();

wss.on('connection', (ws) => {
  console.log('New WebSocket client connected');
  clients.add(ws);

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
    clients.delete(ws);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    clients.delete(ws);
  });
});

function broadcastNotification(notification) {
  const message = JSON.stringify(notification);
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

(async () => {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.mkdir(ATTACHMENTS_DIR, { recursive: true });
  } catch (err) {
    console.error('Error creating directories:', err);
  }
})();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, ATTACHMENTS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix =
      Date.now() + '-' + Math.random().toString(36).substring(2, 9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        'Invalid file type. Only images (JPG, PNG, GIF, WEBP) and PDFs are allowed.'
      )
    );
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

const isArticleExists = async (id) => {
  try {
    const filePath = path.join(DATA_DIR, `${id}.json`);
    await fs.access(filePath, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
};

const deleteAttachmentFiles = async (attachments) => {
  if (!attachments || !Array.isArray(attachments)) return;

  for (const attachment of attachments) {
    try {
      const filePath = path.join(ATTACHMENTS_DIR, attachment.filename);
      await fs.unlink(filePath);
    } catch (err) {
      console.error(`Error deleting attachment ${attachment.filename}:`, err);
    }
  }
};

app.get('/api/articles', async (req, res) => {
  try {
    const files = await fs.readdir(DATA_DIR);
    const articles = [];

    const getPreview = (content) =>
      content.ops
        .map((op) => (typeof op.insert === 'string' ? op.insert : ''))
        .join('')
        .slice(0, 150)
        .trim();

    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const id = file.replace('.json', '');
          const filePath = path.join(DATA_DIR, file);
          const data = await fs.readFile(filePath, 'utf-8');
          const article = JSON.parse(data);

          articles.push({
            id,
            title: article.title,
            preview: getPreview(article.content),
            attachmentCount: article.attachments
              ? article.attachments.length
              : 0,
          });
        } catch (fileErr) {
          console.error(`Error reading file ${file}:`, fileErr);
        }
      }
    }

    res.json(articles);
  } catch (err) {
    console.error('Error reading articles:', err);
    res.status(500).json({
      error: 'Failed to fetch articles',
      details: err.message,
    });
  }
});

app.get('/api/articles/:id', async (req, res) => {
  try {
    const filePath = path.join(DATA_DIR, `${req.params.id}.json`);
    const data = await fs.readFile(filePath, 'utf-8');
    const article = JSON.parse(data);

    res.json({
      id: article.id,
      title: article.title,
      content: article.content,
      attachments: article.attachments || [],
    });
  } catch (err) {
    if (err.code === 'ENOENT') {
      return res.status(404).json({ error: 'Article not found' });
    }
    console.error('Error reading article:', err);
    res.status(500).json({ error: 'Failed to fetch article' });
  }
});

app.post('/api/articles', validateArticle, async (req, res) => {
  try {
    const { title, content, attachments } = req.body;
    const id =
      Date.now().toString(36) + Math.random().toString(36).substring(2);
    const filePath = path.join(DATA_DIR, `${id}.json`);

    const article = {
      id,
      title: title.trim(),
      content,
      attachments: attachments || [],
    };

    await fs.writeFile(filePath, JSON.stringify(article, null, 2));

    broadcastNotification({
      type: 'article_created',
      articleId: id,
      title: article.title,
      message: `New article "${article.title}" has been created`,
      timestamp: new Date().toISOString(),
    });

    res.status(201).json(article);
  } catch (err) {
    console.error('Error creating article:', err);
    res.status(500).json({ error: 'Failed to create article' });
  }
});

app.put('/api/articles/:id', validateArticle, async (req, res) => {
  try {
    const id = req.params.id;
    const { title, content, attachments } = req.body;

    const exists = await isArticleExists(id);
    if (!exists) {
      return res.status(404).json({ error: 'Article not found' });
    }

    const filePath = path.join(DATA_DIR, `${id}.json`);
    const oldData = await fs.readFile(filePath, 'utf-8');
    const oldArticle = JSON.parse(oldData);
    const oldAttachments = oldArticle.attachments || [];

    const newAttachmentFilenames = (attachments || []).map((a) => a.filename);
    const removedAttachments = oldAttachments.filter(
      (a) => !newAttachmentFilenames.includes(a.filename)
    );

    await deleteAttachmentFiles(removedAttachments);

    const article = {
      id,
      title: title.trim(),
      content,
      attachments: attachments || [],
    };

    await fs.writeFile(filePath, JSON.stringify(article, null, 2));

    broadcastNotification({
      type: 'article_updated',
      articleId: id,
      title: article.title,
      message: `Article "${article.title}" has been updated`,
      timestamp: new Date().toISOString(),
    });

    res.json(article);
  } catch (err) {
    console.error('Error updating article:', err);
    res.status(500).json({ error: 'Failed to update article' });
  }
});

app.delete('/api/articles/:id', async (req, res) => {
  try {
    const id = req.params.id;

    const exists = await isArticleExists(id);
    if (!exists) {
      return res.status(404).json({ error: 'Article not found' });
    }

    const filePath = path.join(DATA_DIR, `${id}.json`);

    const data = await fs.readFile(filePath, 'utf-8');
    const article = JSON.parse(data);
    const articleTitle = article.title;

    await deleteAttachmentFiles(article.attachments);

    await fs.unlink(filePath);

    broadcastNotification({
      type: 'article_deleted',
      articleId: id,
      title: articleTitle,
      message: `Article "${articleTitle}" has been deleted`,
      timestamp: new Date().toISOString(),
    });

    res.status(204).send();
  } catch (err) {
    console.error('Error deleting article:', err);
    res.status(500).json({ error: 'Failed to delete article' });
  }
});

app.post('/api/upload', (req, res) => {
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

app.delete('/api/attachments/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(ATTACHMENTS_DIR, filename);

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


app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res
        .status(400)
        .json({ error: 'File size must be less than 10MB' });
    }
    return res.status(400).json({ error: err.message });
  }

  res.status(500).json({
    error: err.message || 'Internal server error',
  });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
  console.log(`WebSocket server running on ws://localhost:${PORT}`);
});
