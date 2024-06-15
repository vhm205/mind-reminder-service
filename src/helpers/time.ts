import moment from 'moment-timezone';

export const TZ_DEFAULT = 'Asia/Ho_Chi_Minh';

export const momentTZ = (datetime?: string, tz?: string) => {
  return moment(datetime).tz(tz || TZ_DEFAULT);
};
