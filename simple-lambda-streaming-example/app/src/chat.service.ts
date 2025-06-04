import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Agent, MastraResponse } from '@mastra/core';
import { createSimpleAgent } from './simple.agent'; // Corrected import path

@Injectable()
export class ChatService implements OnModuleInit {
  private agent: Agent;
  private readonly logger = new Logger(ChatService.name);

  onModuleInit() {
    // Initialize the agent when the module is initialized
    // This ensures OPENROUTER_API_KEY from process.env is available if set at runtime
    try {
      this.agent = createSimpleAgent();
      this.logger.log('SimpleAgent initialized successfully.');
      if (!process.env.OPENROUTER_API_KEY) {
        this.logger.warn('OPENROUTER_API_KEY was not set during ChatService initialization. Agent might fail.');
      }
    } catch (error) {
      this.logger.error('Failed to initialize SimpleAgent:', error);
      // Decide if you want to throw here or let calls to agent fail
    }
  }

  constructor() {
    // Constructor can be kept clean, initialization in onModuleInit
  }

  async getAgentResponseStream(prompt: string): Promise<MastraResponse | null> {
    if (!this.agent) {
      this.logger.error('SimpleAgent is not initialized. Cannot process request.');
      // Optionally, try to re-initialize, or throw a specific error
      // For this example, let's try a lazy init / re-init, though onModuleInit should handle it.
      try {
        this.logger.log('Attempting to re-initialize SimpleAgent in getAgentResponseStream');
        this.agent = createSimpleAgent();
         if (!process.env.OPENROUTER_API_KEY) {
            this.logger.warn('OPENROUTER_API_KEY was not set during agent re-initialization.');
         }
      } catch (error) {
        this.logger.error('Failed to re-initialize SimpleAgent:', error);
        throw new Error('Agent not available and failed to re-initialize.');
      }
    }

    this.logger.log(`Sending prompt to SimpleAgent: "${prompt.substring(0, 50)}..."`);
    try {
      const response = await this.agent.stream([{ role: 'user', content: prompt }]);
      return response;
    } catch (error) {
      this.logger.error(`Error streaming from SimpleAgent: ${error.message}`, error.stack);
      throw error; // Re-throw the error to be handled by the caller
    }
  }
}
