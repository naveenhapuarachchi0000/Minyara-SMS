import { Client, Databases, Users, ID, Permission, Role } from 'node-appwrite';

const client = new Client()
    .setEndpoint('https://fra.cloud.appwrite.io/v1') // Your API Endpoint
    .setProject('6a873ee0000f018920d8')               // Your project ID
    .setKey('standard_b7724341dc30a2d9abe4f3013bc53c211a1fbbf3648bc20d06d50b85f2f224f0e686bda1dc1a9dd0307506bcd04ee0cd71b47deeabcc974c4c548f6f88ca1337a262eed3e518cabf997bf4096eabc609832b74b69860fc6b526c86716d29bf3f973b8befe7a44b436b4034c06722b1c91c2790dc14fcb84d4beb45480821828e');

const databases = new Databases(client);

const DATABASE_ID = 'minyara_db';
const DATABASE_NAME = 'MinyaraDB';

async function setup() {
    console.log('Starting Appwrite setup...');
    
    try {
        // Create Database
        try {
            await databases.create(DATABASE_ID, DATABASE_NAME);
            console.log(`Created Database: ${DATABASE_NAME}`);
        } catch (e) {
            if (e.code === 409) console.log(`Database ${DATABASE_NAME} already exists.`);
            else throw e;
        }

        // --- Create Collections ---
        
        // 1. Students Collection
        const STUDENTS_COLLECTION = 'students';
        try {
            await databases.createCollection(
                DATABASE_ID,
                STUDENTS_COLLECTION,
                'Students',
                [
                    Permission.read(Role.any()), // Assuming we want parents/teachers to read. We can restrict this later via queries.
                    Permission.create(Role.users()),
                    Permission.update(Role.users()),
                    Permission.delete(Role.users())
                ]
            );
            console.log('Created Students collection.');
            
            // Create Attributes
            await databases.createStringAttribute(DATABASE_ID, STUDENTS_COLLECTION, 'fullName', 255, true);
            await databases.createDatetimeAttribute(DATABASE_ID, STUDENTS_COLLECTION, 'joinDate', true);
            await databases.createIntegerAttribute(DATABASE_ID, STUDENTS_COLLECTION, 'age', true);
            await databases.createDatetimeAttribute(DATABASE_ID, STUDENTS_COLLECTION, 'dob', true);
            await databases.createStringAttribute(DATABASE_ID, STUDENTS_COLLECTION, 'school', 255, true);
            await databases.createStringAttribute(DATABASE_ID, STUDENTS_COLLECTION, 'parentName', 255, true);
            await databases.createStringAttribute(DATABASE_ID, STUDENTS_COLLECTION, 'parentPhone', 50, true);
            await databases.createStringAttribute(DATABASE_ID, STUDENTS_COLLECTION, 'parentPhoneOptional', 50, false);
            await databases.createStringAttribute(DATABASE_ID, STUDENTS_COLLECTION, 'syllabus', 50, true);
            await databases.createBooleanAttribute(DATABASE_ID, STUDENTS_COLLECTION, 'isActive', true, true);
            await databases.createStringAttribute(DATABASE_ID, STUDENTS_COLLECTION, 'qrCodeToken', 255, true);
            await databases.createStringAttribute(DATABASE_ID, STUDENTS_COLLECTION, 'parentId', 255, false); // Link to Parent User ID
            
            console.log('Created attributes for Students.');
        } catch (e) {
            if (e.code === 409) console.log(`Collection Students already exists.`);
            else throw e;
        }

        // 2. Classes Collection
        const CLASSES_COLLECTION = 'classes';
        try {
            await databases.createCollection(
                DATABASE_ID,
                CLASSES_COLLECTION,
                'Classes',
                [
                    Permission.read(Role.any()),
                    Permission.create(Role.users()),
                    Permission.update(Role.users()),
                    Permission.delete(Role.users())
                ]
            );
            console.log('Created Classes collection.');
            
            await databases.createStringAttribute(DATABASE_ID, CLASSES_COLLECTION, 'className', 255, true);
            await databases.createStringAttribute(DATABASE_ID, CLASSES_COLLECTION, 'syllabus', 50, true);
            // Storing array of teacher IDs as a string (JSON) or array
            await databases.createStringAttribute(DATABASE_ID, CLASSES_COLLECTION, 'teacherIds', 10000, false, null, true); 
            console.log('Created attributes for Classes.');
        } catch (e) {
            if (e.code === 409) console.log(`Collection Classes already exists.`);
            else throw e;
        }

        // 3. ClassEnrollments Collection
        const ENROLLMENTS_COLLECTION = 'class_enrollments';
        try {
            await databases.createCollection(
                DATABASE_ID,
                ENROLLMENTS_COLLECTION,
                'ClassEnrollments',
                [
                    Permission.read(Role.any()),
                    Permission.create(Role.users()),
                    Permission.update(Role.users()),
                    Permission.delete(Role.users())
                ]
            );
            console.log('Created ClassEnrollments collection.');
            
            await databases.createStringAttribute(DATABASE_ID, ENROLLMENTS_COLLECTION, 'studentId', 255, true);
            await databases.createStringAttribute(DATABASE_ID, ENROLLMENTS_COLLECTION, 'classId', 255, true);
            console.log('Created attributes for ClassEnrollments.');
        } catch (e) {
            if (e.code === 409) console.log(`Collection ClassEnrollments already exists.`);
            else throw e;
        }

        // 4. Payments Collection
        const PAYMENTS_COLLECTION = 'payments';
        try {
            await databases.createCollection(
                DATABASE_ID,
                PAYMENTS_COLLECTION,
                'Payments',
                [
                    Permission.read(Role.any()),
                    Permission.create(Role.users()),
                    Permission.update(Role.users()),
                    Permission.delete(Role.users())
                ]
            );
            console.log('Created Payments collection.');
            
            await databases.createStringAttribute(DATABASE_ID, PAYMENTS_COLLECTION, 'studentId', 255, true);
            await databases.createFloatAttribute(DATABASE_ID, PAYMENTS_COLLECTION, 'amount', true);
            await databases.createDatetimeAttribute(DATABASE_ID, PAYMENTS_COLLECTION, 'date', true);
            await databases.createStringAttribute(DATABASE_ID, PAYMENTS_COLLECTION, 'status', 50, true); // Paid, Pending, Overdue
            await databases.createStringAttribute(DATABASE_ID, PAYMENTS_COLLECTION, 'month', 50, true);
            console.log('Created attributes for Payments.');
        } catch (e) {
            if (e.code === 409) console.log(`Collection Payments already exists.`);
            else throw e;
        }

        console.log('Setup complete! Note: Attribute creation might take a few seconds to process on Appwrite side.');
        
    } catch (error) {
        console.error('Error during setup:', error);
    }
}

setup();
