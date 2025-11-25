# Portfolio & House Price Prediction

My personal portfolio website built with Django, featuring an interactive ML-powered house price prediction tool. This project combines my backend development skills with machine learning to create a practical, production-ready application.

Built by **Md Ali Raza** - Python Backend Developer & ML Engineer

## What's Inside

- **Portfolio Homepage** - My professional profile, skills, projects, and experience
- **House Price Prediction Tool** - Interactive ML model that predicts property prices based on features like bedrooms, bathrooms, location, etc.
- **XGBoost ML Model** - Trained on Indian real estate data with 87.6% R² score
- **Responsive Design** - Works well on desktop and mobile
- **Indian Currency Support** - Prices displayed in ₹ (Rupees) with proper formatting
- **AWS Deployment** - Set up with CI/CD for automated deployments

## Technology Stack

- **Backend**: Django 5.2
- **Machine Learning**: XGBoost, scikit-learn, pandas, numpy
- **Database**: SQLite3
- **Frontend**: HTML, CSS, JavaScript
- **API**: Django REST Framework
- **Production Server**: Gunicorn + Nginx

## Project Structure

```
House_Price_Prediction/
├── House_Price_Prediction/     # Django project settings
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── portfolio/                  # Portfolio application
│   ├── views.py               # Portfolio views
│   ├── urls.py                # Portfolio URL routing
│   └── apps.py
├── price_prediction/           # Price prediction application
│   ├── views.py               # Prediction view logic
│   ├── utils.py               # ML model utilities
│   ├── urls.py                # Prediction URL routing
│   └── apps.py
├── templates/                  # Centralized templates
│   ├── base.html              # Shared base template
│   ├── portfolio/
│   │   └── home.html          # Portfolio homepage
│   └── price_prediction/
│       └── predict.html        # Price prediction form
├── static/                     # Centralized static files
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── main.js
├── ML_Files/                  # Machine learning artifacts
│   ├── best_house_price_model.pkl
│   ├── model_features.pkl
│   ├── model_config.pkl
│   ├── property_type_encoder.pkl
│   ├── city_encoder.pkl
│   ├── House Price Prediction Final.ipynb  # Model training notebook
│   └── House_Price_India.csv               # Training dataset
├── .github/workflows/         # CI/CD workflows
│   └── deploy.yml
├── requirements.txt           # Python dependencies
├── settings.ini.example      # Settings template
├── deploy.sh                 # Deployment script
├── setup_aws.sh              # AWS EC2 setup script
├── manage.py
└── db.sqlite3
```

## Prerequisites

You'll need:

- Python 3.8 or higher
- pip (Python package manager)
- Virtual environment (recommended)
- Git (for deployment)

## Installation

1. **Clone or download the repository**:
   ```bash
   git clone https://github.com/Mdaliraza1/House-Price-Prediction-Using-RF/
   cd House_Price_Prediction
   ```

2. **Create a virtual environment** (recommended):
   ```bash
   python -m venv venv
   ```

3. **Activate the virtual environment**:
   - On Windows:
     ```bash
     venv\Scripts\activate
     ```
   - On macOS/Linux:
     ```bash
     source venv/bin/activate
     ```

4. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```
   
   The `requirements.txt` file includes all necessary dependencies:
   - Django 5.2.8
   - Django REST Framework
   - XGBoost 3.1.1 (for the ML model)
   - scikit-learn 1.7.2
   - pandas 2.3.3
   - numpy 2.3.5
   - Gunicorn (for production)
   - And other supporting libraries

5. **Configure settings**:
   ```bash
   cp settings.ini.example settings.ini
   ```
   Edit `settings.ini` with your configuration (see Configuration section below).

6. **Run migrations** (if needed):
   ```bash
   python manage.py migrate
   ```

7. **Collect static files**:
   ```bash
   python manage.py collectstatic
   ```

## Configuration

### Settings.ini

The application uses `settings.ini` for configuration. Copy `settings.ini.example` to `settings.ini` and configure:

```ini
[DEFAULT]
ENVIRONMENT=development
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

