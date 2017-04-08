const socketio = require('socket.io');
import {unmarshalItem} from 'dynamodb-marshaler';
import {parseDynamodbArn} from './utils';
import * as AWS from 'aws-sdk';

export class DynamoSync {

  static configIO(server, tableArns) {
    this._printParsingArnResult(tableArns);
    this.io = socketio(server);
    tableArns.forEach(arn => {
      this._registerTable(arn);
    });
  }

  static configApp(app) {
    app.use('/__DYNAMO_SYNC__', this.middleware);
  }

  static _printParsingArnResult(tableArns) {
    console.info('ARN parsing result: ');
    for (let arn of tableArns) {
      let {tableName, region} = parseDynamodbArn(arn);
      console.info(`Table: ${tableName} region: ${region}`);
    }
  }

  static getDynamodbObjectByRegion(region) {
    this.dynamodbObjects = this.dynamodbObjects || {};
    if (this.dynamodbObjects[region]) {
      return this.dynamodbObjects[region];
    }
    else {
      this.dynamodbObjects[region] = new AWS.DynamoDB({region});
      return this.dynamodbObjects[region];
    }
  }

  static _registerTable(arn) {
    const {tableName, region} = parseDynamodbArn(arn);
    this.tableToEmitter = this.tableToEmitter || {};
    this.tableToEmitter[tableName] = this._createEmitter(tableName);
    this.tableToEmitter[tableName].on('connection', socket => {
      this.getDynamodbObjectByRegion(region).scan({TableName: tableName}, (err, data) => {
        if (err) {
          socket.emit('init-error', err);
        }
        else {
          const items = data.Items.map(unmarshalItem);
          socket.emit('init-success', items);
        }
      });
    });
  }

  static _IO() {
    if (!this.io) {
      throw new Error('Please call configIO at the beginning');
    }
    else {
      return this.io;
    }
  }

  static _createEmitter(tableName) {
    return this._IO().of('/' + tableName);
  }

  static _isTableRegistered(tableName) {
    return this.tableToEmitter && !!this.tableToEmitter[tableName];
  }

  static emitPayload(tableName, payload) {
    if (!this._isTableRegistered(tableName)) {
      throw Error(`Table: ${tableName} not registered`);
    }
    this.tableToEmitter[tableName].emit('message', payload);
  }

  static _unmarshal(item) {
    if (item.dynamodb) {
      const fields = ['Keys', 'NewImage', 'OldImage'];
      fields.forEach(field => {
        if (item.dynamodb[field]) {
          item.dynamodb[field] = unmarshalItem(item.dynamodb[field]);
        }
      });
    }
    return item;
  }

  static middleware(req, res, next) {
    req.body.Records.map(DynamoSync._unmarshal).forEach(record => {
      DynamoSync.emitPayload(req.body.tableName, record);
    });
    res.end();
  }

}