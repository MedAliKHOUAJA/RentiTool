import { ServiceBusClient, ServiceBusSender } from "@azure/service-bus";

const connectionString = process.env.AZURE_SERVICE_BUS_CONNECTION_STRING!;
const topicName = "notifications";

let client: ServiceBusClient | null = null;
let sender: ServiceBusSender | null = null;

export function getServiceBusClient(): ServiceBusClient {
  if (!client) {
    client = new ServiceBusClient(connectionString);
  }
  return client;
}

export function getSender(): ServiceBusSender {
  if (!sender) {
    const client = getServiceBusClient();
    sender = client.createSender(topicName);
  }
  return sender;
}

export async function closeServiceBusClient() {
  if (sender) {
    await sender.close();
    sender = null;
  }
  if (client) {
    await client.close();
    client = null;
  }
}