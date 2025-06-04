import os, sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
import types
# Stub external dependencies used in prepare_dataset
sys.modules['datasets'] = types.ModuleType('datasets')
sys.modules['datasets'].Dataset = object
sys.modules['datasets'].load_dataset = lambda *args, **kwargs: None
sys.modules['pandas'] = types.ModuleType('pandas')
sys.modules['pandas'].DataFrame = object

from prepare_dataset import format_prompt


def test_format_prompt_default():
    example = {"input": "Hello", "output": "World"}
    formatted = format_prompt(example)
    assert formatted == {"input": "Hello\n\n### Response:", "output": "World"}


def test_format_prompt_with_custom_dict_template():
    example = {"input": "What is AI?", "output": "Artificial Intelligence."}
    template = {
        "system": "You are a helpful assistant.",
        "user": "Question: {input}",
        "assistant": "Answer: {output}",
    }
    formatted = format_prompt(example, prompt_template=template)
    expected_input = "You are a helpful assistant.\n\nQuestion: What is AI?"
    assert formatted == {"input": expected_input, "output": "Artificial Intelligence."}
