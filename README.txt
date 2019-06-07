# websocket-node-express
A simple implementation of a Websocket server based on node/express written in typescript



							chatApp

the application allows to client they are connected to be online user and to chat with other online clients

the application can run on cluster ,
the apps communicate with pubsub redis DB - for example you can run two servers(server1 and server2) and to see the apps communicate 


platforms i've used in this project:

node.js server side 
angular7 client side 
redis NO-SQL DB 

on each server folder you have the angular project on web folder (alredy compiling from angular to index.html) path request to get index html is base url of the project
 
who to run this app?
opne folder server1/server2 in IDE 

Terminal command:

Server side
1. npm install – for install all dependency 
2. npm run build – compiling from .ts to .js
3. copy the web folder (and everything inside the folder) to dist/server folder (where are all TS files)
4. npm start – to run the app 

Client side 
1. npm install – for install all dependency
2. ng serve to run the app with angular-cli  
