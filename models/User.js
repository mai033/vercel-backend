const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: false, 
  },
  bio: {
    type: String,
    required: false, 
  },
  instagram: {
    type: String,
    required: false, 
  },
  additionalLink: {
    type: String,
    required: false, 
  },
  work: [
    {
      type: String, 
      required: false, 
    },
  ],
  cv: {
    type: String,
    required: false, 
  },
  coverPhoto: {
    type: String,
    required: false, 
  },
  isSubscribed: { 
    type: Boolean,
    required: true,
    default: false,
  },
});

module.exports = mongoose.model('User', UserSchema);
