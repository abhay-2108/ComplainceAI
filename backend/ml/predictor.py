"""
predictor.py — RF-based risk scoring (new 15-feature LabelEncoder pipeline)

The saved pipeline (random_forest_model.pkl) is a dict:
    {
        'model':    RandomForestClassifier,
        'encoders': { 'From_Bank': LabelEncoder, 'To_Bank': ..., ... },
        'features': ['From_Bank', 'To_Bank', 'Receiving_Currency',
                     'Payment_Currency', 'Payment_Format',
                     'Log_Amount_Paid', 'Log_Amount_Received',
                     'Implied_Exchange_Rate', 'Is_Cross_Currency',
                     'Same_Bank_Transfer', 'Sender_Tx_Frequency',
                     'Receiver_Tx_Frequency', 'DayOfWeek',
                     'Is_Weekend', 'Time_of_Day']
    }

Categorical columns encoded with LabelEncoder (fit on HI-Small_Patterns.txt):
    From_Bank, To_Bank, Receiving_Currency, Payment_Currency, Payment_Format

For unknown categories the encoder uses the closest known label (index 0 fallback).
Sender/Receiver_Tx_Frequency and Same_Bank_Transfer are stored per-document
in MongoDB during ingestion; for live /predict-risk they are approximated.
"""

import numpy as np
import pandas as pd
import logging
from datetime import datetime

from backend.ml.model_loader import model_loader
from backend.models.schemas import RiskInput, RiskOutput

logger = logging.getLogger(__name__)

# Categorical columns that the LabelEncoders handle
_CAT_COLS = ["From_Bank", "To_Bank", "Receiving_Currency",
             "Payment_Currency", "Payment_Format"]


def _safe_encode(le, value: str) -> int:
    """LabelEncode a value; fall back to 0 for unseen categories."""
    try:
        return int(le.transform([str(value)])[0])
    except Exception:
        return 0


def _time_of_day(hour: int) -> int:
    """Replicate the pd.cut bins used in training: night=0, morning=1, afternoon=2, evening=3."""
    if hour <= 5:
        return 0
    elif hour <= 11:
        return 1
    elif hour <= 17:
        return 2
    else:
        return 3


def _build_features_from_dict(
    from_bank: str,
    to_bank: str,
    amount_paid: float,
    amount_received: float,
    payment_currency: str,
    receiving_currency: str,
    payment_format: str,
    hour: int,
    day_of_week: int,
    sender_tx_freq: int = 1,
    receiver_tx_freq: int = 1,
) -> pd.DataFrame:
    """
    Build the exact 15-feature DataFrame expected by the model.
    Uses the LabelEncoders stored inside model_loader.
    """
    encoders = model_loader.encoders
    features = model_loader.features  # ordered list

    log_paid     = float(np.log1p(amount_paid))
    log_received = float(np.log1p(amount_received))
    implied_rate = (amount_received / amount_paid) if amount_paid > 0 else 1.0
    is_cross_cur = int(payment_currency != receiving_currency)
    same_bank    = int(str(from_bank) == str(to_bank))
    is_weekend   = int(day_of_week in (5, 6))
    tod          = _time_of_day(hour)

    raw = {
        "From_Bank":             str(from_bank),
        "To_Bank":               str(to_bank),
        "Receiving_Currency":    str(receiving_currency),
        "Payment_Currency":      str(payment_currency),
        "Payment_Format":        str(payment_format),
        "Log_Amount_Paid":       log_paid,
        "Log_Amount_Received":   log_received,
        "Implied_Exchange_Rate": float(min(implied_rate, 1e6)),
        "Is_Cross_Currency":     is_cross_cur,
        "Same_Bank_Transfer":    same_bank,
        "Sender_Tx_Frequency":   int(sender_tx_freq),
        "Receiver_Tx_Frequency": int(receiver_tx_freq),
        "DayOfWeek":             day_of_week,
        "Is_Weekend":            is_weekend,
        "Time_of_Day":           tod,
    }

    # Label-encode categorical columns
    for col in _CAT_COLS:
        if col in encoders:
            raw[col] = _safe_encode(encoders[col], raw[col])
        else:
            raw[col] = 0  # fallback if encoder missing

    # Return in the exact column order the model was trained with
    ordered = features if features else list(raw.keys())
    df = pd.DataFrame([{k: raw[k] for k in ordered}])
    return df


# ─── Public helper: build from RiskInput (live /predict-risk endpoint) ────────

def _build_feature_row(risk_input: RiskInput) -> pd.DataFrame:
    ts_str = getattr(risk_input, "timestamp", None)
    try:
        ts = datetime.fromisoformat(ts_str) if ts_str else datetime.utcnow()
    except Exception:
        ts = datetime.utcnow()

    return _build_features_from_dict(
        from_bank       = str(getattr(risk_input, "from_bank", "0")),
        to_bank         = str(getattr(risk_input, "to_bank", "0")),
        amount_paid     = float(risk_input.amount_paid),
        amount_received = float(risk_input.amount_received),
        payment_currency   = str(risk_input.payment_currency),
        receiving_currency = str(risk_input.receiving_currency),
        payment_format  = str(risk_input.payment_format),
        hour            = getattr(risk_input, "hour", ts.hour),
        day_of_week     = getattr(risk_input, "day_of_week", ts.weekday()),
        sender_tx_freq  = 1,
        receiver_tx_freq= 1,
    )


