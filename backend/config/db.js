const mysql = require("mysql2");

const connection = mysql.createConnection(process.env.DB_URL);

connection.connect((err) => {
  if (err) {
    console.log("Database connection failed:", err);
  } else {
    console.log("Database connected");
  }
});

module.exports = connection;
