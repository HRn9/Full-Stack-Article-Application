import React from "react";
import type { Article } from "../types";
import QuillReadOnly from "./QuillReadOnly";

interface ArticleViewProps {
  article: Article;
  onBack: () => void;
}

const ArticleView: React.FC<ArticleViewProps> = ({ article, onBack }) => {
  return (
    <div className="article-view-container">
      <button onClick={onBack} className="btn-back">
        ← Back to Articles
      </button>
      <article className="article-content">
        <h1>{article.title}</h1>
        <div className="article-body">
          <QuillReadOnly delta={article.content} />
        </div>
      </article>
    </div>
  );
};

export default ArticleView;
