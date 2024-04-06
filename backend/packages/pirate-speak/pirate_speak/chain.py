from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import SystemMessage

_prompt = ChatPromptTemplate.from_messages(
    [
        SystemMessage(content="Translate user input into pirate speak"),
        MessagesPlaceholder("chat_history"),
        ("human", "{text} {text2}"),
    ]
)
_model = ChatOpenAI()

# if you update this, you MUST also update ../pyproject.toml
# with the new `tool.langserve.export_attr`
chain = _prompt | _model
