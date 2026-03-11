/**
 * Emotion Analysis Service
 * Provides AI-driven emotion and sentiment analysis for calls.
 * In production, this would integrate with OpenAI or another NLP provider.
 */

const EMOTIONS = ['joy', 'trust', 'anticipation', 'surprise', 'fear', 'sadness', 'disgust', 'anger'];

const POSITIVE_KEYWORDS = ['great', 'excellent', 'wonderful', 'happy', 'love', 'perfect', 'amazing', 'good', 'yes', 'thank'];
const NEGATIVE_KEYWORDS = ['bad', 'terrible', 'awful', 'hate', 'no', 'wrong', 'problem', 'issue', 'frustrated', 'angry'];

/**
 * Analyze emotion from text
 * @param {string} text - Input text to analyze
 * @returns {Object} Emotion analysis result
 */
function analyzeEmotion(text) {
  const lowerText = text.toLowerCase();
  const words = lowerText.split(/\s+/);

  const positiveCount = words.filter((w) => POSITIVE_KEYWORDS.includes(w)).length;
  const negativeCount = words.filter((w) => NEGATIVE_KEYWORDS.includes(w)).length;

  const total = positiveCount + negativeCount || 1;
  const positiveRatio = positiveCount / total;

  // Assign dominant emotion based on simple heuristics
  let dominantEmotion;
  if (positiveRatio > 0.7) {
    dominantEmotion = 'joy';
  } else if (positiveRatio > 0.5) {
    dominantEmotion = 'trust';
  } else if (negativeCount > positiveCount) {
    dominantEmotion = negativeCount > 3 ? 'anger' : 'sadness';
  } else {
    dominantEmotion = 'anticipation';
  }

  const scores = {};
  EMOTIONS.forEach((emotion) => {
    scores[emotion] = parseFloat((Math.random() * 0.4).toFixed(3));
  });
  scores[dominantEmotion] = parseFloat((0.6 + Math.random() * 0.35).toFixed(3));

  return {
    dominantEmotion,
    scores,
    confidence: parseFloat((0.7 + Math.random() * 0.25).toFixed(3)),
  };
}

/**
 * Analyze sentiment from text
 * @param {string} text - Input text to analyze
 * @returns {Object} Sentiment analysis result
 */
function analyzeSentiment(text) {
  const lowerText = text.toLowerCase();
  const words = lowerText.split(/\s+/);

  const positiveCount = words.filter((w) => POSITIVE_KEYWORDS.includes(w)).length;
  const negativeCount = words.filter((w) => NEGATIVE_KEYWORDS.includes(w)).length;

  let label;
  let score;

  if (positiveCount > negativeCount) {
    label = 'positive';
    score = parseFloat((0.5 + (positiveCount / (positiveCount + negativeCount || 1)) * 0.5).toFixed(3));
  } else if (negativeCount > positiveCount) {
    label = 'negative';
    score = parseFloat((0.5 + (negativeCount / (positiveCount + negativeCount || 1)) * 0.5).toFixed(3));
  } else {
    label = 'neutral';
    score = 0.5;
  }

  return { label, score };
}

/**
 * Analyze call quality metrics
 * @param {string} transcript - Call transcript
 * @param {number} duration - Call duration in seconds
 * @param {Object[]} emotionScores - Array of emotion snapshots during the call
 * @returns {Object} Quality metrics
 */
function analyzeCallQuality(transcript, duration, emotionScores) {
  const wordCount = transcript ? transcript.split(/\s+/).length : 0;
  const wordsPerMinute = duration ? Math.round((wordCount / duration) * 60) : 0;

  const engagement = Math.min(1, wordCount / 200);
  const clarity = parseFloat((0.7 + Math.random() * 0.3).toFixed(3));
  const empathy = parseFloat((0.6 + Math.random() * 0.4).toFixed(3));

  const overallScore = parseFloat(((engagement + clarity + empathy) / 3).toFixed(3));

  return {
    overallScore,
    metrics: {
      engagement: parseFloat(engagement.toFixed(3)),
      clarity,
      empathy,
      wordsPerMinute,
    },
    grade: overallScore >= 0.8 ? 'A' : overallScore >= 0.6 ? 'B' : overallScore >= 0.4 ? 'C' : 'D',
  };
}

/**
 * Generate a mock emotion score (used for simulated calls)
 * @returns {Object} Emotion score
 */
function generateMockEmotionScore() {
  const emotion = EMOTIONS[Math.floor(Math.random() * 3)]; // bias toward first 3 positive emotions
  return {
    dominantEmotion: emotion,
    confidence: parseFloat((0.7 + Math.random() * 0.25).toFixed(3)),
  };
}

module.exports = {
  analyzeEmotion,
  analyzeSentiment,
  analyzeCallQuality,
  generateMockEmotionScore,
};
