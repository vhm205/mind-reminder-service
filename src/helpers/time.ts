import moment from 'moment-timezone';

export const TZ_DEFAULT = 'Asia/Ho_Chi_Minh';

export const momentTZ = (tz?: string) => {
  return moment().tz(tz || TZ_DEFAULT);
};
