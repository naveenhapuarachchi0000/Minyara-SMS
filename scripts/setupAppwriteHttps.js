import https from 'https';

const ENDPOINT = 'https://fra.cloud.appwrite.io/v1';
const PROJECT_ID = '6a873ee0000f018920d8';
const API_KEY = 'standard_b7724341dc30a2d9abe4f3013bc53c211a1fbbf3648bc20d06d50b85f2f224f0e686bda1dc1a9dd0307506bcd04ee0cd71b47deeabcc974c4c548f6f88ca1337a262eed3e518cabf997bf4096eabc609832b74b69860fc6b526c86716d29bf3f973b8befe7a44b436b4034c06722b1c91c2790dc14fcb84d4beb45480821828e';

function appwriteRequest(path, method = 'GET', body = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(ENDPOINT + path);
        const options = {
            hostname: url.hostname,
            port: 443,
            path: url.pathname + url.search,
            method: method,
            headers: {
                'X-Appwrite-Project': PROJECT_ID,
                'X-Appwrite-Key': API_KEY,
                'Content-Type': 'application/json'
            },
            timeout: 15000
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(parsed);
                    } else {
                        reject({ statusCode: res.statusCode, data: parsed });
                    }
                } catch (e) {
                    resolve(data);
                }
            });
        });

        req.on('error', reject);
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timed out'));
        });

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

async function run() {
    console.log('--- Connecting to Appwrite ---');
    try {
        // List databases
        const dbs = await appwriteRequest('/databases');
        console.log('Existing databases:', dbs);

        // Create minyara_db if not present
        const dbId = 'minyara_db';
        try {
            const newDb = await appwriteRequest('/databases', 'POST', {
                databaseId: dbId,
                name: 'MinyaraDB',
                enabled: true
            });
            console.log('Created MinyaraDB database successfully!', newDb);
        } catch (e) {
            if (e.statusCode === 409) {
                console.log('Database minyara_db already exists.');
            } else {
                console.error('Database create notice:', e);
            }
        }

        // Create collections
        const collections = [
            { id: 'students', name: 'Students' },
            { id: 'classes', name: 'Classes' },
            { id: 'class_enrollments', name: 'ClassEnrollments' },
            { id: 'payments', name: 'Payments' },
            { id: 'teachers', name: 'Teachers' },
            { id: 'settings', name: 'Settings' }
        ];

        for (const col of collections) {
            try {
                await appwriteRequest(`/databases/${dbId}/collections`, 'POST', {
                    collectionId: col.id,
                    name: col.name,
                    permissions: [
                        'read("any")',
                        'create("users")',
                        'update("users")',
                        'delete("users")'
                    ],
                    documentSecurity: false
                });
                console.log(`Created collection: ${col.name}`);
            } catch (e) {
                if (e.statusCode === 409) {
                    console.log(`Collection ${col.name} already exists.`);
                } else {
                    console.error(`Collection ${col.name} note:`, e.data?.message || e);
                }
            }
        }

        console.log('--- Appwrite Setup Complete! ---');
    } catch (err) {
        console.error('Appwrite connection failed:', err);
    }
}

run();
