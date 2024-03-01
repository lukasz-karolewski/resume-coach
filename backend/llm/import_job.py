from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain.chains.combine_documents import createStuffDocumentsChain
from langchain.chains.retrieval import createRetrievalChain
from langchain_community.document_loaders import WebBaseLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS

// import { MozillaReadabilityTransformer } from "@langchain/community/document_transformers/mozilla_readability";
async def extractJobDetails(url: str):
    chatModel = ChatOpenAI()

    loader = WebBaseLoader(url)
    docs = await loader.load()

    splitter = RecursiveCharacterTextSplitter()
    # transformer = MozillaReadabilityTransformer()

    # sequence = splitter.pipe(transformer)
    # cleanedUpPage = await sequence.invoke(docs)

    splitDocs = await splitter.invoke(docs, {})

    embeddings = OpenAIEmbeddings()

    vectorstore = await FAISS.fromDocuments(
        # cleanedUpPage,
        splitDocs,
        embeddings,
    )

    prompt = ChatPromptTemplate.fromMessages([
        [
            "system",
            "You job is to extract job detail information from text. Text was extracted from an HTML page, and may contain irrelevant information from the page.\nRespond only with the information you can extract from page contents. Do not use any other sources of information.\n\n<page contents>\n{context}\n</page contents>\n\nRespond with just the answser to the question. Do not include the question in your response.\n",
        ],
        [
            "user",
            "Question: {input}\nAnswer: ",
        ],
    ])

    documentChain = await createStuffDocumentsChain({
        "llm": chatModel,
        "prompt": prompt,
    })

    retriever = vectorstore.asRetriever()

    retrievalChain = await createRetrievalChain({
        "combineDocsChain": documentChain,
        "retriever": retriever,
    })

    jobTitle = await retrievalChain.invoke({
        "input": "What is the job title?",
    })

    jobDescription = await retrievalChain.invoke({
        "input": "What is the job description?",
    })

    companyName = await retrievalChain.invoke({
        "input": "What is the company name?",
    })

    return {
        "title": jobTitle.answer,
        "description": jobDescription.answer,
        "companyName": companyName.answer,
    }
