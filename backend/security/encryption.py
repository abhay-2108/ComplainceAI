from cryptography.fernet import Fernet
import logging
from backend.config.settings import settings

logger = logging.getLogger(__name__)

class DataEncryptor:
    def __init__(self):
        # In a real app, generate this once and store in env secrets
        # For this demo, we ensure it's a valid Fernet key
        try:
            self.key = settings.ENCRYPTION_KEY.encode()
            # Fernet keys must be 32 url-safe base64-encoded bytes
            # If the user provided a placeholder, we generate a stable one for the session
            if len(self.key) != 44:
                logger.warning("Invalid ENCRYPTION_KEY length. Generating session-stable key.")
                import hashlib
                import base64
                digest = hashlib.sha256(self.key).digest()
                self.key = base64.urlsafe_b64encode(digest)
            
            self.cipher = Fernet(self.key)
        except Exception as e:
            logger.error(f"Error initializing encryptor: {e}")
            # Fallback to a random key if all fails (not for production)
            self.key = Fernet.generate_key()
            self.cipher = Fernet(self.key)

    def encrypt(self, plain_text: str) -> str:
        if not plain_text: return plain_text
        return self.cipher.encrypt(plain_text.encode()).decode()

    def decrypt(self, cipher_text: str) -> str:
        if not cipher_text: return cipher_text
        try:
            return self.cipher.decrypt(cipher_text.encode()).decode()
        except Exception as e:
            logger.error(f"Decryption failed: {e}")
            return "DECRYPTION_ERROR"

encryptor = DataEncryptor()
