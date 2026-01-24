require('dotenv').config();
const express = require('express');
const app = express();
const PORT = process.env.PORT || 4599;
const cors = require('cors');
const FrontendRoutes = require('./Routes/Frontend.routes.js');
require('./utils/cronjobs.js'); 

app.use(cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}))

app.get('/', (req, res) => {
    res.send('Hello, World');
})

app.use(express.static('public'));


app.use("/api", FrontendRoutes)

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})