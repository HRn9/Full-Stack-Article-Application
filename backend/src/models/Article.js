const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Article extends Model {
    static associate(models) {
      // Define associations here
      Article.hasMany(models.Attachment, {
        foreignKey: 'articleId',
        as: 'attachments',
        onDelete: 'CASCADE',
      });
    }
  }

  Article.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING(200),
        allowNull: false,
        validate: {
          notEmpty: {
            msg: 'Title cannot be empty',
          },
          len: {
            args: [1, 200],
            msg: 'Title must be between 1 and 200 characters',
          },
        },
      },
      content: {
        type: DataTypes.JSONB,
        allowNull: false,
        comment: 'Quill Delta format content',
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
      modelName: 'Article',
      tableName: 'articles',
      timestamps: true,
      underscored: false,
    }
  );

  return Article;
};
