const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Comment extends Model {
    static associate(models) {
      Comment.belongsTo(models.Article, {
        foreignKey: 'articleId',
        as: 'article',
        onDelete: 'CASCADE',
      });
      Comment.belongsTo(models.User, {
        foreignKey: 'creatorId',
        as: 'creator',
        onDelete: 'SET NULL',
      });
    }
  }

  Comment.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      articleId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'articles',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      author: {
        type: DataTypes.STRING(100),
        allowNull: true,
        defaultValue: 'Anonymous',
        validate: {
          len: {
            args: [0, 100],
            msg: 'Author name must be 100 characters or less',
          },
        },
      },
      body: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notEmpty: {
            msg: 'Comment body cannot be empty',
          },
        },
      },
      creatorId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
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
      modelName: 'Comment',
      tableName: 'comments',
      timestamps: true,
      underscored: false,
    }
  );

  return Comment;
};

