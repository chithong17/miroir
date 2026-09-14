const isImageUrl = (value) =>
  typeof value === "string" && /^https?:\/\/.+\.(png|jpe?g|webp|gif)(\?.*)?$/i.test(value);

const searchForUrl = (value) => {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    if (isImageUrl(value)) {
      return value;
    }

    if (value.startsWith("http")) {
      return value;
    }

    return null;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const result = searchForUrl(item);
      if (result) {
        return result;
      }
    }
    return null;
  }

  if (typeof value === "object") {
    const preferredKeys = [
      "result_url",
      "resultUrl",
      "image_url",
      "imageUrl",
      "url",
      "images",
      "outputs",
      "results",
      "data",
    ];

    for (const key of preferredKeys) {
      if (key in value) {
        const result = searchForUrl(value[key]);
        if (result) {
          return result;
        }
      }
    }

    for (const nestedValue of Object.values(value)) {
      const result = searchForUrl(nestedValue);
      if (result) {
        return result;
      }
    }
  }

  return null;
};

export const findResultUrl = (output) => searchForUrl(output);

export const findResultUrls = (output) => {
  const urls = new Set();
  const visit = (value) => {
    if (!value) return;
    if (typeof value === "string" && (isImageUrl(value) || value.startsWith("http"))) urls.add(value);
    else if (Array.isArray(value)) value.forEach(visit);
    else if (typeof value === "object") Object.values(value).forEach(visit);
  };
  visit(output);
  return [...urls];
};
