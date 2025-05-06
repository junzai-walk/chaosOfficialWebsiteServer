const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB Connected');
    
    // Get the Contact model
    const Contact = require('./models/Contact');
    
    // Find all contacts
    Contact.find()
      .then(contacts => {
        console.log('Found contacts:');
        console.log(JSON.stringify(contacts, null, 2));
        mongoose.connection.close();
      })
      .catch(err => {
        console.error('Error finding contacts:', err);
        mongoose.connection.close();
      });
  })
  .catch(err => {
    console.error('Error connecting to MongoDB:', err);
  });
