import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAIChat } from '@/hooks/useAIChat';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Sparkles, Send, X, Loader2, RotateCcw } from 'lucide-react';

interface AIChatProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const AIChat = ({ isOpen, onToggle }: AIChatProps) => {
  const { messages, isLoading, error, sendMessage, clearChat } = useAIChat();
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const message = inputValue;
    setInputValue('');
    await sendMessage(message);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{ type: "spring", duration: 0.3 }}
          className="fixed bottom-24 right-6 z-50 w-80 sm:w-96"
        >
          <Card className="bg-white/95 backdrop-blur-xl border-0 shadow-2xl rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Asistente Fydely</h3>
                    <p className="text-xs opacity-90">Siempre aquí para ayudarte</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearChat}
                    className="text-white hover:bg-white/20 p-1 h-8 w-8"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onToggle}
                    className="text-white hover:bg-white/20 p-1 h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="h-80 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-2xl ${
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
                        : 'bg-white border border-slate-200 text-slate-800'
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      message.role === 'user' ? 'text-white/70' : 'text-slate-500'
                    }`}>
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </motion.div>
              ))}

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="bg-white border border-slate-200 p-3 rounded-2xl">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
                      <span className="text-sm text-slate-600">Escribiendo...</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-center"
                >
                  <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-2xl text-sm">
                    {error}
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-slate-200">
              <form onSubmit={handleSubmit} className="flex space-x-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Escribe tu pregunta..."
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                />
                <Button
                  type="submit"
                  disabled={!inputValue.trim() || isLoading}
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white p-2 rounded-xl"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
              <p className="text-xs text-slate-500 mt-2 text-center">
                Powered by AI • Respuestas en tiempo real
              </p>
            </div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}; 