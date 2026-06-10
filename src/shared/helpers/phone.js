function normalizePhone(input) {
  if (!input) return null;
  let cleaned = input.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.slice(1);
  }
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1);
  }
  return cleaned || null;
}

function validatePhone(input) {
  if (!input) return true;
  const digits = input.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15;
}

module.exports = { normalizePhone, validatePhone };
