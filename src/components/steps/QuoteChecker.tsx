import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertTriangle, Search, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface QuoteVerification {
  id: string;
  quotedText: string;
  attribution: string;
  originalSource: string | null;
  isVerified: boolean;
  matchType: 'exact' | 'partial' | 'paraphrased' | 'not_found';
  confidence: number;
  transcriptSnippet?: string;
  startIndex?: number;
  endIndex?: number;
}

interface QuoteCheckerProps {
  draft: string;
  transcript: string;
  onVerificationComplete: (verifications: QuoteVerification[]) => void;
}

export const QuoteChecker = ({ draft, transcript, onVerificationComplete }: QuoteCheckerProps) => {
  const [isChecking, setIsChecking] = useState(false);
  const [verifications, setVerifications] = useState<QuoteVerification[]>([]);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  // Extract quotes from the draft article
  const extractQuotesFromDraft = (draftText: string): Array<{
    text: string;
    attribution: string;
    fullContext: string;
  }> => {
    const quotes: Array<{ text: string; attribution: string; fullContext: string }> = [];
    
    // Pattern to match quoted text with various attribution formats
    const quotePatterns = [
      // "Quote text," attribution said/explained/noted/etc.
      /"([^"]{20,}?),"?\s+([^\.]+(?:said|explained|noted|shared|mentioned|stated|told|expressed|revealed|admitted|emphasized|clarified|added|continued|concluded)[^\.]*\.)/gi,
      // Attribution said/noted: "Quote text"
      /([^\.]+(?:said|explained|noted|shared|mentioned|stated|told|expressed|revealed|admitted|emphasized|clarified|added|continued|concluded)[^:]*?):\s*"([^"]{20,}?)"/gi,
      // "Quote text" - Attribution
      /"([^"]{20,}?)"\s*[-–—]\s*([^\.]+)/gi,
      // According to Attribution, "Quote text"
      /(?:according to|as)\s+([^,]+),?\s*"([^"]{20,}?)"/gi
    ];

    let contextWindow = 150; // Characters before and after quote for context
    
    quotePatterns.forEach(pattern => {
      let match;
      const regex = new RegExp(pattern);
      
      while ((match = regex.exec(draftText)) !== null) {
        const startIndex = match.index;
        const endIndex = match.index + match[0].length;
        
        // Extract context around the quote
        const contextStart = Math.max(0, startIndex - contextWindow);
        const contextEnd = Math.min(draftText.length, endIndex + contextWindow);
        const fullContext = draftText.substring(contextStart, contextEnd).trim();
        
        let quotedText, attribution;
        
        // Handle different pattern structures
        if (pattern.source.includes('said|explained')) {
          if (match[1].length > match[2]?.length) {
            quotedText = match[1];
            attribution = match[2];
          } else {
            quotedText = match[2];
            attribution = match[1];
          }
        } else {
          quotedText = match[2] || match[1];
          attribution = match[1] || match[2];
        }
        
        if (quotedText && quotedText.length >= 20 && attribution) {
          quotes.push({
            text: quotedText.trim(),
            attribution: attribution.trim(),
            fullContext
          });
        }
      }
    });
    
    return quotes;
  };

  // Find the best match for a quote in the transcript
  const findQuoteInTranscript = (quote: string, transcriptText: string): {
    match: string | null;
    matchType: 'exact' | 'partial' | 'paraphrased' | 'not_found';
    confidence: number;
    snippet?: string;
    startIndex?: number;
    endIndex?: number;
  } => {
    const normalizeText = (text: string) => {
      return text
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    };

    const normalizedQuote = normalizeText(quote);
    const normalizedTranscript = normalizeText(transcriptText);
    const quoteWords = normalizedQuote.split(' ');
    
    // Try exact match first
    if (normalizedTranscript.includes(normalizedQuote)) {
      const startIndex = normalizedTranscript.indexOf(normalizedQuote);
      const endIndex = startIndex + normalizedQuote.length;
      const snippet = transcriptText.substring(startIndex, endIndex);
      
      return {
        match: snippet,
        matchType: 'exact',
        confidence: 100,
        snippet,
        startIndex,
        endIndex
      };
    }

    // Try partial matches - find sequences of words
    let bestMatch = { words: [], confidence: 0, segments: [] as Array<{start: number, end: number, text: string}> };
    
    for (let windowSize = Math.min(quoteWords.length, 8); windowSize >= 3; windowSize--) {
      for (let i = 0; i <= quoteWords.length - windowSize; i++) {
        const window = quoteWords.slice(i, i + windowSize).join(' ');
        const matchIndex = normalizedTranscript.indexOf(window);
        
        if (matchIndex !== -1) {
          const confidence = (windowSize / quoteWords.length) * 100;
          if (confidence > bestMatch.confidence) {
            bestMatch = {
              words: quoteWords.slice(i, i + windowSize),
              confidence,
              segments: [{
                start: matchIndex,
                end: matchIndex + window.length,
                text: transcriptText.substring(matchIndex, matchIndex + window.length)
              }]
            };
          }
        }
      }
    }

    // Try to find multiple segments for paraphrased content
    if (bestMatch.confidence < 50) {
      const segments: Array<{start: number, end: number, text: string}> = [];
      let totalWordsFound = 0;
      
      for (const word of quoteWords) {
        if (word.length > 3) { // Skip small words
          const wordIndex = normalizedTranscript.indexOf(word);
          if (wordIndex !== -1) {
            segments.push({
              start: wordIndex,
              end: wordIndex + word.length,
              text: transcriptText.substring(wordIndex, wordIndex + word.length)
            });
            totalWordsFound++;
          }
        }
      }
      
      if (segments.length > 0) {
        const confidence = (totalWordsFound / quoteWords.length) * 80; // Max 80% for paraphrased
        if (confidence > bestMatch.confidence) {
          bestMatch = { words: [], confidence, segments };
        }
      }
    }

    if (bestMatch.confidence >= 30) {
      // Create snippet with ellipses for non-contiguous matches
      if (bestMatch.segments.length > 1) {
        const sortedSegments = bestMatch.segments.sort((a, b) => a.start - b.start);
        const snippetParts = sortedSegments.map(segment => segment.text);
        const snippet = snippetParts.join('...');
        
        return {
          match: snippet,
          matchType: bestMatch.confidence >= 70 ? 'partial' : 'paraphrased',
          confidence: bestMatch.confidence,
          snippet,
          startIndex: sortedSegments[0].start,
          endIndex: sortedSegments[sortedSegments.length - 1].end
        };
      } else if (bestMatch.segments.length === 1) {
        const segment = bestMatch.segments[0];
        return {
          match: segment.text,
          matchType: bestMatch.confidence >= 70 ? 'partial' : 'paraphrased',
          confidence: bestMatch.confidence,
          snippet: segment.text,
          startIndex: segment.start,
          endIndex: segment.end
        };
      }
    }

    return {
      match: null,
      matchType: 'not_found',
      confidence: 0
    };
  };

  // Run quote verification
  const verifyQuotes = async () => {
    setIsChecking(true);
    setProgress(0);
    
    try {
      const extractedQuotes = extractQuotesFromDraft(draft);
      const totalQuotes = extractedQuotes.length;
      
      if (totalQuotes === 0) {
        toast({
          title: "No quotes found",
          description: "No quoted text was detected in the draft article",
        });
        setIsChecking(false);
        return;
      }

      const newVerifications: QuoteVerification[] = [];
      
      for (let i = 0; i < extractedQuotes.length; i++) {
        const quote = extractedQuotes[i];
        
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const verification = findQuoteInTranscript(quote.text, transcript);
        
        newVerifications.push({
          id: `quote-${i + 1}`,
          quotedText: quote.text,
          attribution: quote.attribution,
          originalSource: verification.match,
          isVerified: verification.confidence >= 50,
          matchType: verification.matchType,
          confidence: verification.confidence,
          transcriptSnippet: verification.snippet,
          startIndex: verification.startIndex,
          endIndex: verification.endIndex
        });
        
        setProgress(((i + 1) / totalQuotes) * 100);
      }
      
      setVerifications(newVerifications);
      onVerificationComplete(newVerifications);
      
      const verifiedCount = newVerifications.filter(v => v.isVerified).length;
      const unverifiedCount = newVerifications.length - verifiedCount;
      
      toast({
        title: "Quote verification complete",
        description: `${verifiedCount} quotes verified, ${unverifiedCount} need review`,
      });
      
    } catch (error) {
      console.error('Quote verification failed:', error);
      toast({
        title: "Verification failed",
        description: "Unable to complete quote verification",
        variant: "destructive"
      });
    }
    
    setIsChecking(false);
  };

  useEffect(() => {
    if (draft && transcript) {
      verifyQuotes();
    }
  }, []);

  const getStatusBadge = (verification: QuoteVerification) => {
    if (verification.isVerified) {
      return <Badge variant="default" className="bg-success text-success-foreground">
        <CheckCircle className="w-3 h-3 mr-1" />
        Verified
      </Badge>;
    } else if (verification.matchType === 'not_found') {
      return <Badge variant="destructive">
        <XCircle className="w-3 h-3 mr-1" />
        Not Found
      </Badge>;
    } else {
      return <Badge variant="secondary">
        <AlertTriangle className="w-3 h-3 mr-1" />
        Needs Review
      </Badge>;
    }
  };

  if (isChecking) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Search className="w-5 h-5 text-primary animate-pulse" />
            <h3 className="text-lg font-semibold">Verifying Quotes</h3>
          </div>
          <p className="text-muted-foreground">
            Checking all quoted text against the original transcript...
          </p>
          
          <div className="max-w-md mx-auto">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-gradient-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Quote Verification Results</h3>
        <p className="text-muted-foreground">
          All quotes have been checked against the original transcript
        </p>
      </div>

      {verifications.length === 0 ? (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            No quoted text was found in the draft article to verify.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-4">
          {/* Summary Stats */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h4 className="font-medium">Verification Summary</h4>
                <p className="text-sm text-muted-foreground">
                  {verifications.length} quotes analyzed
                </p>
              </div>
              <div className="flex gap-2">
                <Badge variant="default" className="bg-success text-success-foreground">
                  {verifications.filter(v => v.isVerified).length} Verified
                </Badge>
                <Badge variant="destructive">
                  {verifications.filter(v => !v.isVerified).length} Need Review
                </Badge>
              </div>
            </div>
          </Card>

          {/* Individual Quote Verifications */}
          <div className="space-y-3">
            {verifications.map((verification, index) => (
              <Card key={verification.id} className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-muted-foreground">
                          Quote #{index + 1}
                        </span>
                        {getStatusBadge(verification)}
                        <span className="text-xs text-muted-foreground">
                          {verification.confidence.toFixed(0)}% match
                        </span>
                      </div>
                      <p className="text-sm font-medium mb-1">Attribution:</p>
                      <p className="text-sm text-muted-foreground mb-2">
                        {verification.attribution}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium mb-1">Quoted Text:</p>
                      <p className="text-sm bg-muted p-3 rounded border-l-4 border-primary">
                        "{verification.quotedText}"
                      </p>
                    </div>

                    {verification.transcriptSnippet && (
                      <div>
                        <p className="text-sm font-medium mb-1">
                          Transcript Source:
                        </p>
                        <p className="text-sm bg-success/10 p-3 rounded border-l-4 border-success">
                          {verification.transcriptSnippet}
                          {verification.matchType === 'paraphrased' && (
                            <span className="block text-xs text-muted-foreground mt-2">
                              * Non-contiguous match shown with ellipses (...)
                            </span>
                          )}
                        </p>
                      </div>
                    )}

                    {!verification.isVerified && verification.matchType === 'not_found' && (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          This quote could not be found in the provided transcript. 
                          Please verify the accuracy or consider removing it.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-center">
        <Button
          variant="outline"
          onClick={verifyQuotes}
          disabled={isChecking}
          className="flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Re-verify Quotes
        </Button>
      </div>
    </div>
  );
};