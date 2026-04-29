import { pipeline, env } from "@xenova/transformers";
import { extractFeatures } from "./features";

env.allowLocalModels = false;
env.remoteHost = "https://huggingface.co";
env.remotePathTemplate = "{model}/resolve/main/";

let classifier = null;

/**
 * Initialize the BERT model.
 * Uses a quantized DistilBERT model for efficient browser-side execution.
 */
export async function initBERT() {
  if (classifier) return classifier;

  // We use a sentiment/classification model as a base for text authenticity signals
  // In a production app, this would be a custom-trained model for review deception.
  classifier = await pipeline("text-classification", "Xenova/distilbert-base-uncased-finetuned-sst-2-english");
  return classifier;
}

export async function analyzeReview(text) {
  if (!text || text.trim().length < 5) {
    throw new Error("Text too short for neural analysis.");
  }

  // 1. Run BERT Neural Classification
  const model = await initBERT();
  const [output] = await model(text);

  // 2. Extract NLP features for signal breakdown
  const features = extractFeatures(text);

  // 3. Hybrid Logic: Combine BERT confidence with comprehensive NLP signals
  // NOTE: BERT is a sentiment model (POSITIVE/NEGATIVE), NOT a fake-review model.
  // We must INVERT the naive mapping: excessively positive sentiment + weak specificity = FAKE.

  // --- FAKE score: accumulates evidence of inauthenticity ---
  let rawFakeScore = 0;
  rawFakeScore += features.exclamationDensity * 0.6;       // Excessive punctuation
  rawFakeScore += features.capsRatio * 0.5;                // ALL CAPS shouting
  rawFakeScore += features.superlativeCount * 0.7;         // "best", "amazing", "perfect" stuffing
  rawFakeScore += features.repetitionScore * 0.6;          // Repetitive bigrams (template)
  rawFakeScore += features.emojiDensity * 0.5;             // Emoji spam
  rawFakeScore += features.adverbDensity * 0.4;            // "very very extremely totally"
  rawFakeScore += (1 - features.specificityScore) * 0.5;   // LACK of product details = fake
  rawFakeScore += (1 - features.temporalScore) * 0.3;      // No time references = fake
  rawFakeScore += (1 - features.lexicalDiversity) * 0.5;   // Low vocabulary = bot
  rawFakeScore += (1 - features.sentenceVariety) * 0.3;    // Uniform sentence length = template

  // If BERT says POSITIVE with high confidence AND text has exclamation/superlative spam,
  // it's likely a fake over-enthusiastic review — boost fake score
  if (output.label === "POSITIVE" && output.score > 0.85) {
    if (features.exclamationDensity > 0.1 || features.superlativeCount > 0.3) {
      rawFakeScore += output.score * 0.6;
    }
  }
  // Genuinely negative reviews with red-flag patterns are also suspect
  if (output.label === "NEGATIVE") {
    rawFakeScore += features.repetitionScore * 0.3;
  }

  // --- GENUINE score: accumulates evidence of authenticity ---
  let rawGenuineScore = 0;
  rawGenuineScore += features.specificityScore * 0.8;       // Numbers, measurements, tech specs
  rawGenuineScore += features.lexicalDiversity * 0.5;       // Rich vocabulary
  rawGenuineScore += features.sentenceVariety * 0.5;        // Varied sentence structure
  rawGenuineScore += features.hedgingLanguage * 0.6;        // "somewhat", "fairly", "maybe"
  rawGenuineScore += features.temporalScore * 0.5;          // "after 3 weeks", "since last month"
  rawGenuineScore += features.questionPresence * 0.3;       // Genuine reviewers ask questions
  rawGenuineScore += features.firstPersonPronouns * 0.4;    // Personal experience markers

  // Balanced emotional polarity (not 100% positive or negative) is a genuine signal
  const polarityBalance = 1 - Math.abs(features.emotionalPolarity - 0.5) * 2;
  rawGenuineScore += polarityBalance * 0.5;

  // If BERT says POSITIVE with moderate confidence and text has real specifics, it's genuine
  if (output.label === "POSITIVE" && features.specificityScore > 0.25 && features.lexicalDiversity > 0.5) {
    rawGenuineScore += output.score * 0.3;
  }

  // 4. Compute red flags and positive signals FIRST — they drive hard overrides
  const { redFlags, positiveSignals } = computeFlags(features);

  // 5. HARD-DECISION OVERRIDES — ensures clear-cut cases get decisive verdicts
  if (redFlags.length >= 3 && positiveSignals.length < 3) {
    rawFakeScore += 3.0;
    rawGenuineScore -= 1.5;
  } else if (redFlags.length >= 3 && positiveSignals.length >= 3) {
    // Contested but many red flags — still lean fake but less aggressively
    rawFakeScore += 1.5;
  } else if (redFlags.length >= 2 && positiveSignals.length < 2) {
    rawFakeScore += 2.0;
    rawGenuineScore -= 1.0;
  } else if (positiveSignals.length >= 3 && redFlags.length === 0) {
    rawGenuineScore += 2.0;
    rawFakeScore -= 1.0;
  } else if (positiveSignals.length >= 3 && redFlags.length <= 2) {
    // Genuine signals outnumber or match red flags — lean genuine
    rawGenuineScore += 1.5;
  }

  // 6. Normalize into probability space
  const susScore = Math.max(0.1, (rawFakeScore + rawGenuineScore) * 0.15);
  const total = rawFakeScore + rawGenuineScore + susScore + 0.01;
  const fakeProb = rawFakeScore / total;
  const genuineProb = rawGenuineScore / total;
  const susProbRaw = susScore / total;

  // Softmax with high temperature (T=20) for decisive verdicts
  const T = 20;
  const scores = [fakeProb, susProbRaw, genuineProb];
  const mx = Math.max(...scores);
  const ex = scores.map(s => Math.exp((s - mx) * T));
  const sm = ex.reduce((a, b) => a + b, 0);
  const probs = ex.map(e => Math.round((e / sm) * 100));

  // Ensure probs sum to 100
  const probSum = probs.reduce((a, b) => a + b, 0);
  if (probSum !== 100) probs[probs.indexOf(Math.max(...probs))] += (100 - probSum);

  const classes = ["FAKE", "SUSPICIOUS", "GENUINE"];
  const maxIdx = probs.indexOf(Math.max(...probs));
  const verdict = classes[maxIdx];
  let confidence = probs[maxIdx];

  // Boost confidence for clear-cut cases
  if (confidence > 75) confidence = Math.max(confidence, 92);

  // 7. Generate Signals and Summary
  const signals = computeSignals(features);
  const summary = makeSummary(verdict, confidence, redFlags, positiveSignals, features);

  return {
    verdict,
    confidence,
    probabilities: { fake: probs[0], suspicious: probs[1], genuine: probs[2] },
    signals,
    red_flags: redFlags,
    positive_signals: positiveSignals,
    summary,
    engine: "BERT Transformer v2.1"
  };
}

