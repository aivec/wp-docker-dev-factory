const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const CYAN = '\x1b[36m';
const WHITE = '\x1b[37m';
const YELLOW = '\x1b[33m';
const NC = '\x1b[0m';

const headers: {
  info: string;
  warn: string;
  error: string;
} = {
  info: `${CYAN}[INFO]${NC}`,
  warn: `${YELLOW}[WARNING]${NC}`,
  error: `${RED}[FATAL]${NC}`,
};

const logger = {
  RED,
  GREEN,
  CYAN,
  WHITE,
  YELLOW,
  NC,

  getMessage: (output: any): string => {
    if (isNaN(output) === false) {
      return output;
    }
    if (typeof output !== 'string') {
      if (output.toString) {
        return output.toString();
      }
      return JSON.stringify(output);
    }

    return output;
  },

  yellow: (message: any): string => `${logger.YELLOW}${logger.getMessage(message)}${logger.NC}`,
  green: (message: any): string => `${logger.GREEN}${logger.getMessage(message)}${logger.NC}`,
  red: (message: any): string => `${logger.RED}${logger.getMessage(message)}${logger.NC}`,
  cyan: (message: any): string => `${logger.CYAN}${logger.getMessage(message)}${logger.NC}`,
  white: (message: any): string => `${logger.WHITE}${logger.getMessage(message)}${logger.NC}`,

  log: (level: string, message: any): void => {
    const levels = ['info', 'warn', 'error'];
    const strmes = logger.getMessage(message);
    if (levels.includes(level)) {
      console.log(`\n${headers[level]} ${strmes}`);
    } else {
      console.log(`\n[${level}] ${strmes}`);
    }
  },

  info: (message: any): void => {
    logger.log('info', logger.getMessage(message));
  },

  warn: (message: any): void => {
    logger.log('warn', logger.getMessage(message));
  },

  error: (message: any): void => {
    logger.log('error', logger.getMessage(message));
  },

  logContext: (value: any): void => {
    console.log('\nvalue:', logger.getMessage(value));
  },

  syntaxError: (message: string, fileName: string): void => {
    console.log(`\n${headers['error']}  ${fileName} SYNTAX ERROR`);
    console.log(`${logger.CYAN}details:${logger.NC} ${message}`);
  },
};

export default logger;
