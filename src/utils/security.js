/**
 * Input güvenlik fonksiyonları
 * XSS, SQL Injection ve diğer güvenlik açıklarını önler
 */

/**
 * HTML karakterlerini escape eder (XSS koruması)
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Tehlikeli karakterleri temizler
 */
export function cleanInput(input) {
  if (typeof input !== 'string') return input;
  
  // Script taglerini kaldır
  let cleaned = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Tehlikeli HTML taglerini kaldır
  cleaned = cleaned.replace(/<iframe|<object|<embed|<link|<style/gi, '');
  
  // SQL injection karakterlerini temizle
  cleaned = cleaned.replace(/(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi, '');
  
  // Null bytes
  cleaned = cleaned.replace(/\0/g, '');
  
  return cleaned.trim();
}

/**
 * Sadece alfanumerik ve belirli karakterlere izin verir
 */
export function sanitizeAlphanumeric(input, allowSpaces = true, allowSpecial = '') {
  if (typeof input !== 'string') return input;
  
  const spacePattern = allowSpaces ? '\\s' : '';
  const specialPattern = allowSpecial.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`[^a-zA-Z0-9${spacePattern}${specialPattern}ğüşıöçĞÜŞİÖÇ]`, 'g');
  
  return input.replace(pattern, '').trim();
}

/**
 * Email validasyonu
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Maksimum uzunluk kontrolü
 */
export function limitLength(input, maxLength) {
  if (typeof input !== 'string') return input;
  return input.slice(0, maxLength);
}

/**
 * Grup adı için özel sanitizasyon
 */
export function sanitizeGroupName(name) {
  // Tehlikeli karakterleri temizle
  let cleaned = cleanInput(name);
  
  // Sadece güvenli karakterlere izin ver
  cleaned = sanitizeAlphanumeric(cleaned, true, '-_');
  
  // Maksimum uzunluk
  cleaned = limitLength(cleaned, 50);
  
  return cleaned;
}

/**
 * Kategori adı için özel sanitizasyon
 */
export function sanitizeCategory(category) {
  // Tehlikeli karakterleri temizle
  let cleaned = cleanInput(category);
  
  // Sadece güvenli karakterlere izin ver
  cleaned = sanitizeAlphanumeric(cleaned, true, '-_');
  
  // Maksimum uzunluk
  cleaned = limitLength(cleaned, 30);
  
  return cleaned;
}

/**
 * Davet kodu için özel sanitizasyon
 */
export function sanitizeInviteCode(code) {
  // Sadece alfanumerik karakterler
  let cleaned = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
  
  // Maksimum uzunluk
  cleaned = limitLength(cleaned, 10);
  
  return cleaned;
}

/**
 * Kullanıcı adı için özel sanitizasyon
 */
export function sanitizeUsername(username) {
  // Tehlikeli karakterleri temizle
  let cleaned = cleanInput(username);
  
  // Sadece güvenli karakterlere izin ver
  cleaned = sanitizeAlphanumeric(cleaned, true, '-_.');
  
  // Maksimum uzunluk
  cleaned = limitLength(cleaned, 30);
  
  return cleaned;
}
