const express = require('express');
const validateArticle = require('../middleware/validateArticle');
const websocketManager = require('../websocket');
const { deleteAttachmentFiles, getPreview } = require('../utils/fileUtils');
const {
  Article,
  Attachment,
  Workspace,
  Comment,
  ArticleVersion,
  sequelize,
} = require('../models');
const { Op } = require('sequelize');
const router = express.Router();

// Middleware to check if user can edit an article
async function canEditArticle(req, res, next) {
  try {
    const articleId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Admins can edit any article
    if (userRole === 'admin') {
      return next();
    }

    // Check if user is the creator of the article
    const article = await Article.findByPk(articleId, {
      attributes: ['id', 'creatorId'],
    });

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    if (article.creatorId !== userId) {
      return res
        .status(403)
        .json({ error: 'You can only edit articles you created' });
    }

    next();
  } catch (err) {
    console.error('Error checking article permissions:', err);
    res.status(500).json({ error: 'Failed to check permissions' });
  }
}

// Middleware to check if user can edit a comment
async function canEditComment(req, res, next) {
  try {
    const { id, commentId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Admins can edit any comment
    if (userRole === 'admin') {
      return next();
    }

    // Check if user is the creator of the comment
    const comment = await Comment.findOne({
      where: { id: commentId, articleId: id },
      attributes: ['id', 'creatorId'],
    });

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (comment.creatorId !== userId) {
      return res
        .status(403)
        .json({ error: 'You can only edit comments you created' });
    }

    next();
  } catch (err) {
    console.error('Error checking comment permissions:', err);
    res.status(500).json({ error: 'Failed to check permissions' });
  }
}

// Middleware to check if user can delete a comment
async function canDeleteComment(req, res, next) {
  try {
    const { id, commentId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Admins can delete any comment
    if (userRole === 'admin') {
      return next();
    }

    // Check if user is the creator of the comment
    const comment = await Comment.findOne({
      where: { id: commentId, articleId: id },
      attributes: ['id', 'creatorId'],
    });

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (comment.creatorId !== userId) {
      return res
        .status(403)
        .json({ error: 'You can only delete comments you created' });
    }

    next();
  } catch (err) {
    console.error('Error checking comment permissions:', err);
    res.status(500).json({ error: 'Failed to check permissions' });
  }
}

router.get('/', async (req, res) => {
  try {
    const { workspaceId, search } = req.query;
    const where = workspaceId ? { workspaceId } : {};

    // Build search conditions
    let searchWhere = {};
    let replacements = {};
    if (search && search.trim()) {
      const searchPattern = `%${search.trim().toLowerCase()}%`;
      searchWhere = {
        [Op.or]: [
          sequelize.literal(
            `LOWER("latestVersion"."title"::text) LIKE :search`
          ),
          sequelize.literal(
            `LOWER("latestVersion"."content"::text) LIKE :search`
          ),
        ],
      };
      replacements = { search: searchPattern };
    }

    const articles = await Article.findAll({
      where: { ...where, ...searchWhere },
      include: [
        {
          model: ArticleVersion,
          as: 'latestVersion',
          include: [
            {
              model: Attachment,
              as: 'attachments',
              attributes: ['id'],
            },
          ],
        },
        {
          model: Comment,
          as: 'comments',
          attributes: ['id'],
        },
        {
          model: require('../models').User,
          as: 'creator',
          attributes: ['id', 'email', 'role'],
        },
      ],
      order: [['createdAt', 'DESC']],
      replacements,
    });

    const payload = articles.map((article) => ({
      id: article.id,
      title: article.latestVersion?.title || article.title,
      preview: getPreview(article.latestVersion?.content || article.content),
      attachmentCount: article.latestVersion?.attachments
        ? article.latestVersion.attachments.length
        : 0,
      commentCount: article.comments ? article.comments.length : 0,
      workspaceId: article.workspaceId,
      currentVersion: article.currentVersion,
      creator: article.creator,
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
          model: ArticleVersion,
          as: 'latestVersion',
          include: [{ model: Attachment, as: 'attachments' }],
        },
        {
          model: ArticleVersion,
          as: 'versions',
          attributes: ['id', 'version', 'title', 'createdAt', 'updatedAt'],
          separate: true,
          order: [['version', 'DESC']],
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
        {
          model: require('../models').User,
          as: 'creator',
          attributes: ['id', 'email', 'role'],
        },
      ],
    });

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    res.json({
      id: article.id,
      workspaceId: article.workspaceId,
      currentVersion: article.currentVersion,
      latestVersionId: article.latestVersionId,
      latestVersion: article.latestVersion,
      versions: article.versions,
      comments: article.comments,
      workspace: article.workspace,
      creator: article.creator,
    });
  } catch (err) {
    console.error('Error reading article:', err);
    res.status(500).json({ error: 'Failed to fetch article' });
  }
});

router.post('/', validateArticle, async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { title, content, attachments, workspaceId } = req.body;
    const userId = req.user.id;

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
      {
        title: title.trim(),
        content,
        workspaceId,
        currentVersion: 1,
        creatorId: userId,
      },
      { transaction }
    );

    const version = await ArticleVersion.create(
      {
        articleId: article.id,
        version: 1,
        title: title.trim(),
        content,
      },
      { transaction }
    );

    article.latestVersionId = version.id;
    await article.save({ transaction });

    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      const attachmentsToCreate = attachments.map((attachment) => ({
        filename: attachment.filename,
        originalName: attachment.originalName,
        mimetype: attachment.mimetype,
        size: attachment.size,
        url: attachment.url,
        articleId: article.id,
        articleVersionId: version.id,
      }));

      await Attachment.bulkCreate(attachmentsToCreate, { transaction });
    }

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

    const createdArticle = await Article.findByPk(article.id, {
      include: [
        {
          model: ArticleVersion,
          as: 'latestVersion',
          include: [{ model: Attachment, as: 'attachments' }],
        },
        { model: Workspace, as: 'workspace', attributes: ['id', 'name'] },
      ],
    });

    res.status(201).json({
      id: createdArticle.id,
      workspaceId: createdArticle.workspaceId,
      currentVersion: createdArticle.currentVersion,
      latestVersion: createdArticle.latestVersion,
      workspace: createdArticle.workspace,
    });
  } catch (err) {
    await transaction.rollback();
    console.error('Error creating article:', err);
    res.status(500).json({ error: 'Failed to create article' });
  }
});

