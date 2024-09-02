import express, { Express, Request, Response } from "express";
import bodyParser from "body-parser";
import cors from "cors"
import Database from 'better-sqlite3';
import jwt from "jsonwebtoken"

const db = new Database('db/mmp-mockapi.db');
db.pragma('journal_mode = WAL');
const app = express();
const apiPort = 8080;
const JWToptions = {
    secret: "WN4G0PXBR0F7MSMPQ2JQJ22S3GRSD68A963HG6RBUFFF5YSLYB8ZK365H7MXGI8E",
    algorithm: "HS512"
};

app.use(bodyParser.json());
app.use(cors());

app.get("/schema/categories", (req, res) => {
    const allCategories = db.prepare("SELECT * FROM dailycategories").all();
    res.json(allCategories);
})

app.get("/schema/items", (req, res) => {
    const allCategories = db.prepare("SELECT * FROM dailyitems").all();
    res.json(allCategories);
})

app.get("/schema/units", (req, res) => {
    const allUnits = db.prepare("SELECT * FROM units").all();
    res.json(allUnits);
})

app.get("/schema/unitOptions", (req, res) => {
    const allOptions = db.prepare("SELECT * FROM unit_options").all();
    res.json(allOptions);
})

app.get("/myData/groupInfo", authenticateJWT, (req, res) => {
    const groupInfo = db.prepare("SELECT groups.name, periodStart, periodEnd FROM 'groups' inner join users on users.\"group\" = groups.id WHERE users.id = " + req.userID).get();
    res.json(groupInfo);
})

app.get("/auth/:loginType/:userName/:credentials", (req, res) => {
    const groupInfo = <{id: number, loginType: string, credentials: string}><unknown>db.prepare("SELECT id, loginType, credentials FROM users WHERE users.name = '" + String(req.params.userName) + "'").get();
    switch (req.params.loginType){
        case "local":
            if (groupInfo.credentials === req.params.credentials){
                let token = jwt.sign({userID: groupInfo.id}, JWToptions.secret, {
                    algorithm: "HS512",
                    expiresIn: "4h",
                    issuer: "MMP"
                });
                res.json({JWT: token});
            }
            else
                res.sendStatus(403)
            break;
    }
})

app.listen(apiPort, () => {
    console.log(`Server is running on port ${apiPort}`);
});

declare global {
    namespace Express {
        export interface Request {
            userID?: string;
        }
    }
}

function authenticateJWT(req: Request, res: Response, next: any) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if (token == null) return res.sendStatus(401)

    jwt.verify(token, JWToptions.secret, (err: any, payload: any) => {
        if (err) return res.sendStatus(403)
        req.userID = payload.userID;
        next();
    })
}

interface IJWTPayload {
    userID: string;
}
