
import('mongodb').then(async ({ MongoClient }) => {
  const client = await MongoClient.connect('mongodb+srv://miroir_user:miroir@miroir.dmfj3mg.mongodb.net/?appName=Miroir');
  const db = client.db('miroir');
  await db.collection('shops').updateMany(
    {},
    { $set: { contact: { address: '123 Fashion Street, D1, HCMC', phone: '0123456789', email: 'hello@shop.com' } } }
  );
  console.log('Shops updated with mock contact info!');
  client.close();
});

