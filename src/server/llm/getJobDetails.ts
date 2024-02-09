import { ChatPromptTemplate } from "@langchain/core/prompts";
import { OpenAIEmbeddings } from "@langchain/openai";
import { ChatOpenAI } from "@langchain/openai";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { createRetrievalChain } from "langchain/chains/retrieval";
import { CheerioWebBaseLoader } from "langchain/document_loaders/web/cheerio";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { MemoryVectorStore } from "langchain/vectorstores/memory";

export async function extractJobDetails(url: string) {
  const chatModel = new ChatOpenAI({});

  const loader = new CheerioWebBaseLoader(url);
  const splitter = new RecursiveCharacterTextSplitter();

  const docs = await loader.load();

  const splitDocs = await splitter.splitDocuments(docs);
  const embeddings = new OpenAIEmbeddings();

  const vectorstore = await MemoryVectorStore.fromDocuments(
    splitDocs,
    embeddings,
  );

  const prompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      `You are extracting job details from a HTML page representing a job posting. 
Respond only with the information you can extract from the HTML page. Do not use any other sources of information. 

<page contents>       
{context}
</page contents>
`,
    ],
    ["user", "Question: {input}"],
  ]);

  const documentChain = await createStuffDocumentsChain({
    llm: chatModel,
    prompt,
  });

  const retriever = vectorstore.asRetriever();

  const retrievalChain = await createRetrievalChain({
    combineDocsChain: documentChain,
    retriever,
  });

  const jobTitle = await retrievalChain.invoke({
    input: "What is the job title?",
  });

  const jobDescription = await retrievalChain.invoke({
    input: "What is the job description?",
  });

  const companyName = await retrievalChain.invoke({
    input: "What is the company name?",
  });

  return {
    title: jobTitle.answer,
    description: jobDescription.answer,
    companyName: companyName.answer,
  };
}
