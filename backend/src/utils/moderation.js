const SEVERE_WORDS = new Set([
  'fuck', 'shit', 'asshole', 'bitch', 'cunt', 'nigger', 'faggot', 
  'motherfucker', 'cocksucker', 'whore', 'slut', 'prick'
]);

const MILD_WORDS = new Set([
  'crap', 'idiot', 'loser', 'stupid', 'dumbass', 'bastard', 'piss', 'retard', 'scam', 'spam'
]);

const SPAM_PATTERNS = [
  /free money/i,
  /click here/i,
  /buy now/i,
  /earn \$?\d+/i,
  /casino online/i,
  /viagra/i,
  /cheap pharmacy/i,
  /make cash/i,
  /work from home/i
];

/**
 * Local fallback checker using regex and word lists
 */
export const localModerate = (text) => {
  const cleanText = text.toLowerCase();
  
  // Check spam patterns
  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(cleanText)) {
      return {
        isSafe: false,
        isSuspicious: false,
        isHighlyUnsafe: true,
        decision: 'rejected',
        reason: `Local filter: Spam pattern matched (${pattern.source})`,
        scores: { spam: 1.0 }
      };
    }
  }

  // Count profanity occurrences
  const words = cleanText.split(/\s+/).map(w => w.replace(/[^a-z]/g, ''));
  let severeCount = 0;
  let mildCount = 0;
  const matchedSevere = [];
  const matchedMild = [];
  
  for (const w of words) {
    if (SEVERE_WORDS.has(w)) {
      severeCount++;
      matchedSevere.push(w);
    } else if (MILD_WORDS.has(w)) {
      mildCount++;
      matchedMild.push(w);
    }
  }

  // Check phrase-level matches for "die" or "kill"
  if (cleanText.includes("kill yourself") || cleanText.includes("die you")) {
    severeCount++;
    matchedSevere.push("kill/die threat");
  }

  if (severeCount > 0) {
    return {
      isSafe: false,
      isSuspicious: false,
      isHighlyUnsafe: true,
      decision: 'rejected',
      reason: `Local filter: Severe abusive words detected (${matchedSevere.join(', ')})`,
      scores: { toxic: 0.98 }
    };
  }

  if (mildCount >= 2) {
    return {
      isSafe: false,
      isSuspicious: true,
      isHighlyUnsafe: false,
      decision: 'flagged',
      reason: `Local filter: Multiple abusive words detected (${matchedMild.join(', ')})`,
      scores: { toxic: 0.65 }
    };
  } else if (mildCount === 1) {
    return {
      isSafe: false,
      isSuspicious: true,
      isHighlyUnsafe: false,
      decision: 'flagged',
      reason: `Local filter: Abusive word detected (${matchedMild[0]})`,
      scores: { toxic: 0.5 }
    };
  }

  return {
    isSafe: true,
    isSuspicious: false,
    isHighlyUnsafe: false,
    decision: 'approved',
    reason: 'Local filter: Safe content',
    scores: { toxic: 0.05 }
  };
};

const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(?:the\s+)?(?:above|previous)\s+instructions/i,
  /ignore\s+all\s+prior\s+directives/i,
  /bypass\s+(?:the\s+)?(?:safety|moderation)\s+filters/i,
  /you\s+must\s+now\s+act\s+as/i,
  /dan\s+mode/i,
  /jailbreak/i,
  /developer\s+mode\s+active/i,
  /system\s+directive/i,
  /ignore\s+restrictions/i
];

/**
 * Checks for common prompt injection patterns in text
 * @param {string} text
 * @returns {boolean}
 */
export const detectPromptInjection = (text) => {
  const clean = text.toLowerCase();
  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    if (pattern.test(clean)) {
      return true;
    }
  }
  return false;
};

/**
 * Moderate text using Hugging Face Serverless Inference API (toxic-bert)
 * Falls back to local profanity checker on loading/errors/rate-limit.
 * @param {string} text 
 * @returns {Promise<{isSafe: boolean, isSuspicious: boolean, isHighlyUnsafe: boolean, decision: string, reason: string, scores: Object}>}
 */
export const moderateText = async (text) => {
  if (!text || !text.trim()) {
    return {
      isSafe: true,
      isSuspicious: false,
      isHighlyUnsafe: false,
      decision: 'approved',
      reason: 'Empty text',
      scores: {}
    };
  }

  // Filter prompt injection attempts
  if (detectPromptInjection(text)) {
    return {
      isSafe: false,
      isSuspicious: false,
      isHighlyUnsafe: true,
      decision: 'rejected',
      reason: 'AI Moderation Security: Prompt injection attempt detected.',
      scores: { injection: 1.0 }
    };
  }

  // Always run local check first to see if it's an immediate auto-block/spam
  const localRes = localModerate(text);
  if (localRes.isHighlyUnsafe) {
    return localRes;
  }

  try {
    const headers = {
      "Content-Type": "application/json"
    };

    if (process.env.HF_TOKEN) {
      headers["Authorization"] = `Bearer ${process.env.HF_TOKEN}`;
    }

    const response = await fetch(
      "https://api-inference.huggingface.co/models/unitary/toxic-bert",
      {
        headers,
        method: "POST",
        body: JSON.stringify({ inputs: text.slice(0, 1000) }),
        signal: AbortSignal.timeout(5000) // 5 seconds timeout
      }
    );

    if (!response.ok) {
      console.warn(`Hugging Face API returned status ${response.status}. Falling back to local moderation.`);
      return localRes;
    }

    const result = await response.json();

    // Check if Hugging Face is loading the model (returns 503 or model loading json message)
    if (result.error && result.error.includes("loading")) {
      console.warn(`Hugging Face Model is currently loading. Falling back to local moderation.`);
      return localRes;
    }

    if (Array.isArray(result) && Array.isArray(result[0])) {
      const scores = {};
      result[0].forEach(item => {
        scores[item.label] = item.score;
      });

      const toxicity = scores.toxic || 0;
      const severeToxicity = scores.severe_toxic || 0;
      const obscene = scores.obscene || 0;
      const threat = scores.threat || 0;
      const insult = scores.insult || 0;
      const identityHate = scores.identity_hate || 0;

      const maxScore = Math.max(toxicity, severeToxicity, obscene, threat, insult, identityHate);

      let decision = 'approved';
      let isSafe = true;
      let isSuspicious = false;
      let isHighlyUnsafe = false;

      if (maxScore > 0.85) {
        decision = 'rejected';
        isSafe = false;
        isHighlyUnsafe = true;
      } else if (maxScore >= 0.35) {
        decision = 'flagged';
        isSafe = false;
        isSuspicious = true;
      }

      return {
        isSafe,
        isSuspicious,
        isHighlyUnsafe,
        decision,
        reason: `AI Moderation: Max toxicity score: ${maxScore.toFixed(3)}`,
        scores
      };
    }

    // Default to local check if output format is unexpected
    return localRes;
  } catch (error) {
    console.error("AI Moderation API query failed. Falling back to local moderation. Error:", error.message);
    return localRes;
  }
};
