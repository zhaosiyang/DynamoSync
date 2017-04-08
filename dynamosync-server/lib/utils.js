'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.parseDynamodbArn = parseDynamodbArn;
function parseDynamodbArn(arn) {
  var tableName = arn.slice(arn.lastIndexOf('/') + 1);
  var region = arn.split(':')[3];
  return { tableName: tableName, region: region };
}