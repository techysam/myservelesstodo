import * as AWS  from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import {createLogger} from '../utils/logger'

const logger = createLogger('datalayer');

const XAWS = AWSXRay.captureAWS(AWS)

import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate'

export class TodoAccess {

  constructor(
    private readonly docClient: DocumentClient = createDynamoDBClient(),
    private readonly S3 = createS3Bucket(),
    private readonly todosTable = process.env.TODOS_TABLE,
    private readonly indexName = process.env.USER_ID_INDEX,
    private readonly bucketName = process.env.IMAGES_S3_BUCKET,
    private readonly urlExpiration = process.env.SIGNED_URL_EXPIRATION) {
  }

  async getAllTodes(userId: string): Promise<TodoItem[]> {
    console.log('Getting all Todes')


  const result = await this.docClient.query({
    TableName: this.todosTable,
    IndexName: this.indexName,
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: {
          ':userId': userId
      }
  	}, (err, data) => {
      err?logger.info("Query failed", err):logger.info('Query succeeded', data);
    }).promise();
    const items = result.Items
    return items as TodoItem[]
  }

  async createTodo(todo: TodoItem): Promise<TodoItem> {
    await this.docClient.put({
      TableName: this.todosTable,
      Item: todo
    }, (err, data) => {
      err?logger.info("Insertion failed", err):logger.info('Insertion succeeded', data);
    }).promise();

    return todo
  }
  async deleteTodo(todoId: string, userId: string) {
  	await this.docClient.delete({
  		TableName: this.todosTable,
      Key: {userId, todoId}
  	}, (err, data) => {
      err?logger.info("Deletion failed", err):logger.info('Deleteion succeeded', data);
    }).promise();
  	return {};
  }
  async updateTodo(userId: string, todoId: string, updatedTodo: TodoUpdate) {
    
    await this.docClient.update({
    TableName:this.todosTable,
    Key:{ userId, todoId},
    ExpressionAttributeNames: {"#N": "name"},
    UpdateExpression: "set #N=:todoName, dueDate=:dueDate, done=:done",
    ExpressionAttributeValues:{
        ":todoName": updatedTodo.name,
        ":dueDate": updatedTodo.dueDate,
        ":done": updatedTodo.done
    },
    ReturnValues:"UPDATED_NEW"
    }, (err, data) => {
      err?logger.info("Update failed", err):logger.info('Update succeeded', data);
    }).promise();
    return {};
  }
  async generateUploadUrl(todoId: string, userId: string): Promise<string>{
     const uploadUrl = this.S3.getSignedUrl('putObject', {
       Bucket: this.bucketName,
       Key: todoId,
       Expires: this.urlExpiration
     })
     await this.docClient.update({
      TableName:this.todosTable,
      Key:{ userId, todoId},
      UpdateExpression: "set attachmentUrl=:URL",
      ExpressionAttributeValues:{
          ":URL": uploadUrl.split("?")[0]
      },
      ReturnValues:"UPDATED_NEW"
      }, (err, data) => {
        err?logger.info("Update URL failed", err):logger.info("GenerateURL and Update attachement URL", data);
      }).promise();

     return uploadUrl; 
  }
}

function createDynamoDBClient() {
  if (process.env.IS_OFFLINE) {
    console.log('Creating a local DynamoDB instance')
    return new XAWS.DynamoDB.DocumentClient({
      region: 'localhost',
      endpoint: 'http://localhost:8000'
    })
  }
  return new XAWS.DynamoDB.DocumentClient()
}

function createS3Bucket(){
  return new XAWS.S3({
  signatureVersion: 'v4'
})
}