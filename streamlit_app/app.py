import streamlit as st
from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline, TextIteratorStreamer
from threading import Thread
import torch
import os
from langchain_core.messages import AIMessage, HumanMessage
import time
from dotenv import load_dotenv

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

# Model path
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(SCRIPT_DIR)
MODEL_DIR = os.path.join(ROOT_DIR, os.getenv('MERGED_MODEL_DIR'))

print(f"Loading model from: {MODEL_DIR}")

# App config
st.set_page_config(page_title="Fine-tuned AI Chatbot", page_icon="🤖")
st.title("🤖 Fine-tuned AI Chatbot")

# Initialize model parameters in session state
if "model_params" not in st.session_state:
    st.session_state.model_params = {
        "temperature": 0.7,
        "max_new_tokens": int(os.getenv('MODEL_MAX_LENGTH', 2048)),
        "top_p": 0.9,
        "top_k": 50
    }

# Sidebar for model parameters
with st.sidebar:
    st.header("Model Parameters")
    st.session_state.model_params["temperature"] = st.slider(
        "Temperature",
        min_value=0.1,
        max_value=2.0,
        value=st.session_state.model_params["temperature"],
        step=0.1,
        help="Higher values make the output more random, lower values make it more deterministic"
    )
    st.session_state.model_params["max_new_tokens"] = st.slider(
        "Max New Tokens",
        min_value=64,
        max_value=int(os.getenv('MODEL_MAX_LENGTH', 2048)),
        value=st.session_state.model_params["max_new_tokens"],
        step=64,
        help="Maximum number of tokens to generate"
    )
    st.session_state.model_params["top_p"] = st.slider(
        "Top P",
        min_value=0.1,
        max_value=1.0,
        value=st.session_state.model_params["top_p"],
        step=0.1,
        help="Nucleus sampling: limits the cumulative probability of tokens to sample from"
    )
    st.session_state.model_params["top_k"] = st.slider(
        "Top K",
        min_value=1,
        max_value=100,
        value=st.session_state.model_params["top_k"],
        step=1,
        help="Limits the number of tokens to sample from"
    )

def initialize_model():
    if "model_components" not in st.session_state:
        print("Initializing model...")
        try:
            # Load tokenizer
            tokenizer = AutoTokenizer.from_pretrained(
                MODEL_DIR,
                trust_remote_code=True,
                local_files_only=True
            )
            
            # Load model
            model = AutoModelForCausalLM.from_pretrained(
                MODEL_DIR,
                device_map="auto",
                torch_dtype=torch.float16,
                trust_remote_code=True,
                local_files_only=True
            )
            
            # Create text generation pipeline
            pipe = pipeline(
                "text-generation",
                model=model,
                tokenizer=tokenizer,
                device_map="auto"
            )
            
            st.session_state.model_components = {
                "tokenizer": tokenizer,
                "model": model,
                "pipe": pipe
            }
            print("Model initialized successfully!")
        except Exception as e:
            st.error(f"Error loading model: {str(e)}")
            raise

def generate_response(query):
    try:
        # Get model components
        pipe = st.session_state.model_components["pipe"]
        
        # Create streamer
        streamer = TextIteratorStreamer(
            st.session_state.model_components["tokenizer"],
            skip_special_tokens=True
        )
        
        # Generate text in a separate thread
        generation_kwargs = dict(
            **st.session_state.model_params,
            streamer=streamer,
            do_sample=True,
            pad_token_id=st.session_state.model_components["tokenizer"].pad_token_id
        )
        
        thread = Thread(target=pipe, args=(query,), kwargs=generation_kwargs)
        thread.start()
        
        # Initialize response placeholder
        response_placeholder = st.empty()
        collected_chunks = []
        
        # Stream the response
        for chunk in streamer:
            collected_chunks.append(chunk)
            response_placeholder.markdown("".join(collected_chunks))
        
        return "".join(collected_chunks)
        
    except Exception as e:
        st.error(f"Error generating response: {str(e)}")
        return None

# Initialize model
initialize_model()

# Initialize chat history
if "messages" not in st.session_state:
    st.session_state.messages = [
        AIMessage(content="Hello! I'm a bot trained on custom data. How can I help you?")
    ]

# Display chat history
for message in st.session_state.messages:
    if isinstance(message, AIMessage):
        with st.chat_message("assistant"):
            st.write(message.content)
    elif isinstance(message, HumanMessage):
        with st.chat_message("user"):
            st.write(message.content)

# Chat input
if query := st.chat_input("What's on your mind?"):
    # Add user message to chat history
    st.session_state.messages.append(HumanMessage(content=query))
    with st.chat_message("user"):
        st.write(query)

    # Generate and stream AI response
    with st.chat_message("assistant"):
        response_placeholder = st.empty()
        full_response = ""
        try:
            # Stream the response
            response = generate_response(query)
            if response:
                full_response = response.replace("assistant", "")
                response_placeholder.markdown(full_response)
                st.session_state.messages.append(AIMessage(content=full_response))
        except Exception as e:
            st.error(f"An error occurred: {str(e)}")

# Clear chat button
if st.sidebar.button("Clear Chat"):
    st.session_state.messages = [
        AIMessage(content="Hello! I'm a bot trained on custom data. How can I help you?")
    ]
    st.rerun()
