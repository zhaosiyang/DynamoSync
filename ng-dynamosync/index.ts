import Socket = SocketIOClient.Socket;
import {Observable, Observer, Subscription} from 'rxjs';
import * as io from 'socket.io-client';

export interface InsertedItem {
  eventName: EventName;
  Keys: any;
  NewImage: any;
}

export interface ModifiedItem {
  eventName: EventName;
  Keys: any;
  OldImage: any;
  NewImage: any;
}

export interface DeletedItem {
  eventName: EventName;
  Keys: any;
}

export interface InitItems {
  eventName: EventName;
  Items: Array<any>;
}

export enum EventName
{
  INIT = <any> 'INIT',
  INSERT = <any>'INSERT',
  MODIFY = <any>'MODIFY',
  REMOVE = <any>'REMOVE',
}

export class NgDynamoSync {

  private socket: Socket;
  private url: string;
  private observable: Observable<any>;
  private allowedEventNames: EventName[] = [EventName.INSERT, EventName.MODIFY, EventName.REMOVE, EventName.INIT];
  private shouldSimplifyItem = true;

  constructor(tableName, serverDomain='') {
    this.url = `${serverDomain}/${tableName}`;
    this.socket = io(this.url);
  }

  get obs() {
    if (!this.observable) {
      this.observable = Observable.create((observer: Observer<any>) => {
        this.socket.on('message', data => {
          observer.next(data);
        });
        this.socket.on('init-success', data => {
          observer.next(data);
        });
        this.socket.on('init-error', err => {
          observer.error(err);
        });
      });
    }
    return this.observable.filter(sub => !!sub);
  }

  notSimplifyItem() {
    this.shouldSimplifyItem = false;
    return this;
  }

  simplifyItem() {
    this.shouldSimplifyItem = true;
    return this;
  }

  onlyAllowEventNames(...eventNames: EventName[]) {
    this.allowedEventNames = eventNames.slice();
    return this;
  }

  toObservable(): Observable<any> {
    let observable = this.obs.filter(record => {
      return (record && record.eventName === undefined) || this.allowedEventNames.indexOf(record.eventName) >= 0;
    });

    if (this.shouldSimplifyItem) {
      observable = observable.map(NgDynamoSync.simplifyRecordsMapper);
    }
    return observable;
  }

  bindToListModel(list: any[]): Subscription {
    return this.toObservable().subscribe(record => {
      switch (record.eventName) {
        case EventName.INIT:
          this.replaceArray(list, record.Items);
          break;
        case EventName.INSERT:
          list.push(record.NewImage);
          break;
        case EventName.REMOVE:
          let index = this.findIndexFromArrayByKeys(list, record.Keys);
          list.splice(index, 1);
          break;
        case EventName.MODIFY:
          index = this.findIndexFromArrayByKeys(list, record.Keys);
          list[index] = record.NewImage;
      }
    })
  }

  private findIndexFromArrayByKeys(list: any[], keyObject: any): number {
    const keys = Object.keys(keyObject);
    for (let i = 0; i < list.length; i++) {
      let valid = true;
      for (let key of keys) {
        if (keyObject[key] !== list[i][key]) {
          valid = false;
          break;
        }
      }
      if (valid) {
        return i;
      }
    }
    return -1;
  }

  private replaceArray(oldArray: Array<any>, newArray: Array<any>) {
    while (oldArray.length > 0) {
      oldArray.pop();
    }
    for(let i = 0; i < newArray.length; i++) {
      oldArray.push(newArray[i]);
    }
  }


  private static simplifyRecordsMapper(record): InsertedItem | ModifiedItem | DeletedItem | InitItems {
    switch (record.eventName) {
      case 'INSERT':
        return {eventName: record.eventName, Keys: record.dynamodb.Keys, NewImage: record.dynamodb.NewImage};
      case 'MODIFY':
        return {eventName: record.eventName, Keys: record.dynamodb.Keys, NewImage: record.dynamodb.NewImage, OldImage: record.dynamodb.OldImage};
      case 'REMOVE':
        return {eventName: record.eventName, Keys: record.dynamodb.Keys};
      // undefined which is 'INIT'
      default:
        return {eventName: EventName.INIT, Items: record};
    }
  }
}

