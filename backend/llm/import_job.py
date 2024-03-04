from langchain_community.document_loaders import WebBaseLoader
from langchain_community.vectorstores import FAISS
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter


def extractJobDetails(url: str):
    llm = ChatOpenAI()

    loader = WebBaseLoader(url)
    docs = loader.load()
    embeddings = OpenAIEmbeddings()

    prompt = ChatPromptTemplate.from_messages(
        [
            # ("system",
            # "You job is to extract job detail information from text. Text was extracted from an HTML page, and may contain irrelevant information from the page.\nRespond only with the information you can extract from page contents. Do not use any other sources of information.\n\n<page contents>\n{context}\n</page contents>\n\nRespond with just the answser to the question. Do not include the question in your response.\n",),
            # ("user",
            # "Question: {input}\nAnswer: ",)
            ("system", "You are world class technical documentation writer."),
            (
                "user",
                "{input}",
            ),
        ]
    )
    output_parser = StrOutputParser()

    chain = prompt | llm | output_parser

    output = chain.invoke({"input": "how can langsmith help with testing?"})

    return chain
