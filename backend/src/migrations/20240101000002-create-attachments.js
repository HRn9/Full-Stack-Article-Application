'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('attachments', {
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
      filename: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Unique filename stored on disk',
      },
      originalName: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Original filename from upload',
      },
      mimetype: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      size: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      url: {
        type: Sequelize.STRING(500),
        allowNull: false,
        comment: 'URL path to access the file',
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

    // Add indexes for better query performance
    await queryInterface.addIndex('attachments', ['articleId'], {
      name: 'attachments_article_id_idx',
    });

    await queryInterface.addIndex('attachments', ['filename'], {
      name: 'attachments_filename_idx',
      unique: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('attachments');
  },
};
