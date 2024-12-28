import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { ObjectId } = require('mongodb');

export default class AuthController {
  static async getConnect(req, res) {
    const baseAuth = req.headers.authorization.slice(6);
    const decodedStr = Buffer.from(baseAuth, 'base64').toString('utf-8');
    const email = decodedStr.split(':').slice(0, 1).toString();
    const password = decodedStr.split(':').slice(1).toString();
    const hashedPassword = crypto.createHash('sha1').update(password).digest('hex');
    const user = await dbClient.getUser(email, hashedPassword);
    if (!(user)) {
      res.status(401).send({ error: 'Unauthorized' });
    } else {
      // Generate a random UUID (token)
      const token = uuidv4();
      await redisClient.set(`auth_${token}`, user._id.toString(), 300);
      console.log(user._id);
      res.send({ token });
    }
  }

  static async getDisconnect(req, res) {
    const xToken = req.headers['x-token'];
    const userId = await redisClient.get(`auth_${xToken}`);
    const user = await dbClient.client.db().collection('users').findOne({ _id: ObjectId(userId) });
    if (!user) {
      res.status(401).send({ error: 'Unauthorized' });
    } else {
      await redisClient.del(`auth_${xToken}`);
      res.status(204).end();
    }
  }
}
