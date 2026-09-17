import "server-only";

export interface ModelRequest<TInput> {
  readonly operation: string;
  readonly input: TInput;
  readonly timeoutMs: number;
}

export interface ModelResponse<TOutput> {
  readonly output: TOutput;
  readonly provider: string;
  readonly model: string;
}

/**
 * Server-only port for a future OpenAI-compatible adapter. Stage 00 provides no
 * implementation and performs no network or model calls.
 */
export interface ModelProvider {
  generate<TInput, TOutput>(
    request: ModelRequest<TInput>,
  ): Promise<ModelResponse<TOutput>>;
}
