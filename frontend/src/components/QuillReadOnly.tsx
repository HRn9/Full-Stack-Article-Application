import React, { useEffect, useRef } from 'react';
import Quill, { Delta } from 'quill';
import 'quill/dist/quill.bubble.css';

interface QuillReadOnlyProps {
  delta: Delta;
}

const QuillReadOnly: React.FC<QuillReadOnlyProps> = ({ delta }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (!quillRef.current) {
      quillRef.current = new Quill(container, {
        readOnly: true,
        theme: 'bubble',
      });
    }

    if (quillRef.current) {
      quillRef.current.setContents(delta);
    }

    return () => {
      if (quillRef.current && container) {
        container.innerHTML = '';
        quillRef.current = null;
      }
    };
  }, [delta]);

  return <div ref={containerRef} />;
};

export default QuillReadOnly;
