const { MongoClient } = require('mongodb');

class DBClient {
  constructor() {
    this.host = process.env.DB_HOST || 'localhost';
    this.port = process.env.DB_PORT || 27017;
    this.database = process.env.DB_DATABASE || 'files_manager';
    this.client = new MongoClient(`mongodb://${this.host}:${this.port}/${this.database}`, { useNewUrlParser: true, useUnifiedTopology: true });
    this.client.connect();
  }

  isAlive() {
    return this.client.isConnected();
  }

  nbUsers() {
    const usersCollection = this.client.db().collection('users');
    return usersCollection.countDocuments({}, { hint: '_id_' });
  }

  nbFiles() {
    const filesCollection = this.client.db().collection('files');
    // console.log(filesCollection.find({}).toArray());
    return filesCollection.countDocuments({}, { hint: '_id_' });
  }

  async getUser(...args) {
    const query = {};
    const params = args.slice(0, 2);
    if (params.length === 1) {
      const [email] = params;
      query.email = email;
    } else {
      const [email, password] = params;
      query.email = email;
      query.password = password;
    }
    // console.log(query)
    const usersCollection = this.client.db().collection('users');
    const serRes = await usersCollection.findOne(query);
    // console.log('This is search result:', serRes);
    return serRes;
  }

  async getFile(parentId) {
    const filesCollection = this.client.db().collection('files');
    const serRes = await filesCollection.find({ parentId });
    return serRes;
  }

  addDoc(doc) {
    const res = this.client.db().collection('users').insertOne(doc);
    return res;
  }
}

const dbClient = new DBClient();
export default dbClient;
