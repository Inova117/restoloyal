import { useState, useCallback } from 'react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface UseAIChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (message: string) => Promise<void>;
  clearChat: () => void;
}

export const useAIChat = (): UseAIChatReturn => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: '¡Hola! Soy el asistente de Fydely. ¿En qué puedo ayudarte con tu programa de fidelización?',
      timestamp: new Date()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      // Check if AI chat is enabled
      const isAIEnabled = import.meta.env.VITE_ENABLE_AI_CHAT === 'true';
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

      if (!isAIEnabled || !apiKey) {
        // Fallback to predefined responses
        const fallbackResponse = getFallbackResponse(content);
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: fallbackResponse,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
        return;
      }

      // OpenAI API call
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `Eres un asistente experto en programas de fidelización y la plataforma Fydely. 
              
              Fydely es una plataforma de fidelización que:
              - Integra tarjetas de lealtad directamente en el wallet del móvil
              - No requiere apps adicionales
              - Funciona para restaurantes, cafés, peluquerías, clínicas, etc.
              - Ofrece analytics avanzados y gestión multi-tenant
              - Tiene integración con POS y API-first
              
              Responde de manera amigable, profesional y concisa. Máximo 150 palabras.
              Si no sabes algo específico, sugiere contactar al equipo de ventas.`
            },
            ...messages.slice(-5).map(msg => ({
              role: msg.role,
              content: msg.content
            })),
            {
              role: 'user',
              content
            }
          ],
          max_tokens: parseInt(import.meta.env.VITE_OPENAI_MAX_TOKENS || '500'),
          temperature: parseFloat(import.meta.env.VITE_OPENAI_TEMPERATURE || '0.7')
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const assistantContent = data.choices?.[0]?.message?.content || 'Lo siento, no pude procesar tu mensaje.';

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: assistantContent,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (err) {
      console.error('AI Chat error:', err);
      setError('Error al conectar con el asistente. Intenta de nuevo.');
      
      // Fallback response on error
      const fallbackMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Disculpa, tengo problemas técnicos. ¿Podrías contactar a nuestro equipo en support@fydely.com?',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  const clearChat = useCallback(() => {
    setMessages([{
      id: '1',
      role: 'assistant',
      content: '¡Hola! Soy el asistente de Fydely. ¿En qué puedo ayudarte con tu programa de fidelización?',
      timestamp: new Date()
    }]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearChat
  };
};

// Fallback responses for when AI is not available
const getFallbackResponse = (userMessage: string): string => {
  const message = userMessage.toLowerCase();
  
  if (message.includes('precio') || message.includes('costo') || message.includes('plan')) {
    return 'Nuestros planes se adaptan al tamaño de tu negocio. ¿Te gustaría agendar una demo personalizada para ver precios específicos?';
  }
  
  if (message.includes('demo') || message.includes('prueba')) {
    return '¡Perfecto! Puedes solicitar una demo gratuita usando el botón "Solicita una demo" en esta página. Te mostraremos cómo Fydely puede transformar tu programa de fidelización.';
  }
  
  if (message.includes('integra') || message.includes('pos') || message.includes('sistema')) {
    return 'Fydely se integra fácilmente con la mayoría de sistemas POS mediante nuestra API. ¿Qué sistema usas actualmente?';
  }
  
  if (message.includes('wallet') || message.includes('app')) {
    return 'Las tarjetas van directo al wallet del móvil - sin apps adicionales. Compatible con Apple Wallet y Google Pay. ¡Es súper fácil para tus clientes!';
  }
  
  return 'Gracias por tu pregunta. Para obtener información detallada, te recomiendo solicitar una demo o contactar a nuestro equipo en support@fydely.com';
}; 