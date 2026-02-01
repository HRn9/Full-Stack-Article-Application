'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('articles', 'workspaceId', {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'workspaces',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    await queryInterface.addIndex('articles', ['workspaceId'], {
      name: 'articles_workspace_id_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('articles', 'workspaceId');
  },
};

