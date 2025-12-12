const BACKEND_URL = 'https://backend-nextjs-one.vercel.app';

interface MensajeRequest {
  mensaje: string;
}

interface MensajeResponse {
  success: boolean;
  result: string;
  type?: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export async function enviarMensajeAI(mensaje: string): Promise<string> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/ai/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ mensaje }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || errorData.message || `Error ${response.status}`;
      throw new Error(errorMessage);
    }

    const data: MensajeResponse = await response.json();
    return data.result || '';
  } catch (error) {
    console.error('Error al enviar mensaje a la IA:', error);
    throw error;
  }
}
