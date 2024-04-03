import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import amqp, { ChannelWrapper } from 'amqp-connection-manager';
import { ConfirmChannel } from 'amqplib';

@Injectable()
export class ConsumerService implements OnModuleInit {
  private logger = new Logger(ConsumerService.name);
  private channelWrapper: ChannelWrapper;

  constructor() {
    const connection = amqp.connect(['amqp://localhost']);
    this.channelWrapper = connection.createChannel();
  }

  async onModuleInit() {
    try {
      await this.channelWrapper.addSetup(async (channel: ConfirmChannel) => {
        await channel.assertQueue('generate-mid', { durable: true });
        await channel.consume('generate-mid', async (message) => {
          try {
            if (message) {
              const content = JSON.parse(message.content.toString());
              this.logger.log('Result message:', content);
              channel.ack(message);
            }
          } catch (error) {
            this.logger.error(error);
          }
        });
      });
      this.logger.log('Consumer service initialized');
    } catch (error) {
      this.logger.error(error);
    }
  }
}
