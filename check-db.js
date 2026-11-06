const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function checkCollections() {
    await mongoose.connect(process.env.MONGODB_URI);
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));

    if (collections.find(c => c.name === 'events')) {
        const events = await mongoose.connection.db.collection('events').find({}).limit(5).toArray();
        console.log('Sample Events:', JSON.stringify(events, null, 2));
    }

    if (collections.find(c => c.name.toLowerCase().includes('galler'))) {
        const galleries = await mongoose.connection.db.collection(collections.find(c => c.name.toLowerCase().includes('galler')).name).find({}).limit(5).toArray();
        console.log('Sample Gallery:', JSON.stringify(galleries, null, 2));
    }

    process.exit(0);
}

checkCollections().catch(console.error);
