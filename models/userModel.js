// models/User.js
import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  token: String,
  calendar: [
    {
      start: Date,
      end: Date,
      title: String,
      description: String,
      attendee: String,
      eventId: String
    },
  ],
});

const userAuth = mongoose.model("users", UserSchema);
export default userAuth;
