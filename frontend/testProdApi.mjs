import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

const PROD_API = "https://miroir-backend-l7si.onrender.com/api";

async function run() {
  try {
    // 1. Create task
    const form = new FormData();
    form.append('tryOnType', 'upper_lower');
    form.append('batchSize', '1');
    
    // We don't have images easily, let's just use some placeholder image URLs or pass files if required.
    // Wait, the API expects files. Let's create dummy files.
    fs.writeFileSync('dummy.jpg', Buffer.from('dummy data'));
    
    form.append('modelImage', fs.createReadStream('dummy.jpg'));
    form.append('upperImage', fs.createReadStream('dummy.jpg'));
    
    console.log("Creating task...");
    const res = await axios.post(`${PROD_API}/tryon`, form, {
      headers: form.getHeaders(),
    });
    
    console.log("Create Task Response:", res.data);
    
    const taskId = res.data.taskId;
    
    // 2. Poll task
    let status = 'pending';
    while (status !== 'completed' && status !== 'failed') {
      await new Promise(r => setTimeout(r, 5000));
      console.log(`Polling task ${taskId}...`);
      const pollRes = await axios.get(`${PROD_API}/tryon/${taskId}`);
      console.log("Poll Response:", JSON.stringify(pollRes.data, null, 2));
      status = pollRes.data.status;
    }
    
  } catch (e) {
    console.error("Error:", e?.response?.data || e.message);
  }
}
run();
