import { findResultUrl } from './utils/findResultUrl.js';

const mockOutput = {
  works: [
    {
      image: {
        url: "https://example.com/image.png"
      }
    }
  ],
  image_url: "https://example.com/image2.png"
};

console.log("Mock1:", findResultUrl(mockOutput));
