import logging
from typing import List, Optional
from groq import Groq

from ..core.config import settings
from .knowledge_base import STATIC_KNOWLEDGE_BASE
from ..schemas.chat import ChatMessage

logger = logging.getLogger("teamflow.groq")


SYSTEM_PROMPT_TEMPLATE = """You are TeamFlow AI Assistant. You help users understand and use the TeamFlow Agile Project Management application.

### SYSTEM INSTRUCTIONS & BEHAVIORAL RULES:
1. You can answer two main types of questions:
   - **How to use TeamFlow**: Use the Website Knowledge Base provided below.
   - **Current Project / Task Data**: Use the Authorized Live Data Context provided below.
2. **Strict Authorization Enforcement**:
   - The user is ONLY authorized to access the projects and data explicitly listed in the Authorized Live Data Context.
   - If the user asks about a project, story, or task that they do NOT have access to (or is not listed in their authorized context), you MUST respond with:
     "I can't provide information from a project you don't have access to."
3. **Accuracy & Truthfulness**:
   - NEVER invent project names, task names, user names, task status, deadlines, progress, comments, time logs, or assignments.
   - If requested information is not available in the authorized context, state clearly that it is not available.
4. **Security & Confidentiality**:
   - NEVER reveal passwords, JWT tokens, API keys, secrets, or internal database credentials under any circumstances.
5. **No Fake Actions**:
   - You are a read-only assistant. Never claim an action (like creating a project or updating a task) was performed unless instructed that the system executed it.
6. **Tone & Formatting**:
   - Be concise, clear, friendly, and helpful.
   - Use clean Markdown formatting (bullet points, bold text) for readability.

---

### SECTION A: WEBSITE KNOWLEDGE BASE (STATIC DOCS)
{static_knowledge}

---

### SECTION B: AUTHORIZED LIVE DATA CONTEXT FOR CURRENT USER
{live_context}
"""


def generate_chat_response(
    user_message: str,
    live_context: str,
    conversation_history: Optional[List[ChatMessage]] = None
) -> str:
    """
    Sends prompt with knowledge base and live context to Groq API.
    Handles exceptions gracefully and returns friendly error messages.
    """
    api_key = settings.GROQ_API_KEY.strip()
    if not api_key:
        logger.warning("GROQ_API_KEY is not set or empty in backend environment settings.")
        return "Sorry, the AI assistant is temporarily unavailable. Please try again."

    model_name = settings.GROQ_MODEL.strip() or "llama-3.3-70b-versatile"

    try:
        client = Groq(api_key=api_key)

        system_instruction = SYSTEM_PROMPT_TEMPLATE.format(
            static_knowledge=STATIC_KNOWLEDGE_BASE,
            live_context=live_context
        )

        messages = [{"role": "system", "content": system_instruction}]

        # Include past history (up to last 6 messages to keep context window manageable)
        if conversation_history:
            recent_history = conversation_history[-6:]
            for msg in recent_history:
                role = "assistant" if msg.role in ("assistant", "bot") else "user"
                messages.append({"role": role, "content": msg.content})

        # Append current user prompt
        messages.append({"role": "user", "content": user_message})

        completion = client.chat.completions.create(
            model=model_name,
            messages=messages,
            temperature=0.3,
            max_tokens=1024,
        )

        if completion.choices and len(completion.choices) > 0:
            return completion.choices[0].message.content.strip()
        else:
            return "I couldn't generate a response. Please try again."

    except Exception as e:
        logger.error(f"Error calling Groq API: {str(e)}", exc_info=True)
        return "Sorry, the AI assistant is temporarily unavailable. Please try again."
