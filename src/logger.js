let logger = exports;

logger.RED = "\033[1;31m";
logger.GREEN = "\033[1;32m";
logger.CYAN = "\033[1;36m";
logger.WHITE = "\033[1;37m";
logger.YELLOW = "\x1b[33m";
logger.NC = "\033[0m";

let headers = {};
headers.info = `${logger.CYAN}[info]${logger.NC}`;
headers.warn = `${logger.YELLOW}[warning]${logger.NC}`;
headers.error = `${logger.RED}[fatal]${logger.NC}`;

logger.log = function(level, message) {
  let levels = ["info", "warn", "error"];
  if (typeof message !== "string") {
    message = JSON.stringify(message);
  }

  if (levels.includes(level)) {
    console.log(`\n${headers[level]} ${message}`);
  } else {
    console.log(`\n[${level}] ${message}`);
  }
};

logger.info = function(message) {
  logger.log("info", message);
};

logger.warn = function(message) {
  logger.log("warn", message);
};

logger.error = function(message) {
  logger.log("error", message);
};
