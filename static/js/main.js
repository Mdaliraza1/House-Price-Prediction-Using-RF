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
                updateSuccessIndicator(this);
            });
            
            input.addEventListener('input', function() {
                // Remove error styling on input
                if (this.classList.contains('error')) {
                    this.classList.remove('error');
                    this.setAttribute('aria-invalid', 'false');
                }
                // Real-time validation for better UX
                if (this.value.trim() || (this.tagName === 'SELECT' && this.value)) {
                    validateInput(this);
                    updateSuccessIndicator(this);
                } else {
                    removeErrorMessage(this);
                    this.setAttribute('aria-invalid', 'false');
                    updateSuccessIndicator(this);
                }
            });
            
            // Add change event for select dropdowns
            if (input.tagName === 'SELECT') {
                input.addEventListener('change', function() {
                    validateInput(this);
                    updateSuccessIndicator(this);
                });
            }
            
            // Add focus event for better accessibility
            input.addEventListener('focus', function() {
                this.setAttribute('aria-invalid', 'false');
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
            
            // Validate location selection
            const latInput = document.getElementById('latitude');
            const lonInput = document.getElementById('longitude');
            const mapContainer = document.getElementById('mapContainer');
            
            if (latInput && lonInput) {
                const lat = latInput.value.trim();
                const lon = lonInput.value.trim();
                
                if (!lat || !lon) {
                    isValid = false;
                    // Show error on map container
                    if (mapContainer) {
                        mapContainer.classList.add('error');
                        showMapErrorMessage('Please select a location on the map or use "Locate Me" button');
                    }
                } else {
                    // Validate coordinate ranges
                    const latNum = parseFloat(lat);
                    const lonNum = parseFloat(lon);
                    
                    if (isNaN(latNum) || latNum < -90 || latNum > 90) {
                        isValid = false;
                        if (mapContainer) {
                            mapContainer.classList.add('error');
                            showMapErrorMessage('Invalid latitude. Please select a valid location.');
                        }
                    } else if (isNaN(lonNum) || lonNum < -180 || lonNum > 180) {
                        isValid = false;
                        if (mapContainer) {
                            mapContainer.classList.add('error');
                            showMapErrorMessage('Invalid longitude. Please select a valid location.');
                        }
                    } else {
                        // Remove error styling if valid
                        if (mapContainer) {
                            mapContainer.classList.remove('error');
                            removeMapErrorMessage();
                        }
                    }
                }
            }
            
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
                const firstError = form.querySelector('.form-input.error, .map-container.error');
                if (firstError) {
                    firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    if (firstError.focus) {
                        firstError.focus();
                    }
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
    input.setAttribute('aria-invalid', 'false');
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
    
    // Validate select dropdowns
    if (input.tagName === 'SELECT' && input.hasAttribute('required')) {
        if (!value) {
            isValid = false;
            errorMessage = 'Please select an option';
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
        input.setAttribute('aria-invalid', 'true');
        showErrorMessage(input, errorMessage);
    } else if (value && input.hasAttribute('required')) {
        // Mark as valid for success indicator
        input.setAttribute('aria-invalid', 'false');
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

function showMapErrorMessage(message) {
    removeMapErrorMessage();
    
    const mapContainer = document.getElementById('mapContainer');
    if (!mapContainer) return;
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'map-error-message';
    errorDiv.textContent = message;
    errorDiv.style.cssText = `
        color: var(--error-color);
        font-size: 0.875rem;
        margin-top: 0.5rem;
        padding: 0.5rem 0.75rem;
        background: #fee2e2;
        border: 1px solid var(--error-color);
        border-radius: 8px;
        animation: slideIn 0.3s ease;
    `;
    
    // Insert after map container
    mapContainer.parentNode.insertBefore(errorDiv, mapContainer.nextSibling);
}

function removeMapErrorMessage() {
    const existingError = document.querySelector('.map-error-message');
    if (existingError) {
        existingError.remove();
    }
}

function updateSuccessIndicator(input) {
    const wrapper = input.closest('.input-wrapper');
    if (!wrapper) return;
    
    const successIcon = wrapper.querySelector('.input-success-icon');
    if (!successIcon) return;
    
    const value = input.value.trim();
    const isValid = !input.classList.contains('error') && 
                    input.checkValidity() && 
                    (value || (input.tagName === 'SELECT' && input.value));
    
    if (isValid && input.hasAttribute('required')) {
        successIcon.style.opacity = '1';
        successIcon.style.transform = 'scale(1)';
    } else {
        successIcon.style.opacity = '0';
        successIcon.style.transform = 'scale(0.8)';
    }
}

// Add CSS for error state and enhanced styles
const style = document.createElement('style');
style.textContent = `
    .form-input.error {
        border-color: var(--error-color) !important;
        background: #fee2e2 !important;
    }
    
    .form-input.error:focus {
        box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1) !important;
    }
    
    /* Enhanced success state */
    .form-input:valid:not(:placeholder-shown):not(:focus):not(.error) {
        border-color: var(--success-color);
    }
    
    /* Select dropdown success state */
    select.form-input:valid:not([value=""]):not(:focus):not(.error) {
        border-color: var(--success-color);
    }
    
    /* Smooth transitions for all states */
    .form-input {
        transition: border-color 0.3s ease, background-color 0.3s ease, box-shadow 0.3s ease;
    }
    
    /* Focus ring for accessibility */
    .form-input:focus-visible {
        outline: 2px solid var(--primary-color);
        outline-offset: 2px;
    }
`;
document.head.appendChild(style);

