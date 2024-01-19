import { userAuthModel } from "../models/index.js";
import axios from "axios";

export default {

  getAccessToken: async (email) =>{
    const user = await userAuthModel.findOne({email});
    if(user){
     try {
        // let header = 
         let tokenDetails = await axios.post("https://accounts.google.com/o/oauth2/token", 
         {
            "client_id":process.env.ID,
            "client_secret": process.env.SECRET,
            "refresh_token": user.token,
            "grant_type": "refresh_token"
        })
        //  console.log(tokenDetails.data)
         tokenDetails.data["refresh_token"] = user.token
         return tokenDetails.data
     } catch (error) {
        throw error;
      }
    }
  },


};