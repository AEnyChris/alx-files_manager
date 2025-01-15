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

      // VALIDATE DATA COLLECTED AND SAVE ACCORDINGLY
      if (name) {
        if (type && filetype.includes(type)) {
          // Validate parentId
          if (parentId !== 0) {
            const parent = await dbClient.client.db().collection('files').findOne({ _id: ObjectId(parentId) });
            if (!parent) {
              res.status(400).send({ error: 'Parent not found' });
              return;
            } if (parent.type !== 'folder') {
              res.status(400).send({ error: 'Parent is not a folder' });
              return;
            }
          }
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
            const { data } = req.body;
            if (data) {
              // if data is present,
              // check if FOLDER_PATH exists else create it
              if (!fs.existsSync(FOLDER_PATH)) {
                fs.mkdirSync(FOLDER_PATH, { recursive: true });
              }

              // Write data to file and save to FOLDER_PATH
              const filePath = path.join(FOLDER_PATH, uuidv4());
              fs.writeFileSync(filePath, Buffer.from(data, 'base64'));

              // Save file data to database
              const doc = {
                name,
                userId: user._id,
                type,
                parentId: parentId !== 0 ? ObjectId(parentId) : 0,
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

  static async getShow(req, res) {
    const xToken = req.headers['x-token'];
    const userId = await redisClient.get(`auth_${xToken}`);
    const user = await dbClient.client.db().collection('users').findOne({ _id: ObjectId(userId) });
    if (!user) {
      res.status(401).send({ error: 'Unauthorized' });
    } else {
      const query = { userId: ObjectId(user._id), _id: ObjectId(req.params.id) };
      const file = await dbClient.client.db().collection('files').findOne(query);
      if (!file) {
        res.status(404).send({ error: 'Not found' });
      } else {
        const fileDetails = {
          id: file._id,
          userId: file.userId,
          name: file.name,
          type: file.type,
          isPublic: file.isPublic,
          parentId: file.parentId,
        };
        res.status(200).send(fileDetails);
      }
    }
  }

  static async getIndex(req, res) {
    const xToken = req.headers['x-token'];
    const userId = await redisClient.get(`auth_${xToken}`);
    const user = await dbClient.client.db().collection('users').findOne({ _id: ObjectId(userId) });
    if (!user) {
      res.status(401).send({ error: 'Unauthorized' });
    } else {
      const parentId = req.query.parentId || 0;
      const page = parseInt(req.query.page, 10) || 0;
      const pageSize = 20;
      const skip = page * pageSize;

      const query = {
        userId: ObjectId(user._id),
        parentId: parentId !== 0 ? ObjectId(parentId) : 0,
      };
      // console.log('query\n');
      // console.log(query);
      const files = await dbClient.client.db().collection('files').find(query).skip(skip)
        .limit(pageSize)
        .toArray();
      const filesDetails = [];
      files.forEach((doc) => {
        filesDetails.push({
          id: doc._id,
          userId: doc.userId,
          name: doc.name,
          type: doc.type,
          isPublic: doc.isPublic,
          parentId: doc.parentId,
        });
      });

      res.status(200).send(filesDetails);
    }
  }
}
