'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

// As an optimization, we could cache the results and not query REST api 
// for known medication pairs.
// To implement, we could store the results in the database and look for pairs.
// Currenlty not used.
//
var InteractionSchema = new Schema({
    rxcui1: String,
    name1: String,
    rxcui2: String,
    name2: String,
    severity: String,
    description: String
});

module.exports = mongoose.model('Interaction', InteractionSchema);
