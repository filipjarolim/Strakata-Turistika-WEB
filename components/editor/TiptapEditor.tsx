import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useState } from 'react';
import { Loader2, Save } from 'lucide-react';

interface TiptapEditorProps {
  content: string;
  isEditable: boolean;
  onSave: (content: string) => Promise<void>;
}

const TiptapEditor: React.FC<TiptapEditorProps> = ({ content, isEditable, onSave }) => {
  const [isSaving, setIsSaving] = useState(false);

  const editor = useEditor({
    extensions: [StarterKit],
    content: content,
    editable: isEditable,
  });

  const handleSave = async () => {
    if (!editor) return;
    
    setIsSaving(true);
    try {
      await onSave(editor.getHTML());
    } catch (error) {
      console.error('Error saving content:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!editor) {
    return null;
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <EditorContent editor={editor} />
      </Card>
      {isEditable && (
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Ukládání...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Uložit
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default TiptapEditor; 