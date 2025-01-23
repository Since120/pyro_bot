import { createLogger, format, transports } from 'winston';

const { combine, timestamp, printf, colorize } = format;

const myFormat = printf(({ level, message, timestamp }) => {
  return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
});

const logger = createLogger({
  // Hier passt du das Level an
  level: process.env.LOG_LEVEL || 'info',

  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    colorize(),
    myFormat
  ),
  transports: [
    new transports.Console(),
    // optional: weitere Transports wie File-Logging
    // new transports.File({ filename: 'logs/combined.log' })
  ],
});

export default logger;
