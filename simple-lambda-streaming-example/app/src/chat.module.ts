import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
// We don't need a controller for this module if it's only used by the streaming.handler directly.
// If you were to expose HTTP routes from NestJS for this, you'd add a ChatController here.

@Module({
  providers: [ChatService],
  exports: [ChatService], // Export ChatService so it can be used by other modules or contexts (like our streaming.handler)
})
export class ChatModule {}
