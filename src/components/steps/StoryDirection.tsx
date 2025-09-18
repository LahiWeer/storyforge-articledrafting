import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Compass, Target, PenTool, Plus, X } from 'lucide-react';

interface StoryDirectionData {
  tone: string;
  angle: string;
  length: string;
  customPrompt?: string;
  customTones?: string[];
  customAngle?: string;
}

interface StoryDirectionProps {
  direction: StoryDirectionData;
  onDirectionChange: (direction: StoryDirectionData) => void;
}

const toneOptions = [
  { value: 'professional', label: 'Professional', description: 'Formal, business-focused writing' },
  { value: 'conversational', label: 'Conversational', description: 'Friendly, approachable tone' },
  { value: 'analytical', label: 'Analytical', description: 'Data-driven, objective analysis' },
  { value: 'narrative', label: 'Narrative', description: 'Story-driven, engaging style' },
  { value: 'investigative', label: 'Investigative', description: 'In-depth, questioning approach' },
  { value: 'other', label: 'Other', description: 'Add one or more custom tones to combine different writing styles' },
];

const angleOptions = [
  { value: 'success-story', label: 'Success Story', description: 'Focus on achievements and positive outcomes' },
  { value: 'challenges-overcome', label: 'Challenges Overcome', description: 'Highlight obstacles and solutions' },
  { value: 'innovation-focus', label: 'Innovation Focus', description: 'Emphasize new ideas and creativity' },
  { value: 'human-impact', label: 'Human Impact', description: 'Center on people and personal stories' },
  { value: 'market-analysis', label: 'Market Analysis', description: 'Business and industry perspective' },
  { value: 'behind-scenes', label: 'Behind the Scenes', description: 'Inside look at processes and decisions' },
  { value: 'other', label: 'Other', description: 'description: 'Provide your own unique story angle' },
];

const lengthOptions = [
  { value: 'brief', label: 'Brief Article', description: '500-800 words • 3-4 minutes read' },
  { value: 'standard', label: 'Standard Article', description: '800-1,200 words • 4-6 minutes read' },
  { value: 'in-depth', label: 'In-depth Feature', description: '1,200-2,000 words • 6-10 minutes read' },
];

export const StoryDirection = ({ direction, onDirectionChange }: StoryDirectionProps) => {
  const [showCustomPrompt, setShowCustomPrompt] = useState(false);
  const [showCustomTone, setShowCustomTone] = useState(false);
  const [showCustomAngle, setShowCustomAngle] = useState(false);
  const [customToneInput, setCustomToneInput] = useState('');

  const updateDirection = (updates: Partial<StoryDirectionData>) => {
    onDirectionChange({ ...direction, ...updates });
  };

  const addCustomTone = () => {
    if (customToneInput.trim()) {
      const currentTones = direction.customTones || [];
      updateDirection({ customTones: [...currentTones, customToneInput.trim()] });
      setCustomToneInput('');
    }
  };

  const removeCustomTone = (index: number) => {
    const currentTones = direction.customTones || [];
    updateDirection({ customTones: currentTones.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <Compass className="w-16 h-16 text-primary mx-auto mb-4" />
        <h2 className="text-3xl font-heading font-semibold mb-2 text-foreground">
          Set Your Story Direction
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Define the tone, angle, and approach for your article. This will guide how your 
          key points are woven into a compelling narrative.
        </p>
      </div>

      <div className="grid gap-8">
        {/* Tone Selection */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <PenTool className="w-5 h-5 text-primary" />
            <h3 className="text-xl font-semibold">Writing Tone</h3>
          </div>
          <p className="text-muted-foreground mb-6">
            Choose the overall tone and voice for your article
          </p>
          
          <RadioGroup
            value={direction.tone}
            onValueChange={(value) => updateDirection({ tone: value })}
            className="grid md:grid-cols-2 gap-4"
          >
            {toneOptions.map((option) => (
              <div key={option.value} className="flex items-center space-x-3">
                <RadioGroupItem value={option.value} id={`tone-${option.value}`} />
                <div className="flex-1">
                  <Label 
                    htmlFor={`tone-${option.value}`}
                    className="text-base font-medium cursor-pointer"
                  >
                    {option.label}
                  </Label>
                  <p className="text-sm text-muted-foreground">{option.description}</p>
                </div>
              </div>
            ))}
          </RadioGroup>

          {/* Custom Writing Tone */}
          <div className="mt-6 pt-6 border-t border-border">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-medium">Custom Writing Tones</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCustomTone(!showCustomTone)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Custom Tone
              </Button>
            </div>
            
            {showCustomTone && (
              <div className="space-y-3 mb-4">
                <div className="flex gap-2">
                  <Input
                    value={customToneInput}
                    onChange={(e) => setCustomToneInput(e.target.value)}
                    placeholder="e.g., Humorous, Technical, Inspirational..."
                    onKeyPress={(e) => e.key === 'Enter' && addCustomTone()}
                  />
                  <Button onClick={addCustomTone} size="sm">
                    Add
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Add multiple custom tones to combine different writing styles in your article
                </p>
              </div>
            )}

            {direction.customTones && direction.customTones.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Custom Tones:</Label>
                <div className="flex flex-wrap gap-2">
                  {direction.customTones.map((tone, index) => (
                    <div key={index} className="flex items-center gap-1 bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm">
                      <span>{tone}</span>
                      <button
                        onClick={() => removeCustomTone(index)}
                        className="hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Angle Selection */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-primary" />
            <h3 className="text-xl font-semibold">Story Angle</h3>
          </div>
          <p className="text-muted-foreground mb-6">
            Select the primary focus or perspective for your article
          </p>
          
          <RadioGroup
            value={direction.angle}
            onValueChange={(value) => updateDirection({ angle: value })}
            className="grid gap-4"
          >
            {angleOptions.map((option) => (
              <div key={option.value} className="flex items-center space-x-3">
                <RadioGroupItem value={option.value} id={`angle-${option.value}`} />
                <div className="flex-1">
                  <Label 
                    htmlFor={`angle-${option.value}`}
                    className="text-base font-medium cursor-pointer"
                  >
                    {option.label}
                  </Label>
                  <p className="text-sm text-muted-foreground">{option.description}</p>
                </div>
              </div>
            ))}
          </RadioGroup>

          {/* Custom Story Angle */}
          <div className="mt-6 pt-6 border-t border-border">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-medium">Custom Story Angle</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCustomAngle(!showCustomAngle)}
              >
                {showCustomAngle ? 'Hide' : 'Add Custom Angle'}
              </Button>
            </div>
            
            {showCustomAngle && (
              <div className="space-y-2">
                <Label htmlFor="custom-angle">Describe your unique story perspective</Label>
                <Textarea
                  id="custom-angle"
                  value={direction.customAngle || ''}
                  onChange={(e) => updateDirection({ customAngle: e.target.value })}
                  placeholder="e.g., 'Focus on the environmental impact of the innovation', 'Explore the competitive landscape and market positioning', 'Highlight the personal journey and lessons learned'..."
                  className="min-h-[80px]"
                />
                <p className="text-xs text-muted-foreground">
                  Define a custom angle that will shape the narrative focus of your article
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Length Selection */}
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">Article Length</h3>
          <p className="text-muted-foreground mb-6">
            Choose your target article length
          </p>
          
          <RadioGroup
            value={direction.length}
            onValueChange={(value) => updateDirection({ length: value })}
            className="grid gap-4"
          >
            {lengthOptions.map((option) => (
              <div key={option.value} className="flex items-center space-x-3">
                <RadioGroupItem value={option.value} id={`length-${option.value}`} />
                <div className="flex-1">
                  <Label 
                    htmlFor={`length-${option.value}`}
                    className="text-base font-medium cursor-pointer"
                  >
                    {option.label}
                  </Label>
                  <p className="text-sm text-muted-foreground">{option.description}</p>
                </div>
              </div>
            ))}
          </RadioGroup>
        </Card>

        {/* Custom Direction */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">Custom Instructions</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCustomPrompt(!showCustomPrompt)}
              >
                {showCustomPrompt ? 'Hide' : 'Add Custom'}
              </Button>
            </div>
            
            {showCustomPrompt && (
              <div className="space-y-2">
                <Label htmlFor="custom-prompt">Additional directions or specific requirements</Label>
                <Textarea
                  id="custom-prompt"
                  value={direction.customPrompt || ''}
                  onChange={(e) => updateDirection({ customPrompt: e.target.value })}
                  placeholder="e.g., 'Include quotes from the CEO', 'Focus on the technical aspects', 'Emphasize the customer benefits'..."
                  className="min-h-[100px]"
                />
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Preview */}
      {direction.tone && direction.angle && direction.length && (
        <Card className="p-6 bg-gradient-secondary border-secondary">
          <h4 className="font-semibold mb-2 text-secondary-foreground">Story Direction Summary</h4>
          <div className="space-y-1 text-sm text-secondary-foreground">
            <p><strong>Tone:</strong> {toneOptions.find(t => t.value === direction.tone)?.label}</p>
            {direction.customTones && direction.customTones.length > 0 && (
              <p><strong>Custom Tones:</strong> {direction.customTones.join(', ')}</p>
            )}
            <p><strong>Angle:</strong> {angleOptions.find(a => a.value === direction.angle)?.label}</p>
            {direction.customAngle && (
              <p><strong>Custom Angle:</strong> {direction.customAngle}</p>
            )}
            <p><strong>Length:</strong> {lengthOptions.find(l => l.value === direction.length)?.label}</p>
            {direction.customPrompt && (
              <p><strong>Custom Instructions:</strong> {direction.customPrompt}</p>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};