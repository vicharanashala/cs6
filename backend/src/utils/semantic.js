import Category from '../models/Category.js';

// Expanded stop words
export const STOP_WORDS = new Set([
  'how', 'to', 'the', 'a', 'an', 'is', 'on', 'in', 'for', 'of', 'with', 'at', 
  'by', 'from', 'my', 'your', 'our', 'their', 'this', 'that', 'these', 'those',
  'what', 'why', 'where', 'when', 'who', 'which', 'do', 'does', 'did', 'done',
  'can', 'could', 'should', 'would', 'will', 'shall', 'may', 'might', 'must',
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
  'have', 'has', 'had', 'having', 'be', 'been', 'being', 'am', 'are', 'was', 'were',
  'about', 'above', 'after', 'again', 'against', 'all', 'any', 'as', 'at',
  'because', 'before', 'below', 'between', 'both', 'but', 'during', 'each',
  'few', 'further', 'here', 'its', 'itself', 'no', 'nor', 'not', 'only', 'other',
  'ours', 'ourselves', 'out', 'over', 'own', 'same', 'so', 'some', 'such',
  'than', 'too', 'very', 's', 't', 'just', 'shouldnt', 'wasnt', 'werent', 'won', 'wont',
  'please', 'help', 'know', 'tell', 'want', 'need', 'ask', 'question', 'problem', 'issue',
  'get', 'got', 'give', 'take', 'make', 'do', 'does', 'find', 'view', 'show'
]);

// Slang translation map
export const SLANG_MAP = {
  "messed": "error",
  "broken": "error",
  "screwed": "error",
  "buggy": "error",
  "crashed": "error",
  "crashing": "error",
  "lagging": "latency",
  "slow": "latency",
  "crawl": "latency",
  "stuck": "blocked",
  "hang": "blocked",
  "freeze": "blocked",
  "cash": "money",
  "bucks": "money",
  "crap": "error",
  "garbage": "error",
  "profs": "professor",
  "prof": "professor",
  "wifi": "internet",
  "net": "internet",
  "admin": "administration",
  "mod": "moderator"
};

// Abbreviations expansion map
export const ABBREVIATION_MAP = {
  "auth": ["authentication", "login", "signup", "credential"],
  "db": ["database", "mongodb", "sql", "mongoose"],
  "vm": ["virtual", "machine", "server", "host"],
  "aws": ["amazon", "cloud", "deployment", "server", "ec2"],
  "mern": ["mongodb", "express", "react", "node", "javascript"],
  "api": ["endpoint", "route", "backend", "request"],
  "ui": ["frontend", "styling", "component", "interface", "design"],
  "ux": ["frontend", "design", "layout", "interface"],
  "gui": ["frontend", "interface", "screen"],
  "ssl": ["security", "certificate", "https", "ssl"],
  "cors": ["cross", "origin", "headers", "error"],
  "midsem": ["midterm", "exam", "academic"],
  "endsem": ["final", "exam", "academic"],
  "cgpa": ["grade", "academic", "gpa", "score"],
  "gpa": ["grade", "academic", "cgpa", "score"],
  "fee": ["payment", "finance", "fees"],
  "webapp": ["application", "web"],
  "app": ["application"]
};

// Multilingual / Hinglish translation map
export const MULTILINGUAL_MAP = {
  "kab": ["when", "schedule", "time"],
  "kidhar": ["where", "location"],
  "kahan": ["where", "location"],
  "paise": ["payment", "money", "fee", "fees"],
  "rupay": ["payment", "money", "fee", "fees"],
  "rupees": ["payment", "money", "fee", "fees"],
  "khana": ["food", "mess"],
  "kamra": ["room", "hostel"],
  "gaddi": ["bus", "transport"],
  "gaadi": ["bus", "transport"],
  "chutti": ["holiday", "leave", "calendar"],
  "paper": ["exam", "test"],
  "naukri": ["job", "placement", "internship"],
  "milna": ["get", "receive"],
  "milega": ["get", "receive"],
  "batao": ["explain", "help"],
  "likha": ["written", "body"]
};

