import re
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

class DataMasker:
    def __init__(self):
        # Fields that should be masked
        self.sensitive_fields = ["account_number", "employee_id", "email", "account_id"]

    def mask_dict(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Recursively mask sensitive fields in a dictionary.
        """
        masked_data = data.copy()
        for key, value in masked_data.items():
            if isinstance(value, dict):
                masked_data[key] = self.mask_dict(value)
            elif key.lower() in self.sensitive_fields:
                masked_data[key] = self.mask_value(key, value)
        return masked_data

    def mask_value(self, field_name: str, value: Any) -> str:
        if value is None:
            return "N/A"
        
        val_str = str(value)
        field_lower = field_name.lower()

        if "email" in field_lower:
            if "@" in val_str:
                parts = val_str.split("@")
                return f"{parts[0][0]}***@{parts[1]}"
            return "***@***.***"
        
        if "account" in field_lower:
            return f"XXXX{val_str[-4:]}" if len(val_str) > 4 else "XXXX"

        if "id" in field_lower:
            return f"{val_str[:3]}XXXX" if len(val_str) > 3 else "XXXX"

        return "MASKED"

masker = DataMasker()
