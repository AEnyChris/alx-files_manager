import redisClient from './utils/redis';
// const redisClient = require("./utils/redis")

(async () => {
    console.log(`this is redisClient.isAlive ${redisClient.isAlive()}`);
    setTimeout(() => {
        console.log(`Redis is alive: ${redisClient.isAlive()}`); // Should print true if connected
      }, 1000);
    console.log(await redisClient.get('myKey'));
    await redisClient.set('myKey', 12, 5);
    console.log(await redisClient.get('myKey'));

    setTimeout(async () => {
        console.log(await redisClient.get('myKey'));
    }, 1000*10)
})();