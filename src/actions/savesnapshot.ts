import logger from '../logger';
import { FinalInstanceConfig } from '../types';
import { commit } from '../docker/commit';

const saveSnapshot = async (config: FinalInstanceConfig): Promise<void> => {
  logger.info(`${logger.WHITE}Saving Snapshot...${logger.NC}`);
  try {
    const { stderr } = await commit(config);
    if (stderr) {
      console.log(stderr.toString());
      logger.error('Failed creating snapshot.');
    }
    logger.info(
      `Success. Saved as ${logger.green(
        config.snapshotImage,
      )}. This new image will be used next time you ${logger.yellow('Start WordPress')}`,
    );
  } catch (error) {
    console.log(error);
    logger.error('Failed creating snapshot.');
  }
};

export default saveSnapshot;
