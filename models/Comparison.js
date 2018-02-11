const mongoose = require('mongoose');

const comparisonSchema = new mongoose.Schema({}, { timestamps: true });

const Comparison = mongoose.model('Comparison', comparisonSchema);

module.exports = Comparison;
