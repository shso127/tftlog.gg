const express = require('express')
const app = express()
const methodOverride = require('method-override')
const bcrypt = require('bcrypt')
require('dotenv').config()

app.use(methodOverride('_method'))
app.use(express.static(__dirname + '/public'))
app.set('view engine', 'ejs')
app.use(express.json())
app.use(express.urlencoded({extended:true}))

const session = require('express-session')
const passport = require('passport')
const LocalStrategy = require('passport-local')
const MongoStore = require('connect-mongo')

app.use(passport.initialize())
app.use(session({
  secret: '암호화에 쓸 비번',
  resave : false,
  saveUninitialized : false,
  cookie : { maxAge : 60 * 60 * 1000 },
  store : MongoStore.create({
    mongoUrl : process.env.DB_URL,
    dbName : 'tftlog'
  })
}))

app.use(passport.session()) 

const { MongoClient, ObjectId } = require('mongodb')

let db
const url = process.env.DB_URL
new MongoClient(url).connect().then((client)=>{
  console.log('DB연결성공')
  db = client.db('tftlog')
}).catch((err)=>{
  console.log(err)
})

app.listen(process.env.PORT, () => {
    console.log('http://localhost:8080 에서 서버 실행중')
})

app.get('/', (req, res) => {
    res.render('home.ejs')
})

app.get('/list', async (req, res) => {
    let result = await db.collection('post').find().toArray()
    res.render('list.ejs', { contentList : result })
})
0
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
            res.redirect('/')
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

app.get('/signUp', (req, res) => {
    res.render('signUp.ejs')
})

app.post('/signUp', async (req, res) => {

    try {
        let cryptPass = await bcrypt.hash(req.body.password, 10)
        if (req.body.title == ''){
            res.send('id를 입력해 주세요')
        }
        else {
            await db.collection('user').insertOne({ 
                username : req.body.username, 
                password : cryptPass })
            res.redirect('/')
        }
    } catch(e) {
        console.log(e)
        res.status(500).send('서버에러남')
    }
})

passport.use(new LocalStrategy(async (inputId, inputPw, cb) => {
    let result = await db.collection('user').findOne({ username : inputId})
    if (!result) {
      return cb(null, false, { message: '아이디 DB에 없음' })
    }
    
    if (await bcrypt.compare(inputPw, result.password)) {
      return cb(null, result)
    } else {
      return cb(null, false, { message: '비번불일치' });
    }
}))

passport.serializeUser((user, done) => {
    console.log(user)
    process.nextTick(() => {
        done(null, { id : user._id, username : user.username })
    })
})

passport.deserializeUser(async (user, done) => {
    let result = await db.collection('user').findOne({_id : new ObjectId(user.id)})
    delete result.password
    process.nextTick(() => {
        done(null, result)
    })
})

app.get('/login', (req, res) => {
    console.log(req.user)
    res.render('login.ejs')
})

app.post('/login', (req, res, next) => {
    passport.authenticate('local', (error, user, info) => {
        if (error) return req.status(500).json(error)
        if (!user) return req.status(401).json(info.message)
        req.logIn(user, (err) => {
            if (err) return next(err)
            res.redirect('/')
        })
    })(req, res, next)
})