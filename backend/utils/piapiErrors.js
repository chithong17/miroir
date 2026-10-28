export const getPiApiErrorMessage = error =>
  error?.response?.data?.error?.message || error?.response?.data?.message || error?.message || "PiAPI request failed.";

export const normalizePiApiError = error => {
  const providerMessage = getPiApiErrorMessage(error);
  const accountMismatch = /task does not belong to the current account/i.test(providerMessage);
  const status = error?.response?.status;
  const normalized = new Error(accountMismatch
    ? "Lượt thử đồ này thuộc tài khoản API trước đó. Vui lòng tạo lượt thử đồ mới."
    : providerMessage);
  normalized.statusCode = accountMismatch ? 409 : status >= 400 && status < 500 ? status : 503;
  normalized.code = accountMismatch ? "TRYON_ACCOUNT_CHANGED" : "PIAPI_UNAVAILABLE";
  return normalized;
};

export const describeTryOnFailure = error => {
  const providerMessage = error?.message || "Task failed to complete.";
  if (error?.code === 10000 || /^internal error\.?$/i.test(providerMessage)) {
    return "Dịch vụ tạo ảnh chưa xử lý được lượt thử này (PiAPI 10000). Vui lòng thử lại sau hoặc chọn ảnh khác.";
  }
  return providerMessage;
};
