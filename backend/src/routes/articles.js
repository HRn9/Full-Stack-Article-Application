const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const config = require('../config');
const validateArticle = require('../middleware/validateArticle');
const websocketManager = require('../websocket');
const {
  isArticleExists,
  deleteAttachmentFiles,
  getPreview,
} = require('../utils/fileUtils');

const router = express.Router();

/**
 * GET /api/articles
 * List all articles with preview
 */
router.get('/', async (req, res) => {
  try {
    const files = await fs.readdir(config.DATA_DIR);
    const articles = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const id = file.replace('.json', '');
          const filePath = path.join(config.DATA_DIR, file);
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

/**
 * GET /api/articles/:id
 * Get a single article by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const filePath = path.join(config.DATA_DIR, `${req.params.id}.json`);
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

/**
 * POST /api/articles
 * Create a new article
 */
router.post('/', validateArticle, async (req, res) => {
  try {
    const { title, content, attachments } = req.body;
    const id =
      Date.now().toString(36) + Math.random().toString(36).substring(2);
    const filePath = path.join(config.DATA_DIR, `${id}.json`);

    const article = {
      id,
      title: title.trim(),
      content,
      attachments: attachments || [],
    };

    await fs.writeFile(filePath, JSON.stringify(article, null, 2));

    websocketManager.broadcastNotification({
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

/**
 * PUT /api/articles/:id
 * Update an existing article
 */
router.put('/:id', validateArticle, async (req, res) => {
  try {
    const id = req.params.id;
    const { title, content, attachments } = req.body;

    const exists = await isArticleExists(id);
    if (!exists) {
      return res.status(404).json({ error: 'Article not found' });
    }

    const filePath = path.join(config.DATA_DIR, `${id}.json`);
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

    websocketManager.broadcastNotification({
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

/**
 * DELETE /api/articles/:id
 * Delete an article
 */
router.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id;

    const exists = await isArticleExists(id);
    if (!exists) {
      return res.status(404).json({ error: 'Article not found' });
    }

    const filePath = path.join(config.DATA_DIR, `${id}.json`);

    const data = await fs.readFile(filePath, 'utf-8');
    const article = JSON.parse(data);
    const articleTitle = article.title;

    await deleteAttachmentFiles(article.attachments);

    await fs.unlink(filePath);

    websocketManager.broadcastNotification({
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

module.exports = router;
