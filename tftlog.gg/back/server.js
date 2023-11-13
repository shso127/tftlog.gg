const express = require('express')
const app = express()

app.listen(8080, () => {
    console.log('http://localhost:8080')
})

app.get('/', (req, res) => {
  res.send('안녕')
}) 