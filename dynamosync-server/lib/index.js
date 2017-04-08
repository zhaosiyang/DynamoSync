'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DynamoSync = undefined;

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _dynamodbMarshaler = require('dynamodb-marshaler');

var _utils = require('./utils');

var _awsSdk = require('aws-sdk');

var AWS = _interopRequireWildcard(_awsSdk);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var socketio = require('socket.io');

var DynamoSync = exports.DynamoSync = function () {
  function DynamoSync() {
    (0, _classCallCheck3.default)(this, DynamoSync);
  }

  (0, _createClass3.default)(DynamoSync, null, [{
    key: 'configIO',
    value: function configIO(server, tableArns) {
      var _this = this;

      this._printParsingArnResult(tableArns);
      this.io = socketio(server);
      tableArns.forEach(function (arn) {
        _this._registerTable(arn);
      });
    }
  }, {
    key: 'configApp',
    value: function configApp(app) {
      app.use('/__DYNAMO_SYNC__', this.middleware);
    }
  }, {
    key: '_printParsingArnResult',
    value: function _printParsingArnResult(tableArns) {
      console.info('ARN parsing result: ');
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = (0, _getIterator3.default)(tableArns), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var arn = _step.value;

          var _parseDynamodbArn = (0, _utils.parseDynamodbArn)(arn),
              tableName = _parseDynamodbArn.tableName,
              region = _parseDynamodbArn.region;

          console.info('Table: ' + tableName + ' region: ' + region);
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }
    }
  }, {
    key: 'getDynamodbObjectByRegion',
    value: function getDynamodbObjectByRegion(region) {
      this.dynamodbObjects = this.dynamodbObjects || {};
      if (this.dynamodbObjects[region]) {
        return this.dynamodbObjects[region];
      } else {
        this.dynamodbObjects[region] = new AWS.DynamoDB({ region: region });
        return this.dynamodbObjects[region];
      }
    }
  }, {
    key: '_registerTable',
    value: function _registerTable(arn) {
      var _this2 = this;

      var _parseDynamodbArn2 = (0, _utils.parseDynamodbArn)(arn),
          tableName = _parseDynamodbArn2.tableName,
          region = _parseDynamodbArn2.region;

      this.tableToEmitter = this.tableToEmitter || {};
      this.tableToEmitter[tableName] = this._createEmitter(tableName);
      this.tableToEmitter[tableName].on('connection', function (socket) {
        _this2.getDynamodbObjectByRegion(region).scan({ TableName: tableName }, function (err, data) {
          if (err) {
            socket.emit('init-error', err);
          } else {
            var items = data.Items.map(_dynamodbMarshaler.unmarshalItem);
            socket.emit('init-success', items);
          }
        });
      });
    }
  }, {
    key: '_IO',
    value: function _IO() {
      if (!this.io) {
        throw new Error('Please call configIO at the beginning');
      } else {
        return this.io;
      }
    }
  }, {
    key: '_createEmitter',
    value: function _createEmitter(tableName) {
      return this._IO().of('/' + tableName);
    }
  }, {
    key: '_isTableRegistered',
    value: function _isTableRegistered(tableName) {
      return this.tableToEmitter && !!this.tableToEmitter[tableName];
    }
  }, {
    key: 'emitPayload',
    value: function emitPayload(tableName, payload) {
      if (!this._isTableRegistered(tableName)) {
        throw Error('Table: ' + tableName + ' not registered');
      }
      this.tableToEmitter[tableName].emit('message', payload);
    }
  }, {
    key: '_unmarshal',
    value: function _unmarshal(item) {
      if (item.dynamodb) {
        var fields = ['Keys', 'NewImage', 'OldImage'];
        fields.forEach(function (field) {
          if (item.dynamodb[field]) {
            item.dynamodb[field] = (0, _dynamodbMarshaler.unmarshalItem)(item.dynamodb[field]);
          }
        });
      }
      return item;
    }
  }, {
    key: 'middleware',
    value: function middleware(req, res, next) {
      req.body.Records.map(DynamoSync._unmarshal).forEach(function (record) {
        DynamoSync.emitPayload(req.body.tableName, record);
      });
      res.end();
    }
  }]);
  return DynamoSync;
}();