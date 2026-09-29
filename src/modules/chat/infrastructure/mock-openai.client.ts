import { Injectable } from '@nestjs/common';
import type { OpenAIClient } from '../domain/chat.repository.js';

@Injectable()
export class MockOpenAIClient implements OpenAIClient {
  async complete(question: string): Promise<{
    answer: string;
    inputTokens: number;
    outputTokens: number;
  }> {
    const delayMs = 1000 + Math.floor(Math.random() * 1000);
    await new Promise((resolve) => setTimeout(resolve, delayMs));

    const answer = `Mocked OpenAI response to: "${question.trim()}"`;
    const inputTokens = Math.max(1, Math.ceil(question.length / 4));
    const outputTokens = Math.max(1, Math.ceil(answer.length / 4));

    return { answer, inputTokens, outputTokens };
  }
}