// Category and conceptual intent maps
export const CONCEPTUAL_MAPS = {
  deployment: {
    intent: "deployment",
    synonyms: ["deploy", "host", "hosting", "publish", "run", "aws", "ec2", "heroku", "server", "render", "vercel", "production", "online", "setup", "port", "nginx", "docker", "kubernetes", "cloud", "ssl", "domain", "https", "github", "git"]
  },
  authentication: {
    intent: "authentication",
    synonyms: ["login", "signin", "signup", "register", "registration", "auth", "password", "email", "reset", "forgot", "account", "logout", "credentials", "token", "jwt", "otp", "verify", "verification", "secure", "oauth"]
  },
  errors: {
    intent: "errors",
    synonyms: ["error", "crash", "bug", "fail", "failure", "issue", "problem", "broken", "crashing", "exception", "incorrect", "invalid", "blocked", "latency", "warning", "rejected", "denied", "slow", "timeout", "network", "connect", "connection", "refused", "cors"]
  },
  admissions: {
    intent: "admissions",
    synonyms: ["admission", "enroll", "enrollment", "apply", "application", "join", "joining", "entry", "criteria", "eligibility", "documents", "certificate", "seat", "verification", "cutoff", "quota", "fees", "registration", "intake"]
  },
  hostel: {
    intent: "hostel",
    synonyms: ["hostel", "room", "housing", "accommodation", "mess", "food", "dorm", "dormitory", "roommate", "warden", "curfew", "stay", "rent", "laundry", "bed", "allotment", "meals", "water", "electricity"]
  },
  academics: {
    intent: "academics",
    synonyms: ["academic", "academics", "course", "subject", "syllabus", "class", "lecture", "professor", "faculty", "attendance", "credit", "cgpa", "gpa", "grade", "curriculum", "semester", "midsem", "endsem", "branch", "department", "degree", "marks"]
  },
  placements: {
    intent: "placements",
    synonyms: ["placement", "placements", "job", "internship", "interview", "company", "placement cell", "resume", "cv", "recruit", "recruiter", "package", "salary", "offer", "hire", "career", "rounds", "aptitude"]
  },
  transport: {
    intent: "transport",
    synonyms: ["transport", "bus", "route", "shuttle", "vehicle", "pickup", "drop", "driver", "pass", "timing", "schedule", "fare", "cab", "commute", "shuttles"]
  },
  exams: {
    intent: "exams",
    synonyms: ["exam", "exams", "examination", "test", "quiz", "midsem", "endsem", "result", "grade", "hall ticket", "admit card", "reappear", "backlog", "supply", "schedule", "timetable", "datesheet"]
  },
  finance: {
    intent: "finance",
    synonyms: ["finance", "stipend", "salary", "pay", "payment", "fees", "cost", "money", "allowance", "compensation", "fee", "refund", "receipt", "transaction", "bank", "scholarship", "dues", "billing", "bill"]
  },
  facilities: {
    intent: "facilities",
    synonyms: ["library", "lab", "computer", "parking", "gym", "sports", "recreation", "hours", "zone", "map", "building", "room", "facility", "facilities", "canteen", "wifi", "internet"]
  },
  technology: {
    intent: "technology",
    synonyms: ["react", "vue", "angular", "node", "nodejs", "express", "mongodb", "mongoose", "javascript", "js", "html", "css", "code", "programming", "database", "db", "frontend", "backend", "fullstack", "mern", "api", "json", "website", "web"]
  }
};

/**
 * Standard Levenshtein distance function for typo-checking
 */
