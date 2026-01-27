"use client";

import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { cn } from "@/lib/utils";

interface IOSTextareaProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    required?: boolean;
    className?: string;
    readOnly?: boolean;
    colors?: {
        background?: string;
        text?: string;
        placeholder?: string;
        border?: string;
        focus?: string;
    };
}

export const IOSTextarea = ({
    value,
    onChange,
    placeholder,
    className,
    readOnly = false,
    colors = {
        background: 'bg-white/50 backdrop-blur-sm',
        text: 'text-gray-900',
        placeholder: 'text-gray-400',
        border: 'border-gray-200',
        focus: 'border-blue-500'
    }
}: IOSTextareaProps) => {
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
            Placeholder.configure({
                placeholder: placeholder || 'Write something...',
                emptyEditorClass: 'is-editor-empty',
            })
        ],
        content: value,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editable: !readOnly,
        editorProps: {
            attributes: {
                class: cn(
                    'prose prose-sm max-w-none focus:outline-none',
                    colors.text,
                    'min-h-[100px] w-full px-4 py-3 rounded-xl',
                    'transition-all duration-200 ease-in-out',
                    'placeholder:text-gray-400',
                    readOnly ? 'bg-gray-100/50 cursor-not-allowed' : 'focus:ring-2 focus:ring-blue-500/20',
                    className
                )
            }
        }
    });

    useEffect(() => {
        if (editor && value !== editor.getHTML()) {
            editor.commands.setContent(value);
        }
    }, [value, editor]);

    return (
        <div className={cn(
            'relative w-full rounded-xl',
            'transition-all duration-200 ease-in-out',
            colors.background,
            colors.border,
            'border-0 shadow-sm',
            'focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-white/50',
            'focus-within:ring-blue-500/50',
            className
        )}>
            <EditorContent editor={editor} />
            <style jsx global>{`
                .ProseMirror {
                    min-height: 100px;
                    padding: 0.75rem 1rem;
                    background: transparent;
                    border-radius: 0.75rem;
                    border: none;
                }
                
                .ProseMirror p {
                    margin: 0.5rem 0;
                }
                
                .ProseMirror h1 {
                    font-size: 1.5rem;
                    font-weight: 600;
                    margin: 1rem 0;
                    color: #1a1a1a;
                }
                
                .ProseMirror h2 {
                    font-size: 1.25rem;
                    font-weight: 600;
                    margin: 0.75rem 0;
                    color: #1a1a1a;
                }
                
                .ProseMirror h3 {
                    font-size: 1.125rem;
                    font-weight: 600;
                    margin: 0.5rem 0;
                    color: #1a1a1a;
                }
                
                .ProseMirror ul {
                    list-style-type: disc;
                    padding-left: 1.5rem;
                    margin: 0.5rem 0;
                }
                
                .ProseMirror ol {
                    list-style-type: decimal;
                    padding-left: 1.5rem;
                    margin: 0.5rem 0;
                }
                
                .ProseMirror li {
                    margin: 0.25rem 0;
                }
                
                .ProseMirror li::marker {
                    color: #666;
                }
                
                .ProseMirror blockquote {
                    border-left: 3px solid #e5e7eb;
                    padding-left: 1rem;
                    margin: 0.5rem 0;
                    color: #666;
                }
                
                .ProseMirror code {
                    background-color: #f3f4f6;
                    padding: 0.2rem 0.4rem;
                    border-radius: 0.25rem;
                    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
                    font-size: 0.875em;
                }
                
                .ProseMirror pre {
                    background-color: #f3f4f6;
                    padding: 1rem;
                    border-radius: 0.5rem;
                    margin: 0.5rem 0;
                    overflow-x: auto;
                }
                
                .ProseMirror pre code {
                    background-color: transparent;
                    padding: 0;
                    border-radius: 0;
                }
                
                .ProseMirror a {
                    color: #2563eb;
                    text-decoration: underline;
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
                    color: inherit;
                    opacity: 0.4;
                    pointer-events: none;
                    height: 0;
                }
            `}</style>
        </div>
    );
};