router.put('/:id', validateArticle, canEditArticle, async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const id = req.params.id;
    const { title, content, attachments, workspaceId } = req.body;

    const article = await Article.findByPk(id, {
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

    const newVersionNumber = (article.currentVersion || 1) + 1;

    const version = await ArticleVersion.create(
      {
        articleId: article.id,
        version: newVersionNumber,
        title: title.trim(),
        content,
      },
      { transaction }
    );

    const incomingAttachments = Array.isArray(attachments) ? attachments : [];

    if (incomingAttachments.length > 0) {
      const attachmentsToCreate = incomingAttachments.map((attachment) => ({
        filename: attachment.filename,
        originalName: attachment.originalName,
        mimetype: attachment.mimetype,
        size: attachment.size,
        url: attachment.url,
        articleId: article.id,
        articleVersionId: version.id,
      }));

      await Attachment.bulkCreate(attachmentsToCreate, { transaction });
    }

    article.title = title.trim();
    article.content = content;
    article.currentVersion = newVersionNumber;
    article.latestVersionId = version.id;
    await article.save({ transaction });

    await transaction.commit();

    const updatedArticle = await Article.findByPk(id, {
      include: [
        {
          model: ArticleVersion,
          as: 'latestVersion',
          include: [{ model: Attachment, as: 'attachments' }],
        },
        { model: Workspace, as: 'workspace', attributes: ['id', 'name'] },
      ],
    });

    websocketManager.broadcastNotification({
      type: 'article_updated',
      articleId: id,
      title: updatedArticle.latestVersion?.title || updatedArticle.title,
      workspaceId: updatedArticle.workspaceId,
      workspaceName: updatedArticle.workspace?.name,
      message: `Article "${updatedArticle.latestVersion?.title || updatedArticle.title}" has been updated`,
      timestamp: new Date().toISOString(),
    });

    res.json({
      id: updatedArticle.id,
      workspaceId: updatedArticle.workspaceId,
      currentVersion: updatedArticle.currentVersion,
      latestVersion: updatedArticle.latestVersion,
      workspace: updatedArticle.workspace,
    });
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
        {
          model: ArticleVersion,
          as: 'versions',
          include: [{ model: Attachment, as: 'attachments' }],
        },
        { model: Workspace, as: 'workspace', attributes: ['id', 'name'] },
      ],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!article) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Article not found' });
    }

    const attachments =
      article.versions?.flatMap((v) => v.attachments || []) || [];
    const articleTitle = article.title;

    await Comment.destroy({ where: { articleId: id }, transaction });
    await Attachment.destroy({ where: { articleId: id }, transaction });
    await ArticleVersion.destroy({ where: { articleId: id }, transaction });
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

router.get('/:id/versions/:version', async (req, res) => {
  try {
    const article = await Article.findByPk(req.params.id, {
      include: [
        { model: Workspace, as: 'workspace', attributes: ['id', 'name'] },
      ],
    });

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    const versionNumber = parseInt(req.params.version, 10);
    if (Number.isNaN(versionNumber)) {
      return res.status(400).json({ error: 'Invalid version number' });
    }

    const version = await ArticleVersion.findOne({
      where: { articleId: article.id, version: versionNumber },
      include: [{ model: Attachment, as: 'attachments' }],
      order: [['version', 'DESC']],
    });

    if (!version) {
      return res.status(404).json({ error: 'Version not found' });
    }

    res.json({
      id: article.id,
      workspaceId: article.workspaceId,
      version: version.version,
      latestVersion: article.currentVersion,
      isLatest: version.version === article.currentVersion,
      title: version.title,
      content: version.content,
      attachments: version.attachments || [],
      workspace: article.workspace,
    });
  } catch (err) {
    console.error('Error fetching article version:', err);
    res.status(500).json({ error: 'Failed to fetch article version' });
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
      include: [
        {
          model: require('../models').User,
          as: 'creator',
          attributes: ['id', 'email', 'role'],
        },
      ],
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
      creatorId: req.user.id,
    });

    res.status(201).json(comment);
  } catch (err) {
    console.error('Error creating comment:', err);
    res.status(500).json({ error: 'Failed to create comment' });
  }
});

router.put('/:id/comments/:commentId', canEditComment, async (req, res) => {
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

router.delete(
  '/:id/comments/:commentId',
  canDeleteComment,
  async (req, res) => {
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
  }
);

module.exports = router;
