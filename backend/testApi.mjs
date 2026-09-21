import axios from 'axios';
import https from 'https';

const PIAPI_KEY = "305c86488ed8bd3174fe87edad0fbdd16bd37e51e57539a5d3aecb0302522829";

const piapiClient = axios.create({
  baseURL: "https://api.piapi.ai/api/v1",
  headers: {
    "x-api-key": PIAPI_KEY,
  },
  httpsAgent: new https.Agent({ minVersion: "TLSv1.2" })
});

async function run() {
  try {
    const res = await piapiClient.get('/task/f52e2679-a67f-4dca-a80b-c70830f216e1');
    console.log(JSON.stringify(res.data, null, 2));
  } catch (e) {
    console.error(e?.response?.data || e.message);
  }
}
run();
