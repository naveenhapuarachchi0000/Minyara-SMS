import https from 'https';

const ENDPOINT = 'https://fra.cloud.appwrite.io/v1';
const PROJECT_ID = '6a873ee0000f018920d8';
const API_KEY = 'standard_b7724341dc30a2d9abe4f3013bc53c211a1fbbf3648bc20d06d50b85f2f224f0e686bda1dc1a9dd0307506bcd04ee0cd71b47deeabcc974c4c548f6f88ca1337a262eed3e518cabf997bf4096eabc609832b74b69860fc6b526c86716d29bf3f973b8befe7a44b436b4034c06722b1c91c2790dc14fcb84d4beb45480821828e';
const DB_ID = 'minyara_db';

function req(path, method = 'GET', body = null) {
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

        const r = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    if (res.statusCode >= 200 && res.statusCode < 300) resolve(parsed);
                    else reject({ statusCode: res.statusCode, data: parsed });
                } catch(e) { resolve(data); }
            });
        });
        r.on('error', reject);
        if (body) r.write(JSON.stringify(body));
        r.end();
    });
}

async function createCollection(id, name) {
    try {
        await req(`/databases/${DB_ID}/collections`, 'POST', {
            collectionId: id,
            name: name,
            permissions: [
                'read("any")',
                'create("any")',
                'update("any")',
                'delete("any")'
            ],
            documentSecurity: false
        });
        console.log(`Collection ${name} (${id}) created.`);
    } catch(e) {
        if (e.statusCode === 409) {
            console.log(`Collection ${id} already exists.`);
            // Update permissions to any
            try {
                await req(`/databases/${DB_ID}/collections/${id}`, 'PUT', {
                    name: name,
                    permissions: [
                        'read("any")',
                        'create("any")',
                        'update("any")',
                        'delete("any")'
                    ],
                    documentSecurity: false
                });
                console.log(`Updated permissions for ${id} to public read/write.`);
            } catch(upErr) {}
        } else {
            console.error(`Collection ${id} error:`, e.data?.message || e);
        }
    }
}

async function createAttribute(colId, type, key, sizeOrOptions = {}) {
    try {
        let path = `/databases/${DB_ID}/collections/${colId}/attributes/${type}`;
        let payload = { key, required: false };
        if (type === 'string') {
            payload.size = sizeOrOptions.size || 255;
            if (sizeOrOptions.default !== undefined) payload.default = sizeOrOptions.default;
            if (sizeOrOptions.array) payload.array = true;
        } else if (type === 'integer' || type === 'float') {
            if (sizeOrOptions.default !== undefined) payload.default = sizeOrOptions.default;
        } else if (type === 'boolean') {
            payload.default = sizeOrOptions.default !== undefined ? sizeOrOptions.default : false;
        }
        await req(path, 'POST', payload);
        console.log(`Created attribute ${colId}.${key}`);
    } catch(e) {
        if (e.statusCode === 409) {
            // Already exists
        } else {
            console.log(`Attribute notice ${colId}.${key}:`, e.data?.message || e);
        }
    }
}

async function main() {
    console.log('--- Syncing Appwrite Database Collections & Permissions ---');
    
    // Ensure Collections
    await createCollection('students', 'Students');
    await createCollection('classes', 'Classes');
    await createCollection('payments', 'Payments');
    await createCollection('teachers', 'Teachers');
    await createCollection('parents', 'Parents');
    await createCollection('settings', 'Settings');

    // Students Attributes
    await createAttribute('students', 'string', 'fullName', { size: 255 });
    await createAttribute('students', 'string', 'grade', { size: 50 });
    await createAttribute('students', 'string', 'dob', { size: 50 });
    await createAttribute('students', 'integer', 'age', { default: 16 });
    await createAttribute('students', 'string', 'joinDate', { size: 50 });
    await createAttribute('students', 'string', 'school', { size: 255 });
    await createAttribute('students', 'string', 'parentName', { size: 255 });
    await createAttribute('students', 'string', 'parentPhone', { size: 50 });
    await createAttribute('students', 'string', 'parentPhoneOptional', { size: 50 });
    await createAttribute('students', 'string', 'syllabus', { size: 50 });
    await createAttribute('students', 'boolean', 'isActive', { default: true });
    await createAttribute('students', 'string', 'qrCodeToken', { size: 255 });

    // Classes Attributes
    await createAttribute('classes', 'string', 'className', { size: 255 });
    await createAttribute('classes', 'string', 'syllabus', { size: 50 });
    await createAttribute('classes', 'string', 'grade', { size: 50 });
    await createAttribute('classes', 'string', 'teacherName', { size: 255 });
    await createAttribute('classes', 'float', 'fee', { default: 4500 });

    // Payments Attributes
    await createAttribute('payments', 'string', 'studentId', { size: 255 });
    await createAttribute('payments', 'string', 'studentName', { size: 255 });
    await createAttribute('payments', 'string', 'classId', { size: 255 });
    await createAttribute('payments', 'string', 'className', { size: 255 });
    await createAttribute('payments', 'string', 'receiptNo', { size: 100 });
    await createAttribute('payments', 'string', 'month', { size: 100 });
    await createAttribute('payments', 'float', 'amount', { default: 4500 });
    await createAttribute('payments', 'string', 'status', { size: 50 });
    await createAttribute('payments', 'string', 'date', { size: 100 });

    // Teachers Attributes
    await createAttribute('teachers', 'string', 'name', { size: 255 });
    await createAttribute('teachers', 'string', 'email', { size: 255 });
    await createAttribute('teachers', 'string', 'phone', { size: 50 });
    await createAttribute('teachers', 'string', 'subject', { size: 255 });
    await createAttribute('teachers', 'string', 'password', { size: 255 });
    await createAttribute('teachers', 'boolean', 'isActivated', { default: true });
    await createAttribute('teachers', 'string', 'activationToken', { size: 100 });
    await createAttribute('teachers', 'boolean', 'isSuspended', { default: false });
    await createAttribute('teachers', 'string', 'lastLogin', { size: 100 });

    // Parents Attributes
    await createAttribute('parents', 'string', 'parentName', { size: 255 });
    await createAttribute('parents', 'string', 'parentPhone', { size: 50 });
    await createAttribute('parents', 'string', 'pin', { size: 50 });
    await createAttribute('parents', 'boolean', 'isActivated', { default: true });
    await createAttribute('parents', 'string', 'activationToken', { size: 100 });
    await createAttribute('parents', 'boolean', 'isSuspended', { default: false });
    await createAttribute('parents', 'string', 'lastLogin', { size: 100 });

    // Settings Attributes
    await createAttribute('settings', 'string', 'institutionName', { size: 255 });
    await createAttribute('settings', 'string', 'logoUrl', { size: 500 });
    await createAttribute('settings', 'string', 'address', { size: 255 });
    await createAttribute('settings', 'string', 'contactPhone', { size: 50 });

    console.log('--- Appwrite Cloud Database Setup & Permissions Sync Complete! ---');
}

main();
