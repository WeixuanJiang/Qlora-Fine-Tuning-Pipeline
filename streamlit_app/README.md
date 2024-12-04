# Streamlit Chatbot

A simple and elegant chatbot built with Streamlit and the Qwen2.5-0.5B-Chat model.

## Features

- Clean and intuitive chat interface
- Real-time response generation
- Chat history management
- Clear chat functionality
- Support for conversation context
- Configurable model parameters

## Setup

1. Install the required dependencies:
```bash
pip install -r requirements.txt
```

2. Run the application:
```bash
streamlit run app.py
```

## Configuration

You can modify the following parameters in the `app.py` file:

- Model path: Change the `model_path` in `initialize_session_state()` to use a different model
- Generation parameters in `generate_response()`:
  - `max_new_tokens`: Maximum length of generated response
  - `temperature`: Controls randomness (higher = more random)
  - `top_p`: Nucleus sampling parameter
  - `top_k`: Top-k sampling parameter
  - `num_beams`: Number of beams for beam search

## Usage

1. Start typing in the chat input box at the bottom of the page
2. Press Enter or click the send button to submit your message
3. Wait for the AI to generate a response
4. Use the "Clear Chat" button in the sidebar to start a new conversation

## Note

Make sure you have sufficient GPU memory if you're using a large language model. The application uses torch.float16 for efficient memory usage.
