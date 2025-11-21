# House Price Prediction – Django + ML

The idea behind the project is to combine a practical machine learning model with a clean, easy-to-use frontend so anyone can try out predictions without writing code.

## Features

- Predict house prices using a trained ML model  
- Clean and responsive UI for entering property details  
- Prediction output in Indian currency format  
- Basic input validation  
- Model loaded once and reused (cached) for faster inference  
- Also supports prediction through a POST API  

## Tech Stack

- **Backend:** Django 5.2  
- **ML Model:** XGBoost, scikit-learn  
- **Data Handling:** pandas, numpy  
- **Frontend:** HTML, CSS, JavaScript  
- **Database:** SQLite (default)  
- **API:** Django REST Framework  

## Project Structure

```
House_Price_Prediction/
│
├── House_Price_Prediction/      
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
│
├── myapp/                        
│   ├── views.py
│   ├── utils.py
│   ├── templates/
│   │   ├── base.html
│   │   └── predict.html
│   └── static/
│
├── ML_Files/                     
│   ├── best_house_price_model.pkl
│   ├── model_features.pkl
│   ├── model_config.pkl
│   ├── property_type_encoder.pkl
│   └── city_encoder.pkl
│
├── requirements.txt
└── manage.py
```

## Getting Started

### 1. Create and activate virtual environment
```
python -m venv venv
```

Windows:
```
venv\Scripts\activate
```

Linux / macOS:
```
source venv/bin/activate
```

### 2. Install dependencies
```
pip install -r requirements.txt
```

### 3. Run migrations
```
python manage.py migrate
```

### 4. Start the server
```
python manage.py runserver
```

Open the app in your browser:
```
http://127.0.0.1:8000/
```

## How the Model Works (Short Summary)

The ML model is an **XGBoost Regressor** trained on Indian housing data.  
The dataset includes features like bedrooms, bathrooms, area, latitude, longitude, property type, etc.

Some engineered features:
- bedrooms × bathrooms  
- living_area / lot_area  
- area per bedroom  
- latitude × longitude  

## API Example (POST)

```
POST /
Content-Type: application/json
```

Example body:
```json
{
  "bedrooms": 3,
  "bathrooms": 2,
  "living_area": 1200,
  "lot_area": 1500,
  "floor": 3,
  "property_type": "Flat",
  "latitude": 28.4595,
  "longitude": 77.0266
}
```

Example response:
```json
{
  "predicted_price": "₹ 1.54 Crore"
}
```

## Troubleshooting

- Ensure `.pkl` files are in `ML_Files/`
- Run `collectstatic` if static files don’t load
- XGBoost "BoosterFree" warning on Windows is harmless

## Future Improvements

- Deployment on AWS / Railway / Render  
- Google Maps location auto-complete  
- City-specific models  
- Docker support  

## Author

**Md Ali Raza**  
Backend Developer – Python, Django, Machine Learning  
LinkedIn: https://linkedin.com/in/Mdaliraza  
GitHub: https://github.com/MdAliRaza1
