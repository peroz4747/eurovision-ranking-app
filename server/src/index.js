const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { Pool } = require('pg');

const PORT = process.env.PORT || 3000;
const POSTGRES_URL = process.env.POSTGRES_URL;
const options = {
  // decide here if the point system should be official or unofficial ranking
  pointingSystemOfficial: true
}

function getFlagEmoji(countryCode) {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt());
  return String.fromCodePoint(...codePoints);
}

const participatingCountries = [
  { country: 'Sweden', flag: getFlagEmoji('SE') },
  { country: 'Ukraine', flag: getFlagEmoji('UA') },
  { country: 'Germany', flag: getFlagEmoji('DE') },
  { country: 'Luxembourg', flag: getFlagEmoji('LU') },
  { country: 'Israel', flag: getFlagEmoji('IL') },
  { country: 'Lithuania', flag: getFlagEmoji('LT') },
  { country: 'Spain', flag: getFlagEmoji('ES') },
  { country: 'Estonia', flag: getFlagEmoji('EE') },
  { country: 'Ireland', flag: getFlagEmoji('IE') },
  { country: 'Latvia', flag: getFlagEmoji('LV') },
  { country: 'Greece', flag: getFlagEmoji('GR') },
  { country: 'United Kingdom', flag: getFlagEmoji('GB') },
  { country: 'Norway', flag: getFlagEmoji('NO') },
  { country: 'Italy', flag: getFlagEmoji('IT') },
  { country: 'Serbia', flag: getFlagEmoji('RS') },
  { country: 'Finland', flag: getFlagEmoji('FI') },
  { country: 'Portugal', flag: getFlagEmoji('PT') },
  { country: 'Armenia', flag: getFlagEmoji('AM') },
  { country: 'Cyprus', flag: getFlagEmoji('CY') },
  { country: 'Switzerland', flag: getFlagEmoji('CH') },
  { country: 'Slovenia', flag: getFlagEmoji('SI') },
  { country: 'Croatia', flag: getFlagEmoji('HR') },
  { country: 'Georgia', flag: getFlagEmoji('GE') },
  { country: 'France', flag: getFlagEmoji('FR') },
  { country: 'Austria', flag: getFlagEmoji('AT') }
];

const officialPoints = [12, 10, 8, 7, 6, 5, 4, 3, 2, 1]
const points = options.pointingSystemOfficial ? officialPoints : participatingCountries.map((c, index) => index + 1)

var ipTable = [];

const app = express();
app.use(cors({
  origin: "*", 
  credentials: true
}));

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true
  }
});

const pool = new Pool({
  connectionString: POSTGRES_URL
});

io.on('connection', async (socket) => {
  const clientIp = socket.request.headers['x-forwarded-for'] || socket.request.connection.remoteAddress;
  console.log('Client connected with IP:', clientIp);
  console.log('New client connected');

  io.emit('points', points)
  io.emit('pointingSystemOfficial', options.pointingSystemOfficial)
  
  let findIp = ipTable.find(ipObj => ipObj.ip === clientIp) || {};
  
  if (!findIp.ip) {
    findIp = { ip: clientIp, data: [] };
    ipTable.push(findIp);
  } else {
    try {
      io.emit('data', findIp.data) 
    } catch (error) {
      console.error(error)
    }
  }

  const results = await pool.query('SELECT * FROM rankings ORDER BY score DESC');
  io.emit('update', results.rows);

  socket.on('rank', async (data) => {
    const { country, score } = data;
    const countryObj = findIp.data.find(obj => obj.country === country);
    const scoreObj = findIp.data.find(obj => obj.score === score);
    
    if (scoreObj) {
      try {
        await pool.query('UPDATE rankings SET score = score - $1 WHERE country = $2', [scoreObj.score, scoreObj.country]);
        scoreObj.score = 0;
      } catch (error) {
        console.error('Database error:', error);
      }
    }

    if (countryObj) {
      try {
        await pool.query('UPDATE rankings SET score = score - $1 WHERE country = $2', [countryObj.score, country]);
        await pool.query('UPDATE rankings SET score = score + $1 WHERE country = $2', [score, country]);
        countryObj.score = score;
        const results = await pool.query('SELECT * FROM rankings ORDER BY score DESC');
        io.emit('update', results.rows);
      } catch (error) {
        console.error('Database error:', error);
        socket.emit('error', 'Database error');
      }
    } else {
      try {
        await pool.query('UPDATE rankings SET score = score + $1 WHERE country = $2', [score, country]);
        findIp.data.push({ country, score });
        const results = await pool.query('SELECT * FROM rankings ORDER BY score DESC');
        io.emit('update', results.rows);
      } catch (error) {
        console.error('Database error:', error);
        socket.emit('error', 'Database error'); 
      }
    }

    io.emit('data', findIp.data) 
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

async function initializeDatabase() {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS rankings (
      id SERIAL PRIMARY KEY,
      country VARCHAR(255) UNIQUE NOT NULL,
      flag VARCHAR(255) UNIQUE NOT NULL,
      score INTEGER DEFAULT 0
    );
  `;

  try {
    await pool.query(createTableQuery);
    console.log("Database initialized - table 'rankings' is ready.");
  } catch (error) {
    console.error("Failed to create 'rankings' table:", error);
    process.exit(1);
  }

let insertInitialData = 'INSERT INTO rankings (country, flag, score) VALUES\n';
participatingCountries.forEach((country, index) => {
  const { country: countryName, flag } = country;
  insertInitialData += `('${countryName.toUpperCase()}', '${flag}', 0)`;
  if (index !== participatingCountries.length - 1) {
    insertInitialData += ',\n';
  } else {
    insertInitialData += '\n';
  }
});
insertInitialData += 'ON CONFLICT (country) DO NOTHING;';

try {
  await pool.query(insertInitialData);
  console.log("Initial data inserted into 'rankings'.");
} catch (error) {
  console.error("Failed to insert initial values:", error);
}

}

async function dropTableAndClose() {
  try {
    console.log("Dropping table 'rankings' and closing server...");
    await pool.query('DROP TABLE IF EXISTS rankings');
    console.log("Table 'rankings' dropped successfully.");
  } catch (error) {
    console.error("Failed to drop 'rankings' table:", error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

process.on('SIGINT', dropTableAndClose);
process.on('SIGTERM', dropTableAndClose);

initializeDatabase().then(() => {
  server.listen(PORT, '0.0.0.0',() => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(error => {
  console.error('Failed to initialize database:', error);
});
