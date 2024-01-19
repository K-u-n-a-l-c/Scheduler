import { google } from "googleapis";
import { userAuthModel } from "../models/index.js";
import axios from "axios";
import { v4 as uuidv4 } from 'uuid';
import utils from "../lib/utils.js";

const userController = function () {

  const auth = new google.auth.OAuth2(
    process.env.ID,
    process.env.SECRET,
    "http://localhost:4000/backend/user/login"
  );

  return {
    saveUsers: async function (req, res) {
      try{const code = req.query.code;
      const { tokens } = await auth.getToken(code);
      console.log(tokens)
      let header = {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: "Bearer " + tokens.access_token,
      };
      let response = await axios.get(
        `https://www.googleapis.com/oauth2/v2/userinfo`,
        { headers: header }
      );
      const user = await userAuthModel.findOne({ email :response.data.email });
    //   console.log(user)
      if (!user) {
        const newUser = new userAuthModel({
          name: response.data.name,
          email: response.data.email,
          token: tokens.refresh_token
        });
        await newUser.save();
      }
      auth.setCredentials(tokens);
      return res.send("User logged in successfully");}catch(err){
        res.status(500).json({ message: "Login Failed" })
      }
    },

    createUser: async function (req, res) {
      const scopes = [
        "https://www.googleapis.com/auth/calendar",
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/userinfo.email",
      ];
      const url = auth.generateAuthUrl({
        access_type: "offline",
        scope: scopes,
      });
      res.redirect(url);
    },

    getAvailableSlots: async function (req, res) {
      const { email, start, end, duration } = req.body;

      const startTime = new Date(start);
      const endTime = new Date(end);
      const meetingDuration = parseInt(duration); //in minutes

      const user = await userAuthModel.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const busySlots = user.calendar.filter(
        (event) => event.start < endTime && event.end > startTime
      );

      let availableSlots = [];
      let slotStart = startTime;
      while (slotStart < endTime) {
        const slotEnd = new Date(slotStart.getTime() + meetingDuration * 60000);

        if (
          !busySlots.some(
            (slot) => slot.start < slotEnd && slot.end > slotStart
          )
        ) {
          availableSlots.push({ start: slotStart, end: slotEnd });
        }
        slotStart = slotEnd;
      }

      res.json(availableSlots);
    },
    createMeeting: async function (req, res) {
        const { email, start, end, title, description, attendee } = req.body;
        const token = await utils.getAccessToken(email)
        auth.setCredentials(token)
        const calendar = google.calendar({ version: 'v3', auth: auth });
        const resource = {
          summary: title,
          description: description,
          start: {
            dateTime: start,
            timeZone: "Asia/Kolkata",
          },
          end: {
            dateTime: end,
            timeZone: "Asia/Kolkata",
          },
          attendees: [{ email: attendee }],
          reminders: {
            useDefault: false,
            overrides: [
              { method: "email", minutes: 24 * 60 },
              { method: "popup", minutes: 10 },
            ],
          },
          conferenceData: {
            createRequest: {
              requestId: uuidv4(),
              conferenceSolutionKey: {
                type: "hangoutsMeet",
              },
            },
          },
        };
        calendar.events.insert({
          calendarId: 'primary',
          sendUpdates:'all',
          resource: resource,
          conferenceDataVersion: 1,
        }, async function (err, event) {
          if (err) {
            res.send("error");
          } else {
            const user = await userAuthModel.findOne({ email });
            if (!user) {
              return res.status(404).json({ message: 'User not found' });
            }
  
            user.calendar.push({ start, end, title, description, attendee, eventId:event.data.id });
            await user.save();
            
            res.json({ message: "Meeting created successfully" });
          }
        });
      },
      getAllEvents: async function (req, res) {
        const { email } = req.body;

        const user = await userAuthModel.findOne({ email });
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }
        const events = user.calendar;
  
        res.json(events);
      },
      updateEvent: async function (req, res) {
        const { email, eventId, start, end, title, description, attendee } = req.body;
  
        const user = await userAuthModel.findOne({ email });
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }
  
        const event = user.calendar.id(eventId);
        if (!event) {
          return res.status(404).json({ message: 'Event not found' });
        }
        const token = await utils.getAccessToken(email)
        auth.setCredentials(token)
        const calendar = google.calendar({ version: 'v3', auth: auth });
  
        const updatedEvent = await calendar.events.update({
          calendarId: 'primary',
          eventId: event.eventId,
          resource: {
            summary: title,
            description: description,
            start: {
              dateTime: start,
              timeZone: "Asia/Kolkata",
            },
            end: {
              dateTime: end,
              timeZone: "Asia/Kolkata",
            },
            attendees: [{ email: attendee }],
          },
        });
  
        event.start = start;
        event.end = end;
        event.title = title;
        event.description = description;
        event.attendee = attendee;
        await user.save();
  
        res.json("Event updated Successfully");
      },
      deleteEvent: async function (req, res) {
        const { email, eventId } = req.body;
  
        const user = await userAuthModel.findOne({ email });
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }
  
        const event = user.calendar.id(eventId);
        if (!event) {
          return res.status(404).json({ message: 'Event not found' });
        }
        const token = await utils.getAccessToken(email)
        auth.setCredentials(token)
        const calendar = google.calendar({ version: 'v3', auth: auth });
  
        await calendar.events.delete({
          calendarId: 'primary',
          eventId: event.eventId,
        });
  
        await userAuthModel.updateOne(
            { email },
            { $pull: { calendar: { _id: eventId } } })
  
        res.json({ message: "Event deleted successfully" });
      },
  };
};

export default userController();
