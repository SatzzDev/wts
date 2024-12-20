const express = require('express');
const path = require('path');
const fs = require('fs');
const axios = require("axios")
const cheerio = require("cheerio")
const expressLayouts = require('express-ejs-layouts');
const mongoose = require('mongoose');
const { getAllProvinces, jadwalSholat } = require('./public/func');

const app = express();
const PORT = process.env.PORT || 3000;



app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layouts/main');

app.use(expressLayouts);
app.use(express.static(path.join(__dirname, 'public')))




const uri = "mongodb+srv://raupganzz:ohsnYdlSDx8vEiCA@satzzdev.qxzw6.mongodb.net/?retryWrites=true&w=majority&appName=SatzzDev";
const clientOptions = { serverApi: { version: '1', strict: true, deprecationErrors: true } };
mongoose.connect(uri, clientOptions)
.then(() => console.log('MongoDB Connected...'))
.catch((err) => console.log(err));




const visitorSchema = new mongoose.Schema({
count: { type: Number, default: 0 }
});



const Visitor = mongoose.model('Visitor', visitorSchema);



app.use(async (req, res, next) => {
try {
let visitor = await Visitor.findOne();
if (!visitor) {
visitor = new Visitor();
}
visitor.count += 1;
await visitor.save();
console.log(`Visitor count updated: ${visitor.count}`);
next();
} catch (err) {
console.error('Error updating visitor count:', err);
next();
}
});


app.get('/visitors', async (req, res) => {
try {
const visitor = await Visitor.findOne();
res.json({ visitorCount: visitor ? visitor.count : 0 });
} catch (err) {
console.error('Error fetching visitor count:', err);
res.status(500).json({ error: 'Failed to fetch visitor count' });
}
});




app.get('/', (req, res) => {
res.render('index', { title: 'Home' });
});


app.get('/spotify', (req, res) => {
res.render('spotify', { title: 'Spotify Downloader' });
});



app.get('/lyrics', (req, res) => {
res.render('lyrics', { title: 'Lyrics Search' });
});



app.get('/youtube', (req, res) => {
res.render('youtube', { title: 'Youtube Downloader' });
});

app.get('/satzzai', (req, res) => {
res.render('satzz-ai', { title: 'Satzz AI' });
});

app.get('/gempa', async (req, res) => {
try {
const response = await axios.get('https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json');
const gempaData = response.data;  
res.render('gempa', { gempa: gempaData, title: 'Gempa Terkini' });
} catch (error) {
console.error('Error fetching earthquake data:', error);
res.status(500).send('Error retrieving data');
}
});


app.get('/jadwal-sholat', async (req, res) => {
try {
const provinces = await getAllProvinces();  
res.render('jadwal-sholat', { provinces, title: 'Jadwal Sholat' });
} catch (error) {
console.error('Error loading provinces:', error);
res.status(500).send('Error loading data');
}
});

app.get('/api/marquee', async (req, res) => {
let rus = await axios.get('https://satganzdevs-api.up.railway.app/api/random/motivasi')
let data = rus.data.data
res.json(data)
})


app.get('/api/jadwal-sholat', async (req, res) => {
const kode = req.query.kode;
if (!kode) {
return res.status(400).json({ status: 'error', message: 'Kode daerah diperlukan' });
}
const schedule = await jadwalSholat(kode);  
res.json(schedule);
});


// Route to get server uptime
app.get('/api/uptime', (req, res) => {
    const uptimeInSeconds = process.uptime();
    const hours = Math.floor(uptimeInSeconds / 3600);
    const minutes = Math.floor((uptimeInSeconds % 3600) / 60);
    const seconds = Math.floor(uptimeInSeconds % 60);
    res.json(`${hours}h ${minutes}m ${seconds}s`);
});




app.listen(PORT, () => {
console.log(`Server running on port ${PORT}`);
});
