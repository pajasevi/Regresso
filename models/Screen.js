const mongoose = require('mongoose');

const screenSchema = new mongoose.Schema({
  url: String,
}, { timestamps: true });

const Screen = mongoose.model('Screen', screenSchema);

module.exports = Screen;
