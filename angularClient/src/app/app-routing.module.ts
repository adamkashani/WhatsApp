import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { ChetComponent } from './components/chet/chet.component';
import { HomeComponent } from './components/home/home.component';
import { ClientService } from './service/client.service';
import { SingInComponent } from './components/sing-in/sing-in.component';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'sing-in', component: SingInComponent },
  { path: '', component: LoginComponent },
  {
    path: 'home', canActivate: [ClientService], component: HomeComponent, children: [
      { path: 'chet', component: ChetComponent },
    ]
  }

];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
