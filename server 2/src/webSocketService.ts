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
                    // if the client not exsis on this server publish to all instanse 
                    console.log("the message to publish bufferBase64 : " + this.bufferBase64(JSON.stringify(message)));
                    this.redisService.redisClient.publish(this.redisService.messagePUBSUB, this.bufferBase64(JSON.stringify(message)))
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

                //if the client try to connect with not token we kiil the socket  
                if (!result) {
                    console.log(`client try to coonnect with not token : ${result}`)
                    ws.terminate()
                    return;
                }

                //insert new client to map clients
                console.log(`client  map set new before the dize  : ${this.CLIENTS.size}`)
                this.CLIENTS.set(senderName, ws)
                console.log(`client  map set new after the dize  : ${this.CLIENTS.size}`)
                //insert the new user to redis online users 
                this.redisService.addOnlineUser(senderName)


                // send for client the userName is online 
                this.webSocketServer.clients.forEach(client => {
                    if (client != ws) {
                        console.log(this.createMessage(`user name connect : ${senderName}`, true, senderName, ''))
                        client.send(this.createMessage(`user name connect : ${senderName}`, true, senderName, ''))
                    }
                })
                //create message to send 
                let message = this.createMessage('', true, senderName, '');
                //for server 2 to publis there the new user is connected
                console.log("befor stringify message value is  : " + message);
                console.log("adduserPUBLISH the message to publish bufferBase64 : " + this.bufferBase64(message));
                this.redisService.redisClient.publish(this.redisService.addUserPUBSUB, this.bufferBase64(message))
            })

            ws.on('error', (err) => {
                this.CLIENTS.forEach((value, key) => {
                    if (value === ws) {
                        this.CLIENTS.delete(key);
                        this.redisService.removeOnlineList(key)
                        console.log(`remove webSocket client name  ${key}`)
                        console.log(`remove webSocket client token  ${token}`)
                        this.redisService.redisClient.del(token)
                        // TODO צריך לידאוג כאן לישלוח הודעה ללקוחות ולימחוק את אותו יוזר שהיתנתק ישלנו כבר את השם שלו שזה בעצם המפתח במתודה 
                    }
                })
                console.warn(`Client disconnected - reason: ${err}`);
            })
        });

    }


    bufferBase64(messageString: string): string {
        return Buffer.from(messageString).toString('base64');
    }

}