import * as express from 'express';
import * as http from 'http';
import * as WebSocket from 'ws';
import * as bodyParser from "body-parser";
import * as cookieParser from "cookie-parser";
import * as path from "path"
import * as jwt from "jsonwebtoken";


import { RedisService } from './redisService';
import { WebSocketService } from './webSocketService';
import { User } from './types/user';
import { DataBaseService } from './dataBaseService';


const app = express();

//initialize a simple http server
const server = http.createServer(app);

//body parser to json
app.use(bodyParser.json());

//use cookie parser middleware
app.use(cookieParser());

//init web folder
app.use(express.static(__dirname + "/web"));

//enable Access-Control-Allow-Origin for angular
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
//initialize the WebSocket server instance
const wss = new WebSocket.Server({ server });

// the client map string the client name
const CLIENTS: Map<string, WebSocket> = new Map();

//create redis service include init
const redisService = new RedisService(wss, CLIENTS);

const webSocketService = new WebSocketService(wss, redisService, CLIENTS)

const sqlService = new DataBaseService(redisService);

//start webSocket server
server.listen(process.env.PORT || 1001, () => {
    console.log(`Server started on port webSocket  ${server.address().port} :)`);
});

// Rest api for login 
app.post('/login', (request, response) => {
    let user: User = request.body as User;
    console.log(`from login the user : ${JSON.stringify(user)}`)
    let name = user.name;
    sqlService.login(user).then((resolve) => {
        console.log("from redisService userExists users redis : ", resolve);
        response.cookie('token', resolve);
        response.send(resolve)
        return;
    },
        (reject) => {
            response.status(403)
            response.send(`the user name ${name} not exists`)
            return;
        })
})

// Rest api for registration 
app.post('/signIn', (request, response) => {
    let user: User = request.body as User;
    sqlService.registration(user).then((resolve) => {
        response.setHeader('Content-Type', 'text/html');
        response.status(200)
        response.send(`Registration successfully passed`)
    }, (reject) => {
        response.status(404)
        response.send(reject)
    })
});

// Rest api for get list of online users 
app.get('/onlineUsers', (request, response) => {
    let token = request.query.token;
    console.log(`from onlineUsers the token value ${token}`)
    // if the request have token and the token on the redis db 
    if (token) {
        redisService.getListOnline(token).then((resolve) => {
            console.log("from server api onlineUsers users redis : ", resolve);
            response.json(resolve)
        },
        (reject) => {
            console.log("from server api the token not exists in the system  : ", token);
            response.status(403)
            response.send('Not registered in the system')
        })
    }
})

app.get('/reconnect/:userName/:token', (request, response) => {
    let userName = request.params.userName;
    let token = request.params.token;
    console.log(`from reconnect the userName : ${userName}  the token : ${token}`)
    //Insert the token = key and value = user name
    redisService.redisClient.set(token, userName);
    response.setHeader('Content-Type', 'text/html');
    response.send(`Reconnect successfully passed`)
})

app.get('/', (request, response) => {
    response.setHeader('Content-Type', 'text/html');
    response.sendFile(path.join(__dirname, 'index.html'));
})

app.listen(8080, () => {
    console.log(`Server started on port 8080 rest api`)
})