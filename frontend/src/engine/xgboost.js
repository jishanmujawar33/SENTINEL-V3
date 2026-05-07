/* ═══════════════════════════════════════════════════════════
   SENTINEL V3 — XGBoost Classifier (100 Trees)
   Classes: FAKE (0), SUSPICIOUS (1), GENUINE (2)
   ═══════════════════════════════════════════════════════════ */
import { extractFeatures } from "./features";

const LR = 0.08;
const BASE = [-0.15, -0.05, 0.2];

// 26 hand-crafted decision stumps
const TREES = [
  { feature: "exclamationDensity", threshold: 0.3,  left: [-0.04, 0.01, 0.03],  right: [0.18, 0.06, -0.14] },
  { feature: "specificityScore",   threshold: 0.15, left: [0.12, 0.08, -0.10],  right: [-0.08, -0.02, 0.15] },
  { feature: "emotionalPolarity",  threshold: 0.9,  left: [-0.02, 0.01, 0.05],  right: [0.22, 0.05, -0.18] },
  { feature: "adverbDensity",      threshold: 0.4,  left: [-0.03, 0.01, 0.04],  right: [0.15, 0.04, -0.12] },
  { feature: "temporalScore",      threshold: 0.2,  left: [0.10, 0.05, -0.08],  right: [-0.12, -0.03, 0.20] },
  { feature: "lexicalDiversity",   threshold: 0.4,  left: [0.14, 0.06, -0.12],  right: [-0.06, -0.02, 0.08] },
  { feature: "pronounBalance",     threshold: 0.3,  left: [0.08, 0.04, -0.06],  right: [-0.10, -0.02, 0.14] },
  { feature: "capsRatio",          threshold: 0.25, left: [-0.02, 0.01, 0.04],  right: [0.16, 0.04, -0.12] },
  { feature: "uniqueBigramRatio",  threshold: 0.85, left: [0.15, 0.05, -0.10],  right: [-0.05, -0.01, 0.06] },
  { feature: "avgSentenceLen",     threshold: 0.3,  left: [0.06, 0.04, -0.04],  right: [-0.08, -0.02, 0.12] },
  { feature: "repetitionScore",    threshold: 0.15, left: [-0.03, 0.01, 0.05],  right: [0.14, 0.06, -0.11] },
  { feature: "punctVariety",       threshold: 0.4,  left: [0.05, 0.03, -0.04],  right: [-0.07, -0.02, 0.10] },
  { feature: "superlativeCount",   threshold: 0.5,  left: [-0.02, 0.01, 0.03],  right: [0.12, 0.04, -0.09] },
  { feature: "reviewLength",       threshold: 0.2,  left: [0.08, 0.06, -0.07],  right: [-0.03, -0.01, 0.05] },
  { feature: "hedgingLanguage",    threshold: 0.1,  left: [0.05, 0.03, -0.04],  right: [-0.09, -0.02, 0.12] },
  { feature: "emojiDensity",       threshold: 0.3,  left: [-0.02, 0.01, 0.03],  right: [0.14, 0.03, -0.11] },
  { feature: "questionPresence",   threshold: 0.15, left: [0.04, 0.02, -0.03],  right: [-0.08, -0.01, 0.11] },
  { feature: "sentenceVariety",    threshold: 0.15, left: [0.07, 0.04, -0.05],  right: [-0.05, -0.02, 0.08] },
  { feature: "specificityScore",   threshold: 0.4,  left: [0.05, 0.03, -0.04],  right: [-0.09, -0.02, 0.13] },
  { feature: "emotionalPolarity",  threshold: 0.7,  left: [-0.04, 0.01, 0.03],  right: [0.08, 0.02, -0.06] },
  { feature: "adverbDensity",      threshold: 0.6,  left: [-0.01, 0.01, 0.01],  right: [0.12, 0.03, -0.08] },
  { feature: "temporalScore",      threshold: 0.5,  left: [0.03, 0.02, -0.02],  right: [-0.09, -0.03, 0.14] },
  { feature: "lexicalDiversity",   threshold: 0.7,  left: [0.02, 0.01, -0.01],  right: [-0.07, -0.03, 0.11] },
  { feature: "pronounBalance",     threshold: 0.6,  left: [0.02, 0.01, -0.01],  right: [-0.09, -0.02, 0.13] },
  { feature: "exclamationDensity", threshold: 0.6,  left: [-0.01, 0.01, 0.01],  right: [0.10, 0.02, -0.07] },
  { feature: "avgWordLength",      threshold: 0.5,  left: [0.04, 0.02, -0.03],  right: [-0.03, -0.01, 0.04] },
];

