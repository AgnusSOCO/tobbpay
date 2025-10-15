import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Sparkles, Bot, User, Loader2 } from 'lucide-react';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

type AIChatbotProps = {
  dashboardData: any;
};

export default function AIChatbot({ dashboardData }: AIChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        '¡Hola! Soy tu asistente de análisis de datos. Puedo ayudarte a entender tus métricas de pago, tendencias y responder preguntas sobre tus transacciones. ¿En qué puedo ayudarte?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: input,
            context: {
              approvedToday: dashboardData.approvedToday,
              salesAmountToday: dashboardData.salesAmountToday,
              approvalRate: dashboardData.approvalRate,
              rejectionRate: dashboardData.rejectionRate,
              totalTransactions: dashboardData.totalTransactions,
              averageTransaction: dashboardData.averageTransaction,
              peakHour: dashboardData.peakHour,
              pendingCharges: dashboardData.pendingCharges,
              topErrors: dashboardData.topErrors?.slice(0, 3),
              bankStats: dashboardData.bankStats?.slice(0, 3),
              currencyBreakdown: dashboardData.currencyBreakdown,
            },
          }),
        }
      );

      const data = await response.json();

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response || 'Lo siento, no pude procesar tu solicitud.',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error calling AI assistant:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Lo siento, hubo un error al procesar tu solicitud. Por favor intenta de nuevo.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestedQuestions = [
    '¿Cuál es mi tasa de aprobación actual?',
    '¿Cuánto he vendido hoy?',
    '¿Cuál es mi hora pico de transacciones?',
    'Analiza mis errores principales',
  ];

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full shadow-2xl hover:shadow-blue-500/50 hover:scale-110 transition-all duration-300 flex items-center justify-center group z-50"
        >
          <Sparkles className="w-7 h-7 text-white group-hover:rotate-12 transition-transform" />
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-200 animate-fadeIn">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-t-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold">Asistente IA</h3>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <p className="text-blue-100 text-xs">En línea</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center hover:bg-opacity-30 transition-all"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[75%] rounded-2xl p-3 ${
                    message.role === 'user'
                      ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white'
                      : 'bg-white border border-gray-200 text-gray-900'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      message.role === 'user' ? 'text-blue-100' : 'text-gray-400'
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString('es-MX', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                {message.role === 'user' && (
                  <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-500 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
                    <User className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl p-3">
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                </div>
              </div>
            )}

            {messages.length === 1 && (
              <div className="space-y-2 mt-4">
                <p className="text-xs text-gray-500 font-medium px-2">Preguntas sugeridas:</p>
                {suggestedQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => setInput(question)}
                    className="w-full text-left text-sm text-gray-700 bg-white border border-gray-200 rounded-xl p-3 hover:border-blue-500 hover:bg-blue-50 transition-all"
                  >
                    {question}
                  </button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-gray-200 bg-white rounded-b-2xl">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Escribe tu pregunta..."
                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                disabled={loading}
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <Send className="w-5 h-5 text-white" />
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">Powered by OpenAI</p>
          </div>
        </div>
      )}
    </>
  );
}
