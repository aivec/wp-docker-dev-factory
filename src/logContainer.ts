import { FinalInstanceConfig } from "./config";
import { execSync } from "child_process";

const logContainer = (config: FinalInstanceConfig) => {
  try {
    console.log("reached")
    execSync(`docker logs -f ${config.containerName}`, { stdio: "inherit" });
  } catch (e) {
    console.log("\nBye.");
  }
};

export default logContainer;
