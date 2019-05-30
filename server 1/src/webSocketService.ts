import * as WebSocket from 'ws';
import * as http from 'http';

import { Message } from './message';
import { RedisService } from './redisService';

export class WebSocketService {

    webSocketServer: WebSocket.Server;
    redisService: RedisService
    CLIENTS: Map<string, WebSocket>;

    constructor(wss: WebSocket.Server, redisService: RedisService, CLIENTS: Map<string, WebSocket>) {
        this.webSocketServer = wss;
        this.redisService = redisService;
        this.CLIENTS = CLIENTS;
        this.init();
    }


    createMessage(content: string, isBroadcast = false, sender = 'NS', clientName?: any): string {
        return JSON.stringify(new Message(content, isBroadcast, clientName, sender));
    }


    init() {

        console.log(`start init from WebSocketService`)

        interface ExtWebSocket extends WebSocket {
            isAlive: boolean;
        }

        this.webSocketServer.on('connection', (ws: WebSocket, request: http.IncomingMessage) => {

            const extWs = ws as ExtWebSocket;

            extWs.isAlive = true;

            ws.on('pong', () => {
                extWs.isAlive = true;
            });
            //connection is up, let's add a simple simple event
            ws.on('message', (msg: string) => {
                console.log(' the CLIENTS size  : ', this.CLIENTS.size)

                // from string to obj message
                const message = JSON.parse(msg) as Message;
                // get the client we wont to send the message 
                let webSocket = this.CLIENTS.get(message.clientName);
                console.log('the message ', message)
                if (webSocket != null) {
                    webSocket = webSocket as WebSocket;
                    console.log(`from message.sender :  ${message.sender}  to message.clientName :  ${message.clientName}`)
                    webSocket.send(JSON.stringify(message))
                } else {
                    // if the client not exsis on this server  publish to all instanse 
                    this.redisService.redisPub.publish('message', JSON.stringify(message))
                }
            });

            //get the token from url 
            let url = request.url as string;
            console.log(`from web socket connction url :  ${url}`)
            let token = url.substring(8, url.length);
            console.log(`from web socket connction token value ${token}`)
            //get the client name conncted from redis 
            this.redisService.redisClient.GET(token, (err, result) => {
                let senderName = result
                console.log(`the result from redis get user by token : ${result}`)
                //insert new client to map clients
                setTimeout(() => {
                    this.CLIENTS.set(senderName, ws)
                }, 1000);
                // send for client the userName is online 
                setTimeout(() => {
                    this.webSocketServer.clients.forEach(client => {
                        if (client != ws) {
                            console.log(this.createMessage(`user name connect : ${senderName}`, true, senderName, ''))
                            client.send(this.createMessage(`user name connect : ${senderName}`, true, senderName, ''))
                        }
                    })
                }, 1000);
                //create message to send 
                let message = this.createMessage('', true, senderName, '');
                //for server 2 to publis there the new user is connected
                this.redisService.redisPub.publish('add-user', JSON.stringify(message))
            })

            //send list of client to the new user 
            this.CLIENTS.forEach((value, key) => {
                ws.send(this.createMessage('', true, key, ''), (error) => {
                    console.log(error)
                })
            });

            ws.on('error', (err) => {
                this.CLIENTS.forEach((value, key) => {
                    if (value === ws) {
                        this.CLIENTS.delete(key);
                        console.log(`remove webSocket client name  ${key}`)
                        // TODO צריך לידאוג כאן לישלוח הודעה ללקוחות ולימחוק את אותו יוזר שהיתנתק ישלנו כבר את השם שלו שזה בעצם המפתח במתודה 
                    }
                })
                console.warn(`Client disconnected - reason: ${err}`);
            })
        });

        // run all the sockets client and remove if the client not connect 
        // TODO remove from CLIENTS the web socket 
        setInterval(() => {
            this.webSocketServer.clients.forEach((ws: WebSocket) => {

                const extWs = ws as ExtWebSocket;

                if (!extWs.isAlive) return ws.terminate();

                extWs.isAlive = false;
                ws.ping(null, undefined);
            });
        }, 10000);


    }





}