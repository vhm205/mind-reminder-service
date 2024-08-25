import moment from 'moment-timezone';

export const TZ_DEFAULT = 'Asia/Ho_Chi_Minh';

export const momentTZ = (datetime?: string | Date, tz?: string | boolean) => {
  if (typeof tz === 'boolean') return moment(datetime).tz(TZ_DEFAULT);
  if (typeof tz === 'string') return moment(datetime).tz(tz);
  return moment(datetime);
};

export const getUTCDateTime = (datetime?: string | Date) => {
  return moment(datetime).utc();
};

export const getIsoDateTime = (datetime?: string | Date) => {
  return moment(datetime).toISOString();
};
