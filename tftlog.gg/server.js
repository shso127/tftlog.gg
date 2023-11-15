const express = require('express')
const app = express()
const methodOverride = require('method-override')

app.use(methodOverride('_method'))
app.use(express.static(__dirname + '/public'))
app.set('view engine', 'ejs')
app.use(express.json())
app.use(express.urlencoded({extended:true})) 

const { MongoClient, ObjectId } = require('mongodb')

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

app.get('/detail/:id', async (req, res) => {
    
    try {
        let result = await db.collection('post').findOne({ _id : new ObjectId(req.params.id) })
        if (result == null)
            res.status(404).send('임의로 url 입력하여 오류남')
        res.render('detail.ejs', { result : result })
    } catch(e){
        console.log(e)
        res.status(404).send('임의로 url 입력하여 오류남')
    }
})

app.get('/edit/:id', async (req, res) => {
    let result = await db.collection('post').findOne({ _id : new ObjectId(req.params.id)})
    console.log(result)
    res.render('edit.ejs', {result : result})
})

app.put('/edit', async (req, res) => {
    await db.collection('post').updateOne({ _id : new ObjectId(req.body.id)},
        {$set : {title : req.body.title, content : req.body.content}})

    console.log(req.body)
    res.redirect('/list')
})

app.delete('/delete', async (req, res) => {
    await db.collection('post').deleteOne({_id : new ObjectId(req.query.docid)})
    res.send('삭제완료')
})