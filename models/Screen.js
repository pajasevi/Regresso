const mongoose = require('mongoose');

const screenSchema = new mongoose.Schema({
  url: String,
	comparisons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comparison' }]
}, { timestamps: true });

const Screen = mongoose.model('Screen', screenSchema);

module.exports = Screen;
