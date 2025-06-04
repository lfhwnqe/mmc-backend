import { Module } from '@nestjs/common';
import { ChatModule } from './chat.module'; // Import the new ChatModule

@Module({
  imports: [
    ChatModule, // Add ChatModule to the imports array
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
