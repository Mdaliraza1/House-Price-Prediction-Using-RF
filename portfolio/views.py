from django.shortcuts import render


def portfolio_home(request):
    """
    Portfolio homepage showcasing profile and projects.
    """
    context = {
        'name': 'Md Ali Raza',
        'title': 'Python Backend Developer & ML Engineer',
        'email': 'mdaliraza92@gmail.com',
        'phone': '+91 98049 21119',
        'github': 'mdaliraza1',
        'linkedin': 'mdaliraza1',
        'summary': 'Computer Science undergraduate and Python backend developer with hands-on experience building production-ready Django applications, RESTful APIs, and deploying ML models (XGBoost) in web applications. Skilled in Django REST Framework, machine learning workflows, and AWS deployment.',
    }
    return render(request, 'portfolio/home.html', context)

