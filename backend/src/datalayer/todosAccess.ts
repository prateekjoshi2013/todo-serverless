import * as AWS  from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate'
import { ImageUrl } from '../models/ImageUrl'

const XAWS = AWSXRay.captureAWS(AWS)

const imagesTable = process.env.IMAGES_S3_BUCKET
const urlExpiration =  process.env.SIGNED_URL_EXPIRATION
const s3 = new XAWS.S3({
  signatureVersion: 'v4'
})
export class TodoItemAccess {

  constructor(
    private readonly docClient: DocumentClient = createDynamoDBClient(),
    private readonly todosTable = process.env.TODOS_TABLE) {
  }

  async deleteTodo(userId:string,todoId:string):Promise<any>{
    console.log('deleting items with :',todoId);
   try{
    const deleteData= await this.docClient.delete({
      TableName: this.todosTable,
      Key:{
        'userId': userId,
        'todoId': todoId
      }
    }).promise();
    console.log('deleting......',deleteData);
    return deleteData;
   }catch(e){
    console.log('deleting......',e);
      return e;
   }
  }

  async updateTodo(userId:string ,todoId: string,todoUpdate: TodoUpdate):Promise<any>{
    console.log('updating items with name :',todoUpdate.name);
   try{
    const updateData= await this.docClient.update(
      {
        TableName:this.todosTable,
        Key:{
            "userId": userId,
            "todoId": todoId
        },
        UpdateExpression: "set done = :done",
        ExpressionAttributeValues:{
            ":done":todoUpdate.done
        },
        ReturnValues:"UPDATED_NEW"
    }).promise();
    console.log('updated data',updateData);
    return updateData;
   }catch(e){
    console.log('updated data',e);
      return e;
   }
  }

  async getAllTodos(userId:string): Promise<TodoItem[]> {
    console.log('Getting all todos for user:',userId);

    const result = await this.docClient.query({
      TableName: this.todosTable,
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: {
          ":userId": userId
      }
  }).promise()

    const items = result.Items
    return items as TodoItem[]
  }

  async createTodo(todo: TodoItem): Promise<TodoItem> {
    await this.docClient.put({
      TableName: this.todosTable,
      Item: todo
    }).promise()

    return todo
  }

  async generateUploadUrl(userId:string,todoId:string,imageId:string): Promise<ImageUrl> {
    try{
      const uploadUrl=this.getUploadUrl(imageId);
      const updateData= await this.docClient.update(
        {
          TableName:this.todosTable,
          Key:{
              "userId": userId,
              "todoId": todoId
          },
          UpdateExpression: "set attachmentUrl = :attachmentUrl",
          ExpressionAttributeValues:{
              ":attachmentUrl":`https://${imagesTable}.s3.amazonaws.com/${imageId}`
          },
          ReturnValues:"UPDATED_NEW"
      }).promise();
      console.log('updated data',updateData);
      return Promise.resolve({uploadUrl});
     }catch(e){
      console.log('updated data',e);
     }
  }

  getUploadUrl(imageId: string) {
    return s3.getSignedUrl('putObject', {
      Bucket: imagesTable,
      Key: imageId,
      Expires: urlExpiration
    })
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
