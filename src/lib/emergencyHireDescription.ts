export const EMERGENCY_HIRE_DESCRIPTION_MIN_LENGTH = 10;

export function isValidEmergencyHireDescription(value: string): boolean {
  return value.trim().length >= EMERGENCY_HIRE_DESCRIPTION_MIN_LENGTH;
}
