/* ═══════════════════════════════════════════════════════════
   SENTINEL — NLP Feature Extraction (14 signals)
   ═══════════════════════════════════════════════════════════ */

const SUPERLATIVES = [
  "best", "amazing", "incredible", "fantastic", "wonderful", "perfect",
  "excellent", "greatest", "outstanding", "magnificent", "brilliant",
  "superb", "phenomenal", "unbelievable", "extraordinary", "flawless",
];

const POSITIVE_WORDS = [
  "good", "great", "love", "nice", "happy", "excellent", "awesome",
  "beautiful", "perfect", "wonderful", "amazing", "fantastic", "best",
  "recommend", "satisfied", "pleased", "impressive", "outstanding",
  "brilliant", "superb", "enjoy", "delightful", "quality", "favorite",
];

const NEGATIVE_WORDS = [
  "bad", "terrible", "awful", "horrible", "poor", "worst", "hate",
  "disappointed", "broken", "useless", "waste", "cheap", "defective",
  "refund", "return", "complaint", "regret", "annoying", "frustrating",
  "disgusting", "pathetic", "mediocre", "overpriced", "scam",
];

const HEDGING_WORDS = [
  "somewhat", "maybe", "perhaps", "a bit", "kind of", "sort of",
  "slightly", "fairly", "quite", "rather", "mostly", "generally",
  "usually", "occasionally", "sometimes", "arguably", "probably",
];

const FIRST_PERSON = ["i ", "i'm", "i've", "i'll", "i'd", "my ", "me ", "mine", "myself"];
const THIRD_PERSON = ["he ", "she ", "they ", "it ", "someone", "people", "everyone"];

const ADVERBS = ["very", "really", "extremely", "totally", "absolutely", "completely", "highly", "so ", "too ", "quite", "fairly"];
const TEMPORAL = ["since", "ago", "last week", "yesterday", "months", "years", "after", "before", "duration", "time"];

/**
 * Extract 14 NLP features from review text.
 * Each feature is normalized to 0–1 range.
 * @param {string} text - The review text to analyze
 * @returns {object} - Feature vector with named keys
 */
