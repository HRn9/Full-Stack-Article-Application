const express = require('express');
const { Workspace, Article, Attachment } = require('../models');
const { deleteAttachmentFiles } = require('../utils/fileUtils');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const workspaces = await Workspace.findAll({
      include: [
        {
          model: Article,
          as: 'articles',
          attributes: ['id'],
        },
      ],
      order: [['createdAt', 'ASC']],
    });

    const payload = workspaces.map((workspace) => ({
      id: workspace.id,
      name: workspace.name,
      description: workspace.description,
      createdAt: workspace.createdAt,
      updatedAt: workspace.updatedAt,
      articleCount: workspace.articles ? workspace.articles.length : 0,
    }));

    res.json(payload);
  } catch (err) {
    console.error('Error fetching workspaces:', err);
    res.status(500).json({ error: 'Failed to fetch workspaces' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const workspace = await Workspace.findByPk(req.params.id);
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }
    res.json(workspace);
  } catch (err) {
    console.error('Error fetching workspace:', err);
    res.status(500).json({ error: 'Failed to fetch workspace' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Workspace name is required' });
    }

    const workspace = await Workspace.create({
      name: name.trim(),
      description: description?.trim() || null,
    });

    res.status(201).json(workspace);
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'Workspace name already exists' });
    }
    console.error('Error creating workspace:', err);
    res.status(500).json({ error: 'Failed to create workspace' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, description } = req.body;
    const workspace = await Workspace.findByPk(req.params.id);

    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    if (name !== undefined) {
      if (!name || !name.trim()) {
        return res
          .status(400)
          .json({ error: 'Workspace name cannot be empty' });
      }
      workspace.name = name.trim();
    }

    if (description !== undefined) {
      workspace.description = description?.trim() || null;
    }

    await workspace.save();
    res.json(workspace);
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'Workspace name already exists' });
    }
    console.error('Error updating workspace:', err);
    res.status(500).json({ error: 'Failed to update workspace' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const workspace = await Workspace.findByPk(req.params.id, {
      include: [
        {
          model: Article,
          as: 'articles',
          include: [{ model: Attachment, as: 'attachments' }],
        },
      ],
    });

    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    const attachments =
      workspace.articles?.flatMap((article) => article.attachments || []) || [];

    await workspace.destroy();
    await deleteAttachmentFiles(attachments);
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting workspace:', err);
    res.status(500).json({ error: 'Failed to delete workspace' });
  }
});

module.exports = router;

