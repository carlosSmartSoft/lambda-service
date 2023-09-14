import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, PutCommand, GetCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";

// Crear una instancia del cliente DynamoDB
const client = new DynamoDBClient({});
// Crear una instancia del cliente DynamoDB Document
const dynamo = DynamoDBDocumentClient.from(client);
// Nombre de la tabla DynamoDB que se utilizará
const tableName = "Service";

/**
 * Función Lambda para gestionar operaciones CRUD en una tabla DynamoDB llamada 'Service'.
 *
 * @param {Object} event - El evento de Lambda, que contiene información sobre la solicitud HTTP.
 * @returns {Object} - Un objeto de respuesta que incluye el código de estado HTTP, el cuerpo de la respuesta y las cabeceras.
 */
export const handler = async (event) => {
  let body;
  let statusCode = 200;
  const headers = {
    "Content-Type": "application/json",
  };

  try {
    switch (event.routeKey) {
      case "GET /service":
        // Realiza una búsqueda en la tabla 'Service' y obtiene todos los elementos
        body = await dynamo.send(new ScanCommand({ TableName: tableName }));
        body = body.Items;
        break;
      case "PUT /service":
        // Parsea el cuerpo de la solicitud como JSON
        const requestJSON = JSON.parse(event.body);
        const { code, name, description } = requestJSON;

        // Verifica si los campos 'code' y 'description' están presentes
        if (!code || !description) {
          throw new Error("Se requieren 'code' y 'description' en el cuerpo de la solicitud");
        }

        // Inserta un nuevo elemento en la tabla 'Service'
        await dynamo.send(
          new PutCommand({
            TableName: tableName,
            Item: {
              code,
              name,
              description,
            },
          })
        );
        body = `Servicio creado con code ${code}`;
        break;
      case "GET /service/{id}":
        body = await dynamo.send(
          new GetCommand({
            TableName: tableName,
            Key: {
              code: event.pathParameters.id,
            },
          })
        );
        body = body.Item;
        break;
      case "DELETE /service/{id}":
        // Elimina un elemento de la tabla 'Service' por su 'code'
        await dynamo.send(
          new DeleteCommand({
            TableName: tableName,
            Key: {
              code: event.pathParameters.id,
            },
          })
        );
        body = `Servicio eliminado con code ${event.pathParameters.id}`;
        break;
      default:
        throw new Error(`Método HTTP no compatible: ${event.httpMethod}`);
    }
  } catch (err) {
    // Manejo de errores: establece el código de estado en 400 y proporciona un mensaje de error
    statusCode = 400;
    body = { error: err.message };
  } finally {
    // Convierte la respuesta en formato JSON
    body = JSON.stringify(body);
  }

  // Retorna la respuesta HTTP
  return {
    statusCode,
    body,
    headers,
  };
};
