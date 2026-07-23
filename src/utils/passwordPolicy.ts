const PASSWORD_FORMAT = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,100}$/;

export function isPasswordValid(password: string): boolean {
  return PASSWORD_FORMAT.test(password);
}

export function getPasswordRuleChecks(password: string) {
  return {
    minLength: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
}

export function isPasswordPolicyMet(password: string): boolean {
  const checks = getPasswordRuleChecks(password);
  return checks.minLength && checks.uppercase && checks.number && checks.special;
}
