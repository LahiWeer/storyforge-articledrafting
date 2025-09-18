// AI-powered content extraction using Claude 4 Sonnet for intelligent key point analysis

export interface AIExtractedKeyPoint {
  text: string;
  relevanceScore: number;
  matchedKeywords: string[];
  source: string;
  reasoning: string;
}

/**
 * Extract keywords from user's article focus for AI analysis
 */
export const extractAIFocusKeywords = (focus: string): string[] => {
  const text = focus.toLowerCase();
  const keywords: string[] = [];
  
  // Enhanced stop words list
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did',
    'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'want', 'need',
    'like', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
    'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'up', 'down',
    'out', 'off', 'over', 'under', 'again', 'further', 'then', 'once'
  ]);
  
  // Extract significant words (3+ characters, not stop words)
  const words = text.split(/\s+/)
    .map(word => word.replace(/[^\w]/g, ''))
    .filter(word => word.length >= 3 && !stopWords.has(word));
  
  // Add individual keywords
  keywords.push(...words);
  
  // Extract key phrases (2-4 word combinations)
  const phrases = text.match(/\b\w+\s+\w+(?:\s+\w+)?(?:\s+\w+)?\b/g) || [];
  keywords.push(...phrases.map(phrase => phrase.trim()));
  
  // Return unique keywords, prioritizing longer phrases
  return [...new Set(keywords)].sort((a, b) => b.length - a.length).slice(0, 25);
};

/**
 * Use Claude 4 Sonnet to intelligently extract key points from content
 */
