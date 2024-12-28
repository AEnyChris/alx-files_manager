import dbClient from '../utils/db';
import redisClient from '../utils/redis';

export default class AppController {
  static async getStatus(req, res) {
    res.status(200).send({ redis: redisClient.isAlive(), db: dbClient.isAlive() });
  }

  static async getStats(req, res) {
    const filesStats = await dbClient.nbFiles();
    const usersStats = await dbClient.nbUsers();
    res.status(200).send({ users: usersStats, files: filesStats });
  }
}
