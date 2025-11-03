const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = 5001;
const DATA_DIR = path.join(__dirname, 'data');

app.use(cors());
app.use(express.json({ limit: '10mb' }));

(async () => {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (err) {
    console.error('Error creating data directory:', err);
  }
})();

const validateArticle = (req, res, next) => {
  const { title, content } = req.body;

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return res.status(400).json({
      error: 'Title is required and must be a non-empty string',
    });
  }

  if (title.length > 200) {
    return res.status(400).json({
      error: 'Title must be 200 characters or less',
    });
  }

  const isDelta =
    content &&
    typeof content === 'object' &&
    Array.isArray(content.ops);

  if (!isDelta) {
    return res.status(400).json({
      error: 'Content must be a Quill Delta object',
    });
  }

  const hasContent = content.ops.some(
    (op) => typeof op.insert === 'string' && op.insert.trim().length > 0
  );

  if (!hasContent) {
    return res.status(400).json({
      error: 'Content cannot be empty',
    });
  }

  next();
};

app.get('/api/articles', async (req, res) => {
  try {
    const files = await fs.readdir(DATA_DIR);
    const articles = [];

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
            content: article.content,
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
    const { title, content } = req.body;
    const id = Date.now().toString(36) + Math.random().toString(36).substring(2);
    const filePath = path.join(DATA_DIR, `${id}.json`);

    const article = {
      id,
      title: title.trim(),
      content,
    };

    await fs.writeFile(filePath, JSON.stringify(article, null, 2));
    res.status(201).json(article);
  } catch (err) {
    console.error('Error creating article:', err);
    res.status(500).json({ error: 'Failed to create article' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
});