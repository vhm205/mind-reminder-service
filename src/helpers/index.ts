import env from '@environments';

export const isProd = () => {
  return env.NODE_ENV === 'production';
};

export const generateUnique = (): string => {
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let link = '';

  for (let i = 0; i < 7; i++) {
    link += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  return link;
};

export const spacedRepetitionInterval = (
  initialInterval: number,
  repetitionNumber: number,
) => {
  return initialInterval * Math.pow(2, repetitionNumber);
};

export * from './time';
