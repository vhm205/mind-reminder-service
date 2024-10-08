import * as dotenv from 'dotenv';

dotenv.config();

const {
  PORT,
  NODE_ENV,
  CORS_ORIGINS,
  REQ_LOGGING,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK,
  COOKIE_TOKEN_NAME,
  AUTH_SECRET,
  ACCESS_TOKEN_SECRET,
  ACCESS_TOKEN_EXPIRES_IN,
  CLIENT_URL,
  API_VERSION,
  TELEGRAM_BOT_TOKEN,
  TELEGRAM_BOT_USERNAME,
  TELEGRAM_USERNAME,
  TELEGRAM_BOT_DEBUG_TOKEN,
  MONGODB_URI,
  QUEUE_COLLECTION_REMINDER,
  QUEUE_REMINDER,
  NOTION_SECRET,
} = process.env;

if (NODE_ENV && !['test', 'production', 'development'].includes(NODE_ENV)) {
  throw new Error('NODE_ENV must be either test, production or development');
}

if (!CORS_ORIGINS) {
  throw new Error('CORS_ORIGINS env is not define');
}

if (!PORT) {
  throw new Error('PORT env is not define');
}

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_CALLBACK) {
  throw new Error('OAuth google env is not define');
}

if (!AUTH_SECRET || !ACCESS_TOKEN_SECRET || !ACCESS_TOKEN_EXPIRES_IN) {
  throw new Error('JWT env is not define');
}

if (!COOKIE_TOKEN_NAME) {
  throw new Error('Cookie env is not define');
}

if (!CLIENT_URL || !API_VERSION) {
  throw new Error('CLIENT_URL env is not define');
}

if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_BOT_USERNAME) {
  throw new Error('Telegram env is not define');
}

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI env is not define');
}

export default {
  PORT,
  NODE_ENV,
  CORS_ORIGINS,
  REQ_LOGGING,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK,
  COOKIE_TOKEN_NAME,
  AUTH_SECRET,
  ACCESS_TOKEN_SECRET,
  ACCESS_TOKEN_EXPIRES_IN,
  CLIENT_URL,
  API_VERSION,
  TELEGRAM_BOT_TOKEN,
  TELEGRAM_BOT_USERNAME,
  TELEGRAM_USERNAME,
  TELEGRAM_BOT_DEBUG_TOKEN,
  MONGODB_URI,
  QUEUE_COLLECTION_REMINDER,
  QUEUE_REMINDER,
  NOTION_SECRET,
};
