import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const { ObjectId } = require('mongodb');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

export default class FilesController {
  static async postUpload(req, res) {
    // Authenticate the user
    const xToken = req.headers['x-token'];
    const userId = await redisClient.get(`auth_${xToken}`);
    const user = await dbClient.client.db().collection('users').findOne({ _id: ObjectId(userId) });
    if (!user) {
      res.status(401).send({ error: 'Unauthorized' });
    } else {
      // Collect data sent by the user
      const filetype = ['folder', 'file', 'image'];
      const { name } = req.body;
      const { type } = req.body;
      const parentId = req.body.parentId || 0;
      const isPublic = req.body.isPublic || false;
      const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';
      // console.log(`This is the folder path: ${FOLDER_PATH}`);

      // VALIDATE DATA COLLECTED AND SAVE ACCORDINGLY
      if (name) {
        if (type && filetype.includes(type)) {
          // if type is 'folder' create document and save to database
          if (type === 'folder') {
            const doc = {
              name,
              userId: user._id,
              type,
              parentId,
              isPublic,
            };
            const insRes = await dbClient.client.db().collection('files').insertOne(doc);
            const fileDetails = {
              id: insRes.ops[0]._id,
              userId: insRes.ops[0].userId,
              name: insRes.ops[0].name,
              type: insRes.ops[0].type,
              isPublic: insRes.ops[0].isPublic,
              parentId: insRes.ops[0].parentId,
            };
            res.status(201).send(fileDetails);
          } else {
            // if type is not 'folder' collect and check if data is present
            // console.log('checking data');
            const { data } = req.body;
            if (data) {
              // If data is present, chek if parent doc is present and is of type folder
              // console.log('data confirmed, checking parent');
              if (parentId !== 0) {
                const parent = await dbClient.client.db().collection('files').findOne({ _id: ObjectId(parentId) });
                // console.log(parent)
                if (!parent) {
                  res.status(400).send({ error: 'Parent not found' });
                  return;
                } if (parent.type !== 'folder') {
                  res.status(400).send({ error: 'Parent is not a folder' });
                  return;
                }
              }
              // if parent is present and is of type folder,
              // check if FOLDER_PATH exists else create it
              // console.log('parent confirmed, checking folder path');
              if (!fs.existsSync(FOLDER_PATH)) {
                fs.mkdirSync(FOLDER_PATH, { recursive: true });
              }

              // console.log('folder path confirmed, writing data to file');
              // Write data to file and save to FOLDER_PATH
              const filePath = path.join(FOLDER_PATH, uuidv4());
              fs.writeFileSync(filePath, Buffer.from(data, 'base64'));

              // Save file data to database
              // console.log('writing file data to database');
              const doc = {
                name,
                userId: user._id,
                type,
                parentId,
                isPublic,
                localpath: filePath,
              };
              const insRes = await dbClient.client.db().collection('files').insertOne(doc);
              const fileDetails = {
                id: insRes.ops[0]._id,
                userId: insRes.ops[0].userId,
                name: insRes.ops[0].name,
                type: insRes.ops[0].type,
                isPublic: insRes.ops[0].isPublic,
                parentId: insRes.ops[0].parentId,
              };
              // console.log('file data written to database');
              // console.log('Done')
              res.status(201).send(fileDetails);
            } else {
              res.status(400).send({ error: 'Missing data' });
            }
          }
        } else {
          res.status(400).send({ error: 'Missing type' });
        }
      } else {
        res.status(400).send({ error: 'Missing name' });
      }
    }
  }
}
