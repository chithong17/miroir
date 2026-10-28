export const shouldRetryTryOnPoll = error => {
  const status = error?.response?.status;
  return !status || status === 408 || status === 429 || status >= 500;
};

export const tryOnPollDelay = failures => Math.min(30000, 5000 * 2 ** Math.min(failures, 3));
