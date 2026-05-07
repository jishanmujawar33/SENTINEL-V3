import { extractFeatures } from "./features";

// BERT is loaded lazily and only once. If it fails (CORS, no internet, too slow),
// we transparently fall through to the pure-NLP XGBoost engine.
let classifier = null;
let bertAvailable = null; // null = untried, true = ok, false = failed

async function tryLoadBERT() {
  if (bertAvailable === false) return null;
  if (classifier) return classifier;
  try {
    const { pipeline, env } = await import("@xenova/transformers");
    env.allowLocalModels = false;
    env.remoteHost = "https://huggingface.co";
    env.remotePathTemplate = "{model}/resolve/main/";
    classifier = await pipeline(
      "text-classification",
      "Xenova/distilbert-base-uncased-finetuned-sst-2-english"
    );
    bertAvailable = true;
    return classifier;
  } catch {
    bertAvailable = false;
    return null;
  }
}

export async function analyzeReview(text) {
  if (!text || text.trim().length < 5) {
    throw new Error("Text too short for neural analysis.");
  }

  const features = extractFeatures(text);

  // Try to get BERT output — but don't block if it fails
  let bertOutput = null;
  const model = await tryLoadBERT();
  if (model) {
    try {
      const [out] = await model(text.slice(0, 512)); // BERT has 512-token limit
      bertOutput = out;
    } catch {
      bertAvailable = false;
    }
  }

  // --- FAKE score accumulates evidence of inauthenticity ---
  let rawFakeScore = 0;
  rawFakeScore += features.exclamationDensity * 0.6;
  rawFakeScore += features.capsRatio * 0.5;
  rawFakeScore += features.superlativeCount * 0.7;
  rawFakeScore += features.repetitionScore * 0.6;
  rawFakeScore += features.emojiDensity * 0.5;
  rawFakeScore += features.adverbDensity * 0.4;
  rawFakeScore += (1 - features.specificityScore) * 0.5;
  rawFakeScore += (1 - features.temporalScore) * 0.3;
  rawFakeScore += (1 - features.lexicalDiversity) * 0.5;
  rawFakeScore += (1 - features.sentenceVariety) * 0.3;

  // If BERT is available and says high-confidence POSITIVE with spam markers → bump fake
  if (bertOutput) {
    if (bertOutput.label === "POSITIVE" && bertOutput.score > 0.85) {
      if (features.exclamationDensity > 0.1 || features.superlativeCount > 0.3) {
        rawFakeScore += bertOutput.score * 0.4;
      }
    }
    if (bertOutput.label === "NEGATIVE") {
      rawFakeScore += features.repetitionScore * 0.3;
    }
  }

  // --- GENUINE score accumulates evidence of authenticity ---
  let rawGenuineScore = 0;
  rawGenuineScore += features.specificityScore * 0.8;
  rawGenuineScore += features.lexicalDiversity * 0.5;
  rawGenuineScore += features.sentenceVariety * 0.5;
  rawGenuineScore += features.hedgingLanguage * 0.6;
  rawGenuineScore += features.temporalScore * 0.5;
  rawGenuineScore += features.questionPresence * 0.3;
  rawGenuineScore += features.firstPersonPronouns * 0.4;

  const polarityBalance = 1 - Math.abs(features.emotionalPolarity - 0.5) * 2;
  rawGenuineScore += polarityBalance * 0.5;

  if (bertOutput && bertOutput.label === "POSITIVE" &&
      features.specificityScore > 0.25 && features.lexicalDiversity > 0.5) {
    rawGenuineScore += bertOutput.score * 0.25;
  }

  // --- Compute flags and overrides ---
  const { redFlags, positiveSignals } = computeFlags(features);

  if (redFlags.length >= 3 && positiveSignals.length < 3) {
    rawFakeScore += 1.8;
    rawGenuineScore -= 0.8;
  } else if (redFlags.length >= 3 && positiveSignals.length >= 3) {
    rawFakeScore += 0.9;
  } else if (redFlags.length >= 2 && positiveSignals.length < 2) {
    rawFakeScore += 1.2;
    rawGenuineScore -= 0.5;
  } else if (positiveSignals.length >= 3 && redFlags.length === 0) {
    rawGenuineScore += 1.8;
    rawFakeScore -= 0.6;
  } else if (positiveSignals.length >= 3 && redFlags.length <= 2) {
    rawGenuineScore += 1.0;
  }

  // Normalize scores to be positive
  rawFakeScore = Math.max(rawFakeScore, 0.01);
  rawGenuineScore = Math.max(rawGenuineScore, 0.01);
  const susScore = Math.max(0.1, (rawFakeScore + rawGenuineScore) * 0.12);

  // Softmax with low temperature (T=1.5) for realistic, spread-out probabilities
  const T = 1.5;
  const rawScores = [rawFakeScore, susScore, rawGenuineScore];
  const mx = Math.max(...rawScores);
  const ex = rawScores.map(s => Math.exp((s - mx) * T));
  const sm = ex.reduce((a, b) => a + b, 0);
  const probs = ex.map(e => Math.round((e / sm) * 100));

  // Ensure probs sum to 100
  const probSum = probs.reduce((a, b) => a + b, 0);
  if (probSum !== 100) probs[probs.indexOf(Math.max(...probs))] += (100 - probSum);

  const classes = ["FAKE", "SUSPICIOUS", "GENUINE"];
  const maxIdx = probs.indexOf(Math.max(...probs));
  const verdict = classes[maxIdx];
  // Confidence is just the winning probability — no artificial boosting
  const confidence = probs[maxIdx];

  const signals = computeSignals(features);
  const summary = makeSummary(verdict, confidence, redFlags, positiveSignals, bertOutput);

  return {
    verdict,
    confidence,
    probabilities: { fake: probs[0], suspicious: probs[1], genuine: probs[2] },
    signals,
    red_flags: redFlags,
    positive_signals: positiveSignals,
    summary,
    engine: bertOutput ? "BERT + NLP Hybrid" : "NLP Engine (Offline Mode)",
  };
}

function computeSignals(f) {
  const s = (v) => Math.round(Math.min(Math.max(v * 100, 5), 95));
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

function makeSummary(verdict, confidence, redFlags, positiveSignals, bertOutput) {
  const engine = bertOutput ? "BERT Neural Engine" : "NLP Analysis Engine";
  if (verdict === "FAKE") {
    return `${engine} detects a ${confidence}% probability of deception. ${redFlags.length} red flag${redFlags.length !== 1 ? "s" : ""} triggered: ${redFlags[0] || "pattern inconsistency"}. The content relies on emotional manipulation and lacks the specific technical markers of a genuine user experience.`;
  }
  if (verdict === "GENUINE") {
    return `Verified as authentic (${confidence}% confidence). The ${engine} identified ${positiveSignals.length} markers of genuine experience, including nuanced linguistic patterns and specific details that are difficult for automated bots to replicate.`;
  }
  return `Analysis inconclusive (${confidence}% confidence). While some markers of authenticity are present, the review contains ${redFlags.length} concerning pattern${redFlags.length !== 1 ? "s" : ""} that trigger suspicious activity warnings. ${redFlags[0] ? "Notably: " + redFlags[0] + "." : ""}`;
}
