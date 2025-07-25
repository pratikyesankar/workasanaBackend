const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String },
   
  owners: { type: [String], default: [] }  
});

module.exports = mongoose.model('Team', teamSchema);
