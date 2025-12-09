const express = require('express');
const validateArticle = require('../middleware/validateArticle');
const websocketManager = require('../websocket');
const { deleteAttachmentFiles, getPreview } = require('../utils/fileUtils');
const {
  Article,
  Attachment,
  Workspace,
  Comment,
  sequelize,
} = require('../models');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { workspaceId } = req.query;
    const where = workspaceId ? { workspaceId } : {};

    const articles = await Article.findAll({
      where,
      include: [
        {
          model: Attachment,
          as: 'attachments',
          attributes: ['id'],
        },
        {
          model: Comment,
          as: 'comments',
          attributes: ['id'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    const payload = articles.map((article) => ({
      id: article.id,
      title: article.title,
      preview: getPreview(article.content),
      attachmentCount: article.attachments ? article.attachments.length : 0,
      commentCount: article.comments ? article.comments.length : 0,
      workspaceId: article.workspaceId,
    }));

    res.json(payload);
  } catch (err) {
    console.error('Error reading articles:', err);
    res.status(500).json({
      error: 'Failed to fetch articles',
      details: err.message,
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const article = await Article.findByPk(req.params.id, {
      include: [
        {
          model: Attachment,
          as: 'attachments',
        },
        {
          model: Comment,
          as: 'comments',
          separate: true,
          order: [['createdAt', 'DESC']],
        },
        {
          model: Workspace,
          as: 'workspace',
          attributes: ['id', 'name', 'description'],
        },
      ],
    });

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    res.json(article);
  } catch (err) {
    console.error('Error reading article:', err);
    res.status(500).json({ error: 'Failed to fetch article' });
  }
});

router.post('/', validateArticle, async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { title, content, attachments, workspaceId } = req.body;

    if (!workspaceId) {
      await transaction.rollback();
      return res
        .status(400)
        .json({ error: 'Workspace ID is required to create an article' });
    }

    const workspace = await Workspace.findByPk(workspaceId, { transaction });
    if (!workspace) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Workspace not found' });
    }

    const article = await Article.create(
      { title: title.trim(), content, workspaceId },
      { transaction }
    );

    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      const attachmentsToCreate = attachments.map((attachment) => ({
        filename: attachment.filename,
        originalName: attachment.originalName,
        mimetype: attachment.mimetype,
        size: attachment.size,
        url: attachment.url,
        articleId: article.id,
      }));

      await Attachment.bulkCreate(attachmentsToCreate, { transaction });
    }

    const createdArticle = await Article.findByPk(article.id, {
      include: [
        { model: Attachment, as: 'attachments' },
        {
          model: Comment,
          as: 'comments',
          separate: true,
          order: [['createdAt', 'DESC']],
        },
        { model: Workspace, as: 'workspace', attributes: ['id', 'name'] },
      ],
      transaction,
    });

    await transaction.commit();

    websocketManager.broadcastNotification({
      type: 'article_created',
      articleId: article.id,
      title: article.title,
      workspaceId: workspace.id,
      workspaceName: workspace.name,
      message: `New article "${article.title}" has been created in "${workspace.name}"`,
      timestamp: new Date().toISOString(),
    });

    res.status(201).json(createdArticle);
  } catch (err) {
    await transaction.rollback();
    console.error('Error creating article:', err);
    res.status(500).json({ error: 'Failed to create article' });
  }
});

