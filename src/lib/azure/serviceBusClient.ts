import { ServiceBusClient, ServiceBusSender } from "@azure/service-bus";

const connectionString = process.env.AZURE_SERVICE_BUS_CONNECTION_STRING!;
const queueName = process.env.AZURE_SERVICE_BUS_QUEUE_NAME || "notifications-queue";

let client: ServiceBusClient | null = null;
let sender: ServiceBusSender | null = null;

export function getServiceBusClient(): ServiceBusClient {
  if (!client) {
    console.log('🔌 [Service Bus] Creating client...');
    client = new ServiceBusClient(connectionString);
  }
  return client;
}

export function getSender(): ServiceBusSender {
  if (!sender) {
    console.log('📤 [Service Bus] Creating sender for queue:', queueName);
    const client = getServiceBusClient();
    // ✅ CHANGEMENT : createSender pour la QUEUE
    sender = client.createSender(queueName);
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