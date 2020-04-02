import logger from "./logger";
import { execSync } from "child_process";
import { FinalInstanceConfig } from "./config";

const stopContainers = (config: FinalInstanceConfig) => {
  logger.info(`${logger.WHITE}Stopping Container(s)...${logger.NC}`);
  execSync(`docker stop ${config.containerName}`, { stdio: "inherit" });
  execSync(`docker rm ${config.containerName}`, { stdio: "inherit" });
};

export default stopContainers;
