const express = require('express')
const app = express()
const methodOverride = require('method-override')
const bcrypt = require('bcrypt')
const { MongoClient, ObjectId } = require('mongodb')
const axios = require('axios')
require('dotenv').config()

app.use(methodOverride('_method'))
app.use(express.static(__dirname + '/public'))
app.set('view engine', 'ejs')
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const session = require('express-session')
const passport = require('passport')
const LocalStrategy = require('passport-local')
const MongoStore = require('connect-mongo')

app.use(passport.initialize())
app.use(session({
    secret: 'abcdefg',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 60 * 60 * 1000 },
    store: MongoStore.create({
        mongoUrl: process.env.DB_URL,
        dbName: 'tftlog'
    })
}))

app.use(passport.session())

let db
const url = process.env.DB_URL
new MongoClient(url).connect().then((client) => {
    console.log('DB연결성공')
    db = client.db('tftlog')
}).catch((err) => {
    console.log(err)
})

app.listen(process.env.PORT, () => {
    console.log('running at http://localhost:8080')
})

function checkLogin(req, res, next) {
    if (!req.user) {
        res.send(
            `<script>
                alert('로그인이 필요합니다.');
                location.href='/login';
            </script>`
        )
    }
    next()
}

app.get('/', (req, res) => {
    res.render('home.ejs')
})

app.get('/list', async (req, res) => {
    let result = await db.collection('post').find().toArray()
    res.render('list.ejs', { contentList: result })
})
0
app.get('/write', (req, res) => {
    res.render('write.ejs')
})

app.post('/add', async (req, res) => {
    try {
        if (req.body.title == '') {
            res.send('제목을 입력해 주세요')
        }
        else {
            await db.collection('post').insertOne(
                { 
                    title: req.body.title,
                    content: req.body.content,
                    user : req.user._id,
                    username : req.user.username
                })
            res.redirect('/')
        }
    } catch (e) {
        console.log(e)
        res.status(500).send('서버에러남')
    }
})

app.get('/detail/:id', async (req, res) => {

    try {
        let result = await db.collection('post').findOne({ _id: new ObjectId(req.params.id) })
        if (result == null)
            res.status(404).send('임의로 url 입력하여 오류남')
        res.render('detail.ejs', { result: result })
    } catch (e) {
        console.log(e)
        res.status(404).send('임의로 url 입력하여 오류남')
    }
})

app.get('/edit/:id', async (req, res) => {
    let result = await db.collection('post').findOne({ _id: new ObjectId(req.params.id) })
    console.log(result)
    res.render('edit.ejs', { result: result })
})

app.put('/edit', async (req, res) => {
    await db.collection('post').updateOne({ _id: new ObjectId(req.body.id) },
        { $set: { title: req.body.title, content: req.body.content } })

    console.log(req.body)
    res.redirect('/list')
})

app.delete('/delete', async (req, res) => {
    await db.collection('post').deleteOne({ 
        _id: new ObjectId(req.query.docid),
        user : new ObjectId(req.user._id)
     })
    res.send('삭제완료')
})

app.get('/signUp', (req, res) => {
    res.render('signUp.ejs')
})

app.post('/signUp', async (req, res) => {

    try {
        let cryptPass = await bcrypt.hash(req.body.password, 10)
        if (req.body.title == '') {
            res.send('id를 입력해 주세요')
        }
        else {
            await db.collection('user').insertOne({
                username: req.body.username,
                password: cryptPass
            })
            res.redirect('/')
        }
    } catch (e) {
        console.log(e)
        res.status(500).send('서버에러남')
    }
})

passport.use(new LocalStrategy(async (inputId, inputPw, cb) => {
    let result = await db.collection('user').findOne({ username: inputId })
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
        done(null, { id: user._id, username: user.username })
    })
})

