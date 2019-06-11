import { Router } from '@angular/router';
import { ClientService } from 'src/app/service/client.service';
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material'
import { User } from 'src/app/models/user';

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

  }

  moveSingIn(){
    this.router.navigate(['/sing-in'])
  }
  
  login(): void {
    //check the value and send reqeust to api login 
    if (this.userName.length < 3) {
      alert("Invalid user name");
      return;
    }
    let user = new User(this.userName, this.password);
    console.log(`user name : ${user}`);

    this.clientService.login(user).subscribe(
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
        alert(error.error)
        console.log(error)
      }

    )
  }
}
