import { Router } from '@angular/router';
import { ClientService } from 'src/app/service/client.service';
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material'

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  userName: string;
  password: string;
  constructor(public router: Router, public clientService: ClientService) { }

  ngOnInit() {

    //check if allredy login route to chet 

  }
  login(): void {
    //check the value and send reqeust to api login 
    if (this.userName.length < 3) {
      alert("Invalid user name");
      return;
    }
    console.log(`user name : ${this.userName}`);

    this.clientService.login(this.userName).subscribe(
      (next) => {
        this.clientService.token = next;
        console.log(this.clientService.token)
        sessionStorage.setItem('token', this.clientService.token)
        sessionStorage.setItem('userName', this.userName)
        // get the token from request ang nav to home page 
        this.clientService.sender = this.userName;
        this.router.navigate(["/home"]);
      },
      (error) => {
        alert(JSON.stringify(error))
        console.log(error)
      }

    )
  }
}
