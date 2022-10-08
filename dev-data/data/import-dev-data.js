const fs = require("fs");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
// const Tour = require("../../models/tourModel");
const User = require("../../models/userModel");
// const Review = require("../../models/reviewModel");
// const config = require("")
dotenv.config({ path: "../../config.env" });
const DB = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useFindAndModify: true,
    useNewUrlParser: true,
    useCreateIndex: true,
  })
  .then(() => console.log("DB Connectd"));

// mongoose.connect(DB).then(() => console.log('DB Connectd'));

// Read JSON file
// const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, "utf-8"));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, "utf-8"));
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/reviews.json`, "utf-8")
);

const importData = async () => {
  try {
    // await Tour.create(tours);
    // console.log("Tour succefully loadded");
    await User.create(users);
    console.log("Users succefully loadded");
    // await Review.create(reviews);
    // console.log("Reviews succefully loadded");
    console.log("----------------------------");
    console.log("Data succefully loadded");
  } catch (error) {
    console.log(error);
  }
  process.exit();
};

const deleteData = async () => {
  try {
    // await Tour.deleteMany();
    // console.log("Tours Deleted");
    await User.deleteMany();
    console.log("Users Deleted");
    // await Review.deleteMany();
    // console.log("Reviews Deleted");
    console.log("Data succefully Deleted");
  } catch (error) {
    console.log(error);
  }
  process.exit();
};
console.log();
if (process.argv[2] === "--import") {
  importData();
} else if (process.argv[2] === "--delete") {
  deleteData();
}
