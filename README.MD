# Chat Bot App - Dynamic Pydantic UI Generator

A cross-platform chat bot application that dynamically generates UI from Pydantic BaseModel definitions and converts natural language to structured data using OpenAI's API.

## Features

- **Dynamic UI Generation**: Automatically creates forms from Pydantic BaseModel schemas
- **Natural Language Processing**: Chat bot converts user descriptions to structured data
- **Cross-Platform Support**: Runs on iOS, Android, and web browsers
- **Structured Output**: Uses OpenAI's structured output feature for reliable data conversion
- **API Integration**: Forwards completed data to external APIs and displays results

## Architecture

### Backend (Python/FastAPI)
- **Schema Parser Service**: Converts Pydantic BaseModel definitions to UI-friendly JSON
- **OpenAI Integration**: Natural language to structured data conversion
- **API Gateway**: Handles data forwarding and result retrieval

### Frontend (React Native)
- **Dynamic Form Generator**: Creates UI components from schema definitions
- **Chat Interface**: Voice-to-text and conversational UI
- **Results Display**: Visualizes API responses

## Prerequisites

- Python 3.8+
- Node.js 16+
- OpenAI API key
- React Native development environment

## Installation

### Backend Setup

1. Create and activate virtual environment:
```bash
python -m venv venv_linux
source venv_linux/bin/activate  # On Linux/Mac
# or
venv_linux\Scripts\activate  # On Windows
```

2. Install Python dependencies:
```bash
pip install fastapi uvicorn pydantic openai python-dotenv
```

3. Create `.env` file:
```env
OPENAI_API_KEY=your_openai_api_key_here
```

### Frontend Setup

1. Install Node.js dependencies:
```bash
npm install -g expo-cli
npx create-expo-app ChatBotApp
cd ChatBotApp
npm install
```

## Usage

### Running the Backend

```bash
source venv_linux/bin/activate
uvicorn main:app --reload
```

### Running the Frontend

```bash
expo start
```

## Development

### Project Structure
```
project1/
├── backend/
│   ├── main.py
│   ├── services/
│   │   ├── schema_parser.py
│   │   ├── openai_service.py
│   │   └── api_gateway.py
│   └── models/
├── frontend/
│   ├── App.js
│   ├── components/
│   │   ├── DynamicForm.js
│   │   ├── ChatInterface.js
│   │   └── ResultsDisplay.js
│   └── services/
├── tests/
└── docs/
```

### Key Components

- **Schema Parser**: Parses Pydantic BaseModel using `model_json_schema()`
- **Dynamic Form**: Renders different input types based on field definitions
- **Chat Integration**: Uses OpenAI structured output for data conversion
- **API Gateway**: Forwards completed BaseModel instances to target endpoints

## Contributing

1. Read `PLANNING.MD` for architecture details
2. Check `TODO.MD` for current tasks
3. Follow Python PEP8 and use type hints
4. Write unit tests for new features
5. Keep files under 500 lines

## Testing

Run tests using pytest:
```bash
source venv_linux/bin/activate
pytest tests/
```

## License

MIT License