export function extractFeatures(text) {
  if (!text || text.trim().length === 0) {
    return getEmptyFeatures();
  }

  const raw = text.trim();
  const lower = raw.toLowerCase();
  const words = lower.split(/\s+/).filter(Boolean);
  const sentences = raw.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const charCount = raw.length;
  const wordCount = words.length;

  // 1. Exclamation density
  const exclCount = (raw.match(/!/g) || []).length;
  const exclamationDensity = Math.min(exclCount / Math.max(charCount, 1) * 20, 1);

  // 2. Caps ratio
  const upperChars = (raw.match(/[A-Z]/g) || []).length;
  const letterChars = (raw.match(/[a-zA-Z]/g) || []).length;
  const capsRatio = letterChars > 0 ? Math.min(upperChars / letterChars * 2, 1) : 0;

  // 3. Average word length (normalized: 1-15 chars → 0-1)
  const avgWordLen = wordCount > 0 ? words.reduce((s, w) => s + w.length, 0) / wordCount : 0;
  const avgWordLenNorm = Math.min(Math.max((avgWordLen - 1) / 14, 0), 1);

  // 4. Superlative count
  const superlativeCount = SUPERLATIVES.reduce((c, s) => c + (lower.includes(s) ? 1 : 0), 0);
  const superlativeNorm = Math.min(superlativeCount / 5, 1);

  // 5. Specificity score (numbers, measurements, tech specs)
  const hasNumbers = /\d/.test(raw);
  const hasMeasurements = /\d+\s*(inch|cm|mm|lb|kg|oz|gb|mb|mah|hour|day|week|month|year|dollar|\$|%|hz|khz|watt|v|ah)/i.test(raw);
  const hasTechSpecs = /(bluetooth|5\.2|5\.3|ip54|water-resistant|bass|treble|tweeter|woofer|playback|latency|aptx|codec|driver)/i.test(raw);
  const hasComparisonRef = /(compared to|better than|worse than|similar to|unlike|sony|bose|jbl|marshall)/i.test(raw);
  const hasTimeRef = /(after \d|for \d|since|ago|month|week|year)/i.test(raw);
  
  const specificityScore = Math.min(
    ((hasNumbers ? 0.15 : 0) + (hasMeasurements ? 0.25 : 0) + (hasTechSpecs ? 0.3 : 0) + (hasComparisonRef ? 0.2 : 0) + (hasTimeRef ? 0.15 : 0)),
    1
  );

  // 6. Emotional polarity (positive – negative balance)
  const posCount = POSITIVE_WORDS.reduce((c, w) => c + (lower.includes(w) ? 1 : 0), 0);
  const negCount = NEGATIVE_WORDS.reduce((c, w) => c + (lower.includes(w) ? 1 : 0), 0);
  const totalSentiment = posCount + negCount;
  // 0.5 = balanced, 0 = all negative, 1 = all positive
  const emotionalPolarity = totalSentiment > 0 ? posCount / totalSentiment : 0.5;

  // 7. Repetition score (repeated bigrams)
  const bigrams = [];
  for (let i = 0; i < words.length - 1; i++) {
    bigrams.push(words[i] + " " + words[i + 1]);
  }
  const bigramSet = new Set(bigrams);
  const repetitionScore = bigrams.length > 0 ? Math.min(1 - bigramSet.size / bigrams.length, 1) * 2 : 0;

  // 8. Review length (normalized: 0-500 chars → 0-1)
  const lengthNorm = Math.min(charCount / 500, 1);

  // 9. Question presence
  const questionCount = (raw.match(/\?/g) || []).length;
  const questionNorm = Math.min(questionCount / 3, 1);

  // 10. First person pronoun usage
  const fpCount = FIRST_PERSON.reduce((c, p) => c + (lower.includes(p) ? 1 : 0), 0);
  const firstPersonNorm = Math.min(fpCount / 4, 1);

  // 11. Hedging language
  const hedgeCount = HEDGING_WORDS.reduce((c, w) => c + (lower.includes(w) ? 1 : 0), 0);
  const hedgingNorm = Math.min(hedgeCount / 4, 1);

  // 12. Emoji/symbol density
  const emojiPattern = /[★☆❤♥❗🔥💯⭐✨😍🤩👍👎😡🎉✅❌💀🙏😊😂❤️‍🔥💪🏆👏🤮🤢😤]/gu;
  const emojiCount = (raw.match(emojiPattern) || []).length;
  const emojiDensity = Math.min(emojiCount / Math.max(wordCount, 1) * 5, 1);

  // 13. Sentence variety (std dev of sentence lengths)
  let sentenceVariety = 0;
  if (sentences.length > 1) {
    const sentLens = sentences.map((s) => s.trim().split(/\s+/).length);
    const meanLen = sentLens.reduce((a, b) => a + b, 0) / sentLens.length;
    const variance = sentLens.reduce((s, l) => s + Math.pow(l - meanLen, 2), 0) / sentLens.length;
    sentenceVariety = Math.min(Math.sqrt(variance) / 10, 1);
  }

  // 14. Lexical diversity (type-token ratio)
  const uniqueWords = new Set(words);
  const lexicalDiversity = wordCount > 0 ? uniqueWords.size / wordCount : 0;

  return {
    exclamationDensity,
    capsRatio,
    avgWordLength: avgWordLenNorm,
    superlativeCount: superlativeNorm,
    specificityScore,
    emotionalPolarity,
    repetitionScore,
    reviewLength: lengthNorm,
    questionPresence: questionNorm,
    firstPersonPronouns: firstPersonNorm,
    hedgingLanguage: hedgingNorm,
    emojiDensity,
    sentenceVariety,
    lexicalDiversity,
    
    // 15. Adverb Density (over-descriptive spam)
    adverbDensity: Math.min(ADVERBS.reduce((c, w) => c + (lower.includes(w) ? 1 : 0), 0) / Math.max(wordCount, 1) * 10, 1),
    
    // 16. Pronoun Balance (1st person vs 3rd person)
    pronounBalance: (fpCount + (THIRD_PERSON.reduce((c, w) => c + (lower.includes(w) ? 1 : 0), 0))) > 0 ? fpCount / (fpCount + THIRD_PERSON.reduce((c, w) => c + (lower.includes(w) ? 1 : 0), 0)) : 0.5,
    
    // 17. Temporal Specificity
    temporalScore: Math.min(TEMPORAL.reduce((c, w) => c + (lower.includes(w) ? 1 : 0), 0) / 2, 1),
    
    // 18. Complexity (Avg sentence length)
    avgSentenceLen: Math.min(wordCount / Math.max(sentences.length, 1) / 25, 1),
    
    // 19. Unique Bigram Ratio
    uniqueBigramRatio: bigrams.length > 0 ? bigramSet.size / bigrams.length : 1,
    
    // 20. Punctuation Variety
    punctVariety: Math.min((new Set(raw.match(/[.,!?;:]/g) || [])).size / 4, 1),
  };
}

function getEmptyFeatures() {
  return {
    exclamationDensity: 0,
    capsRatio: 0,
    avgWordLength: 0,
    superlativeCount: 0,
    specificityScore: 0,
    emotionalPolarity: 0.5,
    repetitionScore: 0,
    reviewLength: 0,
    questionPresence: 0,
    firstPersonPronouns: 0,
    hedgingLanguage: 0,
    emojiDensity: 0,
    sentenceVariety: 0,
    lexicalDiversity: 0,
  };
}

/** Human-readable names for each feature */
export const FEATURE_NAMES = {
  exclamationDensity: "Exclamation Density",
  capsRatio: "Capitalization Ratio",
  avgWordLength: "Avg Word Length",
  superlativeCount: "Superlative Usage",
  specificityScore: "Detail Specificity",
  emotionalPolarity: "Emotional Polarity",
  repetitionScore: "Repetition Pattern",
  reviewLength: "Review Length",
  questionPresence: "Question Marks",
  firstPersonPronouns: "First Person Usage",
  hedgingLanguage: "Hedging Language",
  emojiDensity: "Emoji/Symbol Density",
  sentenceVariety: "Sentence Variety",
  lexicalDiversity: "Lexical Diversity",
  adverbDensity: "Adverb Density",
  pronounBalance: "Pronoun Balance",
  temporalScore: "Temporal Specificity",
  avgSentenceLen: "Syntactic Complexity",
  uniqueBigramRatio: "Bigram Diversity",
  punctVariety: "Punctuation Variety",
};