router.put('/:id', validateArticle, async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const id = req.params.id;
    const { title, content, attachments, workspaceId } = req.body;

    const article = await Article.findByPk(id, {
      include: [{ model: Attachment, as: 'attachments' }],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!article) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Article not found' });
    }

    if (workspaceId) {
      const workspace = await Workspace.findByPk(workspaceId, { transaction });
      if (!workspace) {
        await transaction.rollback();
        return res.status(400).json({ error: 'Workspace not found' });
      }
      article.workspaceId = workspaceId;
    }

    article.title = title.trim();
    article.content = content;
    await article.save({ transaction });

    const incomingAttachments = Array.isArray(attachments) ? attachments : [];
    const incomingFilenames = new Set(
      incomingAttachments.map((a) => a.filename)
    );
    const existingAttachments = article.attachments || [];

    const attachmentsToRemove = existingAttachments.filter(
      (attachment) => !incomingFilenames.has(attachment.filename)
    );

    if (attachmentsToRemove.length > 0) {
      await Attachment.destroy({
        where: {
          id: attachmentsToRemove.map((a) => a.id),
        },
        transaction,
      });
    }

    const existingFilenames = new Set(
      existingAttachments.map((a) => a.filename)
    );
    const newAttachments = incomingAttachments.filter(
      (attachment) => !existingFilenames.has(attachment.filename)
    );

    if (newAttachments.length > 0) {
      const attachmentsToCreate = newAttachments.map((attachment) => ({
        filename: attachment.filename,
        originalName: attachment.originalName,
        mimetype: attachment.mimetype,
        size: attachment.size,
        url: attachment.url,
        articleId: article.id,
      }));

      await Attachment.bulkCreate(attachmentsToCreate, { transaction });
    }

    await transaction.commit();

    await deleteAttachmentFiles(attachmentsToRemove);

    const updatedArticle = await Article.findByPk(id, {
      include: [
        { model: Attachment, as: 'attachments' },
        {
          model: Comment,
          as: 'comments',
          separate: true,
          order: [['createdAt', 'DESC']],
        },
        { model: Workspace, as: 'workspace', attributes: ['id', 'name'] },
      ],
    });

    websocketManager.broadcastNotification({
      type: 'article_updated',
      articleId: id,
      title: updatedArticle.title,
      workspaceId: updatedArticle.workspaceId,
      workspaceName: updatedArticle.workspace?.name,
      message: `Article "${updatedArticle.title}" has been updated`,
      timestamp: new Date().toISOString(),
    });

    res.json(updatedArticle);
  } catch (err) {
    await transaction.rollback();
    console.error('Error updating article:', err);
    res.status(500).json({ error: 'Failed to update article' });
  }
});

router.delete('/:id', async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const id = req.params.id;

    const article = await Article.findByPk(id, {
      include: [
        { model: Attachment, as: 'attachments' },
        { model: Workspace, as: 'workspace', attributes: ['id', 'name'] },
      ],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!article) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Article not found' });
    }

    const attachments = article.attachments || [];
    const articleTitle = article.title;

    await Comment.destroy({ where: { articleId: id }, transaction });
    await Attachment.destroy({ where: { articleId: id }, transaction });
    await article.destroy({ transaction });

    await transaction.commit();

    await deleteAttachmentFiles(attachments);

    websocketManager.broadcastNotification({
      type: 'article_deleted',
      articleId: id,
      title: articleTitle,
      workspaceId: article.workspaceId,
      workspaceName: article.workspace?.name,
      message: `Article "${articleTitle}" has been deleted`,
      timestamp: new Date().toISOString(),
    });

    res.status(204).send();
  } catch (err) {
    await transaction.rollback();
    console.error('Error deleting article:', err);
    res.status(500).json({ error: 'Failed to delete article' });
  }
});

router.get('/:id/comments', async (req, res) => {
  try {
    const article = await Article.findByPk(req.params.id);
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    const comments = await Comment.findAll({
      where: { articleId: req.params.id },
      order: [['createdAt', 'DESC']],
    });

    res.json(comments);
  } catch (err) {
    console.error('Error fetching comments:', err);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

router.post('/:id/comments', async (req, res) => {
  try {
    const article = await Article.findByPk(req.params.id);
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    const { author, body } = req.body;
    if (!body || !body.trim()) {
      return res.status(400).json({ error: 'Comment body is required' });
    }

    const comment = await Comment.create({
      articleId: req.params.id,
      author: author?.trim() || 'Anonymous',
      body: body.trim(),
    });

    res.status(201).json(comment);
  } catch (err) {
    console.error('Error creating comment:', err);
    res.status(500).json({ error: 'Failed to create comment' });
  }
});

router.put('/:id/comments/:commentId', async (req, res) => {
  try {
    const { id, commentId } = req.params;
    const { author, body } = req.body;

    if (body !== undefined && (!body || !body.trim())) {
      return res.status(400).json({ error: 'Comment body cannot be empty' });
    }

    const comment = await Comment.findOne({
      where: { id: commentId, articleId: id },
    });

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (author !== undefined) {
      comment.author = author?.trim() || 'Anonymous';
    }

    if (body !== undefined) {
      comment.body = body.trim();
    }

    await comment.save();

    res.json(comment);
  } catch (err) {
    console.error('Error updating comment:', err);
    res.status(500).json({ error: 'Failed to update comment' });
  }
});

router.delete('/:id/comments/:commentId', async (req, res) => {
  try {
    const { id, commentId } = req.params;

    const deleted = await Comment.destroy({
      where: { id: commentId, articleId: id },
    });

    if (!deleted) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    res.status(204).send();
  } catch (err) {
    console.error('Error deleting comment:', err);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

module.exports = router;
