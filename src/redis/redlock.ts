import Client from 'ioredis';
import Redlock from 'redlock';
import * as dotenv from 'dotenv';

dotenv.config({ path: `../../*.env` });
export const redis = new Client.Cluster([
  { host: process.env.REDIS_HOST, port: +process.env.REDIS_PORT },
]);

export const redlock = new Redlock(
  [redis],

  {
    driftFactor: 0.01,

    retryCount: 10,

    retryDelay: 100,

    retryJitter: 200,

    automaticExtensionThreshold: 500,
  },
);
