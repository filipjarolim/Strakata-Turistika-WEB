"use client";

import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { cn } from "@/lib/utils";
import { 
  Bold, 
  Italic, 
  Strikethrough, 
  Code, 
  Heading1, 
  Heading2, 
  Heading3, 
  List, 
  ListOrdered, 
  Quote, 
  Undo, 
  Redo,
  Link as LinkIcon,
  Unlink
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  readOnly?: boolean;
}

export const RichTextEditor = ({
  value,
  onChange,
  placeholder = "Začněte psát...",
  required,
  className,
  readOnly = false,
}: RichTextEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          HTMLAttributes: {
            class: 'list-disc pl-6 space-y-1'
          }
        },
        orderedList: {
          HTMLAttributes: {
            class: 'list-decimal pl-6 space-y-1'
          }
        },
        heading: {
          levels: [1, 2, 3],
          HTMLAttributes: {
            class: 'font-semibold'
          }
        },
        paragraph: {
          HTMLAttributes: {
            class: 'mb-2'
          }
        }
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline hover:text-blue-800',
        },
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editable: !readOnly,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm max-w-none focus:outline-none',
          'min-h-[200px] w-full px-4 py-3 rounded-lg',
          'transition-all duration-200 ease-in-out',
          readOnly ? 'bg-gray-50 cursor-not-allowed' : 'bg-white',
          className
        ),
        'data-placeholder': placeholder,
      }
    }
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  if (!editor) {
    return null;
  }

  const ToolbarButton = ({ 
    onClick, 
    isActive = false, 
    children, 
    title 
  }: { 
    onClick: () => void; 
    isActive?: boolean; 
    children: React.ReactNode; 
    title: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        'p-2 rounded-md transition-colors',
        'hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500',
        isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900'
      )}
    >
      {children}
    </button>
  );

  return (
    <div className={cn(
      'relative w-full border border-gray-200 rounded-lg overflow-hidden',
      'focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500',
      readOnly && 'bg-gray-50'
    )}>
      {/* Toolbar */}
      {!readOnly && (
        <div className="flex items-center gap-1 p-2 border-b border-gray-200 bg-gray-50">
          {/* Text Formatting */}
          <div className="flex items-center gap-1">
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              isActive={editor.isActive('bold')}
              title="Tučné (Ctrl+B)"
            >
              <Bold className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              isActive={editor.isActive('italic')}
              title="Kurzíva (Ctrl+I)"
            >
              <Italic className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleStrike().run()}
              isActive={editor.isActive('strike')}
              title="Přeškrtnuté"
            >
              <Strikethrough className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleCode().run()}
              isActive={editor.isActive('code')}
              title="Kód"
            >
              <Code className="w-4 h-4" />
            </ToolbarButton>
          </div>

          <div className="w-px h-6 bg-gray-300 mx-2" />

          {/* Headings */}
          <div className="flex items-center gap-1">
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              isActive={editor.isActive('heading', { level: 1 })}
              title="Nadpis 1"
            >
              <Heading1 className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              isActive={editor.isActive('heading', { level: 2 })}
              title="Nadpis 2"
            >
              <Heading2 className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              isActive={editor.isActive('heading', { level: 3 })}
              title="Nadpis 3"
            >
              <Heading3 className="w-4 h-4" />
            </ToolbarButton>
          </div>

          <div className="w-px h-6 bg-gray-300 mx-2" />

          {/* Lists */}
          <div className="flex items-center gap-1">
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              isActive={editor.isActive('bulletList')}
              title="Odrážkový seznam"
            >
              <List className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              isActive={editor.isActive('orderedList')}
              title="Číslovaný seznam"
            >
              <ListOrdered className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              isActive={editor.isActive('blockquote')}
              title="Citace"
            >
              <Quote className="w-4 h-4" />
            </ToolbarButton>
          </div>

          <div className="w-px h-6 bg-gray-300 mx-2" />

          {/* Links */}
          <div className="flex items-center gap-1">
            <ToolbarButton
              onClick={() => {
                const url = window.prompt('Zadejte URL:');
                if (url) {
                  editor.chain().focus().setLink({ href: url }).run();
                }
              }}
              isActive={editor.isActive('link')}
              title="Přidat odkaz"
            >
              <LinkIcon className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().unsetLink().run()}
              isActive={editor.isActive('link')}
              title="Odstranit odkaz"
            >
              <Unlink className="w-4 h-4" />
            </ToolbarButton>
          </div>

          <div className="flex-1" />

          {/* Undo/Redo */}
          <div className="flex items-center gap-1">
            <ToolbarButton
              onClick={() => editor.chain().focus().undo().run()}
              title="Zpět (Ctrl+Z)"
            >
              <Undo className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().redo().run()}
              title="Znovu (Ctrl+Y)"
            >
              <Redo className="w-4 h-4" />
            </ToolbarButton>
          </div>
        </div>
      )}

      {/* Editor Content */}
      <EditorContent editor={editor} />
      
      <style jsx global>{`
        .ProseMirror {
          min-height: 200px;
          padding: 1rem;
          background: white;
          border: none;
          outline: none;
        }
        
        .ProseMirror p {
          margin: 0.5rem 0;
          line-height: 1.6;
        }
        
        .ProseMirror h1 {
          font-size: 1.875rem;
          font-weight: 700;
          margin: 1.5rem 0 1rem 0;
          color: #1f2937;
          line-height: 1.2;
        }
        
        .ProseMirror h2 {
          font-size: 1.5rem;
          font-weight: 600;
          margin: 1.25rem 0 0.75rem 0;
          color: #1f2937;
          line-height: 1.3;
        }
        
        .ProseMirror h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin: 1rem 0 0.5rem 0;
          color: #1f2937;
          line-height: 1.4;
        }
        
        .ProseMirror ul {
          list-style-type: disc;
          padding-left: 1.5rem;
          margin: 0.75rem 0;
        }
        
        .ProseMirror ol {
          list-style-type: decimal;
          padding-left: 1.5rem;
          margin: 0.75rem 0;
        }
        
        .ProseMirror li {
          margin: 0.25rem 0;
          line-height: 1.5;
        }
        
        .ProseMirror blockquote {
          border-left: 4px solid #e5e7eb;
          padding-left: 1rem;
          margin: 1rem 0;
          color: #6b7280;
          font-style: italic;
          background: #f9fafb;
          padding: 0.75rem 1rem;
          border-radius: 0.375rem;
        }
        
        .ProseMirror code {
          background-color: #f3f4f6;
          padding: 0.125rem 0.25rem;
          border-radius: 0.25rem;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 0.875em;
          color: #dc2626;
        }
        
        .ProseMirror pre {
          background-color: #1f2937;
          color: #f9fafb;
          padding: 1rem;
          border-radius: 0.5rem;
          margin: 1rem 0;
          overflow-x: auto;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        }
        
        .ProseMirror pre code {
          background-color: transparent;
          padding: 0;
          border-radius: 0;
          color: inherit;
        }
        
        .ProseMirror a {
          color: #2563eb;
          text-decoration: underline;
          font-weight: 500;
        }
        
        .ProseMirror a:hover {
          color: #1d4ed8;
        }
        
        .ProseMirror:focus {
          outline: none;
        }
        
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #9ca3af;
          pointer-events: none;
          height: 0;
        }
        
        .ProseMirror strong {
          font-weight: 600;
        }
        
        .ProseMirror em {
          font-style: italic;
        }
        
        .ProseMirror s {
          text-decoration: line-through;
        }
      `}</style>
    </div>
  );
};
