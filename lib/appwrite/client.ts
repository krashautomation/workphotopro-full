import { Client, Account, Databases, Storage, Teams, Avatars } from 'react-native-appwrite';

if (!process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT) {
  throw new Error('Missing EXPO_PUBLIC_APPWRITE_ENDPOINT');
}

if (!process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID) {
  throw new Error('Missing EXPO_PUBLIC_APPWRITE_PROJECT_ID');
}

const client = new Client()
  .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID);

// Debug: Log client configuration
console.log('🔧 Appwrite Client Configuration:');
console.log('🔧 Endpoint:', process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT);
console.log('🔧 Project ID:', process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const teams = new Teams(client);
export const avatars = new Avatars(client);

export default client;