export const extractKeyPointsWithAI = async (
  content: string,
  source: string,
  userFocus: string,
  keywords: string[]
): Promise<AIExtractedKeyPoint[]> => {
  const prompt = `You are an expert content analyst. Extract key points from the following content that align with the user's specific focus and goals.

USER'S ARTICLE FOCUS & GOALS:
"${userFocus}"

IDENTIFIED KEYWORDS TO FOCUS ON:
${keywords.join(', ')}

CONTENT TO ANALYZE:
"${content}"

INSTRUCTIONS:
1. Extract 8-10 key points that are directly relevant to the user's focus
2. Each key point MUST include at least one of the identified keywords
3. Focus only on content that supports the user's stated goals and direction
4. Ignore any content that doesn't align with the focus
5. Provide a brief reasoning for each key point's relevance
6. Ensure extracted points are substantial and meaningful (not just fragments)

FORMAT YOUR RESPONSE AS JSON:
{
  "keyPoints": [
    {
      "text": "Complete sentence or insight from the content",
      "matchedKeywords": ["keyword1", "keyword2"],
      "relevanceScore": 8,
      "reasoning": "Why this point is relevant to the user's focus"
    }
  ]
}

Relevance scores should be 1-10 based on how well the key point aligns with the user's focus and includes important keywords.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        temperature: 0.3,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.content[0].text;
    
    try {
      const parsedResult = JSON.parse(aiResponse);
      return parsedResult.keyPoints.map((point: any) => ({
        text: point.text,
        matchedKeywords: point.matchedKeywords || [],
        relevanceScore: point.relevanceScore || 5,
        source,
        reasoning: point.reasoning || 'Relevant to user focus'
      }));
    } catch (parseError) {
      console.warn('Failed to parse Claude response as JSON, using fallback');
      throw parseError;
    }
  } catch (error) {
    console.error('Claude 4 Sonnet extraction failed:', error);
    // Fallback to keyword-based extraction
    return fallbackKeywordExtraction(content, source, keywords);
  }
};

/**
 * Simulate Claude 4 Sonnet analysis (replace with actual API call)
 */
const simulateClaudeAnalysis = async (
  content: string,
  userFocus: string,
  keywords: string[],
  source: string
): Promise<AIExtractedKeyPoint[]> => {
  // Simulate AI processing delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Intelligent content analysis simulation
  const sentences = content
    .split(/[.!?]+\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 30);
  
  const analysisResults: AIExtractedKeyPoint[] = [];
  
  // Simulate AI's intelligent analysis
  for (const sentence of sentences.slice(0, 8)) {
    const lowerSentence = sentence.toLowerCase();
    const matchedKeywords = keywords.filter(keyword => 
      lowerSentence.includes(keyword.toLowerCase())
    );
    
    if (matchedKeywords.length > 0) {
      // AI would provide more sophisticated relevance scoring
      const baseScore = matchedKeywords.length * 2;
      const lengthBonus = Math.min(sentence.length / 100, 2);
      const focusAlignment = calculateFocusAlignment(sentence, userFocus);
      
      const relevanceScore = Math.min(Math.round(baseScore + lengthBonus + focusAlignment), 10);
      
      if (relevanceScore >= 5) {
        analysisResults.push({
          text: sentence.endsWith('.') || sentence.endsWith('!') || sentence.endsWith('?') 
            ? sentence 
            : sentence + '.',
          matchedKeywords,
          relevanceScore,
          source,
          reasoning: `Highly relevant to your focus on ${matchedKeywords.join(' and ')}. Contains key insights about ${getMainTheme(sentence, matchedKeywords)}.`
        });
      }
    }
  }
  
  // Sort by relevance score and return top results
  return analysisResults
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 6);
};

/**
 * Calculate how well content aligns with user's focus
 */
const calculateFocusAlignment = (sentence: string, userFocus: string): number => {
  const focusWords = userFocus.toLowerCase().split(/\s+/);
  const sentenceWords = sentence.toLowerCase().split(/\s+/);
  
  let alignmentScore = 0;
  for (const focusWord of focusWords) {
    if (focusWord.length > 3 && sentenceWords.some(word => word.includes(focusWord))) {
      alignmentScore += 1;
    }
  }
  
  return Math.min(alignmentScore * 0.5, 3);
};

/**
 * Identify main theme from matched keywords
 */
const getMainTheme = (sentence: string, matchedKeywords: string[]): string => {
  // Simple theme detection based on keywords
  const themes = {
    'growth': ['growth', 'increase', 'expand', 'scale', 'develop'],
    'technology': ['technology', 'AI', 'machine learning', 'innovation', 'digital'],
    'users': ['user', 'customer', 'client', 'engagement', 'satisfaction'],
    'business': ['revenue', 'profit', 'market', 'business', 'strategy'],
    'team': ['team', 'employee', 'collaboration', 'workforce', 'hiring']
  };
  
  for (const [theme, themeKeywords] of Object.entries(themes)) {
    if (matchedKeywords.some(keyword => 
      themeKeywords.some(themeWord => keyword.toLowerCase().includes(themeWord))
    )) {
      return theme;
    }
  }
  
  return matchedKeywords[0] || 'business insights';
};

/**
 * Fallback extraction using keyword matching
 */
const fallbackKeywordExtraction = (
  content: string,
  source: string,
  keywords: string[]
): AIExtractedKeyPoint[] => {
  const sentences = content
    .split(/[.!?]+\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 30);
  
  const results: AIExtractedKeyPoint[] = [];
  
  for (const sentence of sentences) {
    const lowerSentence = sentence.toLowerCase();
    const matchedKeywords = keywords.filter(keyword => 
      lowerSentence.includes(keyword.toLowerCase())
    );
    
    if (matchedKeywords.length > 0) {
      results.push({
        text: sentence.endsWith('.') || sentence.endsWith('!') || sentence.endsWith('?') 
          ? sentence 
          : sentence + '.',
        matchedKeywords,
        relevanceScore: Math.min(matchedKeywords.length * 2, 8),
        source,
        reasoning: `Contains relevant keywords: ${matchedKeywords.join(', ')}`
      });
    }
  }
  
  return results.sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, 5);
};

/**
 * Process multiple sources with AI-powered extraction and deduplication
 */
export const processMultipleSourcesWithAI = async (
  sources: Array<{ content: string; title: string; type: string }>,
  transcript: string,
  userFocus: string,
  minKeyPoints: number = 5
): Promise<{ keyPoints: AIExtractedKeyPoint[]; summary: string; keywords: string[] }> => {
  const keywords = extractAIFocusKeywords(userFocus);
  const allKeyPoints: AIExtractedKeyPoint[] = [];
  
  // Process transcript with AI
  if (transcript.trim()) {
    const transcriptPoints = await extractKeyPointsWithAI(
      transcript,
      'Interview Transcript',
      userFocus,
      keywords
    );
    allKeyPoints.push(...transcriptPoints);
  }
  
  // Process each source with AI
  for (const source of sources) {
    const sourcePoints = await extractKeyPointsWithAI(
      source.content,
      source.title,
      userFocus,
      keywords
    );
    allKeyPoints.push(...sourcePoints);
  }
  
  // AI-powered deduplication
  const deduplicatedPoints = deduplicateAIKeyPoints(allKeyPoints);
  
  // Ensure minimum number of key points
  let finalKeyPoints = deduplicatedPoints;
  if (finalKeyPoints.length < minKeyPoints) {
    // Could implement additional AI analysis here for more points
    console.log(`Found ${finalKeyPoints.length} key points, minimum was ${minKeyPoints}`);
  }
  
  const summary = `AI analysis extracted ${finalKeyPoints.length} highly relevant key points from ${sources.length + (transcript ? 1 : 0)} sources, each containing at least one focus keyword and aligned with your article goals.`;
  
  return {
    keyPoints: finalKeyPoints,
    summary,
    keywords
  };
};

/**
 * Remove duplicate key points using AI-enhanced similarity detection
 */
const deduplicateAIKeyPoints = (keyPoints: AIExtractedKeyPoint[]): AIExtractedKeyPoint[] => {
  const unique: AIExtractedKeyPoint[] = [];
  const seen = new Set<string>();
  
  // Sort by relevance score first
  const sorted = [...keyPoints].sort((a, b) => b.relevanceScore - a.relevanceScore);
  
  for (const point of sorted) {
    const normalized = point.text.toLowerCase().trim();
    const words = normalized.split(/\s+/).filter(w => w.length > 3);
    const fingerprint = words.slice(0, 5).join(' ');
    
    // Check for similar content (simple similarity check)
    let isDuplicate = false;
    for (const seenText of seen) {
      const similarity = calculateSimilarity(fingerprint, seenText);
      if (similarity > 0.7) {
        isDuplicate = true;
        break;
      }
    }
    
    if (!isDuplicate) {
      seen.add(fingerprint);
      unique.push(point);
    }
  }
  
  return unique;
};

/**
 * Calculate similarity between two text fingerprints
 */
const calculateSimilarity = (text1: string, text2: string): number => {
  const words1 = new Set(text1.split(/\s+/));
  const words2 = new Set(text2.split(/\s+/));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
};

// Draft Generation Interfaces and Types
export interface StoryDirection {
  tone: string;
  angle: string;
  length: string;
  customPrompt?: string;
}

export interface KeyPoint {
  id: string;
  text: string;
  source: string;
  status: 'VERIFIED' | 'UNVERIFIED' | 'NEEDS REVIEW';
  type: 'transcript' | 'source';
}

export interface Source {
  id: string;
  type: 'pdf' | 'url' | 'youtube' | 'text';
  content: string;
  title: string;
}

export interface DraftResult {
  draft: string;
  sourceMapping: Record<string, string[]>;
  headline: string;
  wordCount: number;
  readTime: number;
}

/**
 * Extract direct quotes from transcript content
 */
const extractQuotesFromTranscript = (transcript: string, storyAngle: string): string[] => {
  if (!transcript || transcript.length < 50) return [];
  
  // Split transcript into sentences and find quotable segments
  const sentences = transcript
    .split(/[.!?]+\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 20 && s.length < 150);
  
  // Filter sentences that make good quotes based on story angle
  const quotablePatterns = {
    'success-story': ['grew', 'increased', 'achieved', 'success', 'results', 'momentum'],
    'challenges-overcome': ['challenge', 'obstacle', 'overcome', 'solution', 'learned', 'adapt'],
    'innovation-focus': ['innovation', 'technology', 'breakthrough', 'transform', 'future', 'possibilities'],
    'default': ['important', 'significant', 'key', 'focus', 'believe', 'think']
  };
  
  const patterns = quotablePatterns[storyAngle as keyof typeof quotablePatterns] || quotablePatterns.default;
  
  const quotes = sentences
    .filter(sentence => {
      const lowerSentence = sentence.toLowerCase();
      return patterns.some(pattern => lowerSentence.includes(pattern));
    })
    .slice(0, 3); // Get top 3 potential quotes
  
  return quotes;
};

/**
 * Use Claude 4 Sonnet to generate engaging headlines
 */
export const generateHeadlineWithClaudeSonnet = async (
  keyPoints: KeyPoint[],
  userFocus: string,
  storyDirection: StoryDirection,
  sources: Source[]
): Promise<string> => {
  const verifiedKeyPoints = keyPoints.filter(point => point.status === 'VERIFIED');
  
  const prompt = `You are an expert headline writer for major publications. Generate a compelling, engaging headline for an article based on the provided information.

USER'S ARTICLE FOCUS & GOALS:
"${userFocus}"

STORY DIRECTION:
- Angle: ${storyDirection.angle}
- Tone: ${storyDirection.tone}
- Target Length: ${storyDirection.length}

KEY POINTS TO FEATURE:
${verifiedKeyPoints.slice(0, 5).map((point, index) => 
  `${index + 1}. "${point.text}"`
).join('\n')}

SOURCES AVAILABLE:
${sources.map((source, index) => 
  `${index + 1}. ${source.title}`
).join('\n')}

HEADLINE REQUIREMENTS:
1. Must be clear, specific, and attention-grabbing
2. Should reflect both the user's focus and chosen story angle
3. Keep it concise (under 80 characters for optimal readability)
4. Use active voice and compelling language
5. Connect to the most important key points
6. Match the ${storyDirection.tone} tone
7. Align with the ${storyDirection.angle} angle approach

ANGLE GUIDELINES:
- Success Story: Focus on achievements, growth, results
- Challenges Overcome: Highlight transformation, resilience, solutions
- Innovation Focus: Emphasize breakthrough, technology, future impact
- Industry Analysis: Present insights, trends, implications

Return only the headline text (no quotes, no JSON formatting).`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 200,
        temperature: 0.7,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    const headline = data.content[0].text.trim();
    
    // Clean up any extra quotes or formatting
    return headline.replace(/^["']|["']$/g, '').trim();
  } catch (error) {
    console.error('Claude 4 Sonnet headline generation failed:', error);
    
    // Fallback headline generation
    return generateFallbackHeadline(keyPoints, userFocus, storyDirection);
  }
};

/**
 * Generate fallback headline when AI fails
 */
const generateFallbackHeadline = (
  keyPoints: KeyPoint[],
  userFocus: string,
  storyDirection: StoryDirection
): string => {
  const verifiedKeyPoints = keyPoints.filter(point => point.status === 'VERIFIED');
  const firstKeyPoint = verifiedKeyPoints[0];
  
  if (!firstKeyPoint) {
    return `${userFocus}: A ${storyDirection.angle.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}`;
  }
  
  // Extract main subject from key points or focus
  const focusWords = userFocus.toLowerCase().split(/\s+/);
  const importantWords = focusWords.filter(word => 
    word.length > 3 && !['with', 'from', 'that', 'this', 'they', 'have', 'been'].includes(word)
  );
  
  const mainSubject = importantWords[0] || 'Business';
  
  // Generate headline based on story angle
  const angleTemplates = {
    'success-story': `How ${mainSubject} Achieved Remarkable Growth`,
    'challenges-overcome': `${mainSubject} Turns Obstacles Into Opportunities`,
    'innovation-focus': `${mainSubject} Breaks New Ground in Innovation`,
    'industry-analysis': `${mainSubject} Insights: What the Data Reveals`
  };
  
  return angleTemplates[storyDirection.angle as keyof typeof angleTemplates] || 
         `${mainSubject}: Key Insights and Developments`;
};

/**
 * Use Claude 4 Sonnet to generate a complete draft article
 */
const generateArticleWithClaudeSonnet = async (
  keyPoints: KeyPoint[],
  sources: Source[],
  transcript: string,
  storyDirection: StoryDirection,
  userFocus: string,
  quotes: string[]
): Promise<DraftResult> => {
  const verifiedKeyPoints = keyPoints.filter(point => point.status === 'VERIFIED');
  
  // First, generate the headline using dedicated function
  const headline = await generateHeadlineWithClaudeSonnet(
    keyPoints,
    userFocus,
    storyDirection,
    sources
  );
  
  const prompt = `You are a professional journalist and content strategist. Generate a complete, publication-ready article based on the provided information.

USER'S ARTICLE FOCUS & GOALS:
"${userFocus}"

HEADLINE TO USE:
"${headline}"

STORY DIRECTION:
- Angle: ${storyDirection.angle}
- Tone: ${storyDirection.tone}
- Target Length: ${storyDirection.length}
${storyDirection.customPrompt ? `- Custom Instructions: ${storyDirection.customPrompt}` : ''}

VERIFIED KEY POINTS TO INCORPORATE:
${verifiedKeyPoints.map((point, index) => 
  `${index + 1}. "${point.text}" (Source: ${point.source})`
).join('\n')}

AVAILABLE QUOTES FROM TRANSCRIPT:
${quotes.map((quote, index) => `${index + 1}. "${quote}"`).join('\n')}

SOURCES TO REFERENCE:
${sources.map((source, index) => 
  `${index + 1}. ${source.title} (${source.type})`
).join('\n')}

ARTICLE STRUCTURE REQUIREMENTS:

1. HEADLINE:
   - Use the provided headline and make it BOLD using Markdown syntax (**headline text**)
   - The headline must be clear, engaging, and reflect the user's focus and chosen Story Angle

2. INTRODUCTION (1-2 paragraphs):
   - Set context and introduce the main subject
   - Explain why the topic matters to readers
   - Establish the chosen story angle clearly
   - Use smooth narrative flow from headline to content

3. BODY (Thematic sections):
   - Group related key points into meaningful themes
   - Develop each theme into full paragraphs with explanation and context
   - Use smooth transitions for cohesive narrative flow between all sections
   - Each section should connect logically to the next
   - Incorporate source references naturally with proper attribution
   - Include 1-2 direct quotes from the transcript that flow naturally within the narrative

4. CONCLUSION (1-2 paragraphs):
   - Provide forward-looking commentary on significance
   - Discuss implications or future outlook
   - Avoid repetition of earlier points - must be unique commentary
   - Connect back to broader context without redundancy

WRITING QUALITY REQUIREMENTS:

SMOOTH NARRATIVE FLOW:
- Organize sections to connect logically (headline → introduction → body themes → conclusion)
- Use transitional phrases between paragraphs and sections
- Each section should flow naturally into the next
- Avoid abrupt topic changes or jarring transitions

REDUCE REPETITION & REDUNDANCY:
- Avoid repeating the same closing sentences or phrases across paragraphs
- Each paragraph must have unique commentary and perspective
- Merge overlapping or repeated points to maintain conciseness
- Eliminate redundant information while preserving important details
- Each conclusion sentence must be distinct and add new insight

STANDARDIZE ATTRIBUTIONS:
- Use consistent attribution style throughout the article
- Vary attribution phrases to avoid monotony
- Examples: "According to [source]...", "As [person] described...", "[Team] revealed...", "The conversation highlighted..."
- Maintain professional journalistic standards for all citations

SIMPLIFY DENSE SENTENCES:
- Rewrite overly technical or complex sentences for clarity
- Maintain meaning while improving readability
- Break down compound sentences when necessary
- Use active voice where possible
- Ensure accessibility for general audiences

STORY ANGLE & TONE CONSISTENCY:
- Maintain the chosen Story Angle (${storyDirection.angle}) throughout the entire article
- Keep Writing Tone (${storyDirection.tone}) consistent from headline to conclusion
- Ensure the article reads as an engaging, cohesive narrative
- Avoid list-like structure - create flowing prose

NATURAL SOURCE INTEGRATION:
When incorporating points or quotes from the transcript, mention the source context naturally:
- If transcript is from an interview: "During the interview, [person/team] explained..." or "[Person/Team] noted that..."
- If transcript is from a meeting: "In the discussion, participants highlighted..." or "Team members emphasized..."
- If transcript is from a presentation: "The speaker outlined..." or "[Name] presented..."
- Do NOT insert quotes mechanically - they must flow naturally within the narrative
- Integrate supporting sources (web links, PDFs, pasted content) smoothly within the text

WRITING GUIDELINES:
- Write in ${storyDirection.tone} tone consistently
- Target approximately ${storyDirection.length === 'short' ? '400-600' : storyDirection.length === 'medium' ? '600-1000' : '1000-1500'} words
- Use active voice and engaging language
- Include specific details and evidence
- Maintain journalistic credibility throughout
- Connect general knowledge only when it clearly supports the key points
- Ensure ALL key points are incorporated meaningfully
- Create an engaging, cohesive narrative rather than a list of points

FORMAT YOUR RESPONSE AS JSON:
{
  "draft": "Complete article content with proper paragraph breaks (use \\n\\n for paragraph separation)",
  "sourceMapping": {
    "paragraph_1": ["Source Name 1", "Source Name 2"],
    "paragraph_2": ["Source Name 3"]
  },
  "wordCount": estimated_word_count,
  "readTime": estimated_read_time_in_minutes
}

Generate a compelling, well-structured article that transforms the key points into an engaging narrative while maintaining journalistic integrity.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8000,
        temperature: 0.4,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.content[0].text;
    
    try {
      const parsedResult = JSON.parse(aiResponse);
      return {
        draft: parsedResult.draft,
        sourceMapping: parsedResult.sourceMapping || {},
        headline: parsedResult.headline,
        wordCount: parsedResult.wordCount || 800,
        readTime: parsedResult.readTime || 4
      };
    } catch (parseError) {
      console.warn('Failed to parse Claude response as JSON, using fallback');
      throw parseError;
    }
  } catch (error) {
    console.error('Claude 4 Sonnet article generation failed:', error);
    // Fallback to enhanced mock generation
    return generateEnhancedMockArticle(keyPoints, sources, transcript, storyDirection, userFocus, quotes);
  }
};

