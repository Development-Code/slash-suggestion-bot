const mongoose = require('mongoose');
const suggestion = new mongoose.Schema({
	message: {
		type: String,
		required: true,
	},
	suggestion: {
		type: String,
		required: true,
	},
	author: {
		type: String,
		required: true,
	},
});
module.exports = mongoose.model('suggestion', suggestion);