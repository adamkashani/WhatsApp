export class Message {
    constructor(
        public sender: string,
        public content: string,
        public isBroadcast: boolean,
        //Who am I sending the message 
        public clientName: string,
    ) { }
}