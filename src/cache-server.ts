import express from 'express';
import { isRunning } from './docker/container';
import { commit } from './docker/commit';

const app = express();
const port = 3749;

app.use(express.json());
app.post('/avc-wpdocker/on-started', async (req, res) => {
  if (!req.body.container) {
    res.status(400).send('failure');
  }

  const container = req.body.container;
  if (!isRunning(container)) {
    return res.status(422).send(`${container} is not running.`);
  }

  try {
    const { stderr } = await commit(container);
    if (stderr) {
      throw new Error();
    }
  } catch (error) {
    return res.status(500).send('failure');
  }

  return res.status(200).send('success');
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
