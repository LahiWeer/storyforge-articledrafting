import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Upload, FileText, ClipboardPaste } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface TranscriptInputProps {
  transcript: string;
  onTranscriptChange: (transcript: string) => void;
}

export const TranscriptInput = ({ transcript, onTranscriptChange }: TranscriptInputProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = (file: File) => {
    if (!file.type.includes('text') && !file.name.endsWith('.txt')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a text file (.txt)",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      onTranscriptChange(content);
      toast({
        title: "Transcript uploaded",
        description: "Your transcript has been successfully loaded",
      });
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text.trim()) {
        onTranscriptChange(text);
        toast({
          title: "Transcript pasted",
          description: "Content has been pasted from clipboard",
        });
      }
    } catch (error) {
      toast({
        title: "Paste failed",
        description: "Could not access clipboard. Please paste manually.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <FileText className="w-16 h-16 text-primary mx-auto mb-4" />
        <h2 className="text-3xl font-heading font-semibold mb-2 text-foreground">
          Upload Your Interview Transcript
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Start by uploading your interview transcript or pasting it directly. This will be the 
          foundation for extracting key insights and crafting your story.
        </p>
      </div>

      {!transcript ? (
        <div className="grid md:grid-cols-2 gap-6">
          {/* File Upload */}
          <Card
            className={`p-8 border-2 border-dashed transition-all cursor-pointer hover:border-primary hover:bg-card-hover ${
              isDragging ? 'border-primary bg-card-hover' : 'border-border'
            }`}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onDragEnter={() => setIsDragging(true)}
            onDragLeave={() => setIsDragging(false)}
            onClick={() => document.getElementById('transcript-upload')?.click()}
          >
            <div className="text-center">
              <Upload className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Upload Transcript File</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Drag and drop your .txt file here or click to browse
              </p>
              <Button variant="outline" size="sm">
                Choose File
              </Button>
            </div>
            <input
              id="transcript-upload"
              type="file"
              accept=".txt,text/plain"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
              }}
            />
          </Card>

          {/* Paste from Clipboard */}
          <Card className="p-8 border-2 border-dashed border-border hover:border-primary hover:bg-card-hover transition-all">
            <div className="text-center">
              <ClipboardPaste className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Paste from Clipboard</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Have your transcript copied? Paste it directly here
              </p>
              <Button onClick={handlePaste} variant="outline" size="sm">
                Paste Content
              </Button>
            </div>
          </Card>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Your Transcript</h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onTranscriptChange('')}
              >
                Clear
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('transcript-upload')?.click()}
              >
                Replace
              </Button>
            </div>
          </div>
          
          <Textarea
            value={transcript}
            onChange={(e) => onTranscriptChange(e.target.value)}
            className="min-h-[400px] font-editorial text-base leading-relaxed"
            placeholder="Your transcript will appear here..."
          />
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{transcript.split(' ').length} words</span>
            <span>{transcript.length} characters</span>
          </div>

          <input
            id="transcript-upload"
            type="file"
            accept=".txt,text/plain"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
            }}
          />
        </div>
      )}
    </div>
  );
};