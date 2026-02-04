/**
 * Keyword-based NLP categorization for crime reports
 * Analyzes description to:
 * - Confirm category matches content
 * - Detect cyber vs physical indicators
 * - Calculate confidence and urgency scores
 * - Assign appropriate authority
 * - Detect potential spam/low-quality reports
 */

// Keyword dictionaries for each category
const categoryKeywords = {
    theft: ['steal', 'stole', 'stolen', 'rob', 'robbed', 'robbery', 'burglar', 'burglary', 'snatch', 'pickpocket', 'loot', 'thief', 'break-in'],
    harassment: ['harass', 'threaten', 'bully', 'stalk', 'intimidate', 'abuse', 'verbal abuse', 'mental torture', 'blackmail', 'extort'],
    cyber_fraud: ['hack', 'phishing', 'scam', 'fraud', 'online', 'password', 'otp', 'bank account', 'credit card', 'debit card', 'upi', 'crypto', 'bitcoin', 'website', 'email', 'social media', 'fake profile'],
    stalking: ['follow', 'following', 'stalk', 'stalking', 'watch', 'watching', 'spy', 'spying', 'track', 'tracking'],
    assault: ['hit', 'beat', 'punch', 'kick', 'attack', 'attacked', 'assault', 'violence', 'violent', 'injury', 'injured', 'weapon', 'knife', 'gun'],
    corruption: ['bribe', 'bribery', 'corrupt', 'corruption', 'illegal payment', 'under the table', 'government', 'official', 'misuse of power'],
    other: []
};

// Cyber-related keywords
const cyberKeywords = ['online', 'internet', 'website', 'email', 'social media', 'app', 'digital', 'computer', 'phone', 'mobile', 'hack', 'password', 'account', 'otp', 'upi', 'bank transfer', 'crypto', 'phishing', 'malware', 'virus'];

// Physical crime keywords
const physicalKeywords = ['street', 'home', 'house', 'office', 'shop', 'road', 'park', 'face to face', 'in person', 'physical', 'body', 'attacked', 'hit', 'punch', 'weapon'];

// High urgency keywords
const urgencyKeywords = {
    emergency: ['emergency', 'life threatening', 'dying', 'kidnap', 'hostage', 'gun', 'weapon', 'immediate', 'help', 'now', 'urgent'],
    high: ['serious', 'dangerous', 'threat', 'armed', 'injury', 'blood', 'hospital'],
    medium: ['repeated', 'ongoing', 'continuous', 'multiple times'],
    low: []
};

// Spam indicators
const spamIndicators = ['test', 'testing', 'asdf', 'qwerty', 'abc', 'xxx', 'lorem ipsum', '123'];

/**
 * Analyze and categorize a crime report
 * @param {Object} report - Report data with category, crimeType, description, threatLevel
 * @returns {Object} Analysis results with scores and flags
 */
export const analyzeReport = (report) => {
    const { category, crimeType, description, threatLevel } = report;
    const descLower = description.toLowerCase();

    // Calculate category confidence
    let confidenceScore = 50; // Base score
    const keywords = categoryKeywords[category] || [];
    let matchedKeywords = 0;

    keywords.forEach(keyword => {
        if (descLower.includes(keyword)) {
            matchedKeywords++;
        }
    });

    // Boost confidence based on keyword matches
    confidenceScore += Math.min(matchedKeywords * 10, 40);

    // Check if any other category has more matches (misclassification detection)
    let suggestedCategory = category;
    let maxMatches = matchedKeywords;

    Object.entries(categoryKeywords).forEach(([cat, words]) => {
        if (cat !== category && cat !== 'other') {
            let catMatches = 0;
            words.forEach(keyword => {
                if (descLower.includes(keyword)) catMatches++;
            });
            if (catMatches > maxMatches) {
                maxMatches = catMatches;
                suggestedCategory = cat;
                confidenceScore -= 15; // Reduce confidence if mismatch detected
            }
        }
    });

    // Detect crime type (cyber vs physical)
    let cyberScore = 0;
    let physicalScore = 0;

    cyberKeywords.forEach(keyword => {
        if (descLower.includes(keyword)) cyberScore++;
    });

    physicalKeywords.forEach(keyword => {
        if (descLower.includes(keyword)) physicalScore++;
    });

    const detectedCrimeType = cyberScore > physicalScore ? 'cyber' : 'physical';

    // Adjust confidence if crime type matches
    if (detectedCrimeType === crimeType) {
        confidenceScore += 10;
    } else {
        confidenceScore -= 10;
    }

    // Assign authority based on crime type
    const assignedAuthority = detectedCrimeType === 'cyber' ? 'cybercrime_unit' : 'local_police';

    // Calculate urgency score
    let urgencyScore = 25; // Base score

    // Add points based on threat level
    const threatLevelScores = {
        emergency: 50,
        high: 35,
        medium: 20,
        low: 10
    };
    urgencyScore += threatLevelScores[threatLevel] || 10;

    // Add points for urgent keywords
    urgencyKeywords.emergency.forEach(keyword => {
        if (descLower.includes(keyword)) urgencyScore += 10;
    });
    urgencyKeywords.high.forEach(keyword => {
        if (descLower.includes(keyword)) urgencyScore += 5;
    });

    // Cap scores at 100
    confidenceScore = Math.min(Math.max(confidenceScore, 0), 100);
    urgencyScore = Math.min(Math.max(urgencyScore, 0), 100);

    // Spam detection
    let spamFlag = false;
    spamIndicators.forEach(indicator => {
        if (descLower.includes(indicator)) spamFlag = true;
    });

    // Check description quality
    const wordCount = description.trim().split(/\s+/).length;
    if (wordCount < 10) {
        spamFlag = true;
        confidenceScore -= 20;
    }

    // Check for repetitive characters
    if (/(.)\1{4,}/.test(description)) {
        spamFlag = true;
        confidenceScore -= 30;
    }

    return {
        confidenceScore: Math.max(confidenceScore, 0),
        urgencyScore,
        assignedAuthority,
        suggestedCategory,
        detectedCrimeType,
        spamFlag
    };
};

export default analyzeReport;
