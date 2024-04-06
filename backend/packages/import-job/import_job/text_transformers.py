
from typing import Any, List, Sequence
from langchain_core.documents import BaseDocumentTransformer, Document

class ReadibilityPyDocumentTransformer(BaseDocumentTransformer):

    def __init__(self) -> None:
        """
        Initialize the transformer.

        This checks if the BeautifulSoup4 package is installed.
        If not, it raises an ImportError.
        """
        try:
            from readabilipy import simple_json_from_html_string  # noqa:F401
        except ImportError:
            raise ImportError(
                "readabilipy is required for ReadibilityPyDocumentTransformer. "
                "Please install it with `pip install readabilipy`."
            )


    def transform_documents(
        self,
        documents: Sequence[Document],
        **kwargs: Any,
    ) -> Sequence[Document]:
        """
        Transform a list of Document objects by cleaning their HTML content.

        Args:
            documents: A sequence of Document objects containing HTML content.

        Returns:
            A sequence of Document objects with transformed content.
        """
        for doc in documents:
            cleaned_content = self.clean_page_content(doc.page_content)
            doc.page_content = cleaned_content

        return documents

    @staticmethod
    def clean_page_content(page_content: str) -> str:
        from readabilipy import simple_json_from_html_string

        article_json = simple_json_from_html_string(page_content)
        print(article_json)
        plain_text = ''.join([p['text'] for p in article_json.get('plain_text', []) or []])

        print(plain_text)

        return plain_text

    async def atransform_documents(
        self,
        documents: Sequence[Document],
        **kwargs: Any,
    ) -> Sequence[Document]:
        raise NotImplementedError