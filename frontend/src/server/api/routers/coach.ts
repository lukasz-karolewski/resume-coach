import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import {
  END,
  MemorySaver,
  MessagesAnnotation,
  START,
  StateGraph,
} from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const coachRouter = createTRPCRouter({
  reviewJobAccomplishments: protectedProcedure
    .input(
      z.object({
        accomplihments: z.array(z.string()),
        thread_id: z.string(),
        user_input: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { thread_id, accomplihments, user_input } = input;

      // Use langchain and Gpt-4o to generate a review
      const llm = new ChatOpenAI({
        model: "gpt-4o-mini",
        temperature: 0,
      });

      const prompt = ChatPromptTemplate.fromMessages([
        [
          "system",
          `You reviewing a job accomplishments on a resume. 
          Please provide a susggestions on how to make it sound more professional and conciese.
          Consider perceived value, impact, and relevance of each accplishment and reorder, group and summarize as necessary and feel free to remove low value items.
          Focus on the impact, not the task.
          You MUST make sure the output is a flat list that can be used as a bullet points in a resume. 
          `,
        ],
        [
          "user",
          `Accomplishments:\n ${accomplihments.map((a) => `- ${a}`).join("\n")}`,
        ],
        new MessagesPlaceholder("messages"),
      ]);

      // Define the function that calls the model
      const callModel = async (state: typeof MessagesAnnotation.State) => {
        const chain = prompt.pipe(llm);
        const response = await chain.invoke(state);
        // Update message history with response:
        return { messages: [response] };
      };

      // Define a new graph
      const workflow = new StateGraph(MessagesAnnotation)
        // Define the node and edge
        .addNode("model", callModel)
        .addEdge(START, "model")
        .addEdge("model", END);

      // Add memory
      const memory = new MemorySaver();
      const app = workflow.compile({ checkpointer: memory });

      // Define the input
      const config = { configurable: { thread_id: thread_id || uuidv4() } };
      const messages = [
        {
          content: user_input,
          role: "user",
        },
      ];

      const output = await app.invoke({ messages }, config);

      // The output contains all messages in the state.
      // This will long the last message in the conversation.

      const response = output.messages[output.messages.length - 1];

      return response.content;
    }),
});
