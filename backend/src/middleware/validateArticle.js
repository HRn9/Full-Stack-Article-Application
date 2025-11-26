module.exports = (req, res, next) => {
  const { title, content } = req.body;

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return res
      .status(400)
      .json({ error: 'Title is required and must be a non-empty string' });
  }

  if (title.length > 200) {
    return res
      .status(400)
      .json({ error: 'Title must be 200 characters or less' });
  }

  const isDelta =
    content && typeof content === 'object' && Array.isArray(content.ops);

  if (!isDelta) {
    return res
      .status(400)
      .json({ error: 'Content must be a Quill Delta object' });
  }

  const hasContent = content.ops.some(
    (op) => typeof op.insert === 'string' && op.insert.trim().length > 0
  );

  if (!hasContent) {
    return res.status(400).json({ error: 'Content cannot be empty' });
  }

  next();
};
