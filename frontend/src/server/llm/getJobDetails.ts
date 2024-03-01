// import { MozillaReadabilityTransformer } from "@langchain/community/document_transformers/mozilla_readability";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { createRetrievalChain } from "langchain/chains/retrieval";
import { CheerioWebBaseLoader } from "langchain/document_loaders/web/cheerio";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { MemoryVectorStore } from "langchain/vectorstores/memory";

export async function extractJobDetails(url: string) {
  const chatModel = new ChatOpenAI({});

  const loader = new CheerioWebBaseLoader(url);
  const docs = await loader.load();

  const splitter = new RecursiveCharacterTextSplitter({});
  // const transformer = new MozillaReadabilityTransformer();

  // const sequence = splitter.pipe(transformer);
  // const cleanedUpPage = await sequence.invoke(docs);

  const splitDocs = await splitter.invoke(docs, {});

  const embeddings = new OpenAIEmbeddings();

  const vectorstore = await MemoryVectorStore.fromDocuments(
    // cleanedUpPage,
    splitDocs,
    embeddings,
  );

  const prompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      `You job is to extract job detail information from text. Text was extracted from an HTML page, and may contain irrelevant information from the page.
Respond only with the information you can extract from page contents. Do not use any other sources of information. 

<page contents>       
{context}
</page contents>

Respond with just the answser to the question. Do not include the question in your response.
`,
    ],
    [
      "user",
      `Question: {input}
Answer: `,
    ],
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
