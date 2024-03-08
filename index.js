// const express = require('express')

// const app = express()
// const PORT = 4000

// app.listen(PORT, () => {
//   console.log(`API listening on PORT ${PORT} `)
// })

// app.get('/', (req, res) => {
//   res.send('Hey this is my API running 🥳')
// })

// app.get('/about', (req, res) => {
//   res.send('This is my about route..... ')
// })

// // Export the Express API
// module.exports = app

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const Stripe = require('stripe');
const User = require('./models/User');

const BUCKET_REGION = process.env.BUCKET_REGION;
const ACCESS_KEY = process.env.ACCESS_KEY;
const SECRET_ACCESS_KEY = process.env.SECRET_ACCESS_KEY;
const MONGODB_URI = process.env.MONGODB_URI;
const PORT = process.env.PORT || 3005;
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const s3Client = new S3Client({
  region: BUCKET_REGION,
  credentials: {
    accessKeyId: ACCESS_KEY,
    secretAccessKey: SECRET_ACCESS_KEY,
  },
});

mongoose
  .connect(MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error(err));

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('Hey this is my API running 🥳')
})

app.post('/storeUserDetails', async (req, res) => {
    const {
      username,
      email,
      location,
      bio,
      instagram,
      additionalLink,
      work,
      cv,
      coverPhoto,
      isSubscribed,
    } = req.body;
  
    try {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(409).json({ message: 'User already exists' });
      }
  
      const newUser = new User({
        username,
        email,
        location,
        bio,
        instagram,
        additionalLink,
        work,
        cv,
        coverPhoto,
        isSubscribed,
      });
  
      await newUser.save();
      res.status(201).json({
        success: true,
        message: 'User details successfully stored',
        newUser,
      });
    } catch (error) {
      console.error('Failed to store user details:', error);
      res.status(500).json({ success: false, message: 'Error saving user details' });
    }
  });
  
app.get('/checkUsername', async (req, res) => {
    const { username } = req.query;
  
    if (!username) {
      return res.status(400).json({ message: 'Username query parameter is required' });
    }
  
    try {
      const existingUser = await User.findOne({ username: username.toString() });
      if (existingUser) {
        return res.status(200).json({
          message: 'Username already exists, please choose another one',
        });
      } else {
        return res.status(200).json({ message: 'Username is available' });
      }
    } catch (error) {
      console.error('Failed to check username:', error);
      return res.status(500).json({
        success: false,
        message: 'Error checking username availability',
      });
    }
  });

app.get('/generate-upload-url', async (req, res) => {
  const fileName = req.query.fileName;
  const key = `uploads/${fileName}`;
  const command = new PutObjectCommand({
    Bucket: process.env.BUCKET_NAME,
    Key: key,
  });

  try {
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 120 });
    res.json({ url: signedUrl, key });
  } catch (err) {
    console.error('Error generating presigned URL', err);
    res.status(500).json({ error: 'Error generating presigned URL' });
  }
});

app.post('/api/create-payment-link', async (req, res) => {
  const { title, price, details } = req.body;

  try {
    const product = await stripe.products.create({
      name: title,
      description: details,
    });

    const priceData = await stripe.prices.create({
      product: product.id,
      unit_amount: price * 100, // Convert to cents
      currency: 'usd',
    });

    const paymentLink = await stripe.paymentLinks.create({
      line_items: [
        {
          price: priceData.id,
          quantity: 1,
        },
      ],
    });

    res.json({ url: paymentLink.url });
  } catch (error) {
    console.error('Error creating payment link:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;

