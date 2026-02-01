const express = require('express');
const articlesRouter = require('./articles');
const uploadRouter = require('./upload');
const workspacesRouter = require('./workspaces');
const authRouter = require('./auth');
const usersRouter = require('./users');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.use('/auth', authRouter);

// Protected routes
router.use(authMiddleware);
router.use('/articles', articlesRouter);
router.use('/upload', uploadRouter);
router.use('/attachments', uploadRouter);
router.use('/workspaces', workspacesRouter);
router.use('/users', usersRouter);

module.exports = router;
