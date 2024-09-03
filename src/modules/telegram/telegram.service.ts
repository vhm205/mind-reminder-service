import { Injectable } from '@nestjs/common';
import TelegramBot from 'node-telegram-bot-api';
import env from '@environments';

const bot = new TelegramBot(env.TELEGRAM_BOT_TOKEN, { polling: true });

@Injectable()
export class TelegramService {
  // private bot: TelegramBot;

  constructor() {
    // this.bot = new TelegramBot(env.TELEGRAM_BOT_TOKEN, { polling: true });
  }

  sendMessage(
    chatId: string,
    text: string,
    opts?: TelegramBot.SendMessageOptions,
  ) {
    return bot.sendMessage(chatId, text, opts);
  }
}
