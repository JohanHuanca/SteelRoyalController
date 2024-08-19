import { Injectable } from '@angular/core';
import { Observable, Observer, BehaviorSubject } from 'rxjs';
import { WebSocketState } from '../models/WebSocketState';
import { CreateMovementRequest } from '../models/CreateMovementRequest';
import { UpdateMovementRequest } from '../models/UpdateMovementRequest';
import { CreatePositionRequest } from '../models/CreatePositionRequest';
import { UpdatePositionRequest } from '../models/UpdatePositionRequest';
import { CreateServoRequest } from '../models/CreateServoRequest';
import { UpdateServoRequest } from '../models/UpdateServoRequest';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private controlSocket!: WebSocket;
  private imageSocket!: WebSocket;
  /* url del espcam */
  private controlUrl = 'ws://172.20.10.2/data';
  private imageUrl = 'ws://192.168.1.51:8766';

  private controlConnectionState = new BehaviorSubject<WebSocketState>(WebSocketState.DISCONNECTED);
  private imageConnectionState = new BehaviorSubject<WebSocketState>(WebSocketState.DISCONNECTED);

  private controlConnectionError = new BehaviorSubject<string | null>(null);
  private imageConnectionError = new BehaviorSubject<string | null>(null);

  private pendingRequests: { [key: string]: { resolve: Function, reject: Function } } = {};

  constructor() { }

  connectToControl(): Observable<any> {
    this.controlSocket = new WebSocket(this.controlUrl);

    return new Observable((observer: Observer<any>) => {
      this.controlSocket.onopen = () => {
        this.controlConnectionState.next(WebSocketState.CONNECTED);
        console.log('Connected to control WebSocket');
      };

      this.controlSocket.onmessage = (event: MessageEvent) => {
        observer.next(event.data);
        this.handleControlMessage(event.data);
      };

      this.controlSocket.onerror = (error: Event) => {
        const errorMessage = error instanceof ErrorEvent ? error.message : 'Unknown error';
        this.controlConnectionError.next(`Control WebSocket error: ${errorMessage}`);
        this.controlConnectionState.next(WebSocketState.FAILED);
        observer.error(error);
      };

      this.controlSocket.onclose = () => {
        this.controlConnectionState.next(WebSocketState.DISCONNECTED);
        observer.complete();
      };
    });
  }

  connectToImages(): Observable<Blob> {
    this.imageSocket = new WebSocket(this.imageUrl);
    this.imageSocket.binaryType = 'blob';

    return new Observable((observer: Observer<Blob>) => {
      this.imageSocket.onopen = () => {
        this.imageConnectionState.next(WebSocketState.CONNECTED);
        console.log('Connected to image WebSocket');
      };

      this.imageSocket.onmessage = (event: MessageEvent) => {
        observer.next(event.data);
      };

      this.imageSocket.onerror = (error: Event) => {
        const errorMessage = error instanceof ErrorEvent ? error.message : 'Unknown error';
        this.imageConnectionError.next(`Image WebSocket error: ${errorMessage}`);
        this.imageConnectionState.next(WebSocketState.FAILED);
        observer.error(error);
      };

      this.imageSocket.onclose = () => {
        this.imageConnectionState.next(WebSocketState.DISCONNECTED);
        observer.complete();
      };
    });
  }

  disconnectFromControl(): void {
    if (this.controlSocket) {
      this.controlSocket.close();
      this.controlConnectionState.next(WebSocketState.DISCONNECTED);
      console.log('Disconnected from control WebSocket');
    }
  }

  disconnectFromImages(): void {
    if (this.imageSocket) {
      this.imageSocket.close();
      this.imageConnectionState.next(WebSocketState.DISCONNECTED);
      console.log('Disconnected from image WebSocket');
    }
  }

  sendControlMessage(message: any): void {
    if (this.controlConnectionState.value === WebSocketState.CONNECTED) {
      this.controlSocket.send(JSON.stringify(message));
    }
  }

  private handleControlMessage(msg: any) {
    const data = JSON.parse(msg);
    const requestId = data.request_id; // Espera request_id del servidor
    if (requestId && this.pendingRequests[requestId]) {
      this.pendingRequests[requestId].resolve(data); // Devuelve solo el payload
      delete this.pendingRequests[requestId];
    }
  }

  sendRequest(endpoint: string, method: string, payload: any = {}): Promise<any> {
    const requestId = this.generateRequestId();
    const message = { endpoint, method, payload, request_id: requestId }; // Enviar request_id al servidor

    return new Promise((resolve, reject) => {
      this.pendingRequests[requestId] = { resolve, reject };
      this.sendControlMessage(message);
    });
  }

  private generateRequestId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  /****************************************************/
  // Methods to interact with the servos
  activateImages(): Promise<any> {
    return this.sendRequest('/app/video/start', 'POST');
  }

  deactivateImages(): Promise<any> {
    return this.sendRequest('/app/video/stop', 'POST');
  }
  /****************************************************/
  saveInitialPosition(): Promise<any> {
    return this.sendRequest('/app/servos/savePosition', 'POST');
  }

  getAllServos(): Promise<any> {
    return this.sendRequest('/app/servos/getAll', 'GET');
  }

  getServo(id: number): Promise<any> {
    return this.sendRequest('/app/servos/get', 'GET', { id });
  }

  createServo(request: CreateServoRequest): Promise<any> {
    return this.sendRequest('/app/servos/create', 'POST', request);
  }

  updateServo(request: UpdateServoRequest): Promise<any> {
    return this.sendRequest('/app/servos/update', 'POST', request);
  }

  deleteServo(): Promise<any> {
    return this.sendRequest('/app/servos/delete', 'POST');
  }
  /****************************************************/
  // Methods to interact with movements and positions
  createMovement(request: CreateMovementRequest): Promise<any> {
    return this.sendRequest('/app/movements/create', 'POST', request);
  }

  updateMovement(request: UpdateMovementRequest): Promise<any> {
    return this.sendRequest('/app/movements/update', 'POST', request);
  }

  deleteMovement(id: number): Promise<any> {
    return this.sendRequest('/app/movements/delete', 'POST', { id });
  }

  getMovement(id: number): Promise<any> {
    return this.sendRequest('/app/movements/get', 'GET', { id });
  }

  getAllMovements(): Promise<any> {
    return this.sendRequest('/app/movements/getAll', 'GET');
  }
  /****************************************************/
  createPosition(request: CreatePositionRequest): Promise<any> {
    return this.sendRequest('/app/positions/create', 'POST', request);
  }

  movePositionUp(id: number): Promise<any> {
    return this.sendRequest('/app/positions/moveUp', 'POST', { id });
  }

  movePositionDown(id: number): Promise<any> {
    return this.sendRequest('/app/positions/moveDown', 'POST', { id });
  }

  updatePosition(request: UpdatePositionRequest): Promise<any> {
    return this.sendRequest('/app/positions/update', 'POST', request);
  }

  deletePosition(id: number): Promise<any> {
    return this.sendRequest('/app/positions/delete', 'POST', { id });
  }

  getPosition(id: number): Promise<any> {
    return this.sendRequest('/app/positions/get', 'GET', { id });
  }

  getAllPositions(): Promise<any> {
    return this.sendRequest('/app/positions/getAll', 'GET');
  }

  getPositionsByMovementId(movement_id: number): Promise<any> {
    return this.sendRequest('/app/positions/getByMovementId', 'GET', { movement_id });
  }

  moveToInitialPosition(): Promise<any> {
    return this.sendRequest('/app/positions/moveToInitial', 'POST');
  }

  executeMovement(movement_id: number): Promise<any> {
    return this.sendRequest('/app/positions/executeMovement', 'POST', { movement_id });
  }

  moveToPositionById(id: number): Promise<any> {
    return this.sendRequest('/app/positions/moveToPosition', 'POST', { id });
  }

  /****************************************************/

  get controlConnectionState$() {
    return this.controlConnectionState.asObservable();
  }

  get imageConnectionState$() {
    return this.imageConnectionState.asObservable();
  }

  get controlConnectionError$() {
    return this.controlConnectionError.asObservable();
  }

  get imageConnectionError$() {
    return this.imageConnectionError.asObservable();
  }
}
