export const generateUnique = (): string => {
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let link = '';

  for (let i = 0; i < 7; i++) {
    link += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  return link;
};
