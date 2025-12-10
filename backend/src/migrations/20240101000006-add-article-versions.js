'use strict';

const { randomUUID } = require('crypto');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // If previous attempt failed, clean partial state to make migration rerunnable.
    await queryInterface.removeColumn('attachments', 'articleVersionId').catch(() => {});
    await queryInterface.removeColumn('articles', 'latestVersionId').catch(() => {});
    await queryInterface.removeColumn('articles', 'currentVersion').catch(() => {});
    await queryInterface.dropTable('article_versions').catch(() => {});
    await queryInterface.addIndex('attachments', ['filename'], {
      name: 'attachments_filename_idx',
      unique: true,
    }).catch(() => {});

    // 1) Create article_versions table
    await queryInterface.createTable('article_versions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      articleId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'articles',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      version: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      content: {
        type: Sequelize.JSONB,
        allowNull: false,
        comment: 'Quill Delta format content',
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        field: 'createdAt',
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        field: 'updatedAt',
      },
    });

    await queryInterface.addIndex('article_versions', ['articleId', 'version'], {
      name: 'article_versions_article_version_idx',
      unique: true,
    });

    // 2) Add tracking columns to articles
    await queryInterface.addColumn('articles', 'currentVersion', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1,
    });

    await queryInterface.addColumn('articles', 'latestVersionId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'article_versions',
        key: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addIndex('articles', ['latestVersionId'], {
      name: 'articles_latest_version_id_idx',
    });

    // 3) Add articleVersionId to attachments (nullable for migration)
    await queryInterface.addColumn('attachments', 'articleVersionId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'article_versions',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    // 4) Drop unique filename constraint to allow same file across versions
    await queryInterface.removeIndex('attachments', 'attachments_filename_idx').catch(
      () => {}
    );

    // 5) Backfill versions and link attachments
    const [articles] = await queryInterface.sequelize.query(
      'SELECT id, title, content, "createdAt", "updatedAt" FROM articles'
    );

    for (const article of articles) {
      let parsedContent = article.content;
      if (typeof parsedContent === 'string') {
        try {
          parsedContent = JSON.parse(parsedContent);
        } catch {
          parsedContent = { ops: [] };
        }
      }

      const versionId = randomUUID();
      await queryInterface.bulkInsert(
        'article_versions',
        [
          {
            id: versionId,
            articleId: article.id,
            version: 1,
            title: article.title,
            content: JSON.stringify(parsedContent),
            createdAt: article.createdAt,
            updatedAt: article.updatedAt,
          },
        ],
        {}
      );

      await queryInterface.sequelize.query(
        'UPDATE attachments SET "articleVersionId" = :versionId WHERE "articleId" = :articleId',
        { replacements: { versionId, articleId: article.id } }
      );

      await queryInterface.sequelize.query(
        'UPDATE articles SET "latestVersionId" = :versionId, "currentVersion" = 1 WHERE id = :articleId',
        { replacements: { versionId, articleId: article.id } }
      );
    }

    // 6) Make articleVersionId required after backfill
    await queryInterface.changeColumn('attachments', 'articleVersionId', {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'article_versions',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addIndex('attachments', ['articleVersionId'], {
      name: 'attachments_article_version_id_idx',
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove index
    await queryInterface.removeIndex('attachments', 'attachments_article_version_id_idx').catch(
      () => {}
    );

    // Allow null to drop column safely
    await queryInterface.changeColumn('attachments', 'articleVersionId', {
      type: Sequelize.UUID,
      allowNull: true,
    }).catch(() => {});

    await queryInterface.removeColumn('attachments', 'articleVersionId').catch(() => {});

    await queryInterface.removeIndex('articles', 'articles_latest_version_id_idx').catch(
      () => {}
    );
    await queryInterface.removeColumn('articles', 'latestVersionId').catch(() => {});
    await queryInterface.removeColumn('articles', 'currentVersion').catch(() => {});

    await queryInterface.dropTable('article_versions');

    // Restore unique index on filename
    await queryInterface.addIndex('attachments', ['filename'], {
      name: 'attachments_filename_idx',
      unique: true,
    });
  },
};

