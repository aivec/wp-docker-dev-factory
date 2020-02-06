const { execSync } = require("child_process");

const logContainer = config => {
  try {
    execSync(`docker logs -f ${config.containerName}`, { stdio: "inherit" });
  } catch (e) {
    console.log("\nBye.");
  }
};

module.exports = logContainer;
