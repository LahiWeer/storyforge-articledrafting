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
  Share,
  FileType,
  File
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';

interface QuoteVerification {
  id: string;
  quotedText: string;
  attribution: string;
  originalSource: string | null;
  isVerified: boolean;
  matchType: 'exact' | 'partial' | 'paraphrased' | 'not_found';
  confidence: number;
}

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
  headline?: string;
  quoteVerifications?: QuoteVerification[];
}

interface ReviewExportProps {
  storyData: StoryData;
  onDataUpdate: (updates: Partial<StoryData>) => void;
}

export const ReviewExport = ({ storyData, onDataUpdate }: ReviewExportProps) => {
  const [isCheckingQuotes, setIsCheckingQuotes] = useState(false);
  const { toast } = useToast();

  const runQuoteChecker = async () => {
    setIsCheckingQuotes(true);
    
    try {
      const quotesInDraft = extractQuotesFromDraft(storyData.draft);
      const verifications: QuoteVerification[] = [];
      
      for (const quote of quotesInDraft) {
        const verification = await verifyQuoteInTranscript(quote, storyData.transcript);
        verifications.push({
          id: Math.random().toString(36).substr(2, 9),
          quotedText: quote.text,
          attribution: quote.attribution,
          originalSource: verification.originalSource,
          isVerified: verification.isVerified,
          matchType: verification.matchType,
          confidence: verification.confidence,
        });
      }
      
      onDataUpdate({ quoteVerifications: verifications });
      setIsCheckingQuotes(false);
      
      toast({
        title: "Quote verification complete",
        description: `${verifications.filter(v => v.isVerified).length} of ${verifications.length} quotes verified`,
      });
    } catch (error) {
      setIsCheckingQuotes(false);
      toast({
        title: "Error during quote verification",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  const extractQuotesFromDraft = (draft: string) => {
    const quotesRegex = /"([^"]+)"/g;
    const quotes = [];
    let match;
    
    while ((match = quotesRegex.exec(draft)) !== null) {
      const quotedText = match[1];
      const context = draft.substring(Math.max(0, match.index - 100), match.index + match[0].length + 100);
      const attributionMatch = context.match(/(?:said|says|told|explained|noted|stated|according to)\s+([^,.]+)(?:[,.]|$)/i);
      
      quotes.push({
        text: quotedText,
        attribution: attributionMatch ? attributionMatch[1].trim() : 'Unknown',
      });
    }
    
    return quotes;
  };

  const verifyQuoteInTranscript = async (quote: { text: string; attribution: string }, transcript: string) => {
    const cleanQuote = quote.text.toLowerCase().replace(/[^\w\s]/g, '');
    const cleanTranscript = transcript.toLowerCase().replace(/[^\w\s]/g, '');
    
    // Check for exact match
    if (cleanTranscript.includes(cleanQuote)) {
      const startIndex = cleanTranscript.indexOf(cleanQuote);
      const originalSource = transcript.substring(
        Math.max(0, startIndex - 50),
        Math.min(transcript.length, startIndex + cleanQuote.length + 50)
      );
      
      return {
        isVerified: true,
        matchType: 'exact' as const,
        confidence: 1.0,
        originalSource: originalSource.trim(),
      };
    }
    
    // Check for partial match
    const quoteWords = cleanQuote.split(/\s+/);
    const matchingWords = quoteWords.filter(word => cleanTranscript.includes(word));
    const confidence = matchingWords.length / quoteWords.length;
    
    if (confidence >= 0.7) {
      const contextSnippet = findBestMatch(quoteWords, transcript);
      return {
        isVerified: confidence >= 0.8,
        matchType: confidence >= 0.8 ? 'partial' as const : 'paraphrased' as const,
        confidence,
        originalSource: contextSnippet,
      };
    }
    
    return {
      isVerified: false,
      matchType: 'not_found' as const,
      confidence: 0,
      originalSource: null,
    };
  };

  const findBestMatch = (words: string[], transcript: string) => {
    const sentences = transcript.split(/[.!?]+/);
    let bestMatch = '';
    let bestScore = 0;
    
    for (const sentence of sentences) {
      const cleanSentence = sentence.toLowerCase().replace(/[^\w\s]/g, '');
      const matchingWords = words.filter(word => cleanSentence.includes(word));
      const score = matchingWords.length / words.length;
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = sentence.trim();
      }
    }
    
    return bestMatch || 'No matching context found';
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

  const exportAsPDF = () => {
    const doc = new jsPDF();
    
    // Add headline
    if (storyData.headline) {
      doc.setFontSize(18);
      doc.setFont(undefined, 'bold');
      const splitHeadline = doc.splitTextToSize(storyData.headline, 180);
      doc.text(splitHeadline, 15, 20);
    }
    
    // Add article content
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    const startY = storyData.headline ? 40 : 20;
    const splitText = doc.splitTextToSize(storyData.draft, 180);
    doc.text(splitText, 15, startY);
    
    // Add sources section
    const sourcesY = startY + (splitText.length * 5) + 20;
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Source References', 15, sourcesY);
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    storyData.sources.forEach((source, index) => {
      doc.text(`${index + 1}. ${source.title} (${source.type.toUpperCase()})`, 15, sourcesY + 10 + (index * 5));
    });
    
    doc.save('story-draft.pdf');
    
    toast({
      title: "Export successful",
      description: "Your article has been downloaded as a PDF file",
    });
  };

  const exportAsDocx = async () => {
    const children = [];
    
    // Add headline
    if (storyData.headline) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: storyData.headline,
              bold: true,
              size: 32,
            }),
          ],
          spacing: { after: 400 },
        })
      );
    }
    
    // Add article content
    const paragraphs = storyData.draft.split('\n\n');
    paragraphs.forEach(paragraph => {
      if (paragraph.trim()) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: paragraph.trim(),
                size: 24,
              }),
            ],
            spacing: { after: 200 },
          })
        );
      }
    });
    
    // Add sources section
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "Source References",
            bold: true,
            size: 28,
          }),
        ],
        spacing: { before: 400, after: 200 },
      })
    );
    
    storyData.sources.forEach((source, index) => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${index + 1}. ${source.title} (${source.type.toUpperCase()})`,
              size: 20,
            }),
          ],
          spacing: { after: 100 },
        })
      );
    });
    
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: children,
        },
      ],
    });
    
    const buffer = await Packer.toBuffer(doc);
    saveAs(new Blob([buffer]), 'story-draft.docx');
    
    toast({
      title: "Export successful",
      description: "Your article has been downloaded as a DOCX file",
    });
  };

  const exportAsTxt = () => {
    const headline = storyData.headline ? `${storyData.headline}\n\n` : '';
    const content = `${headline}${storyData.draft}

---

SOURCE REFERENCES

${storyData.sources.map((source, index) => 
  `${index + 1}. ${source.title} (${source.type.toUpperCase()})`
).join('\n')}

KEY POINTS REFERENCE

${storyData.keyPoints.map((point, index) => 
  `${index + 1}. ${point.text} ${point.status === 'VERIFIED' ? '✓' : '⚠️'}`
).join('\n')}

---

Generated with Story Generator • ${new Date().toLocaleDateString()}`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'story-draft.txt';
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Export successful",
      description: "Your article has been downloaded as a TXT file",
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
      quoteVerification: storyData.quoteVerifications || [],
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
    const quoteVerifications = storyData.quoteVerifications || [];
    const totalQuotes = quoteVerifications.length;
    const verifiedQuotes = quoteVerifications.filter(v => v.isVerified).length;
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

        {storyData.quoteVerifications && storyData.quoteVerifications.length > 0 && (
          <div className="space-y-3">
            {storyData.quoteVerifications.map((verification) => (
              <div key={verification.id} className={`p-4 rounded-lg border ${
                verification.isVerified 
                  ? 'bg-success/5 border-success/20' 
                  : 'bg-warning/5 border-warning/20'
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {verification.isVerified ? (
                        <CheckCircle className="w-4 h-4 text-success" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-warning" />
                      )}
                      <span className={`text-sm font-medium ${
                        verification.isVerified ? 'text-success' : 'text-warning'
                      }`}>
                        {verification.isVerified ? 'VERIFIED' : 'NEEDS REVIEW'}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {verification.matchType.toUpperCase()}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {Math.round(verification.confidence * 100)}% confidence
                      </span>
                    </div>
                    <p className="font-medium mb-1">"{verification.quotedText}"</p>
                    <p className="text-sm text-muted-foreground mb-2">
                      Attributed to: {verification.attribution}
                    </p>
                    {verification.originalSource && (
                      <p className="text-sm bg-background p-2 rounded border-l-4 border-l-muted">
                        {verification.originalSource}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
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
        <div className="grid md:grid-cols-3 gap-4">
          <Button
            onClick={exportAsMarkdown}
            className="flex items-center gap-2 h-auto p-4 justify-start"
            variant="outline"
          >
            <FileText className="w-5 h-5" />
            <div className="text-left">
              <p className="font-medium">Markdown (.md)</p>
              <p className="text-xs text-muted-foreground">
                Article with source references
              </p>
            </div>
          </Button>
          
          <Button
            onClick={exportAsPDF}
            className="flex items-center gap-2 h-auto p-4 justify-start"
            variant="outline"
          >
            <FileType className="w-5 h-5" />
            <div className="text-left">
              <p className="font-medium">PDF (.pdf)</p>
              <p className="text-xs text-muted-foreground">
                Formatted document
              </p>
            </div>
          </Button>
          
          <Button
            onClick={exportAsDocx}
            className="flex items-center gap-2 h-auto p-4 justify-start"
            variant="outline"
          >
            <File className="w-5 h-5" />
            <div className="text-left">
              <p className="font-medium">Word (.docx)</p>
              <p className="text-xs text-muted-foreground">
                Editable document
              </p>
            </div>
          </Button>
          
          <Button
            onClick={exportAsTxt}
            className="flex items-center gap-2 h-auto p-4 justify-start"
            variant="outline"
          >
            <FileText className="w-5 h-5" />
            <div className="text-left">
              <p className="font-medium">Plain Text (.txt)</p>
              <p className="text-xs text-muted-foreground">
                Simple text format
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
              <p className="font-medium">With Provenance (.json)</p>
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