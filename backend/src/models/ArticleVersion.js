const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ArticleVersion extends Model {
    static associate(models) {
      ArticleVersion.belongsTo(models.Article, {
        foreignKey: 'articleId',
        as: 'article',
        onDelete: 'CASCADE',
      });

      ArticleVersion.hasMany(models.Attachment, {
        foreignKey: 'articleVersionId',
        as: 'attachments',
        onDelete: 'CASCADE',
      });
    }
  }

  ArticleVersion.init(
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
      },
      version: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING(200),
        allowNull: false,
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
      modelName: 'ArticleVersion',
      tableName: 'article_versions',
      timestamps: true,
      underscored: false,
      indexes: [
        {
          fields: ['articleId', 'version'],
          unique: true,
        },
      ],
    }
  );

  return ArticleVersion;
};


