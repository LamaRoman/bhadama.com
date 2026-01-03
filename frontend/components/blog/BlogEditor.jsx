"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { useState, useEffect, memo } from "react";
import {
  Bold, Italic, List, ListOrdered, Quote, 
  Heading2, Heading3, Undo, Redo, Loader2
} from "lucide-react";

// Memoized Toolbar Button
const ToolbarButton = memo(({ onClick, isActive, disabled, children, title }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`p-2 rounded-md transition-colors ${
      isActive 
        ? "bg-blue-100 text-blue-700" 
        : "text-gray-600 hover:bg-gray-100"
    } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
  >
    {children}
  </button>
));

ToolbarButton.displayName = "ToolbarButton";

// Simple Toolbar - Memoized
const EditorToolbar = memo(({ editor }) => {
  if (!editor) return null;

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-200 bg-gray-50">
      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="Undo"
      >
        <Undo className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="Redo"
      >
        <Redo className="w-4 h-4" />
      </ToolbarButton>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive("heading", { level: 2 })}
        title="Heading 2"
      >
        <Heading2 className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        isActive={editor.isActive("heading", { level: 3 })}
        title="Heading 3"
      >
        <Heading3 className="w-4 h-4" />
      </ToolbarButton>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive("bold")}
        title="Bold"
      >
        <Bold className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive("italic")}
        title="Italic"
      >
        <Italic className="w-4 h-4" />
      </ToolbarButton>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive("bulletList")}
        title="Bullet List"
      >
        <List className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive("orderedList")}
        title="Numbered List"
      >
        <ListOrdered className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive("blockquote")}
        title="Quote"
      >
        <Quote className="w-4 h-4" />
      </ToolbarButton>
    </div>
  );
});

EditorToolbar.displayName = "EditorToolbar";

export default function BlogEditor({ 
  content = "", 
  onChange, 
  placeholder = "Start writing your blog post..."
}) {
  const [wordCount, setWordCount] = useState(0);
  const [isReady, setIsReady] = useState(false);

  // Initialize editor with minimal extensions
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        // Disable heavy extensions
        dropcursor: false,
        gapcursor: false,
      }),
      Placeholder.configure({ placeholder }),
    ],
    content,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none min-h-[300px] p-4",
      },
    },
    onUpdate: ({ editor }) => {
      const text = editor.getText();
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      setWordCount(words);
      
      if (onChange) {
        onChange(editor.getHTML(), words);
      }
    },
    onCreate: () => {
      setIsReady(true);
    },
  });

  // Set initial content only once
  useEffect(() => {
    if (editor && content && !editor.getText().trim()) {
      editor.commands.setContent(content);
      const text = editor.getText();
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      setWordCount(words);
    }
  }, [editor, content]);

  // Loading state
  if (!editor || !isReady) {
    return (
      <div className="border border-gray-200 rounded-lg p-8 bg-gray-50">
        <div className="flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
          <span className="text-gray-500">Loading editor...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      {/* Toolbar */}
      <EditorToolbar editor={editor} />

      {/* Editor Content */}
      <EditorContent editor={editor} />

      {/* Footer */}
      <div className="border-t border-gray-200 bg-gray-50 px-4 py-2 flex items-center justify-between">
        <span className="text-sm text-gray-600">
          <strong>{wordCount}</strong> words
        </span>
        {wordCount < 500 ? (
          <span className="text-sm text-amber-600">
            Need {500 - wordCount} more words
          </span>
        ) : (
          <span className="text-sm text-green-600">✓ Ready</span>
        )}
      </div>
    </div>
  );
}