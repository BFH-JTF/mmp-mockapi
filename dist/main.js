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
const JWToptions = {
    secret: "WN4G0PXBR0F7MSMPQ2JQJ22S3GRSD68A963HG6RBUFFF5YSLYB8ZK365H7MXGI8E",
    algorithm: "HS512"
};
app.use(body_parser_1.default.json());
app.use((0, cors_1.default)());
app.get("/schema/categories", (req, res) => {
    const allCategories = db.prepare("SELECT * FROM dailycategories").all();
    res.json(allCategories);
});
app.get("/schema/items", (req, res) => {
    const allCategories = db.prepare("SELECT * FROM dailyitems").all();
    res.json(allCategories);
});
app.get("/schema/units", (req, res) => {
    const allUnits = db.prepare("SELECT * FROM units").all();
    res.json(allUnits);
});
app.get("/schema/unitOptions", (req, res) => {
    const allOptions = db.prepare("SELECT * FROM unit_options").all();
    res.json(allOptions);
});
app.get("/myData/groupInfo", authenticateJWT, (req, res) => {
    const groupInfo = db.prepare("SELECT groups.name, periodStart, periodEnd FROM 'groups' inner join users on users.\"group\" = groups.id WHERE users.id = " + req.userID).get();
    res.json(groupInfo);
});
app.get("/auth/:loginType/:userName/:credentials", (req, res) => {
    const groupInfo = db.prepare("SELECT id, loginType, credentials FROM users WHERE users.name = '" + String(req.params.userName) + "'").get();
    switch (req.params.loginType) {
        case "local":
            if (groupInfo.credentials === req.params.credentials) {
                let token = jsonwebtoken_1.default.sign({ userID: groupInfo.id }, JWToptions.secret, {
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
app.listen(apiPort, () => {
    console.log(`Server is running on port ${apiPort}`);
});
function authenticateJWT(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null)
        return res.sendStatus(401);
    jsonwebtoken_1.default.verify(token, JWToptions.secret, (err, payload) => {
        if (err)
            return res.sendStatus(403);
        req.userID = payload.userID;
        next();
    });
}
