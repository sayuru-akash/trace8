const PATTERNS: [RegExp, string][] = [
  [/((?:api[_-]?key|api[_-]?secret|api[_-]?token|auth[_-]?token|access[_-]?token|secret[_-]?key|private[_-]?key|client[_-]?secret)\s*[=:]\s*)([^\s&;]{8,})/gi, "$1***REDACTED***"],
  [/(Bearer\s+)[A-Za-z0-9\-._~+/]+=*/g, "$1***REDACTED***"],
  [/(Basic\s+)[A-Za-z0-9+/]+=*/g, "$1***REDACTED***"],
  [/(ghp_[A-Za-z0-9]{36})/g, "***REDACTED_GITHUB_TOKEN***"],
  [/(gho_[A-Za-z0-9]{36})/g, "***REDACTED_GITHUB_TOKEN***"],
  [/(ghs_[A-Za-z0-9]{36})/g, "***REDACTED_GITHUB_TOKEN***"],
  [/(ghr_[A-Za-z0-9]{36})/g, "***REDACTED_GITHUB_TOKEN***"],
  [/(https?:\/\/[^:]+:)([^@\s]{4,})(@)/g, "$1***REDACTED***$3"],
  [/^([A-Z][A-Z0-9_]*(?:KEY|SECRET|TOKEN|PASSWORD|CREDENTIAL|AUTH)[A-Z0-9_]*)=(.{4,})$/gm, "$1=***REDACTED***"],
];

export function maskSecrets(text: string): string {
  let masked = text;
  for (const [pattern, replacement] of PATTERNS) {
    masked = masked.replace(pattern, replacement);
  }
  return masked;
}
