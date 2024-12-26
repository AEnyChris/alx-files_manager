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
}

const dbClient = new DBClient();
export default dbClient;