[PRODUCTION]
ENVIRONMENT=production
DEBUG=False
ALLOWED_HOSTS=your-domain.com,www.your-domain.com
```

**Important**: Never commit `settings.ini` to version control! It contains sensitive information.

## Usage

1. **Start the development server**:
   ```bash
   python manage.py runserver
   ```

2. **Open your web browser** and navigate to:
   ```
   http://127.0.0.1:8000/
   ```
   
   This will take you to the portfolio homepage.

3. **Navigate to the ML Project** by clicking "ML Project" in the navigation or going to:
   ```
   http://127.0.0.1:8000/house-price-prediction/
   ```

4. **Fill in the property details**:
   - Number of Bedrooms
   - Number of Bathrooms
   - Living Area (sq ft)
   - Lot Area (sq ft)
   - Floor Number
   - Property Type
   - Latitude
   - Longitude

5. **Click "Predict Price"** to get the estimated house price.

## Portfolio Section

The homepage includes:
- **Professional Profile**: Name, title, contact information, and links to [GitHub](https://github.com/Mdaliraza1/) and [LinkedIn](https://www.linkedin.com/in/Mdaliraza1)
- **About Section**: Professional summary and aspirations
- **Technical Skills**: Organized by categories (Languages, Frameworks, Databases, etc.)
- **Experience**: Current and past work experience with detailed descriptions
- **Featured Projects**: 
  - House Price Prediction (Interactive ML Project)
  - [DailyIQ](https://play.google.com/store/apps/details?id=com.dailyiq) - Personal Analytics App (Available on Google Play Store)
  - [Fixly](https://fixly-webskitters.onrender.com/) - Local Service Provider Platform ([GitHub](https://github.com/Mdaliraza1/fixly_webskitters) | [Postman Collection](https://documenter.getpostman.com/view/44342859/2sB2j7eVGw))
- **Education**: Academic background with CGPA details
- **Certifications**: Professional certifications from HackerRank, Great Learning, etc.

## AWS Deployment

### Initial Setup on EC2
print("Testing PR bot review")

1. **Launch an EC2 instance** (Ubuntu 22.04 LTS recommended)

2. **SSH into your instance**:
   ```bash
   ssh -i your-key.pem ubuntu@your-ec2-ip
   ```

3. **Clone this repository**:
   ```bash
   git clone https://github.com/Mdaliraza1/House-Price-Prediction-Using-RF.git /var/www/house-price-prediction
   ```

4. **Run the setup script**:
   ```bash
   chmod +x setup_aws.sh
   ./setup_aws.sh
   ```

5. **Configure settings.ini**:
   ```bash
   cd /var/www/house-price-prediction
   cp settings.ini.example settings.ini
   nano settings.ini  # Edit with your production settings
   ```

6. **Set up SSL** (optional but recommended):
   ```bash
   sudo apt-get install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

### CI/CD Setup

1. **Add GitHub Secrets**:
   - Go to your GitHub repository → Settings → Secrets and variables → Actions
   - Add the following secrets:
     - `AWS_HOST`: Your EC2 public IP or domain
     - `AWS_USER`: EC2 username (usually `ubuntu`)
     - `AWS_SSH_KEY`: Your EC2 private key content

2. **Push to main branch**:
   ```bash
   git push origin main
   ```

   The GitHub Actions workflow will automatically:
   - Run tests
   - Deploy to your EC2 instance
   - Restart the application

### Manual Deployment

If you prefer manual deployment:

```bash
# On your EC2 instance
cd /var/www/house-price-prediction
git pull origin main
source venv/bin/activate
pip install -r requirements.txt
python manage.py collectstatic --noinput
python manage.py migrate
sudo systemctl restart house-price-prediction
```

## ML Model Details

I built an XGBoost regression model trained on Indian real estate data. Here's how it works:

#### 1. **Model Type**
- **Algorithm**: XGBoost (Extreme Gradient Boosting) Regressor
- **Target Transformation**: Log transformation (`log1p`) applied to handle price skewness
- **Hyperparameters**:
  - `n_estimators`: 500
  - `max_depth`: 8
  - `learning_rate`: 0.05
  - `subsample`: 0.8
  - `colsample_bytree`: 0.8
  - `min_child_weight`: 5
  - `reg_lambda`: 1.0 (L2 regularization)

#### 2. **Feature Engineering**

The model uses 13 features - a mix of raw inputs and some I engineered:

**Raw Features (8):**
- `number of bedrooms`: Integer count of bedrooms
- `number of bathrooms`: Decimal count of bathrooms
- `living area`: Total living area in square feet
- `lot area`: Total lot/plot area in square feet
- `floor`: Floor number of the property
- `property_type_encoded`: Encoded property type (Flat, House, Apartment, etc.)
- `Lattitude`: Geographic latitude coordinate
- `Longitude`: Geographic longitude coordinate

**Engineered Features (5):**
- `bedrooms_x_bathrooms`: Interaction feature (bedrooms × bathrooms)
- `Living_vs_Lot_Ratio`: Ratio of living area to lot area
- `area_per_bedroom`: Living area divided by (bedrooms + 1)
- `lot_per_living`: Lot area divided by (living area + 1)
- `lat_x_lon`: Geographic interaction feature (latitude × longitude)

#### 3. **How I Selected Features**

I went through several steps to pick the best features:
- **Exploratory Data Analysis (EDA)**: Understanding data distributions and correlations
- **VIF Analysis**: Variance Inflation Factor to detect multicollinearity
- **OLS Regression**: Statistical significance testing (p-values)
- **XGBoost Feature Importance**: Identifying most predictive features
- **Domain Knowledge**: Incorporating real estate expertise

#### 4. **Data Preprocessing**

- **Categorical Encoding**: Property types are encoded using LabelEncoder
- **Outlier Handling**: IQR (Interquartile Range) capping applied during training
- **Train-Test Split**: 80-20 split with `random_state=42` for reproducibility

#### 5. **Model Performance**

Here's how the model performs:
- **Mean Absolute Error (MAE)**: ₹1,831,344.5
- **Mean Absolute Percentage Error (MAPE)**: 14.05%
- **R² Score**: 0.876 (87.6% variance explained)

