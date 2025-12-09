const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Workspace extends Model {
    static associate(models) {
      Workspace.hasMany(models.Article, {
        foreignKey: 'workspaceId',
        as: 'articles',
        onDelete: 'CASCADE',
      });
    }
  }

  Workspace.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING(150),
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: {
            msg: 'Workspace name cannot be empty',
          },
          len: {
            args: [1, 150],
            msg: 'Workspace name must be between 1 and 150 characters',
          },
        },
      },
      description: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'createdAt',
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'updatedAt',
      },
    },
    {
      sequelize,
      modelName: 'Workspace',
      tableName: 'workspaces',
      timestamps: true,
      underscored: false,
    }
  );

  return Workspace;
};

