const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Attachment extends Model {
    static associate(models) {
      Attachment.belongsTo(models.Article, {
        foreignKey: 'articleId',
        as: 'article',
        onDelete: 'CASCADE',
      });

      Attachment.belongsTo(models.ArticleVersion, {
        foreignKey: 'articleVersionId',
        as: 'articleVersion',
        onDelete: 'CASCADE',
      });
    }
  }

  Attachment.init(
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
      filename: {
        type: DataTypes.STRING(255),
        allowNull: false,
        comment: 'Unique filename stored on disk',
      },
      articleVersionId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'article_versions',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      originalName: {
        type: DataTypes.STRING(255),
        allowNull: false,
        comment: 'Original filename from upload',
      },
      mimetype: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
          isIn: {
            args: [[
              'image/jpeg',
              'image/jpg',
              'image/png',
              'image/gif',
              'image/webp',
              'application/pdf',
            ]],
            msg: 'Invalid file type',
          },
        },
      },
      size: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 0,
          max: 10485760, // 10MB in bytes
        },
      },
      url: {
        type: DataTypes.STRING(500),
        allowNull: false,
        comment: 'URL path to access the file',
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
      modelName: 'Attachment',
      tableName: 'attachments',
      timestamps: true,
      underscored: false,
      indexes: [
        {
          fields: ['articleId'],
        },
        {
          fields: ['articleVersionId'],
        },
      ],
    }
  );

  return Attachment;
};
