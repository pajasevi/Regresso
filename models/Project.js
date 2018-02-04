const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const projectSchema = new Schema({
  name: String,
  description: String,
  users: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  screens: [{ type: Schema.Types.ObjectId, ref: 'Screen' }]
}, { timestamps: true });

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;