export const getLevenshteinDistance = (a, b) => {
  const tmp = [];
  let i, j;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  for (i = 0; i <= a.length; i++) tmp[i] = [i];
  for (j = 0; j <= b.length; j++) tmp[0][j] = j;
  for (i = 1; i <= a.length; i++) {
    for (j = 1; j <= b.length; j++) {
      tmp[i][j] = Math.min(
        tmp[i - 1][j] + 1,
        tmp[i][j - 1] + 1,
        tmp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return tmp[a.length][b.length];
};

/**
 * Stem word to standard base form
 */
export const stemWord = (word) => {
  let w = word.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (w.endsWith('ing')) w = w.slice(0, -3);
  else if (w.endsWith('ed')) w = w.slice(0, -2);
  else if (w.endsWith('s') && !w.endsWith('ss')) w = w.slice(0, -1);
  else if (w.endsWith('ment')) w = w.slice(0, -4);
  else if (w.endsWith('tion')) w = w.slice(0, -4);
  else if (w.endsWith('ability')) w = w.slice(0, -7) + 'able';
  return w;
};

/**
 * Compare two words under typo rules and prefix matching
 */
const matchWordOrConcept = (word, targetWord) => {
  const w = word.toLowerCase();
  const t = targetWord.toLowerCase();
  if (w === t) return true;
  // Prefix matching for incomplete queries (ensure length difference is at most 3 to avoid false positive collisions)
  if (w.length >= 3 && t.startsWith(w) && (t.length - w.length <= 3)) return true;
  // Levenshtein distance for typos (allow distance of 2 for length >= 5)
  if (w.length >= 4 && t.length >= 4) {
    const limit = w.length >= 5 ? 2 : 1;
    if (getLevenshteinDistance(w, t) <= limit) return true;
  }
  return false;
};

/**
 * Expand a single word token through dictionaries, spelling/typo correction, and abbreviations
 */
export const expandToken = (word) => {
  const stemmed = stemWord(word);
  if (STOP_WORDS.has(stemmed) || stemmed.length <= 1) {
    return [];
  }

  const results = new Set([stemmed]);

  // 1. Translate Slang
  if (SLANG_MAP[stemmed]) {
    results.add(SLANG_MAP[stemmed]);
  }

  // 2. Expand Abbreviations
  if (ABBREVIATION_MAP[stemmed]) {
    ABBREVIATION_MAP[stemmed].forEach(w => results.add(w));
  }

  // 3. Map Multilingual / Hinglish
  if (MULTILINGUAL_MAP[stemmed]) {
    MULTILINGUAL_MAP[stemmed].forEach(w => results.add(w));
  }

  // 4. Typo correction against all synonyms of CONCEPTUAL_MAPS
  for (const concept of Object.values(CONCEPTUAL_MAPS)) {
    for (const syn of concept.synonyms) {
      if (matchWordOrConcept(stemmed, syn)) {
        results.add(syn);
      }
    }
  }

  return Array.from(results);
};

/**
 * Infer the user's primary information needs / intents from query tokens
 * Returns a Set of matching intent names
 */
export const inferIntents = (tokens) => {
  const intentScores = {};
  for (const key of Object.keys(CONCEPTUAL_MAPS)) {
    const concept = CONCEPTUAL_MAPS[key];
    let score = 0;
    for (const token of tokens) {
      if (concept.synonyms.includes(token)) {
        score++;
      }
    }
    if (score > 0) {
      intentScores[concept.intent] = score;
    }
  }

  if (Object.keys(intentScores).length === 0) {
    return new Set();
  }

  // Get max score
  const maxScore = Math.max(...Object.values(intentScores));
  const primaryIntents = new Set();
  for (const [intent, score] of Object.entries(intentScores)) {
    // Keep intent if it has at least 2 matches, or is the max score, or is within 25% of the max score
    if (score >= 2 || score === maxScore || score >= maxScore * 0.25) {
      primaryIntents.add(intent);
    }
  }

  return primaryIntents;
};

/**
 * Formulate an expanded set of semantic tokens for a text query
 */
export const getExpandedTokens = (text, tags = [], isQuery = false) => {
  const tokens = new Set();

  if (text) {
    const words = text.split(/\s+/);
    words.forEach(w => {
      expandToken(w).forEach(expanded => tokens.add(expanded));
    });
  }

  if (tags && Array.isArray(tags)) {
    tags.forEach(tag => {
      // Tags are usually precise, but we expand them too
      expandToken(tag).forEach(expanded => tokens.add(expanded));
      const stemmed = stemWord(tag);
      if (stemmed.length > 1) {
        tokens.add(stemmed);
      }
    });
  }

  // Intent-based calculation
  const inferredIntents = inferIntents(tokens);

  // Concept category synonym expansion is ONLY applied to the user's query to avoid database token bloat
  if (isQuery) {
    inferredIntents.forEach(intentName => {
      const concept = CONCEPTUAL_MAPS[intentName];
      if (concept) {
        concept.synonyms.forEach(syn => tokens.add(syn));
      }
    });
  }

  return { tokens, intents: inferredIntents };
};

/**
 * Calculate Jaccard Similarity between two sets
 */
export const calculateJaccardSimilarity = (setA, setB) => {
  if (setA.size === 0 || setB.size === 0) return 0;
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return intersection.size / union.size;
};

/**
 * Calculate blended Semantic Similarity (Jaccard + Overlap/Containment)
 */
export const calculateSemanticSimilarity = (setA, setB) => {
  if (setA.size === 0 || setB.size === 0) return 0;
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  
  const jaccard = intersection.size / union.size;
  const overlap = intersection.size / Math.min(setA.size, setB.size);
  
  // Blend Jaccard (40%) and Overlap (60%) for length-independent intent matching
  return (0.4 * jaccard) + (0.6 * overlap);
};

/**
 * Determine the intent compatibility between query intents and document intents
 * If both have intents and they do NOT overlap, return a penalty factor (e.g., 0.15)
 * Otherwise, return 1.0
 */
export const calculateIntentCompatibility = (queryIntents, docIntents) => {
  if (queryIntents.size === 0 || docIntents.size === 0) {
    return 1.0; // Let Jaccard score do the work if we can't infer intent
  }
  const intersection = [...queryIntents].filter(x => docIntents.has(x));
  if (intersection.length > 0) {
    return 1.0;
  }
  return 0.15; // Ignore superficial keyword overlap (Rule 6)
};

/**
 * Retrieve database categories mapped by ID for fast lookup
 */
export const getCategoryMap = async () => {
  try {
    const categories = await Category.find({}).lean();
    const map = new Map();
    categories.forEach(c => {
      map.set(c._id.toString(), c.name.toLowerCase());
    });
    return map;
  } catch (error) {
    console.error("Error building category map:", error);
    return new Map();
  }
};
