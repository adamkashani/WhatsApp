import * as redis from 'redis';
import * as WebSocket from 'ws';
import { Message } from './message';

// create redis client
export class RedisService {

    redisClient: redis.RedisClient = redis.createClient();
    redisPub: redis.RedisClient = redis.createClient();
    redisSub: redis.RedisClient = redis.createClient();
    webSocketServer: WebSocket.Server;
    clientMap: Map<string, WebSocket>;

    constructor(wss: WebSocket.Server, clientMap: Map<string, WebSocket>) {
        this.webSocketServer = wss;
        this.clientMap = clientMap;
        this.init();
    }

    init() {
        console.log("start init from RedisService ");
        this.redisSubStart()
    }

    redisSubStart() {


        console.log("start redisSub ");
        this.redisSub.on("message", (channel, data) => {
            setTimeout(() => {

                console.log(`from redis sub `)
                try {
                    let message = JSON.parse(data) as Message;
                    console.log("redisSub on message : the channel = " + channel + ' the data : ' + data);
                    if (channel === 'message') {
                        console.log(`from channel add=user : ${data}`)
                        let toSendMessage = this.clientMap.get(message.clientName)
                        if (toSendMessage) {
                            toSendMessage.send(JSON.stringify(message))
                        }
                    } else if (channel === 'add-user') {
                        //get the client from map we want send the message 
                        let senderSocket = this.clientMap.get(message.sender)
                        //if the client not exists hare push for all client the client connctions 
                        console.log(`senderSocket : ${senderSocket}`)
                        if (senderSocket) {
                            console.log(`the client exists in the app`)
                        } else {
                            console.log(`from channel add-user : ${data}`)
                            console.log('the size of clients in web socket ', this.webSocketServer.clients.size)
                            this.webSocketServer.clients.forEach((value) => {
                                console.log(`send the new client connect to  : ${value}`)
                                value.send(JSON.stringify(message), (error) => {
                                    console.log(`error send the new client connect to  : ${value}  the error`, error)
                                    // console.log(`error message  : ${error.message}`)
                                    // console.log(`error name  : ${error.name}`)
                                });
                            })
                        }
                    }
                } catch (error) {
                    console.log(`error try cast data to jsonObject the data :  ${data}`)
                }
            }, 1000);
        })

        this.redisSub.subscribe("add-user");
        this.redisSub.subscribe("message");
        this.redisSub.on("subscribe", function (channel, count) {
            console.log("Subscribed to " + channel + ". Now subscribed to " + count + " channel(s).");
        });
    }

}
