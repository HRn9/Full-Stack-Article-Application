const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const fontDir = path.join(__dirname, 'fonts'); // Папка с твоими шрифтами
const fontRegular = path.join(fontDir, 'Roboto-VariableFont_wdth,wght.ttf');
const fontItalic  = path.join(fontDir, 'Roboto-Italic-VariableFont_wdth,wght.ttf');

function deltaToPlainText(delta) {
  if (!delta || !delta.ops) return '';
  
  return delta.ops.map(op => {
    if (typeof op.insert === 'string') return op.insert;
    if (typeof op.insert === 'object' && op.insert.image) return '[Image]';
    return '';
  }).join('');
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function generateArticlePDF(article, options = {}) {
  const {
    includeMetadata = true,
    includeAttachments = true,
    includeComments = true,
    includeContent = true
  } = options;

  return new Promise((resolve, reject) => {
    try {
      const outputDir = path.join(__dirname, '../../temp');
      if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const safeTitle = article.title.replace(/[^a-z0-9а-яё]/gi, '-').toLowerCase();
      const filename = `article-${safeTitle}-${timestamp}.pdf`;
      const filePath = path.join(outputDir, filename);

      const doc = new PDFDocument({ size: 'A4', margin: 50, autoFirstPage: false });
      doc.addPage();

      doc.registerFont('Roboto', fontRegular);
      doc.registerFont('Roboto-Italic', fontItalic);
      doc.registerFont('Roboto-Bold', fontRegular);

      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);

      doc.info.Title = article.title;
      doc.info.Author = article.creator?.email || 'Unknown';
      doc.info.Subject = 'Article Export';
      doc.info.CreationDate = new Date();

      doc.font('Roboto-Bold')
         .fontSize(24)
         .fillColor('#000000')
         .text(article.title, { align: 'center' });

      doc.moveDown(0.5);

      if (includeMetadata) {
        doc.font('Roboto')
           .fontSize(11)
           .fillColor('#666666');

        const metadataLines = [];

        if (article.creator) metadataLines.push(`Author: ${article.creator.email}`);
        if (article.workspace) metadataLines.push(`Workspace: ${article.workspace.name}`);
        if (article.currentVersion) metadataLines.push(`Version: ${article.currentVersion}`);
        if (article.createdAt) {
          const date = new Date(article.createdAt);
          metadataLines.push(`Created: ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`);
        }
        if (article.updatedAt) {
          const date = new Date(article.updatedAt);
          metadataLines.push(`Last Updated: ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`);
        }

        if (metadataLines.length > 0) {
          doc.text(metadataLines.join(' | '), { align: 'center' });
          doc.moveDown(1);
        }

        doc.moveTo(50, doc.y)
           .lineTo(545, doc.y)
           .strokeColor('#cccccc')
           .stroke();
        doc.moveDown(1);
      }

      if (includeContent && article.content) {
        doc.font('Roboto')
           .fontSize(12)
           .fillColor('#000000');

        const contentText = deltaToPlainText(article.content);
        if (contentText.trim()) {
          doc.text(contentText, { align: 'left', lineGap: 5 });
          doc.moveDown(1);
        }
      }

      if (includeAttachments && article.attachments?.length > 0) {
        doc.font('Roboto-Bold')
           .fontSize(14)
           .fillColor('#000000')
           .text('Attachments:', { underline: true });
        doc.moveDown(0.5);

        doc.font('Roboto')
           .fontSize(11)
           .fillColor('#000000');

        article.attachments.forEach((att, i) => {
          doc.text(`${i + 1}. ${att.originalName} (${att.mimetype}) - ${formatFileSize(att.size)}`, { indent: 10 });
        });
        doc.moveDown(1);
      }

      if (includeComments && article.comments?.length > 0) {
        doc.font('Roboto-Bold')
           .fontSize(14)
           .fillColor('#000000')
           .text('Comments:', { underline: true });
        doc.moveDown(0.5);

        article.comments.forEach((comment, i) => {
          const date = new Date(comment.createdAt);
          const author = comment.author || comment.creator?.email || 'Anonymous';

          doc.font('Roboto-Bold')
             .fontSize(11)
             .fillColor('#333333')
             .text(`Comment ${i + 1} - ${author} (${date.toLocaleDateString()}):`);

          doc.font('Roboto-Italic')
             .fontSize(11)
             .fillColor('#000000')
             .text(deltaToPlainText(comment.body), { indent: 15, lineGap: 3 });

          doc.moveDown(0.5);
        });
      }

      doc.end();

      writeStream.on('finish', () => resolve(filePath));
      writeStream.on('error', err => reject(err));

    } catch (error) {
      reject(error);
    }
  });
}

module.exports = {
  generateArticlePDF,
  deltaToPlainText,
  formatFileSize
};