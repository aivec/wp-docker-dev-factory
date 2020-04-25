const logger: any = {};

logger.RED = '\x1b[31m';
logger.GREEN = '\x1b[32m';
logger.CYAN = '\x1b[36m';
logger.WHITE = '\x1b[37m';
logger.YELLOW = '\x1b[33m';
logger.NC = '\x1b[0m';

logger.yellow = (message: string): string => `${logger.YELLOW}${message}${logger.NC}`;

const headers: {
  info: string;
  warn: string;
  error: string;
} = {
  info: `${logger.CYAN}[INFO]${logger.NC}`,
  warn: `${logger.YELLOW}[WARNING]${logger.NC}`,
  error: `${logger.RED}[FATAL]${logger.NC}`,
};

logger.log = function (level: string, message: string | object): void {
  const levels = ['info', 'warn', 'error'];
  if (typeof message !== 'string') {
    message = JSON.stringify(message);
  }

  if (levels.includes(level)) {
    console.log(`\n${headers[level]} ${message}`);
  } else {
    console.log(`\n[${level}] ${message}`);
  }
};

logger.info = function (message: string): void {
  logger.log('info', message);
};

logger.warn = function (message: string): void {
  logger.log('warn', message);
};

logger.error = function (message: string): void {
  logger.log('error', message);
};

logger.logContext = function (value: any): void {
  console.log('\nvalue:', value);
};

logger.syntaxError = function (message: string, fileName: string): void {
  console.log(`\n${headers['error']}  ${fileName} SYNTAX ERROR`);
  console.log(`${logger.CYAN}details:${logger.NC} ${message}`);
};

export default logger;
