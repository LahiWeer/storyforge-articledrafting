import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { GripVertical, CheckCircle, AlertTriangle, Edit2, Save, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface KeyPoint {
  id: string;
  text: string;
  sources: string[];
  verified: boolean;
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
  const { toast } = useToast();

  const extractKeyPoints = async () => {
    setIsExtracting(true);
    
    // Simulate AI key point extraction
    setTimeout(() => {
      const mockKeyPoints: KeyPoint[] = [
        {
          id: '1',
          text: 'The interviewee emphasized the importance of user feedback in product development',
          sources: [sources[0]?.id || ''],
          verified: true,
        },
        {
          id: '2',
          text: 'Market research shows 78% increase in customer satisfaction after implementing new features',
          sources: [sources[0]?.id || ''],
          verified: false,
        },
        {
          id: '3',
          text: 'Company plans to expand to three new markets in Q2 2024',
          sources: [],
          verified: false,
        },
        {
          id: '4',
          text: 'Technical challenges included scalability issues with the current infrastructure',
          sources: [sources[0]?.id || ''],
          verified: true,
        },
        {
          id: '5',
          text: 'Team size doubled from 12 to 24 employees in the past year',
          sources: [],
          verified: false,
        },
      ];
      
      onKeyPointsChange(mockKeyPoints);
      setIsExtracting(false);
      toast({
        title: "Key points extracted",
        description: "Review and approve the insights below",
      });
    }, 3000);
  };

  useEffect(() => {
    if (keyPoints.length === 0 && transcript && sources.length > 0) {
      extractKeyPoints();
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
    if (point.sources.length === 0) {
      return { icon: AlertTriangle, color: 'text-warning', label: 'UNVERIFIED' };
    }
    return point.verified 
      ? { icon: CheckCircle, color: 'text-success', label: 'VERIFIED' }
      : { icon: AlertTriangle, color: 'text-warning', label: 'NEEDS REVIEW' };
  };

  if (isExtracting) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
          <CheckCircle className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-heading font-semibold mb-2">Extracting Key Points</h2>
        <p className="text-muted-foreground mb-6">
          Analyzing your transcript and sources to identify key insights...
        </p>
        <div className="w-64 h-2 bg-muted rounded-full mx-auto overflow-hidden">
          <div className="h-full bg-gradient-primary rounded-full animate-pulse" style={{ width: '60%' }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
        <h2 className="text-3xl font-heading font-semibold mb-2 text-foreground">
          Review Key Points
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          We've extracted {keyPoints.length} key insights from your transcript and sources. 
          Review, edit, and approve them before proceeding.
        </p>
      </div>

      <div className="grid gap-4">
        {keyPoints.map((point, index) => {
          const status = getVerificationStatus(point);
          const StatusIcon = status.icon;
          
          return (
            <Card key={point.id} className={`p-6 transition-all ${
              point.sources.length === 0 ? 'border-warning/30 bg-warning/5' : 'hover:bg-card-hover'
            }`}>
              <div className="flex items-start gap-4">
                <div className="flex items-center gap-2 mt-1">
                  <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                  <span className="text-sm font-medium text-muted-foreground min-w-[2rem]">
                    {index + 1}
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
                          
                          {point.sources.length > 0 && (
                            <div className="flex gap-1">
                              {point.sources.map(sourceId => (
                                <Badge key={sourceId} variant="outline" className="text-xs">
                                  {getSourceTitle(sourceId)}
                                </Badge>
                              ))}
                            </div>
                          )}
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
                    checked={point.verified}
                    onCheckedChange={(checked) => 
                      updateKeyPoint(point.id, { verified: checked as boolean })
                    }
                  />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{keyPoints.filter(p => p.verified).length} of {keyPoints.length} verified</span>
          <span>{keyPoints.filter(p => p.sources.length === 0).length} need sources</span>
        </div>
        <Button
          variant="outline"
          onClick={extractKeyPoints}
          disabled={isExtracting}
        >
          Re-extract Points
        </Button>
      </div>
    </div>
  );
};