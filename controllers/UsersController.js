import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const crypto = require('crypto');

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

export default class UsersController {
  static async postNew(req, res) {
    if (!req.body.email) {
      res.status(400).send({ error: 'Missing email' });
    } else if (!req.body.password) {
      res.status(400).send({ error: 'Missing password' });
    } else if (await dbClient.userExists(req.body.email)) {
      // console.log('cheking if email exists')
      // console.log(await dbClient.userExists(req.body.email))
      res.status(400).send({ error: 'Already exist' });
    } else {
      const hashedPassword = crypto.createHash('sha1').update(req.body.password).digest('hex');
      const user = { email: req.body.email, password: hashedPassword };
      await waitConnection;
      const obj = await dbClient.addDoc(user);
      res.status(201).send({ id: obj.insertedId, email: req.body.email });
    }
  }
}
