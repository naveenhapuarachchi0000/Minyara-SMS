import { Client, Account, Databases, ID, Query } from 'appwrite';

const client = new Client();
client
    .setEndpoint('https://fra.cloud.appwrite.io/v1') // Appwrite Endpoint
    .setProject('6a873ee0000f018920d8');             // Project ID

export const account = new Account(client);
export const databases = new Databases(client);

export const DATABASE_ID = 'minyara_db';
export const COLLECTIONS = {
    STUDENTS: 'students',
    CLASSES: 'classes',
    PAYMENTS: 'payments',
    TEACHERS: 'teachers',
    PARENTS: 'parents',
    SETTINGS: 'settings'
};

export { ID, Query };
