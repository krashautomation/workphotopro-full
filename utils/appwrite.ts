import { Client, Databases, ID, Storage } from 'react-native-appwrite';

if (!process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID) {
    throw new Error('Missing EXPO_PUBLIC_APPWRITE_PROJECT_ID');
}

if (!process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT) {
    throw new Error('Missing EXPO_PUBLIC_APPWRITE_ENDPOINT');
}

if (!process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID) {
    throw new Error('Missing EXPO_PUBLIC_APPWRITE_DATABASE_ID');
}

const appwriteConfig = {
    endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT,
    projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID,
    platform: "com.workphotopro.workphotoapp",
    db: process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID,
    bucket: process.env.EXPO_PUBLIC_APPWRITE_BUCKET_ID || '',
    col: {
        jobchat: "jobchat",
        messages: "messages",
        reports: "reports",
    },
};

const client = new Client();
client.setEndpoint(appwriteConfig.endpoint);
client.setProject(appwriteConfig.projectId);
client.setPlatform(appwriteConfig.platform);

const db = new Databases(client);
const storage = new Storage(client);

export { appwriteConfig, client, db, storage, ID };
