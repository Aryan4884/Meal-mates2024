import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB connection successful`);
  } catch (error) {
    console.error(`MONGODB CONNECTION FAILED `, error);
    process.exit(1);
  }
};

export default connectDB;