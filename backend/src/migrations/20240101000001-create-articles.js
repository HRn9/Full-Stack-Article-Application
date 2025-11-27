'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('articles', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
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

    await queryInterface.addIndex('articles', ['createdAt'], {
      name: 'articles_created_at_idx',
    });

    await queryInterface.addIndex('articles', ['updatedAt'], {
      name: 'articles_updated_at_idx',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('articles');
  },
};
