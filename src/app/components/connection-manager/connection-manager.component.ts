import { Component, OnDestroy, OnInit } from '@angular/core';
import { WebSocketService } from '../../services/websocket.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { WebSocketState } from '../../models/WebSocketState';

@Component({
  selector: 'app-connection-manager',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './connection-manager.component.html',
  styleUrls: ['./connection-manager.component.scss']
})
export class ConnectionManagerComponent implements OnInit, OnDestroy {
  WebSocketState = WebSocketState;
  controlConnectionState: WebSocketState = WebSocketState.DISCONNECTED;
  imageConnectionState: WebSocketState = WebSocketState.DISCONNECTED;
  controlConnectionError: string | null = null;
  imageConnectionError: string | null = null;
  
  controlConnectionStateSub: Subscription | null = null;
  imageConnectionStateSub: Subscription | null = null;
  controlConnectionErrorSub: Subscription | null = null;
  imageConnectionErrorSub: Subscription | null = null;

  constructor(public webSocketService: WebSocketService) {}

  ngOnInit(): void {
    this.controlConnectionStateSub = this.webSocketService.controlConnectionState$.subscribe(state => {
      this.controlConnectionState = state;
      console.log("Control connection state:", state);
    });

    this.imageConnectionStateSub = this.webSocketService.imageConnectionState$.subscribe(state => {
      this.imageConnectionState = state;
      console.log("Image connection state:", state);
    });

    this.controlConnectionErrorSub = this.webSocketService.controlConnectionError$.subscribe(error => {
      this.controlConnectionError = error;
      if (error) console.error("Control connection error:", error);
    });

    this.imageConnectionErrorSub = this.webSocketService.imageConnectionError$.subscribe(error => {
      this.imageConnectionError = error;
      if (error) console.error("Image connection error:", error);
    });
  }

  ngOnDestroy(): void {
    this.controlConnectionStateSub?.unsubscribe();
    this.imageConnectionStateSub?.unsubscribe();
    this.controlConnectionErrorSub?.unsubscribe();
    this.imageConnectionErrorSub?.unsubscribe();
  }

  toggleControlConnection() {
    switch (this.controlConnectionState) {
      case WebSocketState.CONNECTED:
        this.webSocketService.disconnectFromControl();
        break;
      case WebSocketState.DISCONNECTED:
      case WebSocketState.FAILED:
        this.webSocketService.connectToControl().subscribe();
        break;
      default:
        break;
    }
  }

  toggleImageConnection() {
    switch (this.imageConnectionState) {
      case WebSocketState.CONNECTED:
        this.webSocketService.disconnectFromImages();
        break;
      case WebSocketState.DISCONNECTED:
      case WebSocketState.FAILED:
        this.webSocketService.connectToImages().subscribe();
        break;
      default:
        break;
    }
  }

  getControlButtonText(): string {
    switch (this.controlConnectionState) {
      case WebSocketState.CONNECTED:
        return 'Desconectar Control';
      case WebSocketState.CONNECTING:
        return 'Conectando...';
      case WebSocketState.DISCONNECTED:
        return 'Conectar Control';
      case WebSocketState.FAILED:
        return 'Reintentar Control';
      default:
        return '';
    }
  }

  getControlStatusText(): string {
    switch (this.controlConnectionState) {
      case WebSocketState.CONNECTED:
        return 'Control Conectado';
      case WebSocketState.CONNECTING:
        return 'Conectando control...';
      case WebSocketState.DISCONNECTED:
        return 'Control Desconectado';
      case WebSocketState.FAILED:
        return 'Conexión fallida. Toque para reintentar.';
      default:
        return '';
    }
  }

  getImageButtonText(): string {
    switch (this.imageConnectionState) {
      case WebSocketState.CONNECTED:
        return 'Desconectar Imágenes';
      case WebSocketState.CONNECTING:
        return 'Conectando...';
      case WebSocketState.DISCONNECTED:
        return 'Conectar Imágenes';
      case WebSocketState.FAILED:
        return 'Reintentar Imágenes';
      default:
        return '';
    }
  }

  getImageStatusText(): string {
    switch (this.imageConnectionState) {
      case WebSocketState.CONNECTED:
        return 'Imágenes Conectadas';
      case WebSocketState.CONNECTING:
        return 'Conectando imágenes...';
      case WebSocketState.DISCONNECTED:
        return 'Imágenes Desconectadas';
      case WebSocketState.FAILED:
        return 'Conexión fallida. Toque para reintentar.';
      default:
        return '';
    }
  }
}
