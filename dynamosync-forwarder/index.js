const request = require('request');

exports.handler = function(e, ctx, cb) {
  e.tableName = process.env.TABLE_NAME;
  request(`${process.env.URL}/__DYNAMO_SYNC__`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(e)
  }, cb);
};

