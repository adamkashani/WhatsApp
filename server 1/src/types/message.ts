export class Message {
    constructor(
        public content: string,
        public isBroadcast: boolean,
        public clientName: string,
        public sender: string
    ) { }
}