const dotenv = require("dotenv");
const mongoose = require("mongoose");

process.on("uncaughtException", (err) => {
  console.log("UNCAUGHT EXCEPTION!  🔥 Shutting down..");
  console.log(err.name, err.message);

  process.exit(1);
});

dotenv.config({ path: "./config.env" });
const app = require("./app");

// const DB = process.env.DATABASE_LOCAL;
const DB = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);
const DBLocal = process.env.DATABASE_LOCAL;

mongoose
  .connect(DB, {
    useFindAndModify: true,
    useNewUrlParser: true,
    useCreateIndex: true,
  })
  .then(() => console.log("DB Connectd in EVN -->", process.env.NODE_ENV));

const port = process.env.PORT || 3002;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});
process.on("unhandledRejection", (err) => {
  console.log(err.name, err.message);
  console.log("UNHANDLED REJECTION!  🔥 Shutting down..");
  server.close(() => {
    process.exit(1);
  });
});
process.on("SIGTERM", (err) => {
  console.log(err.name, err.message);
  console.log("SIGTERM RECIVED!  🔥 Shutting down.. gracefully");
  server.close(() => {
    console.log("Process terminating..");
  });
});
