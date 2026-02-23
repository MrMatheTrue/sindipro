const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_MODEL = import.meta.env.VITE_GROQ_MODEL || "openai/gpt-oss-120b";

export interface ChatMessage {
    role: "system" | "user" | "assistant" | "tool";
    content?: string;
    tool_calls?: any[];
    tool_call_id?: string;
}

export const tools = [
    {
        type: "function",
        function: {
            name: "get_all_data",
            description: "Retorna todos os condomínios e suas obrigações para resumo.",
            parameters: { type: "object", properties: {} }
        }
    },
    {
        type: "function",
        function: {
            name: "add_obrigacao",
            description: "Cria uma nova obrigação para um condomínio.",
            parameters: {
                type: "object",
                properties: {
                    condominio_id: { type: "string" },
                    nome: { type: "string" },
                    periodicidade_dias: { type: "number" },
                    criticidade: { type: "string", enum: ["baixa", "media", "alta", "critica"] }
                },
                required: ["condominio_id", "nome"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "add_condominio",
            description: "Cadastra um novo condomínio.",
            parameters: {
                type: "object",
                properties: {
                    nome: { type: "string" },
                    endereco: { type: "string" }
                },
                required: ["nome"]
            }
        }
    }
];

export const queryGroq = async (messages: ChatMessage[]) => {
    if (!GROQ_API_KEY) {
        throw new Error("VITE_GROQ_API_KEY is not defined");
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${GROQ_API_KEY}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            messages,
            model: GROQ_MODEL,
            temperature: 0.1, // Lower temperature for tool use
            max_tokens: 1024,
            tools: tools,
            tool_choice: "auto",
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Failed to query Groq");
    }

    const data = await response.json();
    return data.choices[0].message;
};
