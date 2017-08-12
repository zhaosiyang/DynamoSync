# DynamoSync

### Demo link (http://dynamosync-demo.zhaosiyang.com)
### Demo repo (https://github.com/zhaosiyang/DynamoSync-demo)

### What is DynamoSync?
Dynamosync is a package that allows developer to bind DynamoDB with frontend variable in Angular so that the frontend variable reflects the immediate state of DynamoDB tables. (You can think of it as a light "Firebase" of DynamoDB)

### Prerequisite
Currently DynamoSync only support stack of Angular2 + NodeJS

### Using 3 packages to set up 
##### (Don't be scared, you have no idea how easy it is)
1. dynamosync-server
2. ng-dynamosync
3. forwarder

### Installation
In the server side (NodeJS):
``` npm install dynamosync-server --save ```
In the client side (Angular2):
``` npm install ng-dynamosync --save```
Also, you will need to create AWS lambda from the zip file, for downloading the zip file, you can either go to (https://github.com/zhaosiyang/DynamoSync/tree/master/dynamosync-forwarder) to download the zip file or just download using:
```npm install forwarder``` and get the zip file from your node_modules

### Get Started
#### Step1: Creating AWS Lambda:
 ##### step1.1: create a Lambda by uploading the forwarder zip file 
 ##### step1.2: add two environment variables: 
    - TABLE_NAME  (Your DynamoDB table name)
    - URL  (Your NodeJS server URL, e.g. 12.345.6.789:8080)
 ##### step1.3: Connect DynamoDB table with the lambda function by setting a trigger in AWS console so that any updates on the specified table will trigger the lambda function you have just set.

#### Step2: Server side (NodeJS + Express):
##### step2.1:  import Dynamosync class
```import {DynamoSync} from 'dynamosync-server';```
##### step2.2: configure app object
```DynamoSync.configApp(app);```
##### step2.3: configure server
```
DynamoSync.configIO(server,['arn:aws:dynamodb:us-west-2:**********:table/ShoppingList']);
```
Please note that the second parameter is an array of string, each string is the ARN of the DynamoDB table you want to use. (order does NOT matter)
#### Step3: Client side (Angular2):
##### step3.1: import NgDynamoSync class
```
import {NgDynamoSync} from "ng-dynamosync";
```
##### step3.2: bind variables
```
const subscription1 = new NgDynamoSync('ShoppingList',this.serverDomain).bindToListModel(this.shoppingItems);
```
}
#### You are done!
By doing the above steps, you have successfully binded the Angular variable this.shoppingItems to the documents of the table ShoppingList in DynamoDB

#### if you have more questions, feel free to get help by emailing to kern_zhao@126.com
