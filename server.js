const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();

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

const app = express();

app.use(express.json());

app.use("/", express.static("public"));

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
