import mongoose from 'mongoose';
import Organization from './src/models/organization.model.js';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URL);
  try {
    const orgName = "Talent By Design";
    const department = "ffsdfsd";
    const orgQuery = { name: { $regex: new RegExp("^" + orgName.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + "$", "i") } };
    
    console.log("Running query...", orgQuery);
    const result = await Organization.updateOne(
      orgQuery,
      { $pull: { departments: department } }
    );
    console.log("Result:", result);
    
    const org = await Organization.findOne(orgQuery);
    if(org) {
        console.log("Updated doc departments:", org.departments);
    } else {
        console.log("Organization not found");
    }
  } catch (err) {
    console.error("ERROR:", err);
  } finally {
    process.exit(0);
  }
}
run();
