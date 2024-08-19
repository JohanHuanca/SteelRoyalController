import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { ServoResource } from '../../models/ServoResource';
import { WebSocketService } from '../../services/websocket.service';
import { Subscription } from 'rxjs';
import { WebSocketState } from '../../models/WebSocketState';
import { UpdateServoRequest } from '../../models/UpdateServoRequest';
import { CreateMovementRequest } from '../../models/CreateMovementRequest';
import { CreatePositionRequest } from '../../models/CreatePositionRequest';
import { UpdateMovementRequest } from '../../models/UpdateMovementRequest';
import { UpdatePositionRequest } from '../../models/UpdatePositionRequest';
import { MovementResource } from '../../models/MovementResource';
import { PositionResource } from '../../models/PositionResource';

@Component({
  selector: 'app-servo-control',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    NgxDatatableModule
  ],
  templateUrl: './servo-control.component.html',
  styleUrls: [
    '/node_modules/@swimlane/ngx-datatable/index.css',
    '/node_modules/@swimlane/ngx-datatable/themes/material.css',
    '/node_modules/@swimlane/ngx-datatable/assets/icons.css',
    './servo-control.component.scss'
  ]
})
export class ServoControlComponent implements OnInit, OnDestroy {
  leftLegServos: ServoResource[] = [
    { id: 1, angle: 90 },
    { id: 2, angle: 90 },
    { id: 3, angle: 90 },
    { id: 4, angle: 90 }
  ];
  rightLegServos: ServoResource[] = [
    { id: 5, angle: 90 },
    { id: 6, angle: 90 },
    { id: 7, angle: 90 },
    { id: 8, angle: 90 }
  ];
  huckleServos: ServoResource[] = [
    { id: 9, angle: 90 },
    { id: 10, angle: 90 }
  ];
  leftArmServos: ServoResource[] = [
    { id: 11, angle: 90 },
    { id: 12, angle: 90 },
    { id: 13, angle: 90 }
  ];
  rightArmServos: ServoResource[] = [
    { id: 14, angle: 90 },
    { id: 15, angle: 90 },
    { id: 16, angle: 90 }
  ];

  // Definir los IDs de los movimientos
  advanceMovementId: number = 6;
  turnRightMovementId: number = 5;
  turnLeftMovementId: number = 4;

  controlConnectionState: WebSocketState = WebSocketState.DISCONNECTED;
  controlConnectionStateSub: Subscription | null = null;

  //selectedMovementId: number = -1; // Inicializado a -1 para evitar el tipo null
  selectedMovement: MovementResource | null = null; // Inicializado como null para evitar errores
  newMovementName: string = '';
  movements: MovementResource[] = [];
  positions: any[] = []; // Ajuste aquí
  selectedPosition: any[] = []; // Ajuste aquí
  time:number = 500;

  columns = [
    //{ prop: 'id', name: 'ID', width: 60, sortable: false },
    { prop: 'order', name: 'Order', width: 60, sortable: false },
    { prop: 'time', name: 'Time', width: 60, sortable: false },
    ...Array.from({ length: 16 }, (_, i) => ({ prop: `servo${i + 1}`, name: `ID: ${i + 1}`, width: 60, sortable: false }))
  ];  
  

  constructor(private webSocketService: WebSocketService) { }

  ngOnInit(): void {
    this.controlConnectionStateSub = this.webSocketService.controlConnectionState$.subscribe(state => {
      this.controlConnectionState = state;
      if (state === WebSocketState.DISCONNECTED || state === WebSocketState.FAILED) {
        this.resetServosToDefault();
      } else if (state === WebSocketState.CONNECTED) {
        this.loadServos();
        this.loadMovements();
      }
    });
  }

  ngOnDestroy(): void {
    this.controlConnectionStateSub?.unsubscribe();
  }

