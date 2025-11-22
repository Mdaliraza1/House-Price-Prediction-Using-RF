// Form validation and UX enhancements

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('predictionForm');
    const submitBtn = document.getElementById('submitBtn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoader = submitBtn.querySelector('.btn-loader');
    
    if (form) {
        // Add input validation on blur
        const inputs = form.querySelectorAll('.form-input');
        inputs.forEach(input => {
            input.addEventListener('blur', function() {
                validateInput(this);
            });
            
            input.addEventListener('input', function() {
                // Remove error styling on input
                if (this.classList.contains('error')) {
                    this.classList.remove('error');
                }
            });
        });
        
        // Form submission handler
        form.addEventListener('submit', function(e) {
            let isValid = true;
            
            // Validate all inputs
            inputs.forEach(input => {
                if (!validateInput(input)) {
                    isValid = false;
                }
            });
            
            if (isValid) {
                // Show loading state
                submitBtn.disabled = true;
                btnText.style.display = 'none';
                btnLoader.style.display = 'inline-block';
                
                // Scroll to top to show loading state
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                e.preventDefault();
                // Scroll to first error
                const firstError = form.querySelector('.form-input.error');
                if (firstError) {
                    firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    firstError.focus();
                }
            }
        });
    }
    
    // Scroll to result if prediction exists
    const resultCard = document.getElementById('resultCard');
    if (resultCard) {
        setTimeout(() => {
            resultCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
    }
    
    // Add smooth scroll for error alerts
    const errorAlert = document.querySelector('.alert-error');
    if (errorAlert) {
        setTimeout(() => {
            errorAlert.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
    }
});

function validateInput(input) {
    const value = input.value.trim();
    let isValid = true;
    let errorMessage = '';
    
    // Remove previous error styling
    input.classList.remove('error');
    removeErrorMessage(input);
    
    // Check if required field is empty
    if (input.hasAttribute('required') && !value) {
        isValid = false;
        errorMessage = 'This field is required';
    }
    
    // Validate number inputs
    if (input.type === 'number' && value) {
        const numValue = parseFloat(value);
        const min = parseFloat(input.getAttribute('min'));
        const max = parseFloat(input.getAttribute('max'));
        
        if (isNaN(numValue)) {
            isValid = false;
            errorMessage = 'Please enter a valid number';
        } else if (min !== null && numValue < min) {
            isValid = false;
            errorMessage = `Value must be at least ${min}`;
        } else if (max !== null && numValue > max) {
            isValid = false;
            errorMessage = `Value must be at most ${max}`;
        }
    }
    
    // Validate latitude
    if (input.name === 'latitude' && value) {
        const lat = parseFloat(value);
        if (lat < -90 || lat > 90) {
            isValid = false;
            errorMessage = 'Latitude must be between -90 and 90';
        }
    }
    
    // Validate longitude
    if (input.name === 'longitude' && value) {
        const lon = parseFloat(value);
        if (lon < -180 || lon > 180) {
            isValid = false;
            errorMessage = 'Longitude must be between -180 and 180';
        }
    }
    
    // Show error if invalid
    if (!isValid) {
        input.classList.add('error');
        showErrorMessage(input, errorMessage);
    }
    
    return isValid;
}

function showErrorMessage(input, message) {
    removeErrorMessage(input);
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'input-error';
    errorDiv.textContent = message;
    errorDiv.style.cssText = `
        color: var(--error-color);
        font-size: 0.875rem;
        margin-top: 0.25rem;
        animation: slideIn 0.3s ease;
    `;
    
    input.parentNode.appendChild(errorDiv);
}

function removeErrorMessage(input) {
    const existingError = input.parentNode.querySelector('.input-error');
    if (existingError) {
        existingError.remove();
    }
}

// Add CSS for error state
const style = document.createElement('style');
style.textContent = `
    .form-input.error {
        border-color: var(--error-color) !important;
        background: #fee2e2 !important;
    }
    
    .form-input.error:focus {
        box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1) !important;
    }
`;
document.head.appendChild(style);

