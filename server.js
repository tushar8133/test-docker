const express = require("express");
const mongoose = require("mongoose");
const fs = require("fs");
require("dotenv").config();

/*
200 Ok
201 Resource Created
400 Bad Request
401 Unauthorized
404 Not Found
500 Internal Server Error
res.status // 400
res.statusText // Not found
res.ok // 2XX
await res.json()
await res.text()
*/

const COOKIE_TIMEOUT = 10 * 1000;
const { PORT, MONGO_PORT, MONGO_URL, MONGO_USER, MONGO_PASSWORD } = process.env;

mongoose.connect(
  `mongodb://${MONGO_USER}:${MONGO_PASSWORD}@${MONGO_URL}:${MONGO_PORT}/bookdepot`,
  {
    authSource: "admin",
  }
);

const db = mongoose.connection;

db.on("error", (e) => {
  console.log("MongoDB Connection Error!");
});

db.once("open", () => {
  console.log("MongoDB Connection Sucessful!");
});

const DynamicModel = mongoose.model(
  "Dynamic",
  new mongoose.Schema({}, { strict: false }),
  "books"
);

let sessionDetails = [];
let usersCount = 0;

function checkAndUpdateCookie(req, res, next) {
  const [cookName = null, cookValue = null] = req.headers?.cookie?.split("=") ?? [];
  if (cookName === "user" && sessionDetails.includes(Number(cookValue))) {
    console.log("existing user", cookValue);
    res.cookie("user", cookValue, {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      maxAge: COOKIE_TIMEOUT,
    });
  }
  next();
}

function ifCookieNotPresent(req, res, next) {
  console.log(req.url)

  if (["/authenticate", "/login", "/logout", "/favicon.ico"].includes(req.url)) {
    next();
    return;
  }

  const [cookName = null, cookValue = null] = req.headers?.cookie?.split("=") ?? [];
  if (cookName === "user" && sessionDetails.includes(Number(cookValue))) {
    next();
    return;
  }

  res.status(401).end("Invalid cookie");
  return;
}

function addCookie(res) {
  sessionId = ++usersCount;
  sessionDetails.push(sessionId);
  res.cookie("user", sessionId, {
    httpOnly: true,
    secure: false,
    sameSite: 'strict',
    maxAge: COOKIE_TIMEOUT,
  });
  console.log("new user", sessionId);
}

function removeCookie(res) {
  res.clearCookie('user');
}


const app = express();

app.use(express.json());
app.use("/", express.static("public"));
app.use(checkAndUpdateCookie);
app.use(ifCookieNotPresent);



// POST endpoint to create a dynamic document
app.post("/authenticate", async (req, res) => {
  try {
    if (req.body.username === "aa" && req.body.password === "bb") {
      addCookie(res);
      res.json("Login Successful!");
    } else {
      res.status(401).json("Invalid credentials");
    }
  } catch (error) {
    res.status(500).json({ error: "Invalid Login" });
  }
});

app.get("/logout", async (req, res) => {
  try {
    removeCookie(res);
    res.json("User logged out!");
  } catch (error) {
    res.status(500).json({ error: "Problem in logging out!" });
  }
});

// POST endpoint to create a dynamic document
app.post("/book", async (req, res) => {
  try {
    // const data = { ...req.body, uid: Date.now() };
    const data = req.body;
    if (!data) {
        return res.status(404).json({ error: "Data not received" });
    }
    const newDocument = new DynamicModel(data);
    const savedDocument = await newDocument.save();
    res.status(201).json(savedDocument);
  } catch (error) {
    console.error("Error saving document:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET endpoint to retrieve all dynamic documents
app.get("/books", async (req, res) => {
  try {
    const documents = await DynamicModel.find({});
    res.json(documents);
  } catch (error) {
    console.error("Error retrieving documents:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET endpoint to retrieve a specific dynamic document by ID
app.get("/book/:id", async (req, res) => {
  try {
    const document = await DynamicModel.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }
    res.json(document);
  } catch (error) {
    console.error("Error retrieving document:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//PUT endpoint to update a document.
app.put("/book/:id", async (req, res) => {
  try {
    const updatedDocument = await DynamicModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedDocument) {
      return res.status(404).json({ error: "Document not found" });
    }
    res.json(updatedDocument);
  } catch (error) {
    console.error("Error updating document:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//DELETE endpoint to delete a document.
app.delete("/book/:id", async (req, res) => {
  try {
    const deletedDocument = await DynamicModel.findByIdAndDelete(req.params.id);
    if (!deletedDocument) {
      return res.status(404).json({ error: "Document not found" });
    }
    res.json({ message: "Document deleted" });
  } catch (error) {
    console.error("Error deleting document:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(PORT, () => {
  console.log(`Node Server listening at http://localhost:${PORT}`);
});
