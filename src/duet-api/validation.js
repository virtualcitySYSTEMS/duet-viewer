/**
 * @param {string} value
 * @returns {boolean|string}
 */
export function isValidText(value) {
  const pattern = /\D+/;
  return pattern.test(value) || `Invalid text: ${value}`;
}

/**
 * @param {string} value
 * @returns {boolean|string}
 */
export function isValidEmail(value) {
  const pattern = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return pattern.test(value) || 'Invalid e-mail.';
}
