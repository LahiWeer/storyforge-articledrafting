import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { 
  Download, 
  Eye, 
  Search, 
  CheckCircle, 
  AlertTriangle, 
  Quote,
  FileText,
  Share
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface StoryData {
  transcript: string;
  sources: Array<{
    id: string;
    type: 'pdf' | 'url' | 'youtube' | 'text';
    content: string;
    title: string;
  }>;
  keyPoints: Array<{
    id: string;
    text: string;
    source: string;
    status: 'VERIFIED' | 'UNVERIFIED' | 'NEEDS REVIEW';
    type: 'transcript' | 'source';
  }>;
  storyDirection: {
    tone: string;
    angle: string;
    length: string;
    customPrompt?: string;
  };
  draft: string;
  sourceMapping: Record<string, string[]>;
  headline?: string; // Added headline field
}

interface ReviewExportProps {
  storyData: StoryData;
  onDataUpdate: (updates: Partial<StoryData>) => void;
}

export const ReviewExport = ({ storyData, onDataUpdate }: ReviewExportProps) => {
  const [selectedQuote, setSelectedQuote] = useState<string>('');
  const [isCheckingQuotes, setIsCheckingQuotes] = useState(false);
  const [quoteResults, setQuoteResults] = useState<Array<{
    quote: string;
    source: string;
    verified: boolean;
    snippet: string;
  }>>([]);
  const { toast } = useToast();

  const runQuoteChecker = async () => {
    setIsCheckingQuotes(true);
    
    // Simulate quote checking
    setTimeout(() => {
      const mockResults = [
        {
          quote: "user feedback in product development",
          source: storyData.sources[0]?.title || "Source 1",
          verified: true,
          snippet: "The importance of user feedback in product development cannot be overstated..."
        },
        {
          quote: "78% increase in customer satisfaction",
          source: storyData.sources[0]?.title || "Source 1", 
          verified: false,
          snippet: "Customer satisfaction metrics showed significant improvement..."
        },
      ];
      
      setQuoteResults(mockResults);
      setIsCheckingQuotes(false);
      
      toast({
        title: "Quote verification complete",
        description: `${mockResults.filter(r => r.verified).length} of ${mockResults.length} quotes verified`,
      });
    }, 2000);
  };

  const exportAsMarkdown = () => {
    const headline = storyData.headline ? `# ${storyData.headline}\n\n` : '';
    const markdown = `${headline}${storyData.draft}

---

## Source References

${storyData.sources.map((source, index) => 
  `${index + 1}. **${source.title}** (${source.type.toUpperCase()})`
).join('\n')}

## Key Points Reference

${storyData.keyPoints.map((point, index) => 
  `${index + 1}. ${point.text} ${point.status === 'VERIFIED' ? '✓' : '⚠️'}`
).join('\n')}

---

*Generated with Story Generator • ${new Date().toLocaleDateString()}*`;

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'story-draft.md';
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Export successful",
      description: "Your article has been downloaded as a Markdown file",
    });
  };

  const exportWithProvenance = () => {
    const provenance = {
      headline: storyData.headline,
      article: storyData.draft,
      metadata: {
        generated: new Date().toISOString(),
        tone: storyData.storyDirection.tone,
        angle: storyData.storyDirection.angle,
        length: storyData.storyDirection.length,
        wordCount: storyData.draft.split(' ').length,
      },
      sources: storyData.sources,
      keyPoints: storyData.keyPoints,
      sourceMapping: storyData.sourceMapping,
      quoteVerification: quoteResults,
    };

    const blob = new Blob([JSON.stringify(provenance, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'story-provenance.json';
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Provenance exported",
      description: "Source mapping and verification data saved",
    });
  };

  const getVerificationStats = () => {
    const totalQuotes = quoteResults.length;
    const verifiedQuotes = quoteResults.filter(r => r.verified).length;
    const unverifiedKeyPoints = storyData.keyPoints.filter(kp => kp.status !== 'VERIFIED').length;
    
    return { totalQuotes, verifiedQuotes, unverifiedKeyPoints };
  };

  const stats = getVerificationStats();

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
        <h2 className="text-3xl font-heading font-semibold mb-2 text-foreground">
          Review & Export
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Verify your sources, check quotes for accuracy, and export your final article 
          with full provenance documentation.
        </p>
      </div>

      {/* Verification Dashboard */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <Eye className="w-8 h-8 text-primary mx-auto mb-2" />
          <h3 className="font-semibold mb-1">Source Coverage</h3>
          <p className="text-2xl font-bold text-primary">
            {storyData.sources.length}
          </p>
          <p className="text-xs text-muted-foreground">References attached</p>
        </Card>
        
        <Card className="p-4 text-center">
          <Quote className="w-8 h-8 text-warning mx-auto mb-2" />
          <h3 className="font-semibold mb-1">Quote Verification</h3>
          <p className="text-2xl font-bold text-warning">
            {stats.verifiedQuotes}/{stats.totalQuotes || 'Not run'}
          </p>
          <p className="text-xs text-muted-foreground">Quotes verified</p>
        </Card>
        
        <Card className="p-4 text-center">
          <AlertTriangle className="w-8 h-8 text-destructive mx-auto mb-2" />
          <h3 className="font-semibold mb-1">Unverified Points</h3>
          <p className="text-2xl font-bold text-destructive">
            {stats.unverifiedKeyPoints}
          </p>
          <p className="text-xs text-muted-foreground">Need attention</p>
        </Card>
      </div>

      {/* Quote Checker */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-primary" />
            <h3 className="text-xl font-semibold">Quote Checker</h3>
          </div>
          <Button
            onClick={runQuoteChecker}
            disabled={isCheckingQuotes}
            className="flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            {isCheckingQuotes ? 'Checking...' : 'Run Quote Check'}
          </Button>
        </div>
        
        <p className="text-muted-foreground mb-4">
          Verify that quotes and specific claims in your article can be found in your sources
        </p>

        {quoteResults.length > 0 && (
          <div className="space-y-3">
            {quoteResults.map((result, index) => (
              <div key={index} className={`p-4 rounded-lg border ${
                result.verified 
                  ? 'bg-success/5 border-success/20' 
                  : 'bg-warning/5 border-warning/20'
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {result.verified ? (
                        <CheckCircle className="w-4 h-4 text-success" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-warning" />
                      )}
                      <span className={`text-sm font-medium ${
                        result.verified ? 'text-success' : 'text-warning'
                      }`}>
                        {result.verified ? 'VERIFIED' : 'NEEDS REVIEW'}
                      </span>
                    </div>
                    <p className="font-medium mb-1">"{result.quote}"</p>
                    <p className="text-sm text-muted-foreground mb-2">
                      Source: {result.source}
                    </p>
                    <p className="text-sm bg-background p-2 rounded border-l-4 border-l-muted">
                      {result.snippet}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Headline Editor */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <h3 className="text-xl font-semibold">Article Headline</h3>
          </div>
          <Badge variant="secondary" className="text-xs">
            Generated by Claude 4 Sonnet
          </Badge>
        </div>
        
        <div className="space-y-2">
          <label htmlFor="headline" className="text-sm font-medium text-muted-foreground">
            Edit your AI-generated headline to perfectly capture your story
          </label>
          <Textarea
            id="headline"
            value={storyData.headline || 'No headline generated'}
            onChange={(e) => onDataUpdate({ headline: e.target.value })}
            className="text-lg font-heading font-semibold min-h-[80px] resize-none"
            placeholder="Enter your article headline here..."
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Keep it under 80 characters for optimal readability</span>
            <span className={`${(storyData.headline || '').length > 80 ? 'text-warning' : ''}`}>
              {(storyData.headline || '').length}/80 characters
            </span>
          </div>
        </div>
      </Card>

      {/* Final Article Preview */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">Final Article</h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{storyData.draft.split(' ').length} words</span>
            <Separator orientation="vertical" className="h-4" />
            <span>{Math.ceil(storyData.draft.split(' ').length / 200)} min read</span>
          </div>
        </div>
        
        <Textarea
          value={storyData.draft}
          onChange={(e) => onDataUpdate({ draft: e.target.value })}
          className="min-h-[300px] font-editorial text-base leading-relaxed"
        />
      </Card>

      {/* Export Options */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">Export Options</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <Button
            onClick={exportAsMarkdown}
            className="flex items-center gap-2 h-auto p-4 justify-start"
            variant="outline"
          >
            <FileText className="w-5 h-5" />
            <div className="text-left">
              <p className="font-medium">Download Markdown</p>
              <p className="text-xs text-muted-foreground">
                Article with source references
              </p>
            </div>
          </Button>
          
          <Button
            onClick={exportWithProvenance}
            className="flex items-center gap-2 h-auto p-4 justify-start"
            variant="outline"
          >
            <Download className="w-5 h-5" />
            <div className="text-left">
              <p className="font-medium">Download with Provenance</p>
              <p className="text-xs text-muted-foreground">
                Full source mapping & verification data
              </p>
            </div>
          </Button>
        </div>
      </Card>

      {/* Unverified Items Warning */}
      {stats.unverifiedKeyPoints > 0 && (
        <Card className="p-4 border-warning/30 bg-warning/5">
          <div className="flex items-center gap-2 text-warning">
            <AlertTriangle className="w-5 h-5" />
            <p className="font-medium">
              {stats.unverifiedKeyPoints} key points lack supporting sources
            </p>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Consider adding sources or marking these claims as "UNVERIFIED" in your final article
          </p>
        </Card>
      )}
    </div>
  );
};