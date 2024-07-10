import mongoose, { Schema } from "mongoose";

const paymentSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  message: {
    type: String,
  },
});

export const Payment = mongoose.model("Payment", paymentSchema);
