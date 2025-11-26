const express = require('express');
const articlesRouter = require('./articles');
const uploadRouter = require('./upload');

const router = express.Router();

router.use('/articles', articlesRouter);
router.use('/upload', uploadRouter);
router.use('/attachments', uploadRouter);

module.exports = router;
