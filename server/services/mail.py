import base64
import html
import logging
import os
from typing import Optional

import requests

logger = logging.getLogger(__name__)

BREVO_SMTP_URL = "https://api.brevo.com/v3/smtp/email"


class MailConfigurationError(RuntimeError):
    pass


class MailDeliveryError(RuntimeError):
    pass


def mail_is_configured() -> bool:
    return bool(os.getenv("BREVO_API_KEY") and os.getenv("MAIL_FROM"))


def send_welcome_email(to_email: str, name: str = "") -> bool:
    if not mail_is_configured():
        logger.info("Skipping welcome email because mail is not configured.")
        return False

    display_name = html.escape(name.strip() or "there")
    send_transactional_email(
        to_email=to_email,
        to_name=name,
        subject="Welcome to Green Taxonomy Risk Scorer",
        html_content=f"""
        <html>
          <body>
            <p>Hi {display_name},</p>
            <p>Your Green Taxonomy Risk Scorer account is ready.</p>
            <p>You can now score loans, download PDF reports, and keep a history of your submissions.</p>
          </body>
        </html>
        """,
    )
    return True


def send_report_email(
    *,
    to_email: str,
    to_name: str,
    loan_id: str,
    pdf_bytes: bytes,
) -> None:
    encoded_pdf = base64.b64encode(pdf_bytes).decode("ascii")
    send_transactional_email(
        to_email=to_email,
        to_name=to_name,
        subject="Your Green Taxonomy Loan Risk Report",
        html_content="""
        <html>
          <body>
            <p>Hello,</p>
            <p>Your Green Taxonomy loan risk report is attached as a PDF.</p>
            <p>This report is a decision-support document and does not replace formal compliance review.</p>
          </body>
        </html>
        """,
        attachments=[
            {
                "content": encoded_pdf,
                "name": f"loan_report_{loan_id[:8]}.pdf",
            }
        ],
    )


def send_transactional_email(
    *,
    to_email: str,
    subject: str,
    html_content: str,
    to_name: str = "",
    attachments: Optional[list[dict[str, str]]] = None,
) -> None:
    api_key = os.getenv("BREVO_API_KEY")
    from_email = os.getenv("MAIL_FROM")
    from_name = os.getenv("MAIL_FROM_NAME", "Green Taxonomy Risk Scorer")

    if not api_key or not from_email:
        raise MailConfigurationError("BREVO_API_KEY and MAIL_FROM must be set to send email.")

    payload = {
        "sender": {"name": from_name, "email": from_email},
        "to": [{"email": to_email, "name": to_name or to_email}],
        "subject": subject,
        "htmlContent": html_content,
    }
    if attachments:
        payload["attachment"] = attachments

    try:
        response = requests.post(
            BREVO_SMTP_URL,
            headers={
                "accept": "application/json",
                "api-key": api_key,
                "content-type": "application/json",
            },
            json=payload,
            timeout=15,
        )
        response.raise_for_status()
    except requests.RequestException as exc:
        raise MailDeliveryError(f"Brevo email delivery failed: {exc}") from exc
