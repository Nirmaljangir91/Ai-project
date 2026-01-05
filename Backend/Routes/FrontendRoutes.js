const router = require('express').Router();

router.get('/test', (req, res) => {
    res.json({ message: 'Test route is working!'});
});

module.exports = router;