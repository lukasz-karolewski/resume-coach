import { ChatOpenAI } from "@langchain/openai";
import { CheerioWebBaseLoader } from "langchain/document_loaders/web/cheerio";
import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

const chatModel = new ChatOpenAI({});

export const coachRouter = createTRPCRouter({
  getResume: protectedProcedure.query(async ({ ctx }) => {
    const loader = new CheerioWebBaseLoader(
      "https://www.linkedin.com/in/lukaszkarolewski/",
    );

    const docs = await loader.load();

    console.log(docs.length);
    console.log(docs[0].pageContent.length);
  }),
});
