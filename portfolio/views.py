from django.shortcuts import render


def portfolio_home(request):
    """
    Portfolio homepage showcasing profile and projects.
    """
    context = {
        'name': 'Md Ali Raza',
        'title': 'Backend Engineer & Data Analyst',
        'email': 'mdaliraza92@gmail.com',
        'phone': '+91 98049 21119',
        'github': 'Mdaliraza1',
        'linkedin': 'mdaliraza1',
        'summary': (
            'Backend Engineer and Data Analyst with hands-on experience in Python, SQL, and REST API development. '
            'Proficient in data extraction, transformation, and analysis using Pandas, NumPy, and PostgreSQL. '
            'Experienced in building production-grade backend systems with Django and deploying ML-powered analytics applications. '
            'Skilled in creating dashboards and visualizations using Tableau, with a strong foundation in data science from a B.Tech in Computer Science (Data Science).'
        ),
    }
    return render(request, 'portfolio/home.html', context)