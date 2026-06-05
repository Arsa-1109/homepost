"""
Resend Email Service

All transactional emails for the Homepost portal.
Every function is fire-and-forget (wrapped in try/except).
A failed email should NEVER roll back a database transaction.

Email functions:
  - send_maintenance_notification → landlord
  - send_status_update → tenant (only for changes AWAY from "open")
  - send_pending_tenant_notification → landlord
  - send_approval_notification → tenant
  - send_denial_notification → tenant
  - send_rent_reminder → tenant
  - send_lease_expiry_reminder → tenant
"""

import logging

import resend

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

resend.api_key = settings.resend_api_key

# Sender address — use your verified Resend domain
FROM_EMAIL = "Homepost <noreply@yourdomain.com>"


def _send_email(to: str, subject: str, html: str) -> None:
    """
    Internal helper — sends an email via Resend.
    Wrapped in try/except: email failures are logged, not raised.
    """
    try:
        resend.Emails.send(
            {
                "from": FROM_EMAIL,
                "to": [to],
                "subject": subject,
                "html": html,
            }
        )
    except Exception as e:
        logger.error(f"Failed to send email to {to}: {e}")


# ---------------------------------------------------------------------------
# Maintenance Notifications
# ---------------------------------------------------------------------------


def send_maintenance_notification(
    landlord_email: str,
    tenant_name: str,
    unit_label: str,
    request_title: str,
    priority: str,
) -> None:
    """Notify landlord when a tenant submits a new maintenance request."""
    subject = f"🔧 New Maintenance Request — {unit_label}"
    html = f"""
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">New Maintenance Request</h2>
        <p><strong>{tenant_name}</strong> submitted a request for <strong>{unit_label}</strong>.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr><td style="padding: 8px; color: #6b7280;">Title</td><td style="padding: 8px;">{request_title}</td></tr>
            <tr><td style="padding: 8px; color: #6b7280;">Priority</td><td style="padding: 8px;">{priority.upper()}</td></tr>
        </table>
        <p>Log in to your dashboard to review and respond.</p>
    </div>
    """
    _send_email(landlord_email, subject, html)


def send_reopen_notification(
    landlord_email: str,
    tenant_name: str,
    unit_label: str,
    request_title: str,
) -> None:
    """Notify landlord when a tenant reopens a resolved maintenance request."""
    subject = f"⚠️ Maintenance Request Reopened — {unit_label}"
    html = f"""
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ef4444;">Maintenance Request Reopened</h2>
        <p><strong>{tenant_name}</strong> has reopened a request for <strong>{unit_label}</strong> that was previously resolved.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr><td style="padding: 8px; color: #6b7280;">Title</td><td style="padding: 8px;">{request_title}</td></tr>
        </table>
        <p>Log in to your dashboard to review and address the issue.</p>
    </div>
    """
    _send_email(landlord_email, subject, html)


def send_status_update(
    tenant_email: str,
    request_title: str,
    new_status: str,
) -> None:
    """Notify tenant when their maintenance request status changes (not 'open')."""
    status_messages = {
        "in_progress": "Your landlord is working on it! 🛠️",
        "resolved": "Great news — your request has been resolved! ✅",
        "closed": "This request has been closed. 📋",
    }
    message = status_messages.get(new_status, f"Status updated to: {new_status}")

    subject = f"📋 Request Update — {request_title}"
    html = f"""
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">Maintenance Request Update</h2>
        <p>Your request "<strong>{request_title}</strong>" has been updated.</p>
        <p style="font-size: 18px; padding: 16px; background: #1e293b; color: #f8fafc; border-radius: 8px; text-align: center;">
            {message}
        </p>
        <p>If the issue isn't fully resolved, you can reopen the request from your dashboard.</p>
    </div>
    """
    _send_email(tenant_email, subject, html)


# ---------------------------------------------------------------------------
# Onboarding Notifications
# ---------------------------------------------------------------------------


def send_pending_tenant_notification(
    landlord_email: str,
    tenant_name: str,
    tenant_email: str,
) -> None:
    """Notify landlord when a new tenant requests access."""
    subject = "👋 New Tenant Request — Action Required"
    html = f"""
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">Someone wants to join your portal</h2>
        <p><strong>{tenant_name}</strong> ({tenant_email}) has requested to be added as a tenant.</p>
        <p>Log in to your dashboard to approve or deny this request.</p>
    </div>
    """
    _send_email(landlord_email, subject, html)


def send_approval_notification(
    tenant_email: str,
    property_name: str,
    unit_label: str,
) -> None:
    """Notify tenant when their access request is approved."""
    subject = "🎉 You're in! Welcome to your new portal"
    html = f"""
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">Welcome aboard!</h2>
        <p>Your landlord has approved your access to <strong>{property_name} — {unit_label}</strong>.</p>
        <p>You can now log in to submit maintenance requests, view announcements, and access shared documents.</p>
    </div>
    """
    _send_email(tenant_email, subject, html)


def send_denial_notification(tenant_email: str) -> None:
    """Notify tenant when their access request is denied — with empathy."""
    subject = "Your portal access request"
    html = """
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">About your access request</h2>
        <p>Unfortunately, your landlord wasn't able to approve your request at this time.</p>
        <p>This might just be a mix-up! Here's what you can try:</p>
        <ul>
            <li>Ask your landlord to send you a direct invite link</li>
            <li>Double-check that you entered the correct landlord email</li>
            <li>Try registering again with the right details</li>
        </ul>
        <p>We're here to help you get settled in. 🏠</p>
    </div>
    """
    _send_email(tenant_email, subject, html)


# ---------------------------------------------------------------------------
# Scheduled Reminders
# ---------------------------------------------------------------------------


def send_rent_reminder(
    tenant_email: str,
    unit_label: str,
    days_until_due: int,
) -> None:
    """Remind tenant about upcoming rent due date."""
    subject = f"💰 Rent Reminder — Due in {days_until_due} day{'s' if days_until_due != 1 else ''}"
    html = f"""
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">Rent Reminder</h2>
        <p>Just a friendly heads-up — your rent for <strong>{unit_label}</strong>
           is due in <strong>{days_until_due} day{'s' if days_until_due != 1 else ''}</strong>.</p>
        <p>Make sure to arrange your payment on time. 🙏</p>
    </div>
    """
    _send_email(tenant_email, subject, html)


def send_lease_expiry_reminder(
    tenant_email: str,
    unit_label: str,
    days_until_expiry: int,
) -> None:
    """Remind tenant about upcoming lease expiry."""
    subject = f"📄 Lease Expiry Notice — {days_until_expiry} days remaining"
    html = f"""
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">Lease Expiry Reminder</h2>
        <p>Your lease for <strong>{unit_label}</strong> expires in
           <strong>{days_until_expiry} days</strong>.</p>
        <p>Please reach out to your landlord to discuss renewal or move-out plans.</p>
    </div>
    """
    _send_email(tenant_email, subject, html)
