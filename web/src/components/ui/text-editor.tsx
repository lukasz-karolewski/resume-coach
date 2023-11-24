"use client";

import React, { useState } from "react";

interface TextEditorProps {
  children: React.ReactNode;
  onSave: (newValue: string) => void;
}

const TextEditor: React.FC<TextEditorProps> = ({ onSave, children }) => {
  const [text, setText] = useState(children?.toString() ?? "");

  const handleSave = () => {
    onSave(text);
  };

  return (
    <div className="border text-justify text-sm">
      <textarea value={text} onChange={(e) => setText(e.target.value)} />
      <button onClick={handleSave}>Save</button>
    </div>
  );
};

export default TextEditor;
