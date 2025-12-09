const express = require('express');
const articlesRouter = require('./articles');
const uploadRouter = require('./upload');
const workspacesRouter = require('./workspaces');

const router = express.Router();

router.use('/articles', articlesRouter);
router.use('/upload', uploadRouter);
router.use('/attachments', uploadRouter);
router.use('/workspaces', workspacesRouter);

module.exports = router;
