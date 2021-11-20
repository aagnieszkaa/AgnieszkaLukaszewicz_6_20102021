const express = require('express');
const router = express.Router();
const maxLoggin = require('../middleware/limit');

const userCtrl = require('../controllers/user');

router.post('/signup', userCtrl.signup);
router.post('/login', maxLoggin.limiter, userCtrl.login);

module.exports = router;