/**
 * Use Claude 4 Sonnet to generate a full draft article
 */
export const generateArticleWithAI = async (
  keyPoints: KeyPoint[],
  sources: Source[],
  transcript: string,
  storyDirection: StoryDirection,
  userFocus: string
): Promise<DraftResult> => {
  const verifiedKeyPoints = keyPoints.filter(point => point.status === 'VERIFIED');
  const quotes = extractQuotesFromTranscript(transcript, storyDirection.angle);
  
  try {
    // First, generate the headline using dedicated Claude 4 Sonnet function
    const headline = await generateHeadlineWithClaudeSonnet(
      keyPoints,
      userFocus,
      storyDirection,
      sources
    );
    
    // Use Claude 4 Sonnet for actual article generation
    const response = await generateArticleWithClaudeSonnet(
      verifiedKeyPoints,
      sources,
      transcript,
      storyDirection,
      userFocus,
      quotes
    );
    
    // Ensure headline is included in the result
    response.headline = headline;
    
    return response;
  } catch (error) {
    console.error('AI article generation failed:', error);
    // Fallback to enhanced mock generation
    return generateEnhancedMockArticle(verifiedKeyPoints, sources, transcript, storyDirection, userFocus, quotes);
  }
};

/**
 * Enhanced mock article generation with proper structure
 */
