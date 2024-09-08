import { Injectable, Logger } from '@nestjs/common';
import TelegramBot from 'node-telegram-bot-api';
import env from '@environments';

const bot = new TelegramBot(env.TELEGRAM_BOT_TOKEN, { polling: true });
const botDebug = new TelegramBot(env.TELEGRAM_BOT_DEBUG_TOKEN!, {
  polling: true,
});

@Injectable()
export class TelegramService {
  private readonly logger = new Logger();
  // private bot: TelegramBot;

  constructor() {
    // this.bot = new TelegramBot(env.TELEGRAM_BOT_TOKEN, { polling: true });
  }

  async sendMessage(
    chatId: string,
    message: string,
    opts?: TelegramBot.SendMessageOptions,
  ) {
    try {
      await bot.sendMessage(chatId, message, opts);
    } catch (error) {
      this.logger.error(error);
    }
  }

  async sendAlertMessage(
    message: string,
    opts?: TelegramBot.SendMessageOptions,
  ) {
    try {
      const chatId = env.TELEGRAM_USERNAME!;
      await botDebug.sendMessage(chatId, message, opts);
    } catch (error) {
      this.logger.error(error);
    }
  }
}
