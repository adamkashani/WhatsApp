import { Component, OnInit, AfterViewInit } from '@angular/core';
import { ClientService } from 'src/app/service/client.service';
import { MatSidenavModule } from '@angular/material/sidenav';
import {MatButtonModule} from '@angular/material/button';


@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, AfterViewInit {

  constructor(public clientService: ClientService) { }

  ngOnInit() {
    this.clientService.onLogin();
  }
  ngAfterViewInit(): void {
    // this.clientService.isBroadcast = false;
  }



  // to change the chaet text 
  changeChatClient(clientName: string) {
    console.log(`List of users : ${this.clientService.listOfUsers}`);
    let serverMessages = this.clientService.mapChat.get(clientName)
    this.clientService.serverMessages = serverMessages;
    this.clientService.clientName = clientName;
    console.log(this.clientService)
  }
}
