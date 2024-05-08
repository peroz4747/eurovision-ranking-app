const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { Pool } = require('pg');

// Environment variables
const PORT = process.env.PORT || 3000;
const POSTGRES_URL = process.env.POSTGRES_URL;  // Format: postgresql://user:password@host:port/database

function getFlagEmoji(countryCode) {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char =>  127397 + char.charCodeAt());
  return String.fromCodePoint(...codePoints);
}

const participatingCountries = [
  // { country: 'Cyprus', flag: getFlagEmoji('CY') },
  // { country: 'Serbia', flag: getFlagEmoji('RS') },
  // { country: 'Lithuania', flag: getFlagEmoji('LT') },
  // { country: 'Ireland', flag: getFlagEmoji('IE') },
  // { country: 'Ukraine', flag: getFlagEmoji('UA') },
  // { country: 'Poland', flag: getFlagEmoji('PL') },
  // { country: 'Croatia', flag: getFlagEmoji('HR') },
  // { country: 'Iceland', flag: getFlagEmoji('IS') },
  // { country: 'Slovenia', flag: getFlagEmoji('SI') },
  // { country: 'Finland', flag: getFlagEmoji('FI') },
  // { country: 'Moldova', flag: getFlagEmoji('MD') },
  // { country: 'Azerbaijan', flag: getFlagEmoji('AZ') },
  // { country: 'Australia', flag: getFlagEmoji('AU') },
  // { country: 'Portugal', flag: getFlagEmoji('PT') },
  // { country: 'Luxembourg', flag: getFlagEmoji('LU') },
  { country: 'Malta', flag: getFlagEmoji('MT') },
  { country: 'Albania', flag: getFlagEmoji('AL') },
  { country: 'Greece', flag: getFlagEmoji('GR') },
  { country: 'Switzerland', flag: getFlagEmoji('CH') },
  { country: 'Czechia', flag: getFlagEmoji('CZ') },
  { country: 'Austria', flag: getFlagEmoji('AT') },
  { country: 'Denmark', flag: getFlagEmoji('DK') },
  { country: 'Armenia', flag: getFlagEmoji('AM') },
  { country: 'Latvia', flag: getFlagEmoji('LV') },
  { country: 'San Marino', flag: getFlagEmoji('SM') },
  { country: 'Georgia', flag: getFlagEmoji('GE') },
  { country: 'Belgium', flag: getFlagEmoji('BE') },
  { country: 'Estonia', flag: getFlagEmoji('EE') },
  { country: 'Israel', flag: getFlagEmoji('IL') },
  { country: 'Norway', flag: getFlagEmoji('NO') },
  { country: 'Netherlands', flag: getFlagEmoji('NL') }
];

var ipTable = [];

const app = express();
app.use(cors({
  origin: "*",  // Adjust this if your client is on a different origin
  credentials: true  // Allows cookies and credentials to be sent across origins
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
    const dataObj = findIp.data.find(dataObj => dataObj.country === country)
    // Update database with new score
    if (dataObj) {
      try {
        await pool.query('UPDATE rankings SET score = score - $1 WHERE country = $2', [dataObj.score, country]);
        await pool.query('UPDATE rankings SET score = score + $1 WHERE country = $2', [score, country]);
        dataObj.score = score
        // Emit updated rankings to all clients
        const results = await pool.query('SELECT * FROM rankings ORDER BY score DESC');
        io.emit('update', results.rows);
      } catch (error) {
        console.error('Database error:', error);
        socket.emit('error', 'Database error');  // Inform the client of the error
      }
    } else {
      try {
        await pool.query('UPDATE rankings SET score = score + $1 WHERE country = $2', [score, country]);
        findIp.data.push({ country, score })
        // Emit updated rankings to all clients
        const results = await pool.query('SELECT * FROM rankings ORDER BY score DESC');
        io.emit('update', results.rows);
      } catch (error) {
        console.error('Database error:', error);
        socket.emit('error', 'Database error');  // Inform the client of the error
      }
    }
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
    process.exit(1); // Exit if the database table cannot be created
  }

  try {
    let insertInitialData = 'INSERT INTO rankings (country, flag, score) VALUES\n';

    participatingCountries.forEach((country, index) => {
      const { country: countryName, flag } = country;

      insertInitialData += `('${countryName.toUpperCase()}', '${flag}', 0)`;
      if (index !== participatingCountries.length - 1) {
        insertInitialData += ',\n';
      } else {
        insertInitialData += ';';
      }
    });

    await pool.query(insertInitialData);
    console.log("Initial data inserted into 'rankings'.");
  } catch(error) {
    console.error("Failed TO INSERT INITIAL VALUES:", error);
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
    await pool.end();  // Close the pool before shutting down
    process.exit(0);   // Exit cleanly
  }
}

process.on('SIGINT', dropTableAndClose);
process.on('SIGTERM', dropTableAndClose);

// Ensure the database is initialized before listening on a port
initializeDatabase().then(() => {
  server.listen(PORT, '0.0.0.0',() => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(error => {
  console.error('Failed to initialize database:', error);
});