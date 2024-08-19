import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ConnectionManagerComponent } from './components/connection-manager/connection-manager.component';
import { ServoControlComponent } from './components/servo-control/servo-control.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    ServoControlComponent, 
    ConnectionManagerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'SteelRoyalController';
}
