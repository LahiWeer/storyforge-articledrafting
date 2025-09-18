import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { GripVertical, CheckCircle, AlertTriangle, Edit2, Save, X, Target } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

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
}

export const KeyPointsReview = ({ 
  transcript, 
  sources, 
  keyPoints, 
  onKeyPointsChange 
}: KeyPointsReviewProps) => {
  const [isExtracting, setIsExtracting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [articleFocus, setArticleFocus] = useState('');
  const [showFocusInput, setShowFocusInput] = useState(true);
  const [extractedKeywords, setExtractedKeywords] = useState<string[]>([]);
  const { toast } = useToast();

  // Extract keywords and main ideas from article focus
  const extractFocusKeywords = (focus: string): string[] => {
    const text = focus.toLowerCase();
    const keywords: string[] = [];
    
    // Common words to ignore
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'want', 'need', 'like', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they'];
    
    // Extract significant words (3+ characters, not stop words)
    const words = text.split(/\s+/)
      .map(word => word.replace(/[^\w]/g, ''))
      .filter(word => word.length >= 3 && !stopWords.includes(word));
    
    // Add individual keywords
    keywords.push(...words);
    
    // Extract key phrases (2-3 word combinations)
    const phrases = text.match(/\b\w+\s+\w+(?:\s+\w+)?\b/g) || [];
    keywords.push(...phrases.map(phrase => phrase.trim()));
    
    // Return unique keywords, prioritizing longer phrases
    return [...new Set(keywords)].sort((a, b) => b.length - a.length).slice(0, 15);
  };

  // Generate focused key points based on extracted keywords
  const generateFocusedKeyPoints = (type: 'transcript' | 'source', keywords: string[]): KeyPoint[] => {
    // This simulates how AI would prioritize key points based on the user's focus
    const keywordMatch = (text: string): number => {
      let score = 0;
      keywords.forEach(keyword => {
        if (text.toLowerCase().includes(keyword.toLowerCase())) {
          score += keyword.length > 5 ? 2 : 1; // Give higher weight to longer, more specific keywords
        }
      });
      return score;
    };

    if (type === 'transcript') {
      const allTranscriptPoints = [
        { text: 'According to the interviewee, user feedback has become the primary driver of product development decisions, with the team implementing a structured feedback loop system.', keywords: ['user feedback', 'product development', 'feedback loop'] },
        { text: 'The company experienced significant infrastructure scalability challenges that required immediate technical solutions and architectural changes.', keywords: ['infrastructure', 'scalability', 'technical solutions'] },
        { text: 'Team expansion was mentioned as doubling from 12 to 24 employees, but the timeline and specific roles were not clearly specified in the discussion.', keywords: ['team expansion', 'employees', 'growth'] },
        { text: 'The interviewee discussed plans for Q2 2024 expansion into three new markets, though specific market details were not provided.', keywords: ['expansion', 'markets', 'growth plans'] },
        { text: 'Mobile app usage patterns were discussed extensively, with emphasis on user engagement and retention strategies.', keywords: ['mobile app', 'user engagement', 'retention'] },
        { text: 'Partnership negotiations with a major technology company were referenced, but confidentiality prevented detailed discussion.', keywords: ['partnership', 'technology', 'negotiations'] },
        { text: 'Revenue growth metrics were mentioned but specific percentages and timeframes require verification against company records.', keywords: ['revenue growth', 'metrics', 'financial'] },
        { text: 'Customer acquisition strategies have evolved significantly, incorporating new digital marketing channels and referral programs.', keywords: ['customer acquisition', 'digital marketing', 'strategy'] },
        { text: 'AI integration has been prioritized as part of the company\'s innovation roadmap, with machine learning capabilities being developed internally.', keywords: ['ai', 'innovation', 'machine learning'] },
        { text: 'Company culture transformation initiatives have been implemented to support remote work and distributed team collaboration.', keywords: ['company culture', 'remote work', 'collaboration'] }
      ];

      return allTranscriptPoints
        .map((point, index) => ({
          ...point,
          score: keywordMatch(point.text) + (point.keywords.some(k => keywords.some(uk => uk.includes(k) || k.includes(uk))) ? 5 : 0)
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 8)
        .map((point, index) => ({
          id: `t${index + 1}`,
          text: point.text,
          source: 'Interview Transcript',
          status: Math.random() > 0.3 ? 'VERIFIED' : (Math.random() > 0.5 ? 'UNVERIFIED' : 'NEEDS REVIEW'),
          type: 'transcript' as const,
        }));
    } else {
      const allSourcePoints = [
        { text: 'Industry reports confirm a 78% average increase in customer satisfaction following user-centered design implementations across similar companies.', keywords: ['customer satisfaction', 'user-centered design', 'industry reports'] },
        { text: 'Revenue growth in the technology sector exceeded 150% year-over-year for companies implementing similar business models.', keywords: ['revenue growth', 'technology sector', 'business models'] },
        { text: 'Market analysis suggests that customer acquisition costs have been reduced by an average of 25% through digital transformation initiatives.', keywords: ['customer acquisition', 'digital transformation', 'cost reduction'] },
        { text: 'AI-powered features have become essential for competitive advantage in the current market landscape, according to industry research.', keywords: ['ai-powered', 'competitive advantage', 'market research'] },
        { text: 'Mobile application usage has increased by 40% across the industry in the last quarter, driven by remote work trends.', keywords: ['mobile application', 'usage increase', 'remote work'] },
        { text: 'Strategic partnerships in the technology sector have shown mixed results, with success rates varying significantly by market segment.', keywords: ['strategic partnerships', 'technology sector', 'market segment'] },
        { text: 'Infrastructure scalability solutions require substantial investment but deliver long-term operational efficiency gains.', keywords: ['infrastructure', 'scalability', 'operational efficiency'] },
        { text: 'Team expansion strategies during rapid growth phases often face challenges in maintaining company culture and productivity.', keywords: ['team expansion', 'growth phases', 'company culture'] },
        { text: 'Innovation metrics show that companies investing in R&D see 40% higher market valuation compared to industry averages.', keywords: ['innovation', 'research development', 'market valuation'] },
        { text: 'User experience improvements correlate strongly with customer retention rates, according to longitudinal studies.', keywords: ['user experience', 'customer retention', 'studies'] }
      ];

      return allSourcePoints
        .map((point, index) => ({
          ...point,
          score: keywordMatch(point.text) + (point.keywords.some(k => keywords.some(uk => uk.includes(k) || k.includes(uk))) ? 5 : 0)
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 8)
        .map((point, index) => ({
          id: `s${index + 1}`,
          text: point.text,
          source: sources[index % sources.length]?.title || `External Source ${index + 1}`,
          status: Math.random() > 0.3 ? 'VERIFIED' : (Math.random() > 0.5 ? 'UNVERIFIED' : 'NEEDS REVIEW'),
          type: 'source' as const,
        }));
    }
  };

  const extractKeyPoints = async () => {
    setIsExtracting(true);
    setShowFocusInput(false);
    
    // Extract keywords and ideas from article focus
    const focusKeywords = extractFocusKeywords(articleFocus);
    setExtractedKeywords(focusKeywords);
    
    // Simulate AI key point extraction guided by article focus and keywords
    setTimeout(() => {
      // Generate key points that align with the user's focus and extracted keywords
      const transcriptPoints = generateFocusedKeyPoints('transcript', focusKeywords);
      const sourcePoints = generateFocusedKeyPoints('source', focusKeywords);
      
      const allKeyPoints = [...transcriptPoints, ...sourcePoints];
      onKeyPointsChange(allKeyPoints);
      setIsExtracting(false);
      toast({
        title: "Key points extracted",
        description: `Extracted ${transcriptPoints.length} transcript points and ${sourcePoints.length} source points based on your article focus`,
      });
    }, 3000);
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
          Analyzing your transcript and sources based on your focus: "{articleFocus}"
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
          Based on your focus "{articleFocus}", we've extracted {transcriptPoints.length} key insights from your transcript and {sourcePoints.length} from your sources. 
          Review, edit, and verify them before proceeding.
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