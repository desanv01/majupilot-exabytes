export function containsCopilotToolProtocol(text: string) {
  return /<[｜|]{2}DSML[｜|]{2}\s*(?:calls|invoke|parameter)|<\|(?:tool_call|function_call)\|>/i.test(text);
}

export const INVALID_SAVED_COPILOT_RESPONSE = "An earlier Copilot response could not be displayed safely. Please ask the question again.";
