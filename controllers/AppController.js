import dbClient from '../utils/db';
import redisClient from '../utils/redis';

function waitConnection() {
  return new Promise((resolve, reject) => {
    let i = 0;
    const repeatFct = async () => {
      await setTimeout(() => {
        i += 1;
        if (i >= 10) {
          reject();
        } else if (!(dbClient.isAlive() && redisClient.isAlive())) {
          repeatFct();
        } else {
          resolve();
        }
      }, 1000);
    };
    repeatFct();
  });
}

export default class AppController {
  static async getStatus(req, res) {
    await waitConnection;
    res.status(200).send({ redis: redisClient.isAlive(), db: dbClient.isAlive() });
  }

  static async getStats(req, res) {
    await waitConnection;
    const filesStats = await dbClient.nbFiles();
    const usersStats = await dbClient.nbFiles();
    res.status(200).send({ users: usersStats, files: filesStats });
  }
}
