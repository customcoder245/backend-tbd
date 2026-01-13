import cron from 'node-cron';
import User from '../models/user.model.js';

// Run the cron job to clean expired users every minute
cron.schedule('* * * * *', async () => {
  const expiredUsers = await User.find({
    emailVerificationExpires: { $lt: Date.now() },
    profileCompleted: false,
  });

  if (expiredUsers.length > 0) {
    await User.deleteMany({
      _id: { $in: expiredUsers.map(user => user._id) }
    });
    console.log(`${expiredUsers.length} expired users removed.`);
  }
});
