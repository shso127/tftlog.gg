const express = require('express')
const app = express()

app.use(express.static(__dirname + '/public'))
app.set('view engine', 'ejs')
app.use(express.json())
app.use(express.urlencoded({extended:true})) 

const { MongoClient } = require('mongodb')

let db
const url = ''
new MongoClient(url).connect().then((client)=>{
  console.log('DB연결성공')
  db = client.db('tftlog')
}).catch((err)=>{
  console.log(err)
})

app.listen(8080, () => {
    console.log('http://localhost:8080 에서 서버 실행중')
})

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html')
})

app.get('/list', async (req, res) => {
    let result = await db.collection('post').find().toArray()
    res.render('list.ejs', { contentList : result })
})

app.get('/write', (req, res) => {
    res.render('write.ejs')
})

app.post('/add', async (req, res) => {
    console.log(req.body)

    try {
        if (req.body.title == ''){
            res.send('제목을 입력해 주세요')
        }
        else {
            await db.collection('post').insertOne({ title : req.body.title , content : req.body.content })
            res.redirect('/list')
        }
    } catch(e) {
        console.log(e)
        res.status(500).send('서버에러남')
    }
    
})