import express, { Express, Application, Request, Response } from "express";
import { Client, isNotionClientError, ClientErrorCode, APIErrorCode } from "@notionhq/client";
import * as http from "http";
import cors from "cors";
import dotenv from "dotenv";
import basicAuth from "express-basic-auth"
import axios, { AxiosResponse } from "axios";

dotenv.config();

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

const app: Express = express();

dotenv.config({});

app.use(express.json());
app.use(cors());
app.use(basicAuth({
  users: { 'admin': `${process.env.AUTH_PASS}` }
}))

const PORT = process.env.PORT || 8000;

function errorHandler(error: unknown, res: express.Response<any, Record<string, any>>) {
  if (isNotionClientError(error)) {
    switch (error.code) {
      case ClientErrorCode.RequestTimeout:
        res.status(500).send(error.message);
        break;
      case APIErrorCode.ObjectNotFound:
        res.status(404).send(error.message);
        break;
      case APIErrorCode.Unauthorized:
        res.status(401).send(error.message);
        break;
      // ...
      default:
        res.status(500).send(error.message);
    }
  }
}

app.get("/", (req: Request, res: Response) => {
  res.send("Welcome world");
});

app.post("/createDb", async (req: Request, res: Response) => {
  try {
    const options = {
      method: 'POST',
      url: 'https://api.notion.com/v1/databases',
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${process.env.NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28',
        'content-type': 'application/json'
      },
      data: {
        "parent": {
            "type": "page_id",
            "page_id": "37010522-44ab-4fe1-87a4-2a7f56cea8f6"
        },
        "icon": {
          "type": "emoji",
          "emoji": "📝"
        },
        "cover": {
          "type": "external",
          "external": {
            "url": "https://website.domain/images/image.png"
          }
        },
        "title": [
            {
                "type": "text",
                "text": {
                    "content": "Grocery List",
                    "link": null
                }
            }
        ],
        "properties": {
          "Grocery item": {
            "id": "fy:{",
            "type": "title",
            "title": {}
          },
          "Price": {
            "id": "dia[",
            "type": "number",
            "number": {
              "format": "dollar"
            }
          },
          "Last ordered": {
            "id": "]\\R[",
            "type": "date",
            "date": {}
          },
        }
    }
    };
  
    const response = await axios.request(options)

    res.send(response.data);
 
  } catch (error: unknown) {
    errorHandler(error, res);
  }
});

app.post("/createPage", async (req: Request, res: Response) => {
try {
  const response = await notion.pages.create({
    "parent": { "page_id": "37010522-44ab-4fe1-87a4-2a7f56cea8f6" },
    "properties": {
        "title": {
      "title": [{ "type": "text", "text": { "content": "A note from your pals at Notion" } }]
        }
    },
    "children": [
    {
      "object": "block",
      "type": "paragraph",
      "paragraph": {
        "rich_text": [{ "type": "text", "text": { "content": "You made this page using the Notion API. Pretty cool, huh? We hope you enjoy building with us." } }]
      }
    }
  ]
});
  console.log(response);
} catch (error: unknown) {
  errorHandler(error, res);
}

res.send("Welcome world");
});

const server: http.Server = http.createServer(app);
server.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
});


