from django.shortcuts import render


def portfolio_home(request):
    """Portfolio homepage showcasing profile, experience, and projects."""
    context = {
        'name': 'Md Ali Raza',
        'title': 'AI & Backend Engineer',
        'tagline': 'Python · FastAPI · LLM · Django · AWS · Microservices',
        'email': 'mdaliraza92@gmail.com',
        'phone': '+91 98049 21119',
        'github': 'Mdaliraza1',
        'linkedin': 'mdaliraza1',
        'summary': (
            'AI & Backend Engineer specializing in Python, FastAPI, Django, and scalable REST APIs. '
            'Experienced in building LLM-powered microservices, IoT backends, real-time AI systems, '
            'and cloud-deployed services using AWS, Docker, PostgreSQL, and WebSockets. '
            'Strong in rules-first + LLM architectures, multi-tenant API security, and production deployments.'
        ),
        'skills': [
            {
                'title': 'Languages',
                'items': ['Python', 'Java', 'JavaScript (Node)', 'SQL'],
            },
            {
                'title': 'Backend Frameworks',
                'items': ['FastAPI', 'Uvicorn', 'Pydantic', 'Django', 'Django REST Framework'],
            },
            {
                'title': 'AI / LLM',
                'items': [
                    'Anthropic Claude', 'OpenAI API', 'Prompt Engineering',
                    'Rules Engine', 'LLM Integration',
                ],
            },
            {
                'title': 'Databases & Data',
                'items': ['PostgreSQL', 'asyncpg', 'MySQL', 'SQLite', 'Redis', 'Data Pipelines'],
            },
            {
                'title': 'APIs & Architecture',
                'items': [
                    'REST APIs', 'Microservices', 'Multi-tenant SaaS',
                    'Event-driven Sync', 'WebSockets', 'Django Channels',
                ],
            },
            {
                'title': 'Cloud & DevOps',
                'items': ['AWS EC2', 'AWS RDS', 'Docker', 'CI/CD', 'GitHub Actions'],
            },
            {
                'title': 'Machine Learning',
                'items': ['Scikit-learn', 'Feature Engineering', 'Predictive Modeling'],
            },
            {
                'title': 'Tools & Security',
                'items': [
                    'Git', 'GitHub', 'Postman', 'Linux', 'structlog',
                    'API Key Auth', 'Rate Limiting', 'APScheduler',
                ],
            },
        ],
        'experience': [
            {
                'role': 'Software Engineer',
                'company': 'MA VIE (Subsidiary of Mayabious Art LLP), Kolkata',
                'duration': 'Sep 2025 – Present',
                'key_projects': ['Core PM', 'Nexus', 'Greentrix', 'Maya AI Waiter'],
                'bullets': [
                    'Architected Core PM AI intelligence microservice (FastAPI) with 12+ REST APIs — LLM-powered health summaries, blocker cascade analysis, and risk alerts for a construction PM platform.',
                    'Built Nexus IoT backend with 15+ REST APIs, real-time telemetry via Django Channels/WebSockets, and deployment on AWS EC2 with Docker and CI/CD.',
                    'Developed Greentrix IGBC green certification engine — rule-based scoring migrated from Flask to Django with Google Places and Distance Matrix API integration.',
                    'Built Maya AI Waiter real-time voice ordering assistant using OpenAI Realtime WebSocket API and tool-calling for order management.',
                    'Designed hybrid rules-first + LLM pipelines with multi-tenant API key security, async PostgreSQL, and MySQL→PostgreSQL data mirroring.',
                    'Deployed containerized backend platforms for IoT device management, AI voice systems, and sustainability scoring on AWS with PostgreSQL (RDS).',
                ],
            },
            {
                'role': 'Python Backend Intern',
                'company': 'Whatbytes, Bangalore',
                'duration': 'Feb 2025 – Aug 2025',
                'key_projects': ['DailyIQ'],
                'bullets': [
                    'Built DailyIQ backend with 56+ REST APIs powering ML-based behavioral analytics for a live app published on Google Play.',
                    'Developed Django REST Framework APIs for analytics and puzzle-based learning platforms with secure JWT and OTP authentication.',
                    'Integrated backend services with Flutter mobile applications; optimized PostgreSQL queries for production workloads.',
                ],
            },
            {
                'role': 'Industrial Trainee',
                'company': 'Webskitters Academy Pvt Ltd, Kolkata',
                'duration': 'Jan 2025 – Jun 2025',
                'key_projects': ['Fixly'],
                'bullets': [
                    'Built Fixly local service platform with 40+ REST APIs — dual-role JWT authentication, service listings, provider dashboards, and booking workflows.',
                    'Completed intensive training in Django, Django REST Framework, and PostgreSQL with focus on production-ready API development.',
                    'Documented full API surface in Postman and deployed Fixly to production via Render with end-to-end backend workflows.',
                ],
            },
        ],
        'projects': [
            {
                'name': 'Core PM',
                'subtitle': 'AI Intelligence Microservice',
                'description': (
                    'Decoupled AI microservice for a construction/architecture project management platform. '
                    'Delivers automated health scores, executive summaries, and dependency-based blocker analysis '
                    'using a rules-first + LLM architecture with multi-tenant API security.'
                ),
                'highlights': [
                    '12+ FastAPI endpoints — summaries, blocker cascade analysis, role-aware views, AI notifications',
                    'Rules engine scores health from overdue tasks, blockers, budget burn, and module staleness',
                    'MySQL→PostgreSQL mirror with incremental sync; Node.js batch integration 3×/day',
                    'Anthropic Claude & OpenAI with swappable provider config; Docker + AWS EC2 deploy',
                ],
                'tech': [
                    'FastAPI', 'Python', 'PostgreSQL', 'asyncpg', 'Anthropic', 'OpenAI',
                    'Redis', 'Docker', 'Node.js', 'MySQL', 'GitHub Actions',
                ],
                'icon': '🤖',
                'github': None,
                'live': None,
                'cta': 'AI Backend Microservice',
                'featured': True,
                'employer': 'MA VIE',
            },
            {
                'name': 'Nexus',
                'subtitle': 'IoT Device & Project Management Platform',
                'description': (
                    'IoT backend platform with 15+ REST APIs for projects, boards, device telemetry, '
                    'and real-time temperature streaming via Django Channels. '
                    'Deployed on AWS EC2 with PostgreSQL (RDS), Docker, and CI/CD.'
                ),
                'tech': ['Django', 'DRF', 'WebSockets', 'Django Channels', 'PostgreSQL', 'Docker', 'AWS EC2'],
                'icon': '🔌',
                'github': 'https://github.com/Mdaliraza1/Nexus',
                'live': 'https://nexus.matratech.in',
                'cta': 'Visit Live Site',
                'employer': 'MA VIE',
            },
            {
                'name': 'Greentrix',
                'subtitle': 'IGBC Green Homes Certification Engine',
                'description': (
                    'Rule-based backend engine to evaluate green building certification scores. '
                    'Migrated legacy scoring logic from Flask to Django. Integrated Google Places and Distance Matrix APIs for geospatial analysis.'
                ),
                'tech': ['Django REST Framework', 'Google Places API', 'PostgreSQL', 'Python'],
                'icon': '🌿',
                'github': 'https://github.com/Mdaliraza1/IGBC',
                'live': None,
                'cta': 'View on GitHub',
                'employer': 'MA VIE',
            },
            {
                'name': 'Maya AI Waiter',
                'subtitle': 'Real-Time Voice Ordering AI',
                'description': (
                    'Real-time speech-to-speech AI assistant using OpenAI Realtime WebSocket API. '
                    'Tool-calling architecture for restaurant order management with streaming microphone input and audio response pipeline.'
                ),
                'tech': ['OpenAI Realtime API', 'WebSockets', 'Tool Calling', 'Python'],
                'icon': '🎙️',
                'github': 'https://github.com/Mdaliraza1/mothershut',
                'live': None,
                'cta': 'View on GitHub',
                'employer': 'MA VIE',
            },
            {
                'name': 'DailyIQ',
                'subtitle': 'Personal Analytics Platform (Backend + ML)',
                'description': (
                    'Backend with 56+ REST APIs powering ML-based behavioral analytics for a live mobile app on Google Play. '
                    'Secure JWT authentication, optimized PostgreSQL queries, and Scikit-learn predictive models.'
                ),
                'tech': ['Django REST Framework', 'Scikit-learn', 'JWT Auth', 'PostgreSQL'],
                'icon': '📊',
                'github': None,
                'live': 'https://play.google.com/store/apps/details?id=com.dailyiq',
                'cta': 'View on Play Store',
                'employer': 'Whatbytes',
            },
            {
                'name': 'Fixly',
                'subtitle': 'Local Service Platform',
                'description': (
                    'Full-stack Django + DRF backend with 40+ REST APIs — dual-role authentication, '
                    'service listings, user/provider dashboards, and real-time booking workflows.'
                ),
                'highlights': [
                    '40+ REST APIs with JWT auth, role-based access, and provider onboarding',
                    'Service discovery, booking lifecycle, and dashboard analytics endpoints',
                    'Documented Postman collection for full API reference',
                ],
                'tech': ['Django', 'DRF', 'JWT Auth', 'PostgreSQL', 'REST APIs'],
                'icon': '🔧',
                'github': 'https://github.com/Mdaliraza1/fixly_webskitters',
                'live': 'https://fixly-webskitters.onrender.com',
                'cta': 'Visit Live Site',
                'employer': 'Webskitters Academy',
            },
        ],
        'education': [
            {
                'degree': 'B.Tech in Computer Science & Engineering (Data Science)',
                'school': 'MCKV Institute of Engineering, Kolkata',
                'duration': 'Aug 2022 – Jun 2025',
                'detail': 'CGPA: 7.52',
            },
            {
                'degree': 'Diploma in Mechanical Engineering',
                'school': 'Calcutta Institute of Technology, Kolkata',
                'duration': 'Aug 2019 – Jul 2022',
                'detail': 'CGPA: 7.8',
            },
        ],
        'certifications': [
            {'title': 'Python (Basic)', 'org': 'HackerRank'},
            {'title': 'Software Engineer', 'org': 'HackerRank'},
            {'title': 'Data Science Foundation', 'org': 'Great Learning'},
            {'title': 'Java Programmer Certification', 'org': 'Certified'},
        ],
        'stats': [
            {'value': 2, 'suffix': '+', 'label': 'Years Backend Exp'},
            {'value': 6, 'suffix': '', 'label': 'Production Projects'},
            {'value': 125, 'suffix': '+', 'label': 'API Endpoints'},
            {'value': 4, 'suffix': '', 'label': 'AI/LLM Systems'},
        ],
    }
    return render(request, 'portfolio/home.html', context)
