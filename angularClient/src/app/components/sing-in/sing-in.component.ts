import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ClientService } from 'src/app/service/client.service';
import { User } from 'src/app/models/user';

@Component({
  selector: 'app-sing-in',
  templateUrl: './sing-in.component.html',
  styleUrls: ['./sing-in.component.scss']
})
export class SingInComponent implements OnInit {
  userName: string;
  password: string;

  constructor(public router: Router, public clientService: ClientService) { }

  ngOnInit() {
    
  }

  singIn() {
    let user = new User(this.userName, this.password)
    //validate the user befor send to server side


    this.clientService.singIn(user).subscribe((next) => {
      console.log('the next value from sing-in is : ',next)
      alert('Sing-in Successfully')
      this.router.navigate(['/login'])
    }, (error) => {
      alert(error)
    })
  }

}
