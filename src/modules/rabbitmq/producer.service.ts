import { Injectable, Logger } from '@nestjs/common';
import amqp, { ChannelWrapper } from 'amqp-connection-manager';
import { Channel } from 'amqplib';

@Injectable()
export class ProducerService {
  private logger = new Logger(ProducerService.name);
  private channelWrapper: ChannelWrapper;

  constructor() {
    const connection = amqp.connect(['amqp://localhost']);
    this.channelWrapper = connection.createChannel({
      setup: (channel: Channel) => {
        return channel.assertQueue('generate-mid', { durable: true });
      },
    });
  }

  async addMessage(message: Record<string, any>) {
    try {
      const result = await this.channelWrapper.sendToQueue(
        'generate-mid',
        Buffer.from(JSON.stringify(message)),
        { persistent: true },
      );
      this.logger.log(`Message added to queue: ${result}`);
    } catch (err) {
      this.logger.error(err);
    }
  }
}
