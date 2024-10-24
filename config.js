const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const URL = process.env.MONGO_URL;
mongoose.set("strictQuery", true);
const connectToMongo = async (cb) => {
  try {
    let db = await mongoose.connect(URL);
    db && cb();
    console.log("Connected to DB");
  } catch (error) {
    console.log(error);
  }

  // const f = await User.find();
  // console.log(f);
};

module.exports = connectToMongo;
