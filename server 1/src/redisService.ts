import * as redis from 'redis';
import * as WebSocket from 'ws';
import { Message } from './types/message';
import * as jwt from "jsonwebtoken";

// create redis client
export class RedisService {

    redisClient: redis.RedisClient = redis.createClient();
    redisSub: redis.RedisClient = redis.createClient();
    webSocketServer: WebSocket.Server;
    clientMap: Map<string, WebSocket>;
    // Set array in the redis DB
    online: string = 'online';
    // redis channel add-user
    addUserPUBSUB: string = 'add-user';
    // redis channel message
    messagePUBSUB: string = 'message';

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
            let result = this.fromBase64ToString(data)

            console.log(`the result after return to string from buffer  : ${result}`)

            console.log(`from redis sub `)
            try {
                let message = JSON.parse(result) as Message;
                console.log("redisSub on message : the channel = " + channel + ' the data : ' + message);
                console.log(`message to send  : ${message.toString()}`)
                console.log(`message to send sender name : ${message.sender}`)
                if (channel === this.messagePUBSUB) {
                    console.log(`from channel message : ${message}`)
                    let toSendMessage = this.clientMap.get(message.clientName)
                    if (toSendMessage) {
                        console.log(`the message send to client ${message.clientName}  from client ${message.sender}`)
                        toSendMessage.send(JSON.stringify(message))
                    }
                } else if (channel === this.addUserPUBSUB) {
                    console.log('the client name : ', message.sender)
                    //get the client from map we want send the message 
                    let senderSocket = this.clientMap.get(message.sender)
                    console.log('this  clientMap.keys  : ', this.clientMap.keys.toString())
                    //if the client not exists hare push for all client the new client connctions 
                    console.log(`senderSocket : ${senderSocket}`)
                    if (senderSocket) {
                        console.log(`from redis pubsub the client exists in the app not need to send for all clients for new client connected`)
                    } else {
                        console.log(`from channel add-user : ${data}`)
                        console.log('the size of clients in web socket ', this.webSocketServer.clients.size)
                        // send for client the userName is online 
                        this.webSocketServer.clients.forEach(client => {
                            console.log(JSON.stringify(message))
                            client.send(JSON.stringify(message), (error) => {
                                console.log(`error send the new client connect to  : ${client}  the error`, error)
                            });
                        })
                    }
                }
            } catch (error) {
                console.log(`error try cast data to jsonObject the data :  ${data}`)
            }
        })

        //start listen to tow of channels 
        this.redisSub.subscribe(this.addUserPUBSUB);
        this.redisSub.subscribe(this.messagePUBSUB);
        this.redisSub.on("subscribe", function (channel, count) {
            console.log("Subscribed to " + channel + ". Now subscribed to " + count + " channel(s).");
        });
    }

    // add new user to List online 
    addOnlineUser(userName: string): void {
        console.log(`start addOnlineList redis username insert : ${userName} `)
        let result = this.redisClient.rpush(this.online, userName)
        console.log(`result from redis addOnlineUser is : ${result} `)
    }

    // remove user from List online 
    removeOnlineList(userName: string): void {
        console.log(`start removeOnlineList redis username to remove  : ${userName} `)
        // let result = this.redisClient.del(this.online, userName)
        let result = this.redisClient.lrem(this.online, 0, userName, (data) => {
            console.log(data);
            console.log(`result from redis removeOnlineList is : ${result} `)
        });
    }

    getListOnline(token: string): Promise<any> {
        return new Promise((resolve, reject) => {
            this.redisClient.GET(token, (error, result) => {
                if (result) {
                    console.log(`from onlineUsers rest api get from redis value by name , result :  ${result}`)
                    this.redisClient.lrange(this.online, 0, -1, function (err, result) {
                        console.log("from redisService getOnlineList users redis : ", result);
                        return resolve(result)
                    })
                } else {
                    return reject();
                }
            })


        })
    }

    fromBase64ToString(messageString: string): string {
        let string = Buffer.from(messageString, 'base64').toString();
        console.log(string);
        return string;
    }

    publish(channel: string, message: string) {
        this.redisClient.publish(channel, message);
    }

    userExists(userName: string): Promise<string> {
        return new Promise((resolve, reject) => {
            this.redisClient.SISMEMBER('userss', userName, (err, reply) => {
                console.log("login api set users redis : ", reply);
                if (reply === 0) {
                    return reject()
                } else {
                    let token = jwt.sign({ username: userName }, 'shhhhh');
                    //insert the token key and value the user name
                    this.redisClient.set(token, userName);
                    return resolve(token)
                }
            })
        })
    }

    getUserByToken(token: string): Promise<string> {
        return new Promise((resolve, reject) => {

            this.redisClient.GET(token, (error, result) => {
                if (error) console.log(`error!! from redisService method getUserByToken the error message : ${error.message} `)

                if (result) {
                    return resolve(result)
                } else {
                    return reject();
                }
            })
        })
    }


}
