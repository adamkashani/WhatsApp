import { Component, ViewChild, ElementRef, OnInit, AfterViewInit, Input } from '@angular/core';
import { Message } from 'src/app/models/message';
import { ClientService } from 'src/app/service/client.service';

@Component({
    selector: 'app-chet',
    templateUrl: './chet.component.html',
    styleUrls: ['./chet.component.scss']
})
export class ChetComponent implements AfterViewInit {

    @ViewChild('viewer', { static: false }) private viewer: ElementRef;
    public serverMessages = new Array<Message>();

    public clientMessage = '';
    public isBroadcast = false;
    public sender = '';
    public myMsg: boolean = false;


    constructor(public clientService: ClientService) {
    }

    ngAfterViewInit(): void {
        this.scroll();
    }

    public toggleIsBroadcast(): void {
        this.isBroadcast = !this.isBroadcast;
    }

    public send(name: string): void {
        this.myMsg = true;
        this.clientService.isBroadcast = false;
        console.log('this.clientService.clientName', this.clientService.clientName)
        const message = new Message(this.clientService.sender, this.clientService.sender + ' : ' + this.clientMessage, this.clientService.isBroadcast, this.clientService.clientName);
        this.clientService.addMyMessage(this.clientMessage)
        this.serverMessages.push(message);
        console.log(message)
        this.clientService.socket$.next(message);
        this.clientMessage = '';
        this.scroll();
    }

    public isMine(message: Message): boolean {
        return message && message.sender === this.sender;
    }

    public getSenderInitials(sender: string): string {
        return sender && sender.substring(0, 2).toLocaleUpperCase();
    }
    public getSenderColor(sender: string): string {
        if (!sender) {
            sender = '';
        }
        const alpha = '0123456789ABCDEFGHIJKLMNOPQRSTUVXYZ';
        const initials = this.getSenderInitials(sender);
        const value = Math.ceil((alpha.indexOf(initials[0]) + alpha.indexOf(initials[1])) * 255 * 255 * 255 / 70);
        return '#' + value.toString(16).padEnd(6, '0');
    }

    private scroll(): void {
        setTimeout(() => {
            this.scrollToBottom();
        }, 100);
    }

    private getDiff(): number {
        if (!this.viewer) {
            return -1;
        }

        const nativeElement = this.viewer.nativeElement;
        return nativeElement.scrollHeight - (nativeElement.scrollTop + nativeElement.clientHeight);
    }

    private scrollToBottom(t = 1, b = 0): void {
        if (b < 1) {
            b = this.getDiff();
        }
        if (b > 0 && t <= 120) {
            setTimeout(() => {
                const diff = this.easeInOutSin(t / 120) * this.getDiff();
                this.viewer.nativeElement.scrollTop += diff;
                this.scrollToBottom(++t, b);
            }, 1 / 60);
        }
    }

    private easeInOutSin(t): number {
        return (1 + Math.sin(Math.PI * t - Math.PI / 2)) / 2;
    }

}
