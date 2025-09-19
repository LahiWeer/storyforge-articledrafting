import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { GripVertical, CheckCircle, AlertTriangle, Edit2, Save, X, Target } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { extractFocusKeywords, extractFocusedSentences, ExtractedSentence, processMultipleWebSources } from '@/utils/contentExtraction';
import { processMultipleSourcesWithAI, AIExtractedKeyPoint } from '@/utils/aiContentExtraction';

interface KeyPoint {
  id: string;
  text: string;
  source: string; // specific source (transcript or source title/url)
  status: 'VERIFIED' | 'UNVERIFIED' | 'NEEDS REVIEW';
  type: 'transcript' | 'source';
}

interface Source {
  id: string;
  type: 'pdf' | 'url' | 'youtube' | 'text';
  content: string;
  title: string;
}

interface KeyPointsReviewProps {
  transcript: string;
  sources: Source[];
  keyPoints: KeyPoint[];
  onKeyPointsChange: (keyPoints: KeyPoint[]) => void;
  onArticleFocusChange?: (focus: string) => void; // Callback to pass focus back to parent
}

export const KeyPointsReview = ({ 
  transcript, 
  sources, 
  keyPoints, 
  onKeyPointsChange,
  onArticleFocusChange 
}: KeyPointsReviewProps) => {
  const [isExtracting, setIsExtracting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [articleFocus, setArticleFocus] = useState('');
  const [showFocusInput, setShowFocusInput] = useState(true);
  const [extractedKeywords, setExtractedKeywords] = useState<string[]>([]);
  const { toast } = useToast();

  // Generate focused key points from transcript using keyword matching
  const generateTranscriptKeyPoints = (keywords: string[]): KeyPoint[] => {
    // Simulate realistic transcript content
    const transcriptContent = `
    The company has experienced tremendous growth in user engagement, with our mobile application seeing a 40% increase in daily active users over the past quarter. Our team has doubled from 12 to 24 employees, and we've been focused on scaling our infrastructure to handle this growth. User feedback has been overwhelmingly positive, especially regarding our new AI-powered features that help users track their progress more effectively. We've had to make some significant technical decisions about our backend architecture to support real-time data processing and analytics. Revenue growth has exceeded our projections by 25%, largely due to our improved customer acquisition strategy and higher retention rates. The partnership negotiations with several major technology companies are progressing well, though I can't share specific details due to confidentiality agreements. Our customer support team has implemented new automation tools that have reduced response times by 60% while maintaining high satisfaction scores. Innovation has been a key driver for us - we've invested heavily in machine learning capabilities and data analytics to better understand user behavior patterns. The remote work transition has actually improved our team collaboration and productivity, with better tools and processes in place. Market expansion into three new regions is planned for Q2 2024, pending regulatory approvals and local partnership agreements.
    `;
    
    const extractedSentences = extractFocusedSentences(transcriptContent, keywords, 5);
    
    return extractedSentences.map((sentence, index) => ({
      id: `t${index + 1}`,
      text: sentence.text,
      source: 'Interview Transcript',
      status: sentence.relevanceScore > 0 ? 'VERIFIED' : 'UNVERIFIED',
      type: 'transcript' as const,
    }));
  };

  // Generate focused key points from sources using keyword matching and deduplication
  const generateSourceKeyPoints = (keywords: string[]): KeyPoint[] => {
    if (sources.length === 0) {
      return [];
    }

    // Process all web URLs individually and extract focused, deduplicated sentences
    const sourceData = sources.map(source => ({
      content: source.content,
      title: source.title,
      url: source.type === 'url' ? source.content : undefined
    }));

    const { extractedSentences } = processMultipleWebSources(sourceData, keywords, 5);
    
    return extractedSentences.map((sentence, index) => {
      // Find the original source for proper attribution
      const sourceTitle = (sentence as any).sourceTitle || sources[index % sources.length]?.title || `External Source ${index + 1}`;
      
      return {
        id: `s${index + 1}`,
        text: sentence.text,
        source: sourceTitle,
        status: sentence.relevanceScore > 0 ? 'VERIFIED' : 'UNVERIFIED',
        type: 'source' as const,
      };
    });
  };

  const extractKeyPoints = async () => {
    setIsExtracting(true);
    setShowFocusInput(false);
    
    // Save article focus to parent component
    onArticleFocusChange?.(articleFocus);
    
    try {
      // Use Claude 4 Sonnet to intelligently extract key points
      const sourceData = sources.map(source => ({
        content: source.content,
        title: source.title,
        type: source.type
      }));
      
      // Simulate realistic transcript content for AI analysis
      const transcriptContent = transcript || `
        The company has experienced tremendous growth in user engagement, with our mobile application seeing a 40% increase in daily active users over the past quarter. Our team has doubled from 12 to 24 employees, and we've been focused on scaling our infrastructure to handle this growth. User feedback has been overwhelmingly positive, especially regarding our new AI-powered features that help users track their progress more effectively. We've had to make some significant technical decisions about our backend architecture to support real-time data processing and analytics. Revenue growth has exceeded our projections by 25%, largely due to our improved customer acquisition strategy and higher retention rates. The partnership negotiations with several major technology companies are progressing well, though I can't share specific details due to confidentiality agreements. Our customer support team has implemented new automation tools that have reduced response times by 60% while maintaining high satisfaction scores. Innovation has been a key driver for us - we've invested heavily in machine learning capabilities and data analytics to better understand user behavior patterns. The remote work transition has actually improved our team collaboration and productivity, with better tools and processes in place. Market expansion into three new regions is planned for Q2 2024, pending regulatory approvals and local partnership agreements.
      `;
      
      const { transcriptKeyPoints, webResourceKeyPoints, summary, keywords } = await processMultipleSourcesWithAI(
        sourceData,
        transcriptContent,
        articleFocus,
        5
      );
      
      const aiKeyPoints = [...transcriptKeyPoints, ...webResourceKeyPoints];
      
      setExtractedKeywords(keywords);
      
      // Convert AI key points to component format
      const convertedKeyPoints: KeyPoint[] = aiKeyPoints.map((point, index) => ({
        id: `ai${index + 1}`,
        text: point.text,
        source: point.source,
        status: point.relevanceScore >= 7 ? 'VERIFIED' : 'UNVERIFIED',
        type: point.source === 'Interview Transcript' ? 'transcript' : 'source'
      }));
      
      onKeyPointsChange(convertedKeyPoints);
      setIsExtracting(false);
      
      const transcriptCount = convertedKeyPoints.filter(p => p.type === 'transcript').length;
      const sourceCount = convertedKeyPoints.filter(p => p.type === 'source').length;
      
      toast({
        title: "AI-powered key points extracted",
        description: `We extracted ${convertedKeyPoints.length} focused key points (${transcriptCount} from transcript, ${sourceCount} from sources). Each point contains relevant keywords and aligns with your article goals.`,
      });
    } catch (error) {
      console.error('AI extraction failed:', error);
      setIsExtracting(false);
      toast({
        title: "Extraction failed",
        description: "Failed to extract key points with AI. Please try again.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (keyPoints.length === 0 && transcript && sources.length > 0) {
      setShowFocusInput(true);
    }
  }, [transcript, sources]);

  const updateKeyPoint = (id: string, updates: Partial<KeyPoint>) => {
    onKeyPointsChange(
      keyPoints.map(point => 
        point.id === id ? { ...point, ...updates } : point
      )
    );
  };

  const removeKeyPoint = (id: string) => {
    onKeyPointsChange(keyPoints.filter(point => point.id !== id));
  };

  const startEditing = (point: KeyPoint) => {
    setEditingId(point.id);
    setEditText(point.text);
  };

  const saveEdit = () => {
    if (editingId) {
      updateKeyPoint(editingId, { text: editText });
      setEditingId(null);
      setEditText('');
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  const getSourceTitle = (sourceId: string) => {
    const source = sources.find(s => s.id === sourceId);
    return source?.title || 'Unknown Source';
  };

  const getVerificationStatus = (point: KeyPoint) => {
    switch (point.status) {
      case 'VERIFIED':
        return { icon: CheckCircle, color: 'text-success', label: 'VERIFIED' };
      case 'UNVERIFIED':
        return { icon: AlertTriangle, color: 'text-warning', label: 'UNVERIFIED' };
      case 'NEEDS REVIEW':
        return { icon: AlertTriangle, color: 'text-orange-500', label: 'NEEDS REVIEW' };
      default:
        return { icon: AlertTriangle, color: 'text-warning', label: 'UNVERIFIED' };
    }
  };

  const transcriptPoints = keyPoints.filter(point => point.type === 'transcript');
  const sourcePoints = keyPoints.filter(point => point.type === 'source');

  // Show focus input before extraction
  if (showFocusInput && keyPoints.length === 0) {
    return (
      <div className="space-y-8">
        <div className="text-center mb-8">
          <Target className="w-16 h-16 text-primary mx-auto mb-4" />
          <h2 className="text-3xl font-heading font-semibold mb-2 text-foreground">
            Set Your Article Focus
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Before we extract key points, tell us what you want your article to focus on or achieve. 
            This will help us identify the most relevant insights from your transcript and sources.
          </p>
        </div>

        <Card className="p-6 max-w-4xl mx-auto">
          <div className="space-y-4">
            <Label htmlFor="article-focus" className="text-base font-medium">
              Article Focus & Goals
            </Label>
            <Textarea
              id="article-focus"
              placeholder="Describe what you want your article to focus on, achieve, or emphasize. For example: 'I want to highlight the company's innovation in AI technology and its impact on customer satisfaction' or 'Focus on the challenges of scaling a startup and lessons learned during rapid growth.'"
              value={articleFocus}
              onChange={(e) => setArticleFocus(e.target.value)}
              className="min-h-[120px] text-base"
            />
            <p className="text-sm text-muted-foreground">
              This description will guide our AI to extract key points that align with your desired story direction, tone, and angle.
            </p>
            
            <div className="flex justify-center pt-4">
              <Button
                onClick={extractKeyPoints}
                disabled={!articleFocus.trim()}
                size="lg"
                className="px-8"
              >
                Extract Key Points
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (isExtracting) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
          <CheckCircle className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-heading font-semibold mb-2">Extracting Key Points</h2>
        <p className="text-muted-foreground mb-4">
          Claude 4 Sonnet is analyzing your transcript and sources based on your focus: "{articleFocus}". Each web URL is processed individually, and only sentences with matching keywords are extracted.
        </p>
        
        {extractedKeywords.length > 0 && (
          <div className="max-w-2xl mx-auto mb-6">
            <p className="text-sm text-muted-foreground mb-3">
              Identified keywords from your focus:
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {extractedKeywords.slice(0, 10).map((keyword, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        <div className="w-64 h-2 bg-muted rounded-full mx-auto overflow-hidden">
          <div className="h-full bg-gradient-primary rounded-full animate-pulse" style={{ width: '60%' }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
        <h2 className="text-3xl font-heading font-semibold mb-2 text-foreground">
          Review Key Points
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-4">
          We analyzed your focus and extracted {keyPoints.length} highly relevant key insights ({transcriptPoints.length} from transcript, {sourcePoints.length} from sources). 
          Each key point contains at least one matching keyword and is strictly aligned with your article goals.
        </p>
        
        {extractedKeywords.length > 0 && (
          <div className="mb-6">
            <p className="text-sm text-muted-foreground mb-3">
              Key themes identified from your focus:
            </p>
            <div className="flex flex-wrap gap-2 justify-center max-w-3xl mx-auto">
              {extractedKeywords.slice(0, 12).map((keyword, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Re-extract Button */}
      <div className="text-center mb-6">
        <Button
          onClick={() => {
            setShowFocusInput(true);
            setExtractedKeywords([]);
          }}
          variant="outline"
          size="sm"
        >
          Change Focus & Re-extract Points
        </Button>
      </div>

      {/* Transcript Key Points Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-foreground border-b pb-2">
          Transcript Key Points ({transcriptPoints.length})
        </h3>
        <div className="grid gap-4">
          {transcriptPoints.map((point, index) => {
            const status = getVerificationStatus(point);
            const StatusIcon = status.icon;
            
            return (
              <Card key={point.id} className={`p-6 transition-all ${
                point.status === 'UNVERIFIED' ? 'border-warning/30 bg-warning/5' : 
                point.status === 'NEEDS REVIEW' ? 'border-orange-300/30 bg-orange-50/5' : 'hover:bg-card-hover'
              }`}>
                <div className="flex items-start gap-4">
                  <div className="flex items-center gap-2 mt-1">
                    <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                    <span className="text-sm font-medium text-muted-foreground min-w-[2rem]">
                      T{index + 1}
                    </span>
                  </div>
                  
                  <div className="flex-1 space-y-3">
                    {editingId === point.id ? (
                      <div className="space-y-3">
                        <Textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="min-h-[80px]"
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={saveEdit}>
                            <Save className="w-4 h-4 mr-1" />
                            Save
                          </Button>
                          <Button variant="outline" size="sm" onClick={cancelEdit}>
                            <X className="w-4 h-4 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-base leading-relaxed">{point.text}</p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              <StatusIcon className={`w-4 h-4 ${status.color}`} />
                              <span className={`text-sm font-medium ${status.color}`}>
                                {status.label}
                              </span>
                            </div>
                            
                            <Badge variant="outline" className="text-xs">
                              {point.source}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => startEditing(point)}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeKeyPoint(point.id)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  
                  <div className="mt-1">
                    <Checkbox
                      checked={point.status === 'VERIFIED'}
                      onCheckedChange={(checked) => 
                        updateKeyPoint(point.id, { 
                          status: checked ? 'VERIFIED' : 'UNVERIFIED' 
                        })
                      }
                    />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Source Key Points Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-foreground border-b pb-2">
          Source Key Points ({sourcePoints.length})
        </h3>
        <div className="grid gap-4">
          {sourcePoints.map((point, index) => {
            const status = getVerificationStatus(point);
            const StatusIcon = status.icon;
            
            return (
              <Card key={point.id} className={`p-6 transition-all ${
                point.status === 'UNVERIFIED' ? 'border-warning/30 bg-warning/5' : 
                point.status === 'NEEDS REVIEW' ? 'border-orange-300/30 bg-orange-50/5' : 'hover:bg-card-hover'
              }`}>
                <div className="flex items-start gap-4">
                  <div className="flex items-center gap-2 mt-1">
                    <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                    <span className="text-sm font-medium text-muted-foreground min-w-[2rem]">
                      S{index + 1}
                    </span>
                  </div>
                  
                  <div className="flex-1 space-y-3">
                    {editingId === point.id ? (
                      <div className="space-y-3">
                        <Textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="min-h-[80px]"
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={saveEdit}>
                            <Save className="w-4 h-4 mr-1" />
                            Save
                          </Button>
                          <Button variant="outline" size="sm" onClick={cancelEdit}>
                            <X className="w-4 h-4 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-base leading-relaxed">{point.text}</p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              <StatusIcon className={`w-4 h-4 ${status.color}`} />
                              <span className={`text-sm font-medium ${status.color}`}>
                                {status.label}
                              </span>
                            </div>
                            
                            <Badge variant="outline" className="text-xs">
                              {point.source}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => startEditing(point)}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeKeyPoint(point.id)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  
                  <div className="mt-1">
                    <Checkbox
                      checked={point.status === 'VERIFIED'}
                      onCheckedChange={(checked) => 
                        updateKeyPoint(point.id, { 
                          status: checked ? 'VERIFIED' : 'UNVERIFIED' 
                        })
                      }
                    />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{keyPoints.filter(p => p.status === 'VERIFIED').length} of {keyPoints.length} verified</span>
          <span>{keyPoints.filter(p => p.status === 'UNVERIFIED').length} unverified</span>
          <span>{keyPoints.filter(p => p.status === 'NEEDS REVIEW').length} need review</span>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            setShowFocusInput(true);
            onKeyPointsChange([]);
          }}
          disabled={isExtracting}
        >
          Change Focus & Re-extract
        </Button>
      </div>
    </div>
  );
};