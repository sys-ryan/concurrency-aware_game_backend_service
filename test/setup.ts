import * as mysql from 'mysql2';
import * as dotenv from 'dotenv';
import { join } from 'path';
import { redis } from '../src/redis/redlock';

dotenv.config({ path: join(__dirname, '..', '.test.env') });

const con = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USERNAME,
  port: +process.env.DB_PORT,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

global.afterAll(async () => {
  redis.del('topRankerInfoList');

  con.connect((err) => {
    if (err) {
      console.log(err);
      throw err;
    }

    con.query('DELETE FROM boss_raid_history');
    con.query('DELETE FROM user');
    // con.query('DELETE FROM coupon_types');
  });
});
