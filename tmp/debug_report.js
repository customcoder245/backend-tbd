const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env
dotenv.config({ path: path.resolve(__dirname, 'src/.env') });

const User = require('./src/models/user.model').default || require('./src/models/user.model');
const SubmittedAssessment = require('./src/models/submittedAssessment.model').default || require('./src/models/submittedAssessment.model');

async function debug() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const userId = '69a92da31101f687eebe5607';
        console.log(`Checking User ID: ${userId}`);

        const user = await User.findById(userId);
        if (!user) {
            console.log('USER NOT FOUND IN DB');
            return;
        }

        console.log('User found:', {
            email: user.email,
            role: user.role,
            firstName: user.firstName,
            lastName: user.lastName
        });

        console.log('\nChecking SubmittedAssessments for userId...');
        const reportsByUserId = await SubmittedAssessment.find({ userId });
        console.log(`Found ${reportsByUserId.length} reports by userId.`);

        console.log('\nChecking SubmittedAssessments for email...');
        const reportsByEmail = await SubmittedAssessment.find({ "userDetails.email": user.email.toLowerCase() });
        console.log(`Found ${reportsByEmail.length} reports by email.`);

        if (reportsByEmail.length > 0) {
            console.log('Sample report userDetails:', reportsByEmail[0].userDetails);
            console.log('Sample report scores exists:', !!reportsByEmail[0].scores);
        }

        const allReports = await SubmittedAssessment.find({}).limit(5);
        console.log('\nTotal report count in DB:', await SubmittedAssessment.countDocuments());
        console.log('Sample reports in DB (first 5 emails):', allReports.map(r => r.userDetails?.email));

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
    }
}

debug();