#### 6. **Prediction Pipeline**

When a user submits property details, the following steps occur:

1. **Input Validation**: All required fields are validated
2. **Categorical Encoding**: Property type is encoded using the saved LabelEncoder
3. **Feature Engineering**: 
   - Interaction features are computed automatically
   - Ratio features are calculated
   - Geographic interaction feature is created
4. **Feature Ordering**: Features are arranged in the exact order expected by the model
5. **Prediction**: XGBoost model predicts on log-transformed scale
6. **Inverse Transformation**: Prediction is converted back using `expm1()` (inverse of log1p)
7. **Formatting**: Price is formatted in Indian Rupees with proper number formatting

#### 7. **Model Artifacts**

The model artifacts stored in `ML_Files/` include:
- `best_house_price_model.pkl`: Trained XGBoost model
- `model_features.pkl`: List of feature names in correct order
- `model_config.pkl`: Configuration dictionary (includes `log_target` flag)
- `property_type_encoder.pkl`: LabelEncoder for property types
- `city_encoder.pkl`: LabelEncoder for cities (optional)

#### 8. **Model Caching**

The application implements model caching to improve performance:
- Models are loaded once on first prediction request
- Cached models are reused for subsequent predictions
- Reduces I/O overhead and improves response time

### Why XGBoost?

I chose XGBoost because:
- **High Performance**: Excellent predictive accuracy for regression tasks
- **Feature Interactions**: Automatically captures non-linear relationships
- **Robustness**: Handles missing values and outliers well
- **Interpretability**: Provides feature importance scores
- **Scalability**: Efficient for large datasets

## Input Fields

- **Bedrooms**: Integer (1-10)
- **Bathrooms**: Decimal (0.5-10, step 0.5)
- **Living Area**: Integer (minimum 100 sq ft)
- **Lot Area**: Integer (minimum 100 sq ft)
- **Floor Number**: Integer (0-50)
- **Property Type**: Dropdown selection (e.g., Flat, House, Apartment)
- **Latitude**: Decimal (-90 to 90)
- **Longitude**: Decimal (-180 to 180)

## API Endpoints

- `GET /`: Portfolio homepage (handled by `portfolio` app)
- `GET /house-price-prediction/`: Display the prediction form (handled by `price_prediction` app)
- `POST /house-price-prediction/`: Submit property details and receive prediction (handled by `price_prediction` app)

## Application Architecture

The project is organized into two main Django applications:

### Portfolio App (`portfolio/`)
- **Purpose**: Displays professional portfolio, skills, experience, and projects
- **Views**: `portfolio_home` - Renders the portfolio homepage
- **Templates**: `templates/portfolio/home.html`
- **URLs**: Root path (`/`)

### Price Prediction App (`price_prediction/`)
- **Purpose**: Handles house price prediction using ML models
- **Views**: `predict_price` - Handles GET (form display) and POST (prediction) requests
- **Utilities**: `utils.py` - Contains ML model loading and prediction logic
- **Templates**: `templates/price_prediction/predict.html`
- **URLs**: `/house-price-prediction/`

### Shared Resources
- **Templates**: All templates are centralized in the `templates/` directory at the project root
  - `base.html` - Shared base template with navigation and footer
- **Static Files**: All CSS and JavaScript files are centralized in the `static/` directory at the project root

**Why this structure?**
I separated the portfolio and price prediction into different apps to keep things organized. All templates and static files are in one place at the project root, which makes it easier to maintain and add new features later.

## Development

### Running Tests
```bash
python manage.py test
```

### Creating Superuser
```bash
python manage.py createsuperuser
```

### Accessing Admin Panel
Navigate to `http://127.0.0.1:8000/admin/` after creating a superuser.

## Troubleshooting

1. **Model not loading**: Ensure all `.pkl` files are present in the `ML_Files` directory
2. **Import errors**: Make sure all dependencies are installed in your virtual environment
3. **Static files not loading**: Run `python manage.py collectstatic`
4. **Database errors**: Run `python manage.py migrate`
5. **XGBoost cleanup warnings**: These are harmless and are automatically suppressed
6. **Deployment issues**: Check systemd logs with `sudo journalctl -u house-price-prediction -f`

## Security Notes

- **Never commit `settings.ini`** to version control
- Use strong `SECRET_KEY` in production
- Set `DEBUG=False` in production
- Configure `ALLOWED_HOSTS` properly
- Use HTTPS in production (Let's Encrypt)
- Keep dependencies updated

## License

Open source - feel free to use this for learning or as a reference.

## Questions?

If you have questions or find any issues, feel free to [open an issue](https://github.com/Mdaliraza1/House-Price-Prediction-Using-RF/issues) or reach out!

## Connect With Me

- **GitHub**: [@Mdaliraza1](https://github.com/Mdaliraza1/)
- **LinkedIn**: [Md Ali Raza](https://www.linkedin.com/in/Mdaliraza1)
- **Email**: mdaliraza92@gmail.com
