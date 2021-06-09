import logger from '../logger';
import prompts from 'prompts';
import { FinalInstanceConfig } from '../types';
import { commit } from '../docker/commit';
import { save } from '../docker/image';

const saveSnapshot = async (config: FinalInstanceConfig): Promise<void> => {
  logger.info(`Image will be placed in ${logger.yellow(`${config.workingdir}/images`)}`);
  const response = await prompts({
    type: 'text',
    name: 'filename',
    message: `Please enter a file name for the image (.tar is appended automatically):`,
  });
  if (!response.filename) {
    console.log('\nAborted.');
    process.exit(0);
  }
  const tarpath = `${config.workingdir}/images/${response.filename}.tar`;
  logger.info(`${logger.WHITE}Saving Snapshot (this might take a while)...${logger.NC}`);
  try {
    const { stderr: commiterr } = await commit(config);
    if (commiterr) {
      console.log(commiterr.toString());
      logger.error('Failed creating snapshot.');
      process.exit(1);
    }

    const { stderr: saveerr } = await save(tarpath, config.snapshotImage);
    if (saveerr) {
      console.log(saveerr.toString());
      logger.error('Failed saving image file.');
      process.exit(1);
    }

    logger.info(
      `Success. Saved to ${logger.green(tarpath)}. Point the ${logger.yellow(
        'image',
      )} key in your config to this new image file and it will be used next time you ${logger.yellow(
        'Start WordPress',
      )}`,
    );
  } catch (error) {
    console.log(error);
    logger.error('Failed creating snapshot.');
  }
};

export default saveSnapshot;
