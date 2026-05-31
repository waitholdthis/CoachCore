"""
PDF and image text extraction with OCR fallback.
Returns structured page content with confidence scores.
"""
from __future__ import annotations
import io
import math
from dataclasses import dataclass, field
from pathlib import Path
from typing import IO

# PDF text extraction
from pdfminer.high_level import extract_pages
from pdfminer.layout import LTTextContainer, LTPage, LTFigure

# Image/OCR
from PIL import Image
import pytesseract


@dataclass
class PageContent:
    page_number: int
    text: str
    confidence: float  # 0.0–1.0; 1.0 = native PDF text
    is_ocr: bool = False
    word_count: int = 0

    def __post_init__(self):
        self.word_count = len(self.text.split())


@dataclass
class ExtractionResult:
    pages: list[PageContent] = field(default_factory=list)
    avg_confidence: float = 1.0
    total_words: int = 0
    extraction_method: str = "native_pdf"
    low_quality_pages: list[int] = field(default_factory=list)

    def __post_init__(self):
        if self.pages:
            confidences = [p.confidence for p in self.pages]
            self.avg_confidence = sum(confidences) / len(confidences)
            self.total_words = sum(p.word_count for p in self.pages)
            self.low_quality_pages = [p.page_number for p in self.pages if p.confidence < 0.70]

    @property
    def full_text(self) -> str:
        return "\n\n--- PAGE BREAK ---\n\n".join(
            f"[Page {p.page_number}]\n{p.text}" for p in self.pages
        )


def extract_pdf_native(file_path: Path) -> ExtractionResult:
    """Extract text from a native (selectable-text) PDF using pdfminer."""
    pages: list[PageContent] = []

    for page_num, page_layout in enumerate(extract_pages(str(file_path)), start=1):
        page_text_parts: list[str] = []
        for element in page_layout:
            if isinstance(element, LTTextContainer):
                text = element.get_text().strip()
                if text:
                    page_text_parts.append(text)

        page_text = "\n".join(page_text_parts).strip()

        if not page_text or len(page_text) < 20:
            # Page has no extractable text — likely a scanned image embedded in PDF
            ocr_page = _ocr_pdf_page(file_path, page_num)
            pages.append(ocr_page)
        else:
            pages.append(PageContent(
                page_number=page_num,
                text=page_text,
                confidence=1.0,
                is_ocr=False,
            ))

    return ExtractionResult(pages=pages, extraction_method="native_pdf")


def extract_image(file_path: Path) -> ExtractionResult:
    """Extract text from an image file using Tesseract OCR."""
    image = Image.open(file_path)
    image = _preprocess_image(image)

    ocr_data = pytesseract.image_to_data(image, output_type=pytesseract.Output.DICT)
    text = pytesseract.image_to_string(image)

    # Calculate confidence from word-level confidences (ignore -1 entries)
    confidences = [c for c in ocr_data["conf"] if c != -1]
    avg_conf = (sum(confidences) / len(confidences) / 100.0) if confidences else 0.5

    return ExtractionResult(
        pages=[PageContent(page_number=1, text=text.strip(), confidence=avg_conf, is_ocr=True)],
        extraction_method="tesseract_ocr",
    )


def extract_document(file_path: Path, mime_type: str | None = None) -> ExtractionResult:
    """Route to the appropriate extractor based on file type."""
    suffix = file_path.suffix.lower()

    if suffix in {".pdf"}:
        result = extract_pdf_native(file_path)
        # If avg confidence is low the PDF was likely scanned
        if result.avg_confidence < 0.60:
            result.extraction_method = "scanned_pdf_ocr"
        return result
    elif suffix in {".png", ".jpg", ".jpeg", ".tiff", ".bmp", ".webp"}:
        return extract_image(file_path)
    else:
        raise ValueError(f"Unsupported file type: {suffix}")


def _ocr_pdf_page(file_path: Path, page_num: int) -> PageContent:
    """OCR a single page from a PDF by converting it to an image first."""
    try:
        # Use pdf2image if available, otherwise skip
        from pdf2image import convert_from_path  # type: ignore
        images = convert_from_path(str(file_path), first_page=page_num, last_page=page_num, dpi=300)
        if not images:
            return PageContent(page_number=page_num, text="", confidence=0.0, is_ocr=True)
        image = _preprocess_image(images[0])
        text = pytesseract.image_to_string(image)
        ocr_data = pytesseract.image_to_data(image, output_type=pytesseract.Output.DICT)
        confidences = [c for c in ocr_data["conf"] if c != -1]
        avg_conf = (sum(confidences) / len(confidences) / 100.0) if confidences else 0.4
        return PageContent(page_number=page_num, text=text.strip(), confidence=avg_conf, is_ocr=True)
    except ImportError:
        # pdf2image not available — return empty with low confidence
        return PageContent(page_number=page_num, text="", confidence=0.0, is_ocr=True)


def _preprocess_image(image: Image.Image) -> Image.Image:
    """Apply deskew, contrast normalization, and grayscale for better OCR."""
    try:
        import cv2
        import numpy as np

        img_array = np.array(image.convert("RGB"))
        gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
        # Adaptive thresholding for uneven lighting
        thresh = cv2.adaptiveThreshold(
            gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2
        )
        return Image.fromarray(thresh)
    except ImportError:
        # cv2 not available — return grayscale conversion only
        return image.convert("L")
