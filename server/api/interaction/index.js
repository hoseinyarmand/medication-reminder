'use strict';

var controller = require('./interaction.controller'),
    router = require('express').Router();

// An example call is: http://localhost:9000/api/interactions?day=05-13-2017
//
router.get('/', controller.show);

module.exports = router;
