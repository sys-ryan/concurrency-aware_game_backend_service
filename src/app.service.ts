import { BadRequestException, Injectable } from '@nestjs/common';
import { redis, redlock } from './redis/redlock';

@Injectable()
export class AppService {
  async getHello(): Promise<string> {
    return 'Hello World!';
  }
}
