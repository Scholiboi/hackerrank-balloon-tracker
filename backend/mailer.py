import os
import io
import json
import smtplib
from email.mime.image import MIMEImage
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path
import qrcode
from dotenv import load_dotenv

# ══════════════════════════════════════════════════════════════════════════════
# Config
# ══════════════════════════════════════════════════════════════════════════════

load_dotenv()

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SENDER_EMAIL = os.getenv("EMAIL")
SENDER_PASS = os.getenv("PASSWORD")

BASE_DIR = Path(__file__).parent
TEMPLATE_PATH = BASE_DIR / "templates" / "balloon_email.html"
LOGO_PATH = BASE_DIR / "code_uncode_logo.png"
LAB_DIR = BASE_DIR / "lab_images copy"

# ══════════════════════════════════════════════════════════════════════════════
# Gym Mapping (Same as Pokédex project)
# ══════════════════════════════════════════════════════════════════════════════

GYM_MAP = {
    "Lab 1": {
        "gym_color": "#F08030",
        "gym_shadow": "rgba(240, 128, 48, 0.4)",
        "gym_badge": "🔥 FIRE GYM",
        "pokemon": "Charmander",
        "lab_image": "fire_type_lab1.png",
        "gym_name": "Fire Gym"
    },
    "Lab 2": {
        "gym_color": "#6890F0",
        "gym_shadow": "rgba(104, 144, 240, 0.4)",
        "gym_badge": "💧 WATER GYM",
        "pokemon": "Squirtle",
        "lab_image": "water_type_lab2.png",
        "gym_name": "Water Gym"
    },
    "Lab 3": {
        "gym_color": "#78C850",
        "gym_shadow": "rgba(120, 200, 80, 0.4)",
        "gym_badge": "🌿 GRASS GYM",
        "pokemon": "Bulbasaur",
        "lab_image": "grass_type_lab3.png",
        "gym_name": "Grass Gym"
    },
    "Lab 4": {
        "gym_color": "#A864C8",
        "gym_shadow": "rgba(168, 100, 200, 0.4)",
        "gym_badge": "👻 GHOST GYM",
        "pokemon": "Gengar",
        "lab_image": "ghost_type_lab4.png",
        "gym_name": "Ghost Gym"
    },
}

# ══════════════════════════════════════════════════════════════════════════════
# Core Logic
# ══════════════════════════════════════════════════════════════════════════════

def generate_qr_png(data: dict) -> bytes:
    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=10,
        border=2
    )
    qr.add_data(json.dumps(data, ensure_ascii=False))
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()

def build_pokedex_email(p: dict):
    """
    p keys: Name, Email, hackerrank_id, lab, seat
    """
    if not TEMPLATE_PATH.exists():
        raise FileNotFoundError(f"Template not found at {TEMPLATE_PATH}")

    template_html = TEMPLATE_PATH.read_text(encoding="utf-8")
    
    lab_key = p.get("lab", "Lab 1")
    gym = GYM_MAP.get(lab_key, GYM_MAP["Lab 1"])

    # Template Replacements
    html = template_html
    html = html.replace("{{NAME}}", p.get("name", "Trainer"))
    html = html.replace("{{USERNAME}}", p.get("hackerrank_id", "N/A"))
    html = html.replace("{{EMAIL}}", p.get("email", ""))
    html = html.replace("{{LAB_NAME}}", p.get("lab", "N/A"))
    html = html.replace("{{SEAT_NO}}", str(p.get("seat", "")))
    html = html.replace("{{GYM_COLOR}}", gym["gym_color"])
    html = html.replace("{{GYM_SHADOW}}", gym["gym_shadow"])
    html = html.replace("{{GYM_BADGE}}", gym["gym_badge"])
    html = html.replace("{{GYM_NAME}}", gym["gym_name"])
    html = html.replace("{{POKEMON}}", gym["pokemon"])

    # Build MIME
    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"Code Uncode: Your Gym Challenge Awaits, {p.get('name')}!"
    msg["From"] = f"CodeStars Team <{SENDER_EMAIL}>"
    msg["To"] = p.get("email")

    msg_related = MIMEMultipart("related")
    msg_related.attach(MIMEText(html, "html"))

    # 1. Logo
    if LOGO_PATH.exists():
        logo_img = MIMEImage(LOGO_PATH.read_bytes(), _subtype="png")
        logo_img.add_header("Content-ID", "<logo>")
        logo_img.add_header("Content-Disposition", "inline", filename="logo.png")
        msg_related.attach(logo_img)

    # 2. Lab Banner
    lab_img_path = LAB_DIR / gym["lab_image"]
    if lab_img_path.exists():
        lab_img = MIMEImage(lab_img_path.read_bytes(), _subtype="png")
        lab_img.add_header("Content-ID", "<lab_image>")
        lab_img.add_header("Content-Disposition", "inline", filename="lab_image.png")
        msg_related.attach(lab_img)

    # 3. QR Code
    qr_data = {
        "hr_id": p.get("hackerrank_id"),
        "name": p.get("name"),
        "lab": p.get("lab"),
        "seat": p.get("seat")
    }
    qr_png = generate_qr_png(qr_data)
    qr_img = MIMEImage(qr_png, _subtype="png")
    qr_img.add_header("Content-ID", "<qrcode>")
    qr_img.add_header("Content-Disposition", "inline", filename="qr.png")
    msg_related.attach(qr_img)

    # Plain text fallback
    text = (
        f"Code Uncode Finals - Trainer Summons\n"
        f"{'=' * 40}\n\n"
        f"Hey {p.get('name')}!\n\n"
        f"HackerRank ID: {p.get('hackerrank_id')}\n"
        f"Lab: {p.get('lab')}\n"
        f"Seat: {p.get('seat')}\n\n"
        f"Live Leaderboard: https://cuc.scholiboi.dev\n"
    )

    msg.attach(MIMEText(text, "plain"))
    msg.attach(msg_related)
    return msg

def send_email(msg: MIMEMultipart):
    if not SENDER_EMAIL or not SENDER_PASS:
        raise ValueError("SMTP credentials not configured in environment")

    # Use a context manager for SMTP
    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.starttls()
        server.login(SENDER_EMAIL, SENDER_PASS)
        server.sendmail(SENDER_EMAIL, [msg["To"]], msg.as_string())
