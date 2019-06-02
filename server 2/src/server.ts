import * as express from 'express';
import * as http from 'http';
import * as WebSocket from 'ws';
import * as jwt from "jsonwebtoken";
import * as bodyParser from "body-parser";
import * as cookieParser from "cookie-parser";
import * as path from "path"


import { Message } from './message';
import { RedisService } from './redisService';
import { WebSocketService } from './webSocketService';


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

// the client map string the client name or token 
const CLIENTS: Map<string, WebSocket> = new Map();

//create redis service include init
const redisService = new RedisService(wss, CLIENTS);

const webSocketService = new WebSocketService(wss, redisService, CLIENTS)

//start webSocket server
server.listen(process.env.PORT || 1002, () => {
    console.log(`Server started on port webSocket  ${server.address().port} :)`);
});

// Rest api for login 
app.post('/login', (request, response) => {
    let name: string = request.body.name;
    let result: boolean;
    redisService.redisClient.lrange('users', 0, -1, function (err, reply) {
        console.log("login api users redis : ", reply);
        // return list from redis
        reply.forEach(element => {
            if (element === name) {
                result = true;
            }
        })
        console.log(`login the result from redis ${result}`)
        if (result == true) {
            let token = jwt.sign({ username: name }, 'shhhhh');
            //insert the token key and value the user name
            redisService.redisClient.set(token, name);
            console.log(`from api login token value ${token}`)
            response.cookie('token', token);
            response.send(token)
            return;
        } else {
            response.status(403)
            response.send(`the user name ${name} not exists`)
            return;
        }
    });
})

app.get('/onlineUsers', (request, response) => {

    let token = request.query.token;
    console.log(`from onlineUsers the token value ${token}`)
    if (token) {
        redisService.redisClient.GET(token, (error, result) => {
            if (result) {
                console.log(`from onlineUsers rest api get from redis value by name , result :  ${result}`)
                redisService.redisClient.lrange(redisService.online, 0, -1, function (err, result) {
                    console.log("from redisService getOnlineList users redis : ", result);
                    response.json(result)
                    return;
                })
            } else {
                response.status(403)
                response.send('Not registered in the system')
            }
        })
    } else {
        response.status(403)
        response.send('Not registered in the system')
    }
})

app.get('/', (request, response) => {
    response.setHeader('Content-Type', 'text/html');
    response.sendFile(path.join(__dirname, 'index.html'));
})

app.listen(8081, () => {
    console.log(`Server started on port 8081 rest api`)
})