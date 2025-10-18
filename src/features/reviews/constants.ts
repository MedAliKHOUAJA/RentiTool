// ==========================================
// SENTIMENT ANALYSIS CONSTANTS
// ==========================================

export const SENTIMENT_CONFIG = {
    positive: {
      label: 'Positif',
      emoji: '😊',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      textColor: 'text-green-700 dark:text-green-400',
      borderColor: 'border-green-300 dark:border-green-700',
      barColor: 'bg-green-500',
      gaugeColor: 'text-green-600',
    },
    negative: {
      label: 'Négatif',
      emoji: '😞',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      textColor: 'text-red-700 dark:text-red-400',
      borderColor: 'border-red-300 dark:border-red-700',
      barColor: 'bg-red-500',
      gaugeColor: 'text-red-600',
    },
    neutral: {
      label: 'Neutre',
      emoji: '😐',
      bgColor: 'bg-gray-100 dark:bg-gray-800',
      textColor: 'text-gray-700 dark:text-gray-300',
      borderColor: 'border-gray-300 dark:border-gray-600',
      barColor: 'bg-gray-400',
      gaugeColor: 'text-gray-600',
    },
    mixed: {
      label: 'Mitigé',
      emoji: '🤔',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
      textColor: 'text-yellow-700 dark:text-yellow-400',
      borderColor: 'border-yellow-300 dark:border-yellow-700',
      barColor: 'bg-yellow-500',
      gaugeColor: 'text-yellow-600',
    },
  } as const;
  
  export const SENTIMENT_LABELS = {
    positive: 'Positif',
    negative: 'Négatif',
    neutral: 'Neutre',
    mixed: 'Mitigé',
  } as const;
  
  export const SENTIMENT_EMOJIS = {
    positive: '😊',
    negative: '😞',
    neutral: '😐',
    mixed: '🤔',
  } as const;
  
  // ==========================================
  // RATING CONSTANTS
  // ==========================================
  
  export const RATING_THRESHOLDS = {
    EXCELLENT: 4.5,
    GOOD: 3.5,
    AVERAGE: 2.5,
    POOR: 1.5,
  } as const;
  
  export const RATING_LABELS = {
    tool: {
      toolStatus: 'État de l\'outil',
      fiability: 'Fiabilité',
    },
    owner: {
      communication: 'Communication',
      ponctuality: 'Ponctualité',
    },
  } as const;
  
  // ==========================================
  // REVIEW CONSTANTS
  // ==========================================
  
  export const REVIEW_ENTITY_TYPES = {
    TOOL: 1,
    RATER: 2,
    RATED: 3,
  } as const;
  
  export const MAX_RATING = 5;
  export const MIN_RATING = 1;
  
  export const REVIEW_COMMENT_MAX_LENGTH = 1000;
  export const REVIEW_COMMENT_MIN_LENGTH = 10;
  
  // ==========================================
  // DATE FORMATS
  // ==========================================
  
  export const DATE_FORMATS = {
    SHORT: 'dd/MM/yyyy',
    LONG: 'dd MMMM yyyy',
    FULL: 'EEEE dd MMMM yyyy',
    WITH_TIME: 'dd/MM/yyyy HH:mm',
  } as const;
  
  export const LOCALE_FR = {
    code: 'fr-FR',
    dateFormat: {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    },
    dateTimeFormat: {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    },
  } as const;
  
  // ==========================================
  // UI CONSTANTS
  // ==========================================
  
  export const AVATAR_SIZES = {
    xs: 'w-8 h-8',
    sm: 'w-10 h-10',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20',
  } as const;
  
  export const STAR_SIZES = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8',
  } as const;
  
  // ==========================================
  // ANIMATION CONSTANTS
  // ==========================================
  
  export const ANIMATION_DURATION = {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500,
  } as const;
  
  export const TRANSITION_CLASSES = {
    DEFAULT: 'transition-all duration-300',
    FAST: 'transition-all duration-150',
    SLOW: 'transition-all duration-500',
  } as const;