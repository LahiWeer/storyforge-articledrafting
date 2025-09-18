// Utility functions for extracting content based on keywords and focus

export interface ExtractedSentence {
  text: string;
  relevanceScore: number;
  matchedKeywords: string[];
}

/**
 * Extract keywords and main ideas from article focus text
 */
export const extractFocusKeywords = (focus: string): string[] => {
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
  
  // Extract key phrases (2-4 word combinations)
  const phrases = text.match(/\b\w+\s+\w+(?:\s+\w+)?(?:\s+\w+)?\b/g) || [];
  keywords.push(...phrases.map(phrase => phrase.trim()));
  
  // Return unique keywords, prioritizing longer phrases
  return [...new Set(keywords)].sort((a, b) => b.length - a.length).slice(0, 20);
};

/**
 * Calculate relevance score for a sentence based on keyword matches
 */
export const calculateRelevanceScore = (sentence: string, keywords: string[]): { score: number; matchedKeywords: string[] } => {
  const lowerSentence = sentence.toLowerCase();
  let score = 0;
  const matchedKeywords: string[] = [];
  
  keywords.forEach(keyword => {
    const lowerKeyword = keyword.toLowerCase();
    if (lowerSentence.includes(lowerKeyword)) {
      // Higher weight for longer, more specific keywords
      const keywordWeight = keyword.length > 8 ? 3 : (keyword.length > 5 ? 2 : 1);
      score += keywordWeight;
      matchedKeywords.push(keyword);
    }
  });
  
  // Bonus for sentences with multiple keyword matches
  if (matchedKeywords.length > 1) {
    score += matchedKeywords.length * 0.5;
  }
  
  return { score, matchedKeywords };
};

/**
 * Extract sentences from content that match focus keywords
 */
export const extractFocusedSentences = (content: string, keywords: string[], minSentences: number = 5): ExtractedSentence[] => {
  // Split content into sentences (improved sentence boundary detection)
  const sentences = content
    .split(/[.!?]+\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 20) // Filter out very short sentences
    .map(s => s.replace(/^\s*[-•*]\s*/, '')) // Remove bullet points
    .filter(s => s.length > 0);
  
  // Score each sentence based on keyword relevance
  const scoredSentences: ExtractedSentence[] = sentences.map(sentence => {
    const { score, matchedKeywords } = calculateRelevanceScore(sentence, keywords);
    return {
      text: sentence.endsWith('.') || sentence.endsWith('!') || sentence.endsWith('?') 
        ? sentence 
        : sentence + '.',
      relevanceScore: score,
      matchedKeywords
    };
  });
  
  // Sort by relevance score (highest first)
  scoredSentences.sort((a, b) => b.relevanceScore - a.relevanceScore);
  
  // Ensure we have at least the minimum number of sentences
  const relevantSentences = scoredSentences.filter(s => s.relevanceScore > 0);
  
  if (relevantSentences.length >= minSentences) {
    return relevantSentences;
  } else {
    // If we don't have enough relevant sentences, include the best non-matching ones
    const additionalSentences = scoredSentences
      .filter(s => s.relevanceScore === 0)
      .slice(0, minSentences - relevantSentences.length);
    
    return [...relevantSentences, ...additionalSentences];
  }
};

/**
 * Process web content and extract focus-relevant sentences
 */
export const processWebContentForFocus = (
  content: string, 
  title: string, 
  keywords: string[], 
  minSentences: number = 5
): { extractedSentences: ExtractedSentence[]; summary: string } => {
  const extractedSentences = extractFocusedSentences(content, keywords, minSentences);
  
  const relevantCount = extractedSentences.filter(s => s.relevanceScore > 0).length;
  const summary = `Extracted ${extractedSentences.length} sentences from "${title}" (${relevantCount} highly relevant to your focus)`;
  
  return { extractedSentences, summary };
};

/**
 * Simulate web content extraction (to be replaced with actual web scraping)
 */
export const simulateWebContentExtraction = (url: string): string => {
  // This simulates realistic web content that would be extracted from various URLs
  const sampleContents = [
    `The company has revolutionized customer experience through innovative AI-powered solutions that analyze user behavior patterns in real-time. Market research indicates that businesses implementing similar AI technologies see an average 45% improvement in customer satisfaction scores. User feedback has become the cornerstone of modern product development, with successful companies establishing comprehensive feedback loops that inform every major decision. Digital transformation initiatives have proven essential for competitive advantage, with industry leaders investing heavily in automation and machine learning capabilities. Customer acquisition costs have decreased significantly for organizations that prioritize user-centered design principles and data-driven decision making. Revenue growth accelerates when companies focus on understanding their customers' true needs rather than pushing generic solutions. Innovation in the technology sector requires a delicate balance between cutting-edge features and practical usability that serves real-world problems. Strategic partnerships often fail when companies don't align their core values and customer service philosophies from the outset. Team expansion during rapid growth phases presents unique challenges in maintaining company culture while scaling operational efficiency. Mobile application development has shifted towards personalized experiences that adapt to individual user preferences and behavioral patterns.`,
    
    `Industry analysis reveals that successful startups share common characteristics in their approach to scaling operations and building sustainable business models. Infrastructure investments must be carefully planned to support anticipated growth without over-engineering solutions for theoretical future needs. Team collaboration tools have become essential for distributed workforces, with productivity metrics showing significant improvements when remote teams use integrated communication platforms. Customer retention strategies that focus on long-term relationship building consistently outperform short-term acquisition campaigns in terms of lifetime value. User experience design principles should guide every aspect of product development, from initial concept through final implementation and ongoing optimization. Market expansion requires thorough understanding of local customer preferences, regulatory requirements, and competitive landscapes before committing significant resources. Financial metrics demonstrate that companies investing in employee satisfaction and professional development see higher retention rates and improved performance outcomes. Technology adoption curves show that early movers in emerging markets gain sustainable competitive advantages that are difficult for later entrants to overcome. Product-market fit becomes evident when customer demand consistently exceeds supply capacity and user engagement metrics show sustained upward trends. Strategic decision-making processes benefit from data-driven insights combined with intuitive understanding of customer needs and market dynamics.`,
    
    `Research and development investments in artificial intelligence and machine learning technologies have yielded remarkable returns for forward-thinking organizations across multiple industries. Customer service automation has evolved beyond simple chatbots to sophisticated systems that can handle complex inquiries and provide personalized solutions. User engagement metrics indicate that interactive features and gamification elements significantly increase time spent on digital platforms and improve overall satisfaction ratings. Business model innovation often requires companies to challenge traditional assumptions about value creation and customer relationship management. Digital marketing strategies must integrate seamlessly with customer experience touchpoints to create cohesive brand interactions throughout the entire customer journey. Operational efficiency gains from process automation enable teams to focus on high-value activities that require human creativity and strategic thinking. Market research consistently shows that companies prioritizing sustainability and social responsibility attract more loyal customers and talented employees. Partnership agreements in the technology sector require careful consideration of intellectual property rights, data sharing protocols, and long-term strategic alignment. Competitive analysis reveals that successful companies continuously adapt their offerings based on changing customer preferences and emerging market opportunities. Performance optimization initiatives should balance immediate cost savings with long-term growth potential and customer satisfaction objectives.`
  ];
  
  return sampleContents[Math.floor(Math.random() * sampleContents.length)];
};