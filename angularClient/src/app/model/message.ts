export class Message {
    constructor(
        public sender: string,
        public content: string,
        public isBroadcast = false,
        public myName:string,
        public clientNameToSend?:string
    ) { }
}