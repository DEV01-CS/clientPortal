"""
Chatbot service for handling client service-related queries.
Only responds to questions about service charges, property, lease, and related topics.
"""

# Keywords related to client service/website topics
RELEVANT_KEYWORDS = [
    "service charge", "service charges", "property", "properties", "lease", "leases", "leaseholder",
    "landlord", "landlords", "managing agent", "managing agents", "residents association",
    "budget", "budget report", "invoice", "invoices", "payment", "payments", "charge",
    "amenities", "concierge", "maintenance", "repair", "repairs", "building", "buildings",
    "location", "wandsworth", "sw18", "property size", "bedroom", "bedrooms",
    "lease term", "payment dates", "year end", "score", "comparison", "trends",
    "documents", "docs", "report", "reports", "document", "pdf", "monthly report",
    "what is", "how much", "when is", "where is", "explain", "tell me about",
    "help", "assistance", "question", "questions"
]

# Greeting keywords that should be accepted
GREETING_KEYWORDS = [
    "hello", "hi", "hey", "greetings", "good morning", "good afternoon", 
    "good evening", "good night", "howdy", "hi there", "hey there"
]

# Clearly off-topic keywords that should be denied
OFF_TOPIC_KEYWORDS = [
    "weather", "cooking", "recipe", "joke", "jokes", "funny", "movie", "movies",
    "sports", "football", "soccer", "basketball", "music", "song", "songs",
    "game", "games", "news", "politics", "election", "trump", "biden",
    "stock", "stocks", "crypto", "bitcoin", "shopping", "buy", "sell",
    "travel", "vacation", "hotel", "restaurant", "food", "recipe"
]


def is_greeting(message):
    """Check if the message is a greeting"""
    lower_message = message.lower().strip()
    return any(greeting in lower_message for greeting in GREETING_KEYWORDS)


def is_off_topic(message):
    """Check if the message is clearly off-topic"""
    lower_message = message.lower()
    return any(off_topic in lower_message for off_topic in OFF_TOPIC_KEYWORDS)


def is_relevant_message(message):
    """Check if message is relevant to client service"""
    # Allow greetings
    if is_greeting(message):
        return True
    
    # Deny clearly off-topic questions
    if is_off_topic(message):
        return False
    
    # Check for relevant keywords
    lower_message = message.lower()
    return any(keyword in lower_message for keyword in RELEVANT_KEYWORDS)


def generate_response(user_message, client_data=None):
    """
    Generate a response based on the user's message.
    
    Args:
        user_message: The user's input message
        client_data: Optional dictionary containing client-specific data
    
    Returns:
        Response string
    """
    lower_message = user_message.lower().strip()
    
    # Handle greetings
    if is_greeting(user_message):
        return "Hello! I'm here to help you,How can I assist you today?"
    
    # Use client data if available, otherwise use default values
    service_charge = client_data.get('service_charge', '£2,551') if client_data else '£2,551'
    property_size = client_data.get('property_size', '710 Sq2') if client_data else '710 Sq2'
    bedrooms = client_data.get('bedrooms', '2') if client_data else '2'
    location = client_data.get('location', 'Wandsworth, SW18 1UZ') if client_data else 'Wandsworth, SW18 1UZ'
    landlord = client_data.get('landlord', 'Star Building Ltd.') if client_data else 'Star Building Ltd.'
    managing_agent = client_data.get('managing_agent', 'London Building Ltd.') if client_data else 'London Building Ltd.'
    lease_term = client_data.get('lease_term', '90 years remaining') if client_data else '90 years remaining'
    score = client_data.get('score', 'HIGH') if client_data else 'HIGH'
    
    # Service charge related
    if "service charge" in lower_message or ("charge" in lower_message and "service" in lower_message):
        return f"Your service charge is {service_charge} per year, payable in two installments on 1st January and 30th June. The service charge covers maintenance, amenities, and building management services."
    
    # Property size
    if "property size" in lower_message or ("size" in lower_message and "property" in lower_message) or "bedroom" in lower_message:
        return f"Your property is {property_size} with {bedrooms} bedrooms, located in {location}."
    
    # Lease related
    if "lease" in lower_message or "leaseholder" in lower_message:
        return f"You are the leaseholder with {lease_term} on your lease. The lease term ends on 31st December each year for service charge purposes."
    
    # Landlord/Managing Agent
    if "landlord" in lower_message or "managing agent" in lower_message:
        return f"Your landlord is {landlord} and the managing agent is {managing_agent}. You can contact them through the documents section or your account dashboard."
    
    # Documents
    if "document" in lower_message or "doc" in lower_message or "report" in lower_message or "pdf" in lower_message:
        return "You can find your documents in the 'Docs' section above. Available documents include Budget Report, Monthly Report, and Service Charge Invoice. Click on any document to view or download."
    
    # Payment dates
    if "payment" in lower_message or ("when" in lower_message and "due" in lower_message) or "due date" in lower_message:
        return "Service charge payments are due on 1st January and 30th June each year. The service charge year ends on 31st December."
    
    # Location
    if "location" in lower_message or ("where" in lower_message and "property" in lower_message) or "wandsworth" in lower_message or "sw18" in lower_message:
        return f"Your property is located in {location}. You can view the location on the map above."
    
    # Score/Rating
    if "score" in lower_message or "rating" in lower_message or ("high" in lower_message and "charge" in lower_message) or ("low" in lower_message and "charge" in lower_message):
        return f"Your service charge score is currently {score} compared to similar properties. This means your service charge is {'higher' if score == 'HIGH' else 'lower'} than average for properties of similar size and location."
    
    # Amenities
    if "amenities" in lower_message or "concierge" in lower_message or ("services" in lower_message and "property" in lower_message):
        return "Your property includes concierge services. The service charge covers maintenance, building management, and all amenities provided by the managing agent."
    
    # General help
    if "help" in lower_message or "assist" in lower_message or "what can" in lower_message:
        return "I can help you with questions about your service charge, property details, lease information, payment dates, documents, location, and property management. What would you like to know?"
    
    # Default response for relevant but unclear questions
    return "I can help you with information about your service charge, property details, lease, payments, documents, and property management. Could you please be more specific about what you'd like to know?"


def get_denial_message():
    """Get the standard denial message for off-topic questions"""
    return "I apologize, but I can only assist you with questions related to client services, service charges, property management, lease information, and related topics. Thank you for your understanding."

