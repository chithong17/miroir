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
    const res = await piapiClient.get('/user/balance'); // Or something similar, let's just get any info if we can, or just trigger an error.
    // Actually, PiAPI might not have /user/balance, but let's see what endpoint exists or just print it.
    console.log(res.data);
  } catch (e) {
    console.error(e?.response?.data || e.message);
  }
}
run();
