import * as dotenv from 'dotenv';

dotenv.config();

const { PORT, NODE_ENV, API_VERSION, REQ_LOGGING, CORS_ORIGINS } = process.env;

if (NODE_ENV && !['test', 'production', 'development'].includes(NODE_ENV)) {
  throw new Error('NODE_ENV must be either test, production or development');
}

if (!CORS_ORIGINS) {
  throw new Error('CORS_ORIGINS is not define');
}

if (!PORT) {
  throw new Error('PORT is not define');
}

export default {
  PORT,
  NODE_ENV,
  API_VERSION,
  REQ_LOGGING,
  CORS_ORIGINS,
};
