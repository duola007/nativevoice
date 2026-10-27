import type { NativeAudio, WordResult } from "./azure";

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9']/g, "");

/**
 * Pairs the learner's assessed words with the native recording's words
 * (longest common subsequence on normalized text). Returns user index → native index.
 */
export function matchWords(user: WordResult[], native: NativeAudio["words"]): Map<number, number> {
  const u = user.map((w) => (w.errorType === "Insertion" ? null : norm(w.text)));
  const n = native.map((w) => norm(w.text));
  const dp = Array.from({ length: u.length + 1 }, () => new Array<number>(n.length + 1).fill(0));
  for (let i = u.length - 1; i >= 0; i--) {
    for (let j = n.length - 1; j >= 0; j--) {
      dp[i][j] = u[i] !== null && u[i] === n[j]
        ? dp[i + 1][j + 1] + 1
        : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const map = new Map<number, number>();
  let i = 0, j = 0;
  while (i < u.length && j < n.length) {
    if (u[i] !== null && u[i] === n[j]) map.set(i++, j++);
    else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
    else j++;
  }
  return map;
}
