export function parseDynamodbArn(arn) {
  const tableName = arn.slice(arn.lastIndexOf('/') + 1);
  const region = arn.split(':')[3];
  return {tableName, region};
}