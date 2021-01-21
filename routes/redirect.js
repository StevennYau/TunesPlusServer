var express = require('express');
var router = express.Router();

router.get('/testing', function(req, res) {
   res.redirect('/home');
 });

 module.exports = router;