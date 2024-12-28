import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const { ObjectId } = require('mongodb');

const crypto = require('crypto');

export default class UsersController {
  static async postNew(req, res) {
    if (!req.body.email) {
      res.status(400).send({ error: 'Missing email' });
    } else if (!req.body.password) {
      res.status(400).send({ error: 'Missing password' });
    } else if (await dbClient.getUser(req.body.email)) {
    //   console.log('cheking if email exists')
    //   console.log(await dbClient.getUser(req.body.email))
      res.status(400).send({ error: 'Already exist' });
    } else {
      const hashedPassword = crypto.createHash('sha1').update(req.body.password).digest('hex');
      const user = { email: req.body.email, password: hashedPassword };
      const obj = await dbClient.addDoc(user);
      res.status(201).send({ id: obj.insertedId, email: req.body.email });
    }
  }

  static async getMe(req, res) {
    const xToken = req.headers['x-token'];
    const userId = await redisClient.get(`auth_${xToken}`);
    const user = await dbClient.client.db().collection('users').findOne({ _id: ObjectId(userId) });
    if (!user) {
      res.status(401).send({ error: 'Unauthorized' });
    } else {
      res.send({ id: user._id, email: user.email });
    }
  }
}
