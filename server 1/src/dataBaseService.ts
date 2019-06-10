import * as mySql from "mysql"
import * as jwt from "jsonwebtoken";

import { User } from "./types/user";
import { RedisService } from "./redisService";
import { Response } from "express";


export class DataBaseService {

    connection: mySql.Connection = mySql.createConnection({
        host: "localhost",
        user: "root",
        password: "1234",
        database: "whatsapp",
    });
    redisService: RedisService;

    constructor(redisService: RedisService) {
        this.redisService = redisService
        this.init()
    }

    init() {
        console.log(`start init from DataBaseService`)
        this.connection.connect((error) => {
            if (error) {
                console.log(`error connection to mysql DB the error message : ${error.message}`);
                console.log(`error connection to mysql DB the error stack : ${error.stack}`);
            }
            else {
                console.log("Connected!");
                // this.login(new User('adam', '123132')).then((resolve) => {
                //     console.log(`login Succeeded the resolve : ${resolve}`)
                // }, (reject) => {
                //     console.log(`login faild the reject : ${reject}`)
                // })
            }
        })
    }

    login(user: User): Promise<string> {
        return new Promise((resolve, reject) => {
            let isValide = this.userValidate(user);
            console.log(`the result from userValidator : ${isValide}`)
            if (isValide) {
                console.log(`start login DB`)
                console.log(user.name)
                let sql = `SELECT * FROM whatsapp.users WHERE name='${user.name}' AND password='${user.password}'`
                console.log(sql)
                this.connection.query(sql, (error, results) => {
                    if (error) {
                        console.log(`error!! from DB login the error message : ${error.message}`);
                        return reject(`the user name :  ${user.name} or password ${user.password} not exists`);
                    }
                    if (results) {
                        //Convert user name from string to jwt(json web token)
                        let token = jwt.sign({ username: user.name }, 'shhhhh');
                        //Insert the token = key and value = user name
                        this.redisService.redisClient.set(token, user.name);
                        console.log(`from api login token value ${token}`);
                        return resolve(token);
                    } else {
                        return reject(`the user name :  ${user.name} or password ${user.password} not exists`);
                    }
                });
            } else {
                return reject(`the user name or password not validate`);
            }
        })
    }

    registration(user: User, response: Response) {
        if (this.userValidate(user)) {
            if (this.nameExsist(user.name)) {

                let sql = 'INSERT INTO  users SET ?'
                this.connection.query(sql, [{ 'name': user.name }, { 'password': user.password }], (error, results) => {
                    // if return error from sql api
                    if (error) console.log(`error!! from DB registration the error message : ${error.message}`);

                    if (results) {
                        response.setHeader('Content-Type', 'text/html');
                        response.status(200)
                        response.send(`Registration successfully passed`)
                    }
                });
            } else {
                console.log(`error!! from registration the user name alredy exists ${user.name}`)
                response.status(404)
                response.send(`user alredy exists`)

            }
        } else {
            console.log(`error!! from registration the user not valide ${user}`)
            response.status(404)
            response.send(`user not valide`)
        }
    }

    userValidate(user: User): boolean {
        if (!user.name || user.name.length < 3) {
            return false
        }
        if (!user.password || user.password.length < 3) {
            return false
        }
        return true
    }

    // the user.name must be UNIQUE this method check thet 
    nameExsist(name: string): boolean {

        console.log(`start name exsist`)
        console.log(name)
        let sql = `SELECT * FROM users WHERE users.name=?`
        this.connection.query(sql, [name], (error, results, fields) => {

            if (error) {
                console.log(`error from nameExsist DB error message : ${error.message}`)
                return null;
            }
            if (results) {
                console.log('the result : ', results)
                console.log(`the result[0] : ${results[0]}`)
                if (!results[0]) {
                    return true;
                }
            }
        })
        return false;
    }

    selectAll() {
        let sql = 'SELECT * FROM users'
        this.connection.query(sql, (error, results, fields) => {

            if (error) {
                console.log(`error from selectAll DB error message : ${error.message}`)
            }
            if (results) {
                console.log('the result : ', results)
            }
        })
    }

    createTable() {
        console.log(`try create table`)
        let sql = "CREATE TABLE users (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(50) NOT NULL , password VARCHAR(50) NOT NULL , CONSTRAINT UC_Person UNIQUE (name))";
        this.connection.query(sql, (error, result) => {
            if (error) {
                console.log(`error!! from createTable error message ${error.message}`)
            }
            if (result) {
                console.log("Table created");
            }
        });
    }
}