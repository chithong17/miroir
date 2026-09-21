import { findResultUrl } from './utils/findResultUrl.js';

const mockOutput = {
  works: [
    {
      image: {
        url: "https://example.com/image.png"
      }
    }
  ]
};

console.log("Mock1:", findResultUrl(mockOutput));
