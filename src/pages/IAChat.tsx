import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Send, Sparkles } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { queryGroq, ChatMessage } from "@/lib/groq";

const suggestions = [
  "Quais condomínios têm obrigações vencendo nos próximos 30 dias?",
  "Mostre todas as tarefas atrasadas do Residencial Aurora",
  "Resumo geral de todos os meus condomínios",
  "Adicione uma obrigação de dedetização para o Edifício Solar",
];

const IAChat = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = { role: "user", content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");

    try {
      const systemPrompt = "Você é o SíndicoOS AI, assistente especializado em gestão de condomínios. Responda sempre em português do Brasil de forma objetiva e profissional. Você pode consultar e manipular dados usando as ferramentas fornecidas.";

      let currentMessages: ChatMessage[] = [
        { role: "system", content: systemPrompt },
        ...newMessages
      ];

      let aiResponse = await queryGroq(currentMessages);

      // Handle tool calls
      if (aiResponse.tool_calls) {
        setMessages(prev => [...prev, aiResponse]);

        for (const toolCall of aiResponse.tool_calls) {
          const { name, arguments: argsString } = toolCall.function;
          const args = JSON.parse(argsString);
          let result: any = null;

          if (name === "get_all_data") {
            const { data: condos } = await supabase.from("condominios").select("id, nome");
            const { data: obrs } = await supabase.from("obrigacoes").select("nome, status, condominio_id");
            result = { condominios: condos, obrigacoes: obrs };
          } else if (name === "add_obrigacao") {
            const { error } = await supabase.from("obrigacoes").insert({
              condominio_id: args.condominio_id,
              nome: args.nome,
              periodicidade_dias: args.periodicidade_dias || 365,
              criticidade: args.criticidade || "media",
            });
            result = error ? { error: error.message } : { success: true };
          } else if (name === "add_condominio") {
            const { error } = await supabase.from("condominios").insert({
              nome: args.nome,
              endereco: args.endereco,
              sindico_id: (await supabase.auth.getUser()).data.user?.id
            });
            result = error ? { error: error.message } : { success: true };
          }

          const toolMessage: ChatMessage = {
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(result)
          };

          currentMessages = [...currentMessages, aiResponse, toolMessage];
          const finalResponse = await queryGroq(currentMessages);
          setMessages((prev) => [...prev, toolMessage, { role: "assistant", content: finalResponse.content }]);
        }
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: aiResponse.content }]);
      }
    } catch (error) {
      console.error("Erro ao consultar Groq:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Desculpe, ocorreu um erro ao processar sua solicitação. Verifique sua conexão ou tente novamente mais tarde." },
      ]);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Bot className="h-6 w-6 text-primary" />
          Assistente IA
        </h1>
        <p className="text-muted-foreground">Consulte dados, crie tarefas e gere relatórios por linguagem natural.</p>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Como posso ajudar?</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-md">
                Pergunte sobre seus condomínios, obrigações, tarefas ou peça para executar ações.
              </p>
              <div className="grid sm:grid-cols-2 gap-2 max-w-lg">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => setInput(s)}
                    className="text-left text-sm p-3 rounded-lg border border-border hover:border-primary/40 hover:bg-card transition-colors text-muted-foreground"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm ${msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-secondary text-secondary-foreground rounded-bl-md"
                    }`}
                >
                  {msg.content}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t flex gap-2">
          <Input
            placeholder="Pergunte algo sobre seus condomínios..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="flex-1"
          />
          <Button onClick={handleSend} size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default IAChat;
