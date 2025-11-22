import pickle
import os
import sys
import warnings
import numpy as np
import pandas as pd
from pathlib import Path
from django.conf import settings

# Suppress XGBoost cleanup warnings (harmless but annoying)
warnings.filterwarnings('ignore', category=UserWarning)

# Suppress XGBoost cleanup errors in __del__ (known XGBoost issue)
# This error occurs during garbage collection and is harmless
# We filter stderr to suppress this specific error message
_original_stderr_write = sys.stderr.write

def filtered_stderr_write(message):
    """Filter out XGBoost cleanup errors while preserving other stderr output"""
    if isinstance(message, str):
        # Filter out XGBoost cleanup errors
        if 'Exception ignored in: <function Booster.__del__' in message:
            return
        if 'AttributeError' in message and 'XGBoosterFree' in message:
            return
    _original_stderr_write(message)

# Only apply filter if not already applied
if sys.stderr.write != filtered_stderr_write:
    sys.stderr.write = filtered_stderr_write

import logging
logger = logging.getLogger(__name__)

# Cache for loaded model artifacts
_model_cache = {
    'model': None,
    'features': None,
    'config': None,
    'property_type_encoder': None,
    'city_encoder': None
}


def get_ml_files_path():
    """Get the path to ML_Files directory"""
    base_dir = Path(__file__).resolve().parent.parent
    ml_files_path = base_dir / 'ML_Files'
    return ml_files_path


def load_model_artifacts():
    """Load all ML model artifacts from pickle files"""
    ml_path = get_ml_files_path()
    
    # Return cached models if already loaded
    if _model_cache['model'] is not None:
        return _model_cache
    
    try:
        # Load model with proper error handling for XGBoost cleanup warnings
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            with open(ml_path / 'best_house_price_model.pkl', 'rb') as f:
                _model_cache['model'] = pickle.load(f)
            
            # Ensure XGBoost model is properly initialized
            # This helps prevent cleanup issues
            if hasattr(_model_cache['model'], 'get_booster'):
                try:
                    _model_cache['model'].get_booster()
                except:
                    pass
        
        # Load features
        with open(ml_path / 'model_features.pkl', 'rb') as f:
            _model_cache['features'] = pickle.load(f)
        
        # Load config
        with open(ml_path / 'model_config.pkl', 'rb') as f:
            _model_cache['config'] = pickle.load(f)
        
        # Load property type encoder
        try:
            with open(ml_path / 'property_type_encoder.pkl', 'rb') as f:
                _model_cache['property_type_encoder'] = pickle.load(f)
        except FileNotFoundError:
            _model_cache['property_type_encoder'] = None
        
        # Load city encoder (may not be used)
        try:
            with open(ml_path / 'city_encoder.pkl', 'rb') as f:
                _model_cache['city_encoder'] = pickle.load(f)
        except FileNotFoundError:
            _model_cache['city_encoder'] = None
        
        logger.info("Model artifacts loaded successfully")
        return _model_cache
    
    except Exception as e:
        logger.error(f"Error loading model artifacts: {str(e)}")
        raise Exception(f"Error loading model artifacts: {str(e)}")


def get_property_types():
    """Get list of available property types from encoder"""
    artifacts = load_model_artifacts()
    encoder = artifacts['property_type_encoder']
    if encoder is not None:
        return list(encoder.classes_)
    return ['Flat', 'House', 'Apartment']  # Default fallback


def predict_house_price(input_dict):
    """
    Predict house price based on input features.
    This function matches the notebook's predict_price function exactly.
    It handles encoding and feature engineering automatically.
    
    Args:
        input_dict: Dictionary containing property features (just provide basic data)
        
    Returns:
        Predicted price as float
    """
    artifacts = load_model_artifacts()
    model = artifacts['model']
    features = artifacts['features']
    config = artifacts['config']
    property_type_encoder = artifacts['property_type_encoder']
    
    # Create a copy of input dict
    d = input_dict.copy()
    
    # Encode property type (handled automatically)
    if "property_type_encoded" not in d:
        if property_type_encoder is not None and "property_type" in d:
            val = d["property_type"]
            if isinstance(val, str):
                if val not in property_type_encoder.classes_:
                    raise ValueError(f"Unknown property_type: {val}")
                d["property_type_encoded"] = int(property_type_encoder.transform([val])[0])
            else:
                d["property_type_encoded"] = int(val)
        else:
            d["property_type_encoded"] = 0
    
    # Validate basic required features
    if "number of bedrooms" not in d or "number of bathrooms" not in d:
        raise KeyError("number of bedrooms and number of bathrooms are required.")
    
    if "living area" not in d or "lot area" not in d:
        raise KeyError("living area and lot area are required.")
    
    # Compute engineered features automatically (model needs these)
    d["bedrooms_x_bathrooms"] = d["number of bedrooms"] * d["number of bathrooms"]
    d["Living_vs_Lot_Ratio"] = d["living area"] / max(d["lot area"], 1)
    d["area_per_bedroom"] = d["living area"] / (d["number of bedrooms"] + 1)
    d["lot_per_living"] = d["lot area"] / (d["living area"] + 1)
    
    # Validate and compute location features
    if "Lattitude" not in d or "Longitude" not in d:
        raise KeyError("Lattitude and Longitude are required.")
    d["lat_x_lon"] = d["Lattitude"] * d["Longitude"]
    
    # Build dataframe with exact feature order (model expects this)
    for f in features:
        if f not in d:
            raise KeyError(f"Missing required feature: {f}")
    
    df_input = pd.DataFrame([{f: d[f] for f in features}])
    
    # Type check
    for col in df_input.columns:
        if not np.issubdtype(type(df_input[col].iloc[0]), np.number):
            raise TypeError(f"Feature '{col}' must be numeric, got {type(df_input[col].iloc[0])}.")
    
    # Make prediction
    pred_log = model.predict(df_input)
    if np.isnan(pred_log).any():
        raise ValueError("Model prediction is NaN.")
    
    # Apply inverse log transformation if needed
    if config.get("log_target", False):
        return float(np.expm1(pred_log)[0])
    return float(pred_log[0])

