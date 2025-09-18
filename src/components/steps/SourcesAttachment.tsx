import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { FileText, Link, Video, Upload, X, AlertCircle, Type } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { simulateWebContentExtraction, processWebContentForFocus, extractFocusKeywords } from '@/utils/contentExtraction';

interface Source {
  id: string;
  type: 'pdf' | 'url' | 'youtube' | 'text';
  content: string;
  title: string;
}

interface SourcesAttachmentProps {
  sources: Source[];
  onSourcesChange: (sources: Source[]) => void;
  articleFocus?: string; // Optional article focus for content filtering
}

export const SourcesAttachment = ({ sources, onSourcesChange, articleFocus }: SourcesAttachmentProps) => {
  const [urlInput, setUrlInput] = useState('');
  const [textContent, setTextContent] = useState('');
  const [textTitle, setTextTitle] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const addSource = (source: Omit<Source, 'id'>) => {
    const newSource = {
      ...source,
      id: Date.now().toString(),
    };
    onSourcesChange([...sources, newSource]);
  };

  const removeSource = (id: string) => {
    onSourcesChange(sources.filter(s => s.id !== id));
  };

  const handleFileUpload = async (file: File) => {
    if (file.type !== 'application/pdf') {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF file",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    // Simulate PDF processing
    setTimeout(() => {
      addSource({
        type: 'pdf',
        title: file.name,
        content: `PDF content extracted from ${file.name}`,
      });
      setIsProcessing(false);
      toast({
        title: "PDF uploaded",
        description: "Source document has been processed",
      });
    }, 2000);
  };

  const handleUrlSubmit = async () => {
    if (!urlInput.trim()) return;

    setIsProcessing(true);
    
    const isYoutube = urlInput.includes('youtube.com') || urlInput.includes('youtu.be');
    
    // Simulate URL processing with focus-based content extraction
    setTimeout(() => {
      try {
        const hostname = new URL(urlInput).hostname;
        const title = `Source from ${hostname}`;
        
        // Extract raw web content
        const rawContent = simulateWebContentExtraction(urlInput);
        
        let processedContent = rawContent;
        let contentDescription = "Web content has been processed";
        
        // If article focus is provided, filter content based on focus keywords
        if (articleFocus && articleFocus.trim()) {
          const keywords = extractFocusKeywords(articleFocus);
          const { extractedSentences, summary } = processWebContentForFocus(
            rawContent, 
            title, 
            keywords, 
            5 // Minimum 5 sentences
          );
          
          // Use only the focus-relevant sentences
          processedContent = extractedSentences.map(s => s.text).join(' ');
          contentDescription = summary;
        }
        
        addSource({
          type: isYoutube ? 'youtube' : 'url',
          title,
          content: processedContent,
        });
        
        setUrlInput('');
        setIsProcessing(false);
        
        toast({
          title: "Source added",
          description: contentDescription,
        });
      } catch (error) {
        console.error('Error processing URL:', error);
        // Fallback to basic processing
        addSource({
          type: isYoutube ? 'youtube' : 'url',
          title: `Source from URL`,
          content: simulateWebContentExtraction(urlInput),
        });
        
        setUrlInput('');
        setIsProcessing(false);
        
        toast({
          title: "Source added",
          description: "Web content has been processed",
        });
      }
    }, 1500);
  };

  const handleTextSubmit = () => {
    if (!textContent.trim() || !textTitle.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide both a title and content",
        variant: "destructive",
      });
      return;
    }

    addSource({
      type: 'text',
      title: textTitle.trim(),
      content: textContent.trim(),
    });

    setTextContent('');
    setTextTitle('');
    
    toast({
      title: "Content added",
      description: "Text source has been saved",
    });
  };

  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <FileText className="w-4 h-4" />;
      case 'youtube':
        return <Video className="w-4 h-4" />;
      case 'text':
        return <Type className="w-4 h-4" />;
      default:
        return <Link className="w-4 h-4" />;
    }
  };

  const getSourceBadgeColor = (type: string) => {
    switch (type) {
      case 'pdf':
        return 'bg-destructive/10 text-destructive hover:bg-destructive/20';
      case 'youtube':
        return 'bg-warning/10 text-warning hover:bg-warning/20';
      case 'text':
        return 'bg-secondary/10 text-secondary-foreground hover:bg-secondary/20';
      default:
        return 'bg-primary/10 text-primary hover:bg-primary/20';
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center w-16 h-16 bg-secondary rounded-full mx-auto mb-4">
          <Upload className="w-8 h-8 text-secondary-foreground" />
        </div>
        <h2 className="text-3xl font-heading font-semibold mb-2 text-foreground">
          Attach Supporting Sources
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Add multiple supporting documents, references, or paste content directly. 
          {articleFocus && (
            <span className="block mt-2 text-sm text-primary font-medium">
              Content will be filtered to match your article focus for maximum relevance.
            </span>
          )}
        </p>
      </div>

      {sources.length === 0 && (
        <Card className="p-6 border-warning/20 bg-warning/5">
          <div className="flex items-center gap-2 text-warning">
            <AlertCircle className="w-5 h-5" />
            <p className="font-medium">At least one supporting source is required to proceed</p>
          </div>
        </Card>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {/* PDF Upload */}
        <Card className="p-6">
          <div className="text-center">
            <FileText className="w-12 h-12 text-primary mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Upload PDF Document</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Research papers, brochures, reports, or any supporting PDF
            </p>
            <Button
              variant="outline"
              onClick={() => document.getElementById('pdf-upload')?.click()}
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Choose PDF'}
            </Button>
          </div>
          <input
            id="pdf-upload"
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
            }}
          />
        </Card>

        {/* URL Input */}
        <Card className="p-6">
          <div className="text-center mb-4">
            <Link className="w-12 h-12 text-primary mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Add Web Source</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Articles, YouTube videos, or any web-based reference
            </p>
          </div>
          <div className="flex gap-2">
            <Input
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://example.com/article"
              onKeyPress={(e) => e.key === 'Enter' && handleUrlSubmit()}
            />
            <Button
              onClick={handleUrlSubmit}
              disabled={!urlInput.trim() || isProcessing}
            >
              {isProcessing ? 'Adding...' : 'Add'}
            </Button>
          </div>
        </Card>

        {/* Text Content Paste */}
        <Card className="p-6">
          <div className="text-center mb-4">
            <Type className="w-12 h-12 text-primary mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Paste Content</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Copy and paste text from any source directly
            </p>
          </div>
          <div className="space-y-3">
            <Input
              value={textTitle}
              onChange={(e) => setTextTitle(e.target.value)}
              placeholder="Source title or description"
            />
            <Textarea
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              placeholder="Paste your content here..."
              className="min-h-[100px] resize-none"
            />
            <Button
              onClick={handleTextSubmit}
              disabled={!textContent.trim() || !textTitle.trim()}
              className="w-full"
            >
              Add Content
            </Button>
          </div>
        </Card>
      </div>

      {/* Sources List */}
      {sources.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Your Sources ({sources.length})</h3>
          <div className="grid gap-3">
            {sources.map((source) => (
              <Card key={source.id} className="p-4 hover:bg-card-hover transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getSourceIcon(source.type)}
                    <div>
                      <h4 className="font-medium">{source.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {source.type.toUpperCase()} • Ready for analysis
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getSourceBadgeColor(source.type)}>
                      {source.type}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSource(source.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};