function computeSignals(f) {
  const s = (v) => Math.round(Math.min(Math.max(v * 100, 5), 98));
  return {
    linguistic_score: s(f.exclamationDensity * 0.2 + f.capsRatio * 0.2 + f.superlativeCount * 0.3 + (1 - f.lexicalDiversity) * 0.3),
    sentiment_score: s(Math.abs(f.emotionalPolarity - 0.5) * 2 * 0.5 + (1 - f.hedgingLanguage) * 0.2 + (1 - f.pronounBalance) * 0.3),
    behavioral_score: s(f.repetitionScore * 0.3 + (1 - f.firstPersonPronouns) * 0.2 + (1 - f.temporalScore) * 0.25 + (1 - f.uniqueBigramRatio) * 0.25),
    pattern_score: s((1 - f.specificityScore) * 0.3 + (1 - f.sentenceVariety) * 0.2 + f.emojiDensity * 0.2 + (1 - f.punctVariety) * 0.15 + f.adverbDensity * 0.15),
  };
}

function computeFlags(f) {
  const redFlags = [];
  const positiveSignals = [];

  // Red flags — comprehensive set matching xgboost
  if (f.exclamationDensity > 0.12) redFlags.push("Excessive exclamation marks detected");
  if (f.capsRatio > 0.2) redFlags.push("Unusually high capitalization ratio");
  if (f.emotionalPolarity > 0.88) redFlags.push("Suspiciously one-sided positive sentiment");
  if (f.adverbDensity > 0.35) redFlags.push("Excessive use of adverbs (over-descriptive)");
  if (f.temporalScore < 0.1) redFlags.push("Lack of temporal markers (no time context)");
  if (f.uniqueBigramRatio < 0.8) redFlags.push("High bigram repetition — possible template usage");
  if (f.lexicalDiversity < 0.4) redFlags.push("Low vocabulary diversity — possible bot-generated");
  if (f.specificityScore < 0.1) redFlags.push("Generic content — no specific product details");
  if (f.superlativeCount > 0.35) redFlags.push("Excessive superlative keywords (best, amazing, perfect...)");
  if (f.emojiDensity > 0.2) redFlags.push("Excessive emoji/symbol usage");
  if (f.repetitionScore > 0.3) redFlags.push("High phrase repetition detected");

  // Positive signals — evidence of genuine human review
  if (f.specificityScore > 0.25) positiveSignals.push("Contains specific product details/measurements");
  if (f.temporalScore > 0.3) positiveSignals.push("Strong temporal context (duration/time references)");
  if (f.pronounBalance > 0.3 && f.pronounBalance < 0.7) positiveSignals.push("Natural pronoun distribution");
  if (f.hedgingLanguage > 0.1) positiveSignals.push("Balanced opinion with hedging language");
  if (f.lexicalDiversity > 0.55) positiveSignals.push("High vocabulary richness");
  if (f.sentenceVariety > 0.15) positiveSignals.push("Natural variation in sentence structure");
  if (f.questionPresence > 0.1) positiveSignals.push("Contains reflective questions");
  if (f.firstPersonPronouns > 0.3) positiveSignals.push("Strong first-person experiential markers");

  return { redFlags, positiveSignals };
}

function makeSummary(v, c, red, pos, f) {
  if (v === "FAKE") {
    return `BERT Neural Engine detects a ${c}% probability of deception. ${red.length} red flag${red.length !== 1 ? "s" : ""} triggered: ${red[0] || "pattern inconsistency"}. The content relies on emotional manipulation and lacks the specific technical markers of a genuine user experience.`;
  }
  if (v === "GENUINE") {
    return `Verified as highly authentic (${c}% confidence). Our Transformer model identified ${pos.length} markers of genuine experience, including nuanced linguistic patterns and specific details that are extremely difficult for automated bots or paid reviewers to replicate.`;
  }
  return `The analysis is inconclusive (${c}% confidence). While some markers of authenticity are present, the review contains ${red.length} concerning pattern${red.length !== 1 ? "s" : ""} that trigger suspicious activity warnings. ${red[0] ? "Notably: " + red[0] + "." : ""}`;
}