  // Escucha de eventos de teclado
  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    switch (event.key) {
      case 'ArrowDown':
        this.moveToInitialPosition();
        break;
      case 'ArrowUp':
        this.executeMovementForId(this.advanceMovementId);
        break;
      case 'ArrowLeft':
        this.executeMovementForId(this.turnLeftMovementId);
        break;
      case 'ArrowRight':
        this.executeMovementForId(this.turnRightMovementId);
        break;
      default:
        break;
    }
  }

  // Ejecutar el movimiento
  executeMovementForId(movementId: number) {
    this.webSocketService.executeMovement(movementId).then(response => {
      if (response.error) {
        console.log(response.error.message);
      } else {
        console.log(response.payload.message);
        this.loadServos();
      }
    }).catch(error => {
      console.error('Error al ejecutar el movimiento:', error);
    });
  }

  loadServos() {
    this.webSocketService.getAllServos().then(response => {
      if (response.error) {
        console.log(response.error.message);
      } else {
        console.log(response.payload);
        const servos = response.payload.content;
        this.leftLegServos = servos.filter((servo: ServoResource) => servo.id >= 1 && servo.id <= 4);
        this.rightLegServos = servos.filter((servo: ServoResource) => servo.id >= 5 && servo.id <= 8);
        this.huckleServos = servos.filter((servo: ServoResource) => servo.id >= 9 && servo.id <= 10);
        this.leftArmServos = servos.filter((servo: ServoResource) => servo.id >= 11 && servo.id <= 13);
        this.rightArmServos = servos.filter((servo: ServoResource) => servo.id >= 14 && servo.id <= 16);
      }
    }).catch(error => {
      console.error('Error al obtener los servos:', error);
    });
  }

  loadMovements() {
    this.webSocketService.getAllMovements().then(response => {
      if (response.error) {
        console.log(response.error.message);
      } else {
        this.movements = response.payload.content;
      }
    }).catch(error => {
      console.error('Error al obtener los movimientos:', error);
    });
  }

  resetServosToDefault() {
    this.leftLegServos.forEach((servo: ServoResource) => servo.angle = 90);
    this.rightLegServos.forEach((servo: ServoResource) => servo.angle = 90);
    this.leftArmServos.forEach((servo: ServoResource) => servo.angle = 90);
    this.rightArmServos.forEach((servo: ServoResource) => servo.angle = 90);
    this.huckleServos.forEach((servo: ServoResource) => servo.angle = 90);
  }

  updateServo(servo: ServoResource) {
    const request: UpdateServoRequest = { id: servo.id, angle: servo.angle };
    if (this.controlConnectionState === WebSocketState.CONNECTED) {
      this.webSocketService.updateServo(request).then(response => {
        if (response.error) {
          console.log(response.error.message);
        } else {
          console.log(response.payload);
        }
      }).catch(error => {
        console.error('Error al actualizar el servo:', error);
      });
    } else {
      this.resetServosToDefault(); // Asegura que el ángulo vuelva a 90 si no está conectado
    }
  }

  createMovement() {
    const request: CreateMovementRequest = { name: this.newMovementName };
    this.webSocketService.createMovement(request).then(response => {
      if (response.error) {
        console.log(response.error.message);
      } else {
        console.log('Movimiento creado:', response.payload);
        const newMovement: MovementResource = response.payload;
        this.movements.push(newMovement);
        this.selectedMovement = newMovement;
        this.newMovementName = "";
        this.positions = [];
      }
    }).catch(error => {
      console.error('Error al crear el movimiento:', error);
    });
  }

  updateMovement() {
    if (this.selectedMovement) {
      const request: UpdateMovementRequest = { id: this.selectedMovement.id, name: this.newMovementName };
      this.webSocketService.updateMovement(request).then(response => {
        if (response.error) {
          console.log(response.error.message);
        } else {
          console.log('Movimiento actualizado:', response.payload);
          this.loadMovements(); // Refresca la lista de movimientos
          this.newMovementName = "";
        }
      }).catch(error => {
        console.error('Error al actualizar el movimiento:', error);
      });
    }
  }

  deleteMovement() {
    if (this.selectedMovement) {
      this.webSocketService.deleteMovement(this.selectedMovement.id).then(response => {
        if (response.error) {
          console.log(response.error.message);
        } else {
          console.log('Movimiento eliminado:', response.payload);
          this.loadMovements(); // Refresca la lista de movimientos
          this.selectedMovement = null;
          this.positions = [];
        }
      }).catch(error => {
        console.error('Error al eliminar el movimiento:', error);
      });
    }
  }

  createPosition() {
    if (this.selectedMovement) {
      const angles = [
        ...this.leftLegServos,
        ...this.rightLegServos,
        ...this.huckleServos,
        ...this.leftArmServos,
        ...this.rightArmServos
      ];
      const request: CreatePositionRequest = { time: this.time, angles, movement_id: this.selectedMovement.id };
      console.log(request)
      this.webSocketService.createPosition(request).then(response => {
        if (response.error) {
          console.log(response.error.message);
        } else {
          console.log('Posición creada:', response.payload);
          this.loadPositions(); // Refresca la lista de posiciones
          this.selectedPosition = []; // Restablecer la selección
        }
      }).catch(error => {
        console.error('Error al crear la posición:', error);
      });
    }
  }

  updatePosition() {
    if (this.selectedMovement && this.selectedPosition.length > 0) {
      const angles = [
        ...this.leftLegServos,
        ...this.rightLegServos,
        ...this.huckleServos,
        ...this.leftArmServos,
        ...this.rightArmServos
      ];
      const request: UpdatePositionRequest = { id: this.selectedPosition[0].id, time: this.time, angles };
      this.webSocketService.updatePosition(request).then(response => {
        if (response.error) {
          console.log(response.error.message);
        } else {
          console.log('Posición actualizada:', response.payload);
          this.loadPositions(); // Refresca la lista de posiciones
          this.selectedPosition = []; // Restablecer la selección
        }
      }).catch(error => {
        console.error('Error al actualizar la posición:', error);
      });
    }
  }

  movePositionUp() {
    if (this.selectedMovement && this.selectedPosition.length > 0) {
      console.log(this.selectedPosition[0].id)
      this.webSocketService.movePositionUp(this.selectedPosition[0].id).then(response => {
        if (response.error) {
          console.log(response.error.message);
        } else {
          console.log('Posición actualizada:', response.payload);
          this.loadPositions(); // Refresca la lista de posiciones
          this.selectedPosition = []; // Restablecer la selección
        }
      }).catch(error => {
        console.error('Error al actualizar la posición:', error);
      });
    }
  }

  movePositionDown() {
    if (this.selectedMovement && this.selectedPosition.length > 0) {
      this.webSocketService.movePositionDown(this.selectedPosition[0].id).then(response => {
        if (response.error) {
          console.log(response.error.message);
        } else {
          console.log('Posición actualizada:', response.payload);
          this.loadPositions(); // Refresca la lista de posiciones
          this.selectedPosition = []; // Restablecer la selección
        }
      }).catch(error => {
        console.error('Error al actualizar la posición:', error);
      });
    }
  }

  deletePosition() {
    if (this.selectedPosition.length > 0) {
      this.webSocketService.deletePosition(this.selectedPosition[0].id).then(response => {
        if (response.error) {
          console.log(response.error.message);
        } else {
          console.log('Posición eliminada:', response.payload);
          this.loadPositions(); // Refresca la lista de posiciones
          this.selectedPosition = []; // Restablecer la selección
        }
      }).catch(error => {
        console.error('Error al eliminar la posición:', error);
      });
    }
  }

  loadPositions() {
    if (this.selectedMovement) {
      this.webSocketService.getPositionsByMovementId(this.selectedMovement.id).then(response => {
        if (response.error) {
          console.log(response.error.message);
        } else {
          this.positions = response.payload.content.map((position: PositionResource) => {
            const positionWithServos: any = { ...position };
            position.angles.forEach(angle => {
              positionWithServos[`servo${angle.id}`] = angle.angle;
            });
            console.log(positionWithServos)
            return positionWithServos;
          });
        }
      }).catch(error => {
        console.error('Error al obtener las posiciones:', error);
      });
    } 
  }

  saveInitialPosition(){
    this.webSocketService.saveInitialPosition().then(response => {
      if (response.error) {
        console.log(response.error.message);
      } else {
        console.log(response.payload.message);
      }
    }).catch(error => {
      console.error('Error al actualizar el servo:', error);
    });
  }
  
  executeMovement(){
    if (this.selectedMovement) {
      this.webSocketService.executeMovement(this.selectedMovement.id).then(response => {
        if (response.error) {
          console.log(response.error.message);
        } else {
          console.log(response.payload.message);
          this.loadServos();
        }
      }).catch(error => {
        console.error('Error al obtener las posiciones:', error);
      });
    } 
  }

  moveToInitialPosition(){
    this.webSocketService.moveToInitialPosition().then(response => {
      if (response.error) {
        console.log(response.error.message);
      } else {
        console.log(response.payload.message);
        this.loadServos();
      }
    }).catch(error => {
      console.error('Error al eliminar el movimiento:', error);
    });
  }

  moveToPositionById(){
    if (this.selectedPosition.length > 0) {
      this.webSocketService.moveToPositionById(this.selectedPosition[0].id).then(response => {
        if (response.error) {
          console.log(response.error.message);
        } else {
          console.log('Posición Movido:', response.payload);
          const servos = response.payload.content;
          this.leftLegServos = servos.filter((servo: ServoResource) => servo.id >= 1 && servo.id <= 4);
          this.rightLegServos = servos.filter((servo: ServoResource) => servo.id >= 5 && servo.id <= 8);
          this.huckleServos = servos.filter((servo: ServoResource) => servo.id >= 9 && servo.id <= 10);
          this.leftArmServos = servos.filter((servo: ServoResource) => servo.id >= 11 && servo.id <= 13);
          this.rightArmServos = servos.filter((servo: ServoResource) => servo.id >= 14 && servo.id <= 16);

          this.selectedPosition = []; // Restablecer la selección
        }
      }).catch(error => {
        console.error('Error al eliminar la posición:', error);
      });
    }
  }

  downloadSelectedPositionsAsJson() {
    if (this.selectedMovement && this.positions.length > 0) {
      // Crear un objeto JSON con las posiciones seleccionadas, eliminando la propiedad "angles"
      const filteredPositions = this.positions.map(position => {
        const { angles, ...rest } = position; // Desestructuración para excluir 'angles'
        return rest;
      });
  
      // Convertir el objeto filtrado a JSON
      const dataStr = JSON.stringify(filteredPositions, null, 2);
  
      // Crear un elemento de anclaje temporal para la descarga
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${this.selectedMovement.name}.json`;
      document.body.appendChild(a);
      a.click();
  
      // Limpiar el DOM
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } else {
      console.log('No hay posiciones disponibles para descargar.');
    }
  }
  
  
  onSelect(event: any) {
    if (event.type === 'click') {
      this.selectedPosition = [event.row];
    }
  }
}