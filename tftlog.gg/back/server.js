const express = require('express')
const app = express()
const path = require('path')

app.listen(8080, () => {
    console.log('http://localhost:8080')
})

app.use( '/', express.static( path.join(__dirname, '../front/dist') ));  
// 이 부분이 없으면 아래코드에서 index.html을 로드하지 못한다.
app.get('/', (req, res)=>{
    res.sendFile(path.join(__dirname, '../front/dist/index.html'));  
})