require('dotenv').config()
const connectToMongo = require('./database/db');

const express = require('express')
var cors = require('cors')

const app = express()
const port = process.env.PORT || 5000
const bodyParser = require('body-parser');

connectToMongo();
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
app.use(cors())

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.use('/api/auth', require('./routes/auth'));
app.use('/api/video', require('./routes/video'));


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})