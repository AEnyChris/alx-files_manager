import routes from './routes/index';

const express = require('express');

const app = express();
const port = 5000;

app.use('/', routes);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

export default app;
