/**
 * Created by nate on 5/27/15.
 */

var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
    res.render('client');
});

module.exports = router;
