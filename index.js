const express = require('express');
const path = require('path');
const fs = require('fs');
const axios = require("axios")
const cheerio = require("cheerio")

const app = express();
const PORT = process.env.PORT || 3000;


app.set('view engine', 'ejs')
app.use(express.static(path.join(__dirname, 'public')))


async function getAllProvinces() {
try {
const response = await axios.get('https://jadwalsholat.org/jadwal-sholat/monthly.php');
const html = response.data;
const $ = cheerio.load(html);
const options = $('select[name="kota"] option');
const provinces = [];

options.each((index, element) => {
const kode = $(element).attr('value');
const nama = $(element).text().trim();
if (kode && nama) {
provinces.push([nama, `.jadwalsholat ${kode}`]);
}
});

// Memprioritaskan Pekanbaru di bagian atas
const sortedProvinces = provinces.sort((a, b) => {
if (a[0].toLowerCase() === 'indragiri hulu') return -1;
if (b[0].toLowerCase() === 'indragiri hulu') return 1;
return 0;
});

return sortedProvinces;
} catch (error) {
console.error('Error scraping:', error);
return [];
}
}


async function jadwalSholat(kode_daerah) {
try {
const response = await axios.get('https://jadwalsholat.org/jadwal-sholat/daily.php?id=' + kode_daerah);
const html = response.data;
const $ = cheerio.load(html);
let daerah = $('h1').text().split(', GMT')[0].trim();
let bulan = $('h2').text().trim();
const row = $('tr.table_light, tr.table_dark').find('td');
const tanggal = $(row[0]).text().trim();
const imsyak = $(row[1]).text().trim();
const shubuh = $(row[2]).text().trim();
const terbit = $(row[3]).text().trim();
const dhuha = $(row[4]).text().trim();
const dzuhur = $(row[5]).text().trim();
const ashr = $(row[6]).text().trim();
const maghrib = $(row[7]).text().trim();
const isya = $(row[8]).text().trim();
return {
status: 'ok',
developer: "SatganzDevs",
daerah,
bulan,
tanggal,
imsyak,
shubuh,
terbit,
dhuha,
dzuhur,
ashr,
maghrib,
isya
};
} catch (error) {
console.error('Error scraping:', error);
return {
status: 'error',
error: error.message
};
}
}


app.get('/', (req, res) => {
    res.render('index');
});

app.get('/spotify', (req, res) => {
    res.render('spotify');
});

app.get('/gempa', async (req, res) => {
  try {
    const response = await axios.get('https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json');
    const gempaData = response.data;

    res.render('gempa', { gempa: gempaData });
  } catch (error) {
    console.error('Error fetching earthquake data:', error);
    res.status(500).send('Error retrieving data');
  }
});


app.get('/jadwal-sholat', async (req, res) => {
  try {
    const provinces = await getAllProvinces();  // Function you provided
    res.render('jadwal-sholat', { provinces });
  } catch (error) {
    console.error('Error loading provinces:', error);
    res.status(500).send('Error loading data');
  }
});

// Fetch prayer schedule
app.get('/api/jadwal-sholat', async (req, res) => {
  const kode = req.query.kode;
  if (!kode) {
    return res.status(400).json({ status: 'error', message: 'Kode daerah diperlukan' });
  }
  const schedule = await jadwalSholat(kode);  // Function you provided
  res.json(schedule);
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