passport.deserializeUser(async (user, done) => {
    let result = await db.collection('user').findOne({ _id: new ObjectId(user.id) })
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

app.get('/search', async (req, res) => {
    let searchCondition = [
        {$search : {
          index : 'title_index',
          text : { query : req.query.val, path : 'title' }
        }}
      ]
    let result = await db.collection('post')
    .aggregate(searchCondition).toArray()
    
    res.render('search.ejs', { contentList : result })
})

function unixTimestampToDateTime(unixTimestamp) {
    const milliseconds = unixTimestamp;
    const dateObject = new Date(milliseconds);
    const year = dateObject.getFullYear();
    const month = dateObject.getMonth() + 1;
    const day = dateObject.getDate();

    return year + '.' + month + '.' + day
}

app.get('/profile', async (req, res) => {
    try{
        const summoner = await axios.get(`https://kr.api.riotgames.com/tft/summoner/v1/summoners/by-name/${req.query.val}?api_key=${process.env.APIKey}`)
        const summoner_leage = await axios.get(
            `https://kr.api.riotgames.com/tft/league/v1/entries/by-summoner/${summoner.data.id}?api_key=${process.env.APIKey}`
        )
        const matches = await axios.get(
            `https://asia.api.riotgames.com/tft/match/v1/matches/by-puuid/${summoner.data.puuid}/ids?start=0&count=${Math.min(20, summoner_leage.data[0].wins + summoner_leage.data[0].losses)}&api_key=${process.env.APIKey}`
        )
        let match_data = []
        let match_info = []
        for (let i = 0; i < Math.min(20, summoner_leage.data[0].wins + summoner_leage.data[0].losses); i++){
            const tmp = await axios.get(
                `https://asia.api.riotgames.com/tft/match/v1/matches/${matches.data[i]}?api_key=${process.env.APIKey}`
            )
            for (let j = 0; j < 8; j++){
                if (tmp.data.metadata.participants[j] == summoner.data.puuid) {
                    match_data.push(tmp.data.info.participants[j])
                    break
                }
            }
            match_info.push({
                game_datatime : unixTimestampToDateTime(tmp.data.info.game_datetime), 
                game_length : Math.floor(tmp.data.info.game_length / 60) + '분' + ' ' + Math.floor(tmp.data.info.game_length % 60) + '초'})
        }
        // console.log(summoner.data)
        console.log(match_data[3].augments)
        res.render('profile.ejs', 
        { 
            profile : summoner.data, 
            league : summoner_leage.data[0], 
            match_data : match_data,
            match_info : match_info
        })
    } catch (e){
        res.render('err.ejs')
    }
})

const compareLeaguePoints = (a, b) => b.leaguePoints - a.leaguePoints;

app.get('/challenger', async (req, res) => {
    const challenger = await axios.get(`https://kr.api.riotgames.com/tft/league/v1/challenger?queue=RANKED_TFT&api_key=${process.env.APIKey}`)
    let challenger_data = challenger.data.entries.slice(0, 100)
    challenger_data.sort(compareLeaguePoints)
    console.log(challenger_data[0])
    res.render('challenger.ejs', { challenger_data : challenger_data })
})

app.get('/grandmaster', async (req, res) => {
    const grandmaster = await axios.get(`https://kr.api.riotgames.com/tft/league/v1/grandmaster?queue=RANKED_TFT&api_key=${process.env.APIKey}`)
    let grandmaster_data = grandmaster.data.entries.slice(0, 100)
    grandmaster_data.sort(compareLeaguePoints)
    console.log(grandmaster_data)
    res.render('grandmaster.ejs', { grandmaster_data : grandmaster_data })
})

app.get('/master', async (req, res) => {
    const master = await axios.get(`https://kr.api.riotgames.com/tft/league/v1/master?queue=RANKED_TFT&api_key=${process.env.APIKey}`)
    let master_data = master.data.entries.slice(0, 100)
    master_data.sort(compareLeaguePoints)
    console.log(master_data)
    res.render('master.ejs', { master_data : master_data })
})