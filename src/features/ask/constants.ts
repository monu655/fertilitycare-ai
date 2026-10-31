// Safe to import from browser code (no server-only imports here).
export const MAX_QUESTION_LENGTH = 300;

// Plain-language text for each reason an AI answer was not used. Codes only, never any content.
export function explainFallback(reason: string): string {
  if (reason === "http_401" || reason === "http_403") return "The AI key was rejected. Check GROQ_API_KEY in the .env file.";
  if (reason === "http_429") return "The AI service is busy or its free limit was reached. Try again in a minute.";
  if (reason === "http_400" || reason === "http_404") return "The AI service rejected the request (check the model name in .env).";
  if (reason.startsWith("http_")) return `The AI service returned an error (${reason.replace("http_", "")}).`;
  if (reason === "timeout") return "The AI service took too long to answer.";
  if (reason === "network") return "The server could not reach the AI service (internet or firewall).";
  if (reason === "bad_json" || reason === "bad_shape" || reason === "empty_reply" || reason === "too_short")
    return "The AI reply was not in the expected format.";
  if (reason === "unsafe") return "The AI reply did not pass our safety check.";
  if (reason === "invented_number") return "The AI reply contained a number that is not in the sources, so it was not used.";
  return "The AI answer could not be used.";
}