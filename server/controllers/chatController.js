const { OpenAI } = require('openai');

class ChatController {
    constructor() {
        // Use NVIDIA NIM configuration
        this.openai = new OpenAI({
            apiKey: process.env.NVIDIA_API_KEY || 'fake-key-to-prevent-crash',
            baseURL: process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1'
        });
    }

    handleChat = async (req, res) => {
        try {
            const { message, conversationHistory = [] } = req.body;
            
            console.log(`[ChatController] Incoming message: "${message.substring(0, 30)}..."`);
            
            if (!message) {
                return res.status(400).json({ error: 'Message is required' });
            }

            // --- AUTO REPLY SYSTEM (No API Key Required) ---
            const lowerMessage = message.toLowerCase().trim();
            const autoReplies = {
                "hi": "Hello! How can I help you manage your subscriptions today?",
                "hello": "Hello! How can I help you manage your subscriptions today?",
                "how to add subscription": "To add a subscription, navigate to the 'Subscriptions' page from the dashboard menu and click the 'Add Subscription' button. Fill in the required details like name, cost, and billing cycle!",
                "add subscription": "To add a subscription, navigate to the 'Subscriptions' page from the dashboard menu and click the 'Add Subscription' button. Fill in the required details like name, cost, and billing cycle!",
                "write html code": "Sure! Here is a basic HTML boilerplate:\n\n```html\n<!DOCTYPE html>\n<html>\n<head>\n  <title>SubManager</title>\n</head>\n<body>\n  <h1>Welcome to SubManager!</h1>\n</body>\n</html>\n```",
                "what is python code": "Python is a high-level, interpreted software programming language. Here is a simple Python example:\n\n```python\ndef greet():\n    print('Hello from SubManager!')\n```",
                "reset": "You can safely reset all your subscription data by navigating to Settings -> Data Management, and clicking the 'Reset All Data' button.",
                "spending": "You can view your total spending directly on your Dashboard overview cards, or check the 'Reports' tab for a beautiful categorized breakdown!",
                "who made this": "I am the SubManager AI assistant, crafted to help you organize your digital subscriptions and software life!",
                "dark mode": "You can toggle the theme between Light Mode and Dark Mode by clicking the sun/moon icon in the top right navigation bar.",
                "logout": "To securely log out, simply click the 'Logout' button in the top right corner of your screen.",
                "what is java": "Java is a popular object-oriented programming language. Here is a simple snippet:\n\n```java\nclass Main {\n  public static void main(String[] args) {\n    System.out.println(\"Hello SubManager!\");\n  }\n}\n```"
            };

            // Check if the exact message matches any of our auto-replies
            if (autoReplies[lowerMessage]) {
                console.log(`[ChatController] Auto-Reply matched for: "${lowerMessage}"`);
                return res.json({ reply: autoReplies[lowerMessage] });
            }

            // Check if the message contains fuzzy keywords
            for (const [key, reply] of Object.entries(autoReplies)) {
                if (lowerMessage.includes(key)) {
                    console.log(`[ChatController] Auto-Reply matched keyword: "${key}"`);
                    return res.json({ reply: reply });
                }
            }
            // -----------------------------------------------

            if (!process.env.NVIDIA_API_KEY || process.env.NVIDIA_API_KEY === 'your_api_key_here') {
                return res.status(500).json({ error: 'NVIDIA_API_KEY is not configured in environment variables' });
            }


            // Create context payload
            const messages = [
                {
                    role: 'system',
                    content: 'You are an assistant for a subscription management application called SubManager. Help users track subscriptions, understand spending, manage renewals, and navigate the dashboard.'
                },
                ...conversationHistory,
                { role: 'user', content: message }
            ];

            const completion = await this.openai.chat.completions.create({
                model: 'deepseek-ai/deepseek-v3.2',
                messages: messages,
            });

            const finalReply = completion.choices[0].message.content;
            console.log(`[ChatController] API request status: SUCCESS`);
            console.log(`[ChatController] Response content: "${finalReply.substring(0, 30)}..."`);
            
            res.json({ reply: finalReply });
        } catch (error) {
            console.error('[ChatController] API error message:', error.message);
            res.status(500).json({ error: error.message || 'Failed to communicate with AI assistant' });
        }
    };
}

module.exports = new ChatController();