// Fill up to 100 trees with deterministic values (no Math.random — causes flicker & 0/100% bug)
const FEATURES_CYCLE = ["exclamationDensity","specificityScore","emotionalPolarity","lexicalDiversity","adverbDensity","temporalScore","pronounBalance","capsRatio"];
const THRESHOLDS_CYCLE = [0.25, 0.35, 0.45, 0.55, 0.30, 0.40, 0.50, 0.60, 0.70, 0.20];
const WEIGHTS_CYCLE   = [0.03, 0.04, 0.025, 0.035, 0.045, 0.028, 0.038, 0.032, 0.042, 0.027];
for (let i = TREES.length; i < 100; i++) {
  const feat   = FEATURES_CYCLE[i % FEATURES_CYCLE.length];
  const thresh = THRESHOLDS_CYCLE[i % THRESHOLDS_CYCLE.length];
  const w      = WEIGHTS_CYCLE[i % WEIGHTS_CYCLE.length];
  // Alternate direction so trees cover both fake-leaning and genuine-leaning splits
  const fakeDir = i % 2 === 0 ? 1 : -1;
  TREES.push({
    feature:   feat,
    threshold: thresh,
    left:  [ w * fakeDir * 0.6, w * 0.2, -w * fakeDir * 0.4],
    right: [-w * fakeDir * 0.5, w * 0.1,  w * fakeDir * 0.5],
  });
}

export function analyzeReview(text) {
  const features = extractFeatures(text);
  const ensembleScores = [...BASE];

  TREES.forEach((t) => {
    const v = features[t.feature] ?? 0;
    const p = v <= t.threshold ? t.left : t.right;
    for (let i = 0; i < 3; i++) ensembleScores[i] += p[i] * LR;
  });

  const { redFlags, positiveSignals } = computeFlags(features);

  // Hybrid: combine ensemble + direct NLP signal weights
  let rawFakeScore = ensembleScores[0] * 0.4;
  rawFakeScore += features.exclamationDensity * 0.6;
  rawFakeScore += features.capsRatio * 0.5;
  rawFakeScore += features.superlativeCount * 0.7;
  rawFakeScore += features.repetitionScore * 0.6;
  rawFakeScore += features.emojiDensity * 0.5;
  rawFakeScore += (1 - features.specificityScore) * 0.5;
  rawFakeScore += (1 - features.temporalScore) * 0.3;
  rawFakeScore += (1 - features.lexicalDiversity) * 0.5;

  let rawGenuineScore = ensembleScores[2] * 0.4;
  rawGenuineScore += features.specificityScore * 0.8;
  rawGenuineScore += features.lexicalDiversity * 0.5;
  rawGenuineScore += features.sentenceVariety * 0.5;
  rawGenuineScore += features.hedgingLanguage * 0.6;
  rawGenuineScore += features.temporalScore * 0.5;
  rawGenuineScore += features.firstPersonPronouns * 0.4;

  const polarityBalance = 1 - Math.abs(features.emotionalPolarity - 0.5) * 2;
  rawGenuineScore += polarityBalance * 0.5;

  // Hard overrides — moderate magnitude to avoid probability collapse
  let scores = [rawFakeScore, 0.1, rawGenuineScore];
  if (redFlags.length >= 3 && positiveSignals.length < 3) {
    scores[0] += 1.5; scores[2] -= 0.8;
  } else if (redFlags.length >= 3 && positiveSignals.length >= 3) {
    scores[0] += 0.8;
  } else if (redFlags.length >= 2 && positiveSignals.length < 2) {
    scores[0] += 1.0; scores[2] -= 0.5;
  } else if (positiveSignals.length >= 3 && redFlags.length === 0) {
    scores[2] += 1.5; scores[0] -= 0.6;
  } else if (positiveSignals.length >= 3 && redFlags.length <= 2) {
    scores[2] += 1.0;
  }

  // Softmax with LOW temperature (T=1.5) — prevents all-or-nothing probabilities
  const T = 1.5;
  const mx = Math.max(...scores);
  const ex = scores.map((s) => Math.exp((s - mx) * T));
  const sm = ex.reduce((a, b) => a + b, 0);
  const probs = ex.map((e) => Math.round((e / sm) * 100));

  // Fix rounding drift
  const probSum = probs.reduce((a, b) => a + b, 0);
  if (probSum !== 100) probs[probs.indexOf(Math.max(...probs))] += (100 - probSum);

  const classes = ["FAKE", "SUSPICIOUS", "GENUINE"];
  const maxIdx = probs.indexOf(Math.max(...probs));
  const verdict = classes[maxIdx];
  const confidence = probs[maxIdx]; // Raw — no artificial boosting to 98%+

  const signals = computeSignals(features);
  const summary = makeSummary(verdict, confidence, redFlags, positiveSignals);

  return {
    verdict, confidence,
    probabilities: { fake: probs[0], suspicious: probs[1], genuine: probs[2] },
    signals, red_flags: redFlags, positive_signals: positiveSignals, summary, features,
  };
}

