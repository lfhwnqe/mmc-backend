import { Mastra } from '@mastra/core';
import { createLogger } from '@mastra/core';
import { weatherWorkflow } from './workflows';
import { storytellingAgent } from './agents';

export const mastra = new Mastra({
  workflows: { weatherWorkflow },
  agents: { storytellingAgent },
  logger: createLogger({
    name: 'Mastra',
    level: 'info',
  }),
});
