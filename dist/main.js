"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db = new better_sqlite3_1.default('db/mmp-mockapi.db');
db.pragma('journal_mode = WAL');
const app = (0, express_1.default)();
const apiPort = 8080;
const JWTOptions = {
    secret: "WN4G0PXBR0F7MSMPQ2JQJ22S3GRSD68A963HG6RBUFFF5YSLYB8ZK365H7MXGI8E",
    algorithm: "HS512"
};
app.use(body_parser_1.default.json());
app.use((0, cors_1.default)());
// Endpoints without auth
const selectAllCategories = db.prepare("SELECT * FROM dailycategories");
app.get("/schema/categories", (req, res) => {
    res.json(selectAllCategories.all());
});
const selectAllItems = db.prepare("SELECT * FROM dailyitems");
app.get("/schema/items", (req, res) => {
    res.json(selectAllItems.all());
});
const selectAllUnits = db.prepare("SELECT * FROM units");
app.get("/schema/units", (req, res) => {
    res.json(selectAllUnits.all());
});
const selectAllOptions = db.prepare("SELECT * FROM unit_options");
app.get("/schema/unitOptions", (req, res) => {
    res.json(selectAllOptions.all());
});
// Endpoints with auth
app.get("/auth/:loginType/:userName/:credentials", (req, res) => {
    const selectUserCredentials = db.prepare('SELECT id, loginType, credentials FROM users WHERE users.name = ?');
    let userInfo = selectUserCredentials.get(String(req.params.userName));
    switch (req.params.loginType) {
        case "local":
            if (userInfo.credentials === req.params.credentials) {
                let token = jsonwebtoken_1.default.sign({ userID: userInfo.id }, JWTOptions.secret, {
                    algorithm: "HS512",
                    expiresIn: "4h",
                    issuer: "MMP"
                });
                res.json({ JWT: token });
            }
            else
                res.sendStatus(403);
            break;
    }
});
app.get("/myData/groupInfo", authenticateJWT, (req, res) => {
    const selectGroupInfo = db.prepare('SELECT \'groups\'.name, periodStart, periodEnd FROM \'groups\' inner join users on users.\'group\' = \'groups\'.id WHERE users.id = ?');
    let groupInfo = selectGroupInfo.get(req.userID);
    res.json(groupInfo);
});
let insertDaily = db.prepare('INSERT INTO tracker_daily (user, date, amountNumeric, amountOption, item) VALUES (?,?,?,?,?)');
let getDaily4User = db.prepare('SELECT COUNT(*) as entryTotal FROM tracker_daily WHERE date=? AND user=? AND item=?');
let getLastId = db.prepare('SELECT seq FROM sqlite_sequence WHERE name=?');
app.post("/myData/addDaily", authenticateJWT, (req, res) => {
    let daily = req.body;
    daily.userID = Number(req.userID);
    try {
        let checkExists = getDaily4User.get(daily.date, daily.userID, daily.itemID);
        if (checkExists.entryTotal > 0)
            res.status(400).json({ err: "Entry for day, user and item already exists" });
        else {
            insertDaily.run(daily.userID, daily.date, daily.amountNumeric, daily.amountOption, daily.itemID);
            let lastID = getLastId.get("tracker_daily");
            console.log(lastID);
            res.json({ lastID: lastID.seq });
        }
    }
    catch (e) {
        console.log("Error writing daily consumption data: ", e);
        res.sendStatus(400);
    }
});
let updateDaily = db.prepare('UPDATE tracker_daily SET amountNumeric = ?, amountOption = ? WHERE id = ? AND user = ?');
app.post("/myData/editDaily/:entryID", authenticateJWT, (req, res) => {
    let daily = req.body;
    daily.userID = Number(req.userID);
    daily.id = req.params.entryID;
    try {
        updateDaily.run(daily.amountNumeric, daily.amountOption, daily.id, daily.userID);
        res.sendStatus(200);
    }
    catch (e) {
        console.log("Error editing daily consumption data: ", e);
        res.sendStatus(400);
    }
});
let removeDaily = db.prepare('DELETE FROM tracker_daily WHERE id = ? AND user = ?');
app.get("/myData/removeDaily/:entryID", authenticateJWT, (req, res) => {
    try {
        removeDaily.run(req.params.entryID, req.userID);
        res.sendStatus(200);
    }
    catch (e) {
        console.log("Error removing daily consumption data: ", e);
        res.sendStatus(400);
    }
});
let getDailyByDate = db.prepare('SELECT date, id, item, amountNumeric, amountOption FROM tracker_daily WHERE user = ? AND date = ?');
app.get("/myData/byDate/:dateString", authenticateJWT, (req, res) => {
    try {
        let byDate = getDailyByDate.all(req.userID, req.params.dateString);
        res.status(200).json(byDate);
    }
    catch (e) {
        console.log("Error getting daily data by date");
        res.sendStatus(400);
    }
});
let getDailyByCategory = db.prepare('SELECT date, dailyitems.id, item, amountNumeric, amountOption FROM tracker_daily JOIN dailyitems ON item=dailyitems.id WHERE user = ? AND dailyitems.category = ?');
app.get("/myData/byCategory/:categoryID", authenticateJWT, (req, res) => {
    try {
        let byCat = getDailyByCategory.all(req.userID, req.params.categoryID);
        res.status(200).json(byCat);
    }
    catch (e) {
        console.log("Error getting daily data by date");
        res.sendStatus(400);
    }
});
let listFlights = db.prepare('SELECT * FROM tracker_flights WHERE user = ?');
app.get("/myData/listFlights", authenticateJWT, (req, res) => {
    const flightList = listFlights.all(req.userID);
    res.status(200).json(flightList);
});
let addFlight = db.prepare('INSERT INTO tracker_flights (user, origin, destination, flightClass, kilometer, co2eq, ubp, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
app.get("/myData/addFlight/:date/:origin/:destination/:flightClass", authenticateJWT, (req, res) => {
    try {
        // TODO Add call to ClimateAPI to get realistic numbers
        addFlight.run(req.userID, req.params.origin, req.params.destination, Number(req.params.flightClass), 555, 2020, 800, req.params.date);
        let lastID = getLastId.get("tracker_flights");
        res.json({ lastID: lastID.seq });
    }
    catch (e) {
        console.log("Error adding flight data: ", e);
        res.sendStatus(400);
    }
});
let removeFlight = db.prepare('DELETE FROM tracker_flights WHERE user = ? AND id = ?');
app.get("/myData/removeFlight/:flightID", authenticateJWT, (req, res) => {
    try {
        removeFlight.run(req.userID, req.params.flightID);
        res.sendStatus(200);
    }
    catch (e) {
        res.sendStatus(400);
    }
});
app.listen(apiPort, () => {
    console.log(`Server is running on port ${apiPort}`);
});
function authenticateJWT(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null)
        return res.sendStatus(401);
    jsonwebtoken_1.default.verify(token, JWTOptions.secret, (err, payload) => {
        if (err)
            return res.sendStatus(403);
        req.userID = payload.userID;
        next();
    });
}
