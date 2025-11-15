"server-only";

import { ChatPromptTemplate } from "@langchain/core/prompts";
import {
  END,
  MessagesAnnotation,
  START,
  StateGraph,
} from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { COACH_SYSTEM_PROMPT, createLLM, createMemory } from "./config";
import { allTools } from "./tools";

/**
 * Create the ReAct agent graph
 */
export function createCoachAgent() {
  const llm = createLLM();
  const memory = createMemory();

  // Bind tools to the LLM
  const llmWithTools = llm.bindTools(allTools);

  // Create the prompt with system message
  const prompt = ChatPromptTemplate.fromMessages([
    ["system", COACH_SYSTEM_PROMPT],
    ["placeholder", "{messages}"],
  ]);

  // Define the agent node that calls the LLM
  const callModel = async (state: typeof MessagesAnnotation.State) => {
    const chain = prompt.pipe(llmWithTools);
    const response = await chain.invoke({ messages: state.messages });
    return { messages: [response] };
  };

  // Define routing logic: continue to tools or end?
  const shouldContinue = (state: typeof MessagesAnnotation.State) => {
    const messages = state.messages;
    const lastMessage = messages[messages.length - 1];

    // If the LLM makes a tool call, route to the "tools" node
    if (
      lastMessage &&
      "tool_calls" in lastMessage &&
      Array.isArray(lastMessage.tool_calls) &&
      lastMessage.tool_calls.length > 0
    ) {
      return "tools";
    }
    // Otherwise, end the conversation
    return END;
  };

  // Create the tool node
  const toolNode = new ToolNode(allTools);

  // Build the graph
  const workflow = new StateGraph(MessagesAnnotation)
    .addNode("agent", callModel)
    .addNode("tools", toolNode)
    .addEdge(START, "agent")
    .addConditionalEdges("agent", shouldContinue, {
      tools: "tools",
      [END]: END,
    })
    .addEdge("tools", "agent"); // After tools, go back to agent

  // Compile with memory checkpointer
  return workflow.compile({ checkpointer: memory });
}
