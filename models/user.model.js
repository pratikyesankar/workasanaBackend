   
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, trim: true, unique: true },
  password: { type: String, required: true }  
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
 
