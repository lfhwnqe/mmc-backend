import { Agent } from '@mastra/core';
// import { weatherTool } from '../tools';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { Logger } from '@nestjs/common';

const logger = new Logger('MastraAgents');

// 添加构建时间标记，便于验证何时加载环境变量
const buildTime = new Date().toISOString();
logger.log(`Mastra Agent模块初始化时间: ${buildTime}`);

// 检查OpenRouter API Key是否存在
const openRouterApiKey = process.env.OPENROUTER_API_KEY;
if (!openRouterApiKey) {
  logger.warn(
    `⚠️ OPENROUTER_API_KEY环境变量未设置，Storytelling Agent可能无法正常工作 (初始化时间: ${buildTime})`,
  );
} else {
  logger.log(
    `OPENROUTER_API_KEY已配置，值长度: ${openRouterApiKey.length} (初始化时间: ${buildTime})`,
  );
}

const openrouter = createOpenRouter({
  apiKey: openRouterApiKey,
});

export const storytellingAgent = new Agent({
  name: 'Storytelling Agent',
  instructions: `
      你是一个给小朋友讲故事的专家
      你的任务是根据小朋友的年龄和兴趣，给他们讲一个有趣的故事。
      你的故事应该包含以下元素：
      - 有趣的角色
      - 有趣的故事情节
      - 有趣的角色对话
      - 有趣的角色动作
      - 有趣的角色表情
`,
  model: openrouter.chat('microsoft/mai-ds-r1:free'),
  // tools: { weatherTool },
});

