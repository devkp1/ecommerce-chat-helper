import "dotenv/config";
import express, { Express, Request, Response } from "express";
import { MongoClient } from "mongodb";
import cors from "cors";
import { CallAgent } from "./agent";

const app: Express = express();

app.use(cors());
app.use(express.json());

const client = new MongoClient(process.env.MONGODB_ATLAS_URI as string);

async function startServer() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("You successfully connected to database.");

    app.get("/", (req: Request, res: Response) => {
      res.send("Langgraph agent server");
    });

    app.post("/chat", async (req: Request, res: Response) => {
      const initialMessage = req.body.message;
      const threadId = Date.now().toString();
      console.log("initialMessage:", initialMessage);

      // call ai agent for respons
      try {
        const response = await CallAgent(client, initialMessage, threadId);
        res.json({ threadId, response });
      } catch (error) {
        console.error("error starting conversation with ai :", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    app.post("chat/:threadId", async (req: Request, res: Response) => {
      const { threadId } = req.params;
      const { message } = req.body;

      try {
        const response = await CallAgent(client, message, threadId);
        res.json({ response });
      } catch (error) {
        console.error("error in chat:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    const PORT = process.env.PORT || 8000;
    app.listen(PORT, () => {
      console.log("Server running on port :", PORT);
    });
  } catch (error) {
    console.error("Failed to connect with database : ", error);
    process.exit(1);
  }
}

startServer();