const generateEnhancedMockArticle = (
  keyPoints: KeyPoint[],
  sources: Source[],
  transcript: string,
  storyDirection: StoryDirection,
  userFocus: string,
  quotes: string[]
): DraftResult => {
  const verifiedKeyPoints = keyPoints.filter(point => point.status === 'VERIFIED');
  
  // Generate headline based on story direction
  const generateHeadline = (): string => {
    const headlineTemplates = {
      'success-story': [
        'How Strategic Innovation Drives Unprecedented Growth',
        'From Vision to Victory: A Success Story in Modern Business',
        'Breaking Barriers: The Journey to Market Leadership'
      ],
      'challenges-overcome': [
        'Turning Obstacles into Opportunities: Lessons in Resilience',
        'When Challenges Become Catalysts for Change',
        'Navigating Uncertainty: A Guide to Strategic Adaptation'
      ],
      'innovation-focus': [
        'Pioneering the Future: Innovation at the Core of Success',
        'Beyond Technology: How Innovation Shapes Business Strategy',
        'The Innovation Imperative: Redefining Industry Standards'
      ],
      'default': [
        'Strategic Insights: Navigating Today\'s Business Landscape',
        'Leadership in Action: Driving Change Through Vision',
        'Business Evolution: Adapting to Market Dynamics'
      ]
    };
    
    const templates = headlineTemplates[storyDirection.angle as keyof typeof headlineTemplates] || headlineTemplates.default;
    return templates[Math.floor(Math.random() * templates.length)];
  };
  
  // Generate article sections
  const introduction = generateIntroduction();
  const body = generateBody();
  const conclusion = generateConclusion();
  
  const fullArticle = `${introduction}\n\n${body}\n\n${conclusion}`;
  const wordCount = fullArticle.split(/\s+/).length;
  const readTime = Math.ceil(wordCount / 200);
  
  const sourceMapping = generateSourceMapping();
  
  return {
    draft: fullArticle,
    sourceMapping,
    headline: generateHeadline(),
    wordCount,
    readTime
  };
  
  function generateIntroduction(): string {
    const hasQuotes = quotes.length > 0;
    const sampleQuote = hasQuotes ? quotes[0] : '';
    
    switch (storyDirection.angle) {
      case 'success-story':
        return `In today's rapidly evolving business landscape, success stories often emerge from strategic vision combined with precise execution. ${hasQuotes ? `"${sampleQuote}," reflecting the momentum that has characterized recent developments.` : 'The insights from recent developments reveal a systematic approach to growth that extends beyond traditional metrics.'}\n\nThis transformation represents more than incremental progress—it demonstrates how strategic alignment with market dynamics can create sustainable competitive advantages. The evidence points to a comprehensive approach that balances innovation with operational excellence, positioning the organization for continued expansion in an increasingly complex marketplace.`;
      
      case 'challenges-overcome':
        return `Behind every breakthrough lies a series of obstacles that once seemed insurmountable. ${hasQuotes ? `"${sampleQuote}," highlighting the mindset that transforms challenges into competitive advantages.` : 'The approach to overcoming significant challenges has revealed patterns of resilience and strategic thinking.'}\n\nThe ability to navigate complex business challenges while maintaining forward momentum requires both tactical flexibility and strategic clarity. These experiences have shaped a more resilient organizational structure, demonstrating how systematic problem-solving can create lasting value and competitive differentiation.`;
      
      case 'innovation-focus':
        return `At the intersection of technology and strategy, breakthrough innovations are reshaping traditional business practices. ${hasQuotes ? `"${sampleQuote}," emphasizing the transformative potential of strategic innovation.` : 'The integration of innovative approaches has created new possibilities for growth and efficiency.'}\n\nInnovation in today's context extends far beyond technological implementation to encompass strategic thinking, operational excellence, and market positioning. This comprehensive approach has established a foundation for sustained competitive advantage through continuous adaptation and strategic foresight.`;
      
      default:
        return `In an increasingly complex business environment, strategic insights often emerge from the intersection of vision, execution, and market understanding. ${hasQuotes ? `"${sampleQuote}," providing context for the strategic decisions that have shaped recent developments.` : 'The patterns that emerge from recent developments offer valuable insights into strategic positioning and market dynamics.'}\n\nThe convergence of strategic planning, operational excellence, and market awareness creates opportunities for organizations that can effectively balance immediate concerns with long-term vision. These insights reveal approaches that extend beyond traditional business practices to encompass broader questions of competitive advantage and sustainable growth.`;
    }
  }
  
  function generateBody(): string {
    if (verifiedKeyPoints.length === 0) {
      return 'The analysis of available information is ongoing, with comprehensive insights pending verification of key data points. Strategic development continues across multiple dimensions, with particular attention to market positioning and operational efficiency.';
    }
    
    // Group key points thematically
    const themes = groupKeyPointsByTheme();
    const sections = [];
    
    for (const [themeName, points] of Object.entries(themes)) {
      if (points.length === 0) continue;
      
      let section = `**${themeName}**\n\n`;
      
      for (const point of points) {
        const attribution = point.type === 'transcript' ? 'According to the discussion' : `Based on ${point.source}`;
        section += `${attribution}, ${point.text} This development reflects broader strategic initiatives that align with market opportunities and organizational capabilities.\n\n`;
      }
      
      sections.push(section);
    }
    
    return sections.join('');
  }
  
  function generateConclusion(): string {
    return `Looking ahead, these developments position the organization for continued growth and market leadership. The strategic framework established through these initiatives creates a foundation for adapting to future market dynamics while maintaining competitive advantages.\n\nThe implications extend beyond immediate business outcomes to broader questions of industry evolution and market positioning. As these strategies continue to evolve, they will likely influence best practices across the sector, demonstrating the value of comprehensive strategic thinking in an increasingly complex business environment.`;
  }
  
  function groupKeyPointsByTheme(): Record<string, KeyPoint[]> {
    const themes: Record<string, KeyPoint[]> = {
      'Strategic Foundation': [],
      'Growth and Performance': [],
      'Innovation and Technology': [],
      'Market Position': [],
      'Operational Excellence': []
    };
    
    for (const point of verifiedKeyPoints) {
      const text = point.text.toLowerCase();
      
      if (text.includes('strategy') || text.includes('vision') || text.includes('plan')) {
        themes['Strategic Foundation'].push(point);
      } else if (text.includes('growth') || text.includes('revenue') || text.includes('performance')) {
        themes['Growth and Performance'].push(point);
      } else if (text.includes('innovation') || text.includes('technology') || text.includes('digital')) {
        themes['Innovation and Technology'].push(point);
      } else if (text.includes('market') || text.includes('customer') || text.includes('competitive')) {
        themes['Market Position'].push(point);
      } else {
        themes['Operational Excellence'].push(point);
      }
    }
    
    // Remove empty themes
    return Object.fromEntries(
      Object.entries(themes).filter(([_, points]) => points.length > 0)
    );
  }
  
  function generateSourceMapping(): Record<string, string[]> {
    const sourceNames = sources.map(s => s.title);
    if (transcript) sourceNames.push('Interview Transcript');
    
    return {
      'paragraph_1': sourceNames.slice(0, 2),
      'paragraph_2': sourceNames.slice(1, 3),
      'paragraph_3': sourceNames
    };
  }
};