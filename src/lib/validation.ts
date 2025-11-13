// src/lib/validation.ts
export interface ValidationResult {
  isValid: boolean;
  errors: { [key: string]: string };
}

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  // Valider les numéros tunisiens (+216 XX XXX XXX ou XX XXX XXX)
  const phoneRegex = /^(\+216)?[0-9]{8}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Règles basiques: longueur minimale et au moins un chiffre
  if (password.length < 8) {
    errors.push('Le mot de passe doit contenir au moins 8 caractères');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins un chiffre');
  }
  
  if (!/[A-Za-z]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins une lettre');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateName = (name: string): boolean => {
  return name.length >= 2 && /^[a-zA-Zà-ÿÀ-Ÿ\s'-]+$/.test(name);
};

export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Supprimer les balises HTML
    .replace(/\s+/g, ' '); // Normaliser les espaces
};

export const validateSignupData = (data: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  userType: string;
  city: string;
}): ValidationResult => {
  const errors: { [key: string]: string } = {};

  // Validation du prénom
  if (!data.firstName || !validateName(data.firstName)) {
    errors.firstName = 'Le prénom doit contenir au moins 2 caractères alphabétiques';
  }

  // Validation du nom
  if (!data.lastName || !validateName(data.lastName)) {
    errors.lastName = 'Le nom doit contenir au moins 2 caractères alphabétiques';
  }

  // Validation de l'email
  if (!data.email || !validateEmail(data.email)) {
    errors.email = 'L\'email n\'est pas valide';
  }

  // Validation du téléphone
  if (!data.phone || !validatePhone(data.phone)) {
    errors.phone = 'Le numéro de téléphone doit être un numéro tunisien valide (8 chiffres)';
  }

  // Validation du mot de passe
  const passwordValidation = validatePassword(data.password);
  if (!passwordValidation.isValid) {
    errors.password = passwordValidation.errors.join(', ');
  }

  // Validation de la confirmation du mot de passe
  if (data.password !== data.confirmPassword) {
    errors.confirmPassword = 'Les mots de passe ne correspondent pas';
  }

  // Validation du type d'utilisateur
  const validUserTypes = ['tenant', 'owner'];
  if (!data.userType || !validUserTypes.includes(data.userType)) {
    errors.userType = 'Le type d\'utilisateur doit être tenant ou owner';
  }

  // Validation de la ville
  if (!data.city || data.city.trim().length < 2) {
    errors.city = 'La ville doit contenir au moins 2 caractères';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateLoginData = (data: {
  email: string;
  password: string;
}): ValidationResult => {
  const errors: { [key: string]: string } = {};

  if (!data.email || !validateEmail(data.email)) {
    errors.email = 'L\'email n\'est pas valide';
  }

  if (!data.password || data.password.length < 1) {
    errors.password = 'Le mot de passe est requis';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};