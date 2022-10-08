const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const path = require("path");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const hpp = require("hpp");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const userRoute = require("./routes/userRoute");
const AppEror = require("./utils/appError");
const globalErrorHandler = require("./controllers/errorController");
// 100 request for same ip in 1 hour
const limiter = rateLimit({
  max: 100, // Limit each IP to 100 requests per `window` (here, per 60 minutes)
  windowMs: 60 * 60 * 1000, // 60 minutes
  message: "Too many request with this IP please try again in an hour",
});

const app = express();
// app.enable("trust proxy");
app.set("trust proxy", 1);
// app.set("view engine", "pug");
// app.set("views", path.join(__dirname, "views"));

// Serving static files
// app.use(express.static(`${__dirname}/public`));
app.use(express.static(path.join(__dirname, "public")));
// Global Middlewares
// Set Security HTTP header
app.use(helmet());
app.use(
  cors({
    credentials: true,
    // origin: ["https://webtourism.netlify.app"],
    origin: true,
    methods: ["POST", "PUT", "GET", "OPTIONS", "HEAD", "PATCH"],
  })
);
// app.use(cors());
// Limit request from same IP
app.use("/api", limiter);
// app.post(
//   "/webhook-checkout",
//   express.raw({ type: "application/json" }),
//   bookingController.webhookCheckout
// );
// Body Parser (basicaly reading data from body in req.body)
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());
// Data sanitization against nosql query injection ,
app.use(mongoSanitize());
// Data sanitization against xss ,
app.use(xss());
// Prevent parameter pollution
// By using whitelist option allow only duration to be double in query
app.use(
  hpp({
    whitelist: [
      "duration",
      "ratingsAverage",
      "ratingsQantity",
      "maxGroupSize",
      "difficulty",
      "price",
    ],
  })
);
// Development Login
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// app.use("/", viewRouter);
// app.use("/api/v1/tours", tourRoute);
app.use("/api/v1/users", userRoute);
// app.use("/api/v1/reviews", reviewRoute);
// app.use("/api/v1/bookings", bookingRoute);
app.all("*", (req, res, next) => {
  next(
    new AppEror(
      `This route is not available on this server ${req.originalUrl}`,
      400
    )
  );
});
app.use(globalErrorHandler);
module.exports = app;
