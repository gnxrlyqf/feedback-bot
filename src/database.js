const mysql = require("mysql2");

module.exports = mysql.createPool({
	host: "127.0.0.1",
	user: "root",
	password: "root",
	multipleStatements: true,
	database: "fdb"
})