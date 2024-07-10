import mongoose, { Schema } from "mongoose";

const complaintSchema = new Schema({
  locality: {
    type: String,
    require: true,
  },
  date: {
    type: Date,
    require: true,
  },
  foodType: {
    type: String,
    require: true,
  },
  foodDescription: {
    type: String,
    require: true,
  },
  image: {
    type: String,
    require: true,
  },
  latitude: {
    type: Number,
    require: true,
  },
  longitude: {
    type: Number,
    require: true,
  },
  mapAPI: {
    type: String,
    require: true,
  },
  mobileNo: {
    type: Number,
    require: true,
  },
});

export const Complaint = mongoose.model("Complaint", complaintSchema);
