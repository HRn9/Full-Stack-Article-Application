const fs = require('fs').promises;
const path = require('path');
const config = require('../config');

/**
 * Check if an article exists by ID
 * @param {string} id - Article ID
 * @returns {Promise<boolean>}
 */
async function isArticleExists(id) {
  try {
    const filePath = path.join(config.DATA_DIR, `${id}.json`);
    await fs.access(filePath, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Delete attachment files from disk
 * @param {Array} attachments - Array of attachment objects
 */
async function deleteAttachmentFiles(attachments) {
  if (!attachments || !Array.isArray(attachments)) return;

  for (const attachment of attachments) {
    try {
      const filePath = path.join(config.ATTACHMENTS_DIR, attachment.filename);
      await fs.unlink(filePath);
      console.log(`Deleted attachment: ${attachment.filename}`);
    } catch (err) {
      console.error(`Error deleting attachment ${attachment.filename}:`, err);
    }
  }
}

/**
 * Get a preview text from article content
 * @param {Object} content - Quill Delta content
 * @returns {string}
 */
function getPreview(content) {
  return content.ops
    .map((op) => (typeof op.insert === 'string' ? op.insert : ''))
    .join('')
    .slice(0, 150)
    .trim();
}

/**
 * Initialize required directories
 */
async function initializeDirectories() {
  try {
    await fs.mkdir(config.DATA_DIR, { recursive: true });
    await fs.mkdir(config.ATTACHMENTS_DIR, { recursive: true });
    console.log('Directories initialized successfully');
  } catch (err) {
    console.error('Error creating directories:', err);
    throw err;
  }
}

module.exports = {
  isArticleExists,
  deleteAttachmentFiles,
  getPreview,
  initializeDirectories,
};
