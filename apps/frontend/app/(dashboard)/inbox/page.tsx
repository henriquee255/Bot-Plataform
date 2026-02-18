import { MessageSquare } from 'lucide-react';

export default function InboxEmptyPage() {
  return (
    <div className="flex-1 flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <MessageSquare className="w-8 h-8 text-indigo-500" />
        </div>
        <h2 className="text-lg font-semibold text-gray-700">Selecione uma conversa</h2>
        <p className="text-gray-400 text-sm mt-1">
          Escolha uma conversa na lista à esquerda para começar
        </p>
      </div>
    </div>
  );
}
