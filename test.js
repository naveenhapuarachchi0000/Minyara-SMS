import { Client, Databases } from 'appwrite';

const client = new Client();
client
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('6a873ee0000f018920d8');

const databases = new Databases(client);

async function testParent() {
    try {
        const id = 'par_' + Date.now();
        await databases.createDocument('minyara_db', 'parents', id, {
            parentName: 'Parent',
            parentPhone: '0771234567',
            pin: '',
            isActivated: false,
            activationToken: 'ACT-PAR-TEST',
            isSuspended: false,
            lastLogin: 'Never'
        });
        console.log("Add parent success!");
    } catch(e) {
        console.error("Appwrite error:", e.message);
        if (e.response) {
            console.error("Details:", e.response);
        }
    }
}
testParent();