# ─── Public helper: build from raw MongoDB transaction dict ───────────────────

def _build_feature_row_from_txn(txn: dict) -> pd.DataFrame:
    ts_raw = txn.get("timestamp")
    if isinstance(ts_raw, str):
        try:
            ts = datetime.fromisoformat(ts_raw)
        except Exception:
            ts = datetime.utcnow()
    elif isinstance(ts_raw, datetime):
        ts = ts_raw
    else:
        ts = datetime.utcnow()

    # DB field names match HI-Small_Patterns.txt column names (underscore)
    amount_paid     = float(txn.get("amount_paid") or txn.get("amount") or 0)
    amount_received = float(txn.get("amount_received") or amount_paid)
    from_bank       = str(txn.get("from_bank") or "0")
    to_bank         = str(txn.get("to_bank") or "0")
    payment_currency   = str(txn.get("payment_currency") or "US Dollar")
    receiving_currency = str(txn.get("receiving_currency") or "US Dollar")
    payment_format  = str(txn.get("payment_format") or txn.get("transaction_type") or "ACH")

    # Velocity features stored in DB during ingestion (default 1 if missing)
    sender_freq   = int(txn.get("sender_tx_frequency") or 1)
    receiver_freq = int(txn.get("receiver_tx_frequency") or 1)

    return _build_features_from_dict(
        from_bank        = from_bank,
        to_bank          = to_bank,
        amount_paid      = amount_paid,
        amount_received  = amount_received,
        payment_currency    = payment_currency,
        receiving_currency  = receiving_currency,
        payment_format   = payment_format,
        hour             = ts.hour,
        day_of_week      = ts.weekday(),
        sender_tx_freq   = sender_freq,
        receiver_tx_freq = receiver_freq,
    )


# ─── Risk predictor class ─────────────────────────────────────────────────────

class RiskPredictor:
    def __init__(self):
        self.loader = model_loader

    def _score_to_output(self, score: float) -> RiskOutput:
        if score >= 0.70:
            level = "HIGH"
        elif score >= 0.40:
            level = "MEDIUM"
        else:
            level = "LOW"
        return RiskOutput(
            risk_score=round(score, 4),
            risk_level=level,
            is_violation=(score >= 0.70),
        )

    def predict(self, input_data: RiskInput) -> RiskOutput:
        """Predict risk for a live /predict-risk API call."""
        try:
            if self.loader.is_ready:
                df    = _build_feature_row(input_data)
                proba = self.loader.model.predict_proba(df)
                score = float(proba[0][1])
                logger.info(f"RF score (live): {score:.4f}")
            else:
                logger.warning("RF model not loaded — heuristic fallback")
                score = self._heuristic_predict(input_data)

            return self._score_to_output(score)

        except Exception as e:
            logger.error(f"Prediction error: {e}", exc_info=True)
            raise

    def predict_from_transaction(self, txn: dict) -> RiskOutput:
        """Predict from a raw MongoDB transaction document (used by agent crew)."""
        try:
            if self.loader.is_ready:
                df    = _build_feature_row_from_txn(txn)
                proba = self.loader.model.predict_proba(df)
                score = float(proba[0][1])
                logger.info(f"RF score for {txn.get('transaction_id')}: {score:.4f}")
            else:
                logger.warning("RF model not loaded — heuristic fallback")
                score = self._heuristic_from_txn(txn)

            return self._score_to_output(score)

        except Exception as e:
            logger.error(f"predict_from_transaction error: {e}", exc_info=True)
            return RiskOutput(risk_score=0.5, risk_level="MEDIUM", is_violation=False)

    # ── Heuristic fallbacks (only if pkl missing) ─────────────────────────────

    def _heuristic_predict(self, data: RiskInput) -> float:
        score = 0.1
        amount = float(data.amount_paid or 0)
        if amount > 1_000_000:
            score += 0.4
        if str(data.payment_format) in ("Wire", "ACH", "Cash"):
            score += 0.2
        if str(data.payment_currency) != str(data.receiving_currency):
            score += 0.1
        return min(score, 1.0)

    def _heuristic_from_txn(self, txn: dict) -> float:
        score = 0.1
        if float(txn.get("amount_paid") or txn.get("amount") or 0) > 1_000_000:
            score += 0.4
        if str(txn.get("payment_format") or txn.get("transaction_type") or "") in ("Wire", "ACH", "Cash"):
            score += 0.2
        return min(score, 1.0)


predictor = RiskPredictor()
