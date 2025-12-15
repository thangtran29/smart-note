'use client';

import { useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import EditorJS from '@editorjs/editorjs';
import Header from '@editorjs/header';
import List from '@editorjs/list';
import Code from '@editorjs/code';
import Quote from '@editorjs/quote';
import type { EditorJSContent } from '@/lib/notes/types';

interface NoteEditorProps {
  initialContent?: EditorJSContent | null;
  onChange?: (content: EditorJSContent) => void;
  readOnly?: boolean;
}

export interface NoteEditorRef {
  appendText: (text: string) => Promise<void>;
}

export const NoteEditor = forwardRef<NoteEditorRef, NoteEditorProps>(
  ({ initialContent, onChange, readOnly = false }, ref) => {
    const editorRef = useRef<EditorJS | null>(null);
    const holderRef = useRef<HTMLDivElement>(null);

    const handleChange = useCallback(async () => {
      if (editorRef.current && onChange) {
        const content = await editorRef.current.save();
        onChange(content as EditorJSContent);
      }
    }, [onChange]);

    const appendText = useCallback(async (text: string) => {
      if (!editorRef.current || readOnly) return;

      try {
        // Wait for editor to be ready
        await editorRef.current.isReady;

        // Get current blocks to determine insertion index
        const currentData = await editorRef.current.save();
        const currentBlocks = currentData.blocks || [];
        const insertIndex = currentBlocks.length;

        // Insert a new paragraph block at the end
        // EditorJS blocks.insert signature: insert(type, data, config)
        // config can have index property to specify where to insert
        await editorRef.current.blocks.insert('paragraph', {
          text: text,
        }, {
          index: insertIndex,
        });

        // Trigger onChange to save
        if (onChange) {
          // Small delay to ensure block is inserted
          setTimeout(async () => {
            if (editorRef.current) {
              const updatedData = await editorRef.current.save();
              onChange(updatedData as EditorJSContent);
            }
          }, 100);
        }
      } catch (error) {
        console.error('Failed to append text to editor:', error);
      }
    }, [readOnly, onChange]);

    useImperativeHandle(ref, () => ({
      appendText,
    }), [appendText]);

    useEffect(() => {
      if (editorRef.current || !holderRef.current) {
        return;
      }

      const editor = new EditorJS({
        holder: holderRef.current,
        tools: {
          header: {
            class: Header as unknown as EditorJS.ToolConstructable,
            config: {
              levels: [1, 2, 3],
              defaultLevel: 2,
            },
          },
          list: {
            class: List as unknown as EditorJS.ToolConstructable,
            inlineToolbar: true,
          },
          code: Code as unknown as EditorJS.ToolConstructable,
          quote: {
            class: Quote as unknown as EditorJS.ToolConstructable,
            inlineToolbar: true,
          },
        },
        data: initialContent ?? { time: 0, blocks: [], version: '2.28.0' },
        readOnly,
        onChange: handleChange,
        placeholder: 'Start writing your note...',
      });

      editorRef.current = editor;

      return () => {
        if (editorRef.current?.destroy) {
          editorRef.current.destroy();
          editorRef.current = null;
        }
      };
    }, [initialContent, readOnly, handleChange]);

    return (
      <div 
        ref={holderRef} 
        className="prose prose-sm sm:prose lg:prose-lg max-w-none min-h-[300px] border rounded-md p-4 bg-white dark:bg-gray-950"
      />
    );
  }
);

NoteEditor.displayName = 'NoteEditor';