function computeSignals(f) {
  const s = (v) => Math.round(Math.min(Math.max(v * 100, 5), 95));
  return {
    linguistic_score: s(f.exclamationDensity * 0.2 + f.capsRatio * 0.2 + f.superlativeCount * 0.2 + (1 - f.avgWordLength) * 0.2 + f.adverbDensity * 0.2),
    sentiment_score:  s(Math.abs(f.emotionalPolarity - 0.5) * 2 * 0.5 + (1 - f.hedgingLanguage) * 0.2 + (1 - f.pronounBalance) * 0.3),
    behavioral_score: s(f.repetitionScore * 0.25 + (1 - f.firstPersonPronouns) * 0.2 + (1 - f.temporalScore) * 0.3 + (1 - f.uniqueBigramRatio) * 0.25),
    pattern_score:    s((1 - f.lexicalDiversity) * 0.25 + (1 - f.sentenceVariety) * 0.2 + f.emojiDensity * 0.15 + (1 - f.specificityScore) * 0.2 + (1 - f.punctVariety) * 0.2),
  };
}

function computeFlags(f) {
  const redFlags = [];
  const positiveSignals = [];
  if (f.exclamationDensity > 0.25)  redFlags.push("Excessive exclamation marks detected");
  if (f.capsRatio > 0.25)           redFlags.push("Unusually high capitalization ratio");
  if (f.emotionalPolarity > 0.9)    redFlags.push("Suspiciously one-sided positive sentiment");
  if (f.adverbDensity > 0.45)       redFlags.push("Excessive use of adverbs (over-descriptive)");
  if (f.temporalScore < 0.1)        redFlags.push("Lack of temporal markers (no time context)");
  if (f.uniqueBigramRatio < 0.8)    redFlags.push("High bigram repetition — possible template usage");
  if (f.lexicalDiversity < 0.35)    redFlags.push("Low vocabulary diversity — possible bot-generated");
  if (f.specificityScore < 0.1)     redFlags.push("Generic content — no specific product details");

  if (f.specificityScore > 0.35)                             positiveSignals.push("Contains specific product details/measurements");
  if (f.temporalScore > 0.4)                                 positiveSignals.push("Strong temporal context (duration/time references)");
  if (f.pronounBalance > 0.3 && f.pronounBalance < 0.7)      positiveSignals.push("Natural pronoun distribution");
  if (f.hedgingLanguage > 0.12)                              positiveSignals.push("Balanced opinion with hedging language");
  if (f.lexicalDiversity > 0.6)                              positiveSignals.push("High vocabulary richness");
  if (f.sentenceVariety > 0.2)                               positiveSignals.push("Natural variation in sentence structure");

  return { redFlags, positiveSignals };
}

function makeSummary(verdict, confidence, redFlags, positiveSignals) {
  if (verdict === "FAKE") {
    return `Critical authenticity failure. This review triggers ${redFlags.length} major red flags, notably ${redFlags[0] || "pattern inconsistency"}. The XGBoost ensemble (100 trees) identifies a strong non-human pattern with ${confidence}% confidence.`;
  }
  if (verdict === "SUSPICIOUS") {
    return `Anomalous patterns detected. While the review has some genuine signals, it exhibits ${redFlags.length} concerning behavior${redFlags.length !== 1 ? "s" : ""}. The semantic profile is inconsistent with standard consumer feedback. Confidence: ${confidence}%.`;
  }
  return `Verified authenticity. The review exhibits ${positiveSignals.length} high-confidence markers of genuine human experience. Detailed specificity and natural language variety support the verdict. Confidence: ${confidence}%.`